import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Simple in-memory set to deduplicate webhook events within the same Lambda instance
const processedEvents = new Set<string>()

export const handler = async (event: any) => {
  const sig = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature']
  if (!sig) {
    console.error('Missing stripe-signature header')
    return { statusCode: 400, body: 'Missing signature' }
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body

  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: 'Webhook Error' }
  }

  // --- Bug 5: Idempotency check (in-memory) ---
  if (processedEvents.has(stripeEvent.id)) {
    console.log(`Skipping already-processed event: ${stripeEvent.id}`)
    return { statusCode: 200, body: 'Already processed' }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const metadata = session.metadata!

    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb')
    const { GetCommand, UpdateCommand, DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

    if (metadata.type === 'guest') {
      // Guest registration payment
      const { guestRegistrationId } = metadata
      console.log(`Guest payment completed: guestRegistration=${guestRegistrationId}, amount=${session.amount_total}`)

      // Check if already processed in DynamoDB
      const existing = await ddb.send(new GetCommand({
        TableName: process.env.GUEST_REGISTRATION_TABLE!,
        Key: { id: guestRegistrationId },
        ProjectionExpression: 'paymentStatus',
      }))
      if (existing.Item?.paymentStatus === 'PAID') {
        console.log(`Guest registration ${guestRegistrationId} already paid, skipping`)
        processedEvents.add(stripeEvent.id)
        return { statusCode: 200, body: 'Already processed' }
      }

      await ddb.send(new UpdateCommand({
        TableName: process.env.GUEST_REGISTRATION_TABLE!,
        Key: { id: guestRegistrationId },
        UpdateExpression: 'SET #s = :s, paymentStatus = :ps, amountPaid = :ap, stripePaymentIntentId = :spi, registeredAt = :ra',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': 'CONFIRMED',
          ':ps': 'PAID',
          ':ap': session.amount_total,
          ':spi': session.payment_intent as string,
          ':ra': new Date().toISOString(),
        },
      }))

      console.log(`Guest registration ${guestRegistrationId} confirmed with payment`)
    } else {
      // Authenticated user registration payment
      const { userId, registrationId } = metadata
      console.log(`Payment completed: registration=${registrationId}, amount=${session.amount_total}`)

      // Check if already processed in DynamoDB
      const existing = await ddb.send(new GetCommand({
        TableName: process.env.REGISTRATION_TABLE!,
        Key: { id: registrationId },
        ProjectionExpression: 'paymentStatus',
      }))
      if (existing.Item?.paymentStatus === 'PAID') {
        console.log(`Registration ${registrationId} already paid, skipping`)
        processedEvents.add(stripeEvent.id)
        return { statusCode: 200, body: 'Already processed' }
      }

      await ddb.send(new UpdateCommand({
        TableName: process.env.REGISTRATION_TABLE!,
        Key: { id: registrationId },
        UpdateExpression: 'SET #s = :s, paymentStatus = :ps, amountPaid = :ap, stripePaymentIntentId = :spi, registeredAt = :ra',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': 'CONFIRMED',
          ':ps': 'PAID',
          ':ap': session.amount_total,
          ':spi': session.payment_intent as string,
          ':ra': new Date().toISOString(),
        },
      }))

      // Create order record
      await ddb.send(new UpdateCommand({
        TableName: process.env.ORDER_TABLE!,
        Key: { id: `ord_${registrationId}` },
        UpdateExpression: 'SET userId = :u, #t = :t, subtotal = :st, total = :tot, currency = :c, stripePaymentIntentId = :spi, stripeSessionId = :ss, #s = :s, paidAt = :pa, createdAt = :ca',
        ExpressionAttributeNames: { '#s': 'status', '#t': 'type' },
        ExpressionAttributeValues: {
          ':u': userId,
          ':t': 'REGISTRATION',
          ':st': session.amount_total,
          ':tot': session.amount_total,
          ':c': 'MXN',
          ':spi': session.payment_intent as string,
          ':ss': session.id,
          ':s': 'PAID',
          ':pa': new Date().toISOString(),
          ':ca': new Date().toISOString(),
        },
      }))

      console.log(`Registration ${registrationId} confirmed with payment`)
    }
  }

  // Mark as processed after successful handling
  processedEvents.add(stripeEvent.id)

  return { statusCode: 200, body: 'OK' }
}
