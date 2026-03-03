import Stripe from 'stripe'
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!

export const handler = async (event: any) => {
  const sig = event.headers['stripe-signature']
  let stripeEvent: Stripe.Event

  try {
    stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return { statusCode: 400, body: 'Webhook Error' }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object as Stripe.Checkout.Session
    const metadata = session.metadata!

    const { DynamoDBClient } = await import('@aws-sdk/client-dynamodb')
    const { UpdateCommand, DynamoDBDocumentClient } = await import('@aws-sdk/lib-dynamodb')
    const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

    if (metadata.type === 'guest') {
      // Guest registration payment
      const { guestRegistrationId, eventId } = metadata
      console.log(`Guest payment completed: guestRegistration=${guestRegistrationId}, amount=${session.amount_total}`)

      await ddb.send(new UpdateCommand({
        TableName: process.env.GUEST_REGISTRATION_TABLE!,
        Key: { id: guestRegistrationId },
        UpdateExpression: 'SET #s = :s, paymentStatus = :ps, amountPaid = :ap, stripePaymentIntentId = :ss, updatedAt = :ua',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': 'CONFIRMED',
          ':ps': 'PAID',
          ':ap': session.amount_total,
          ':ss': session.id,
          ':ua': new Date().toISOString(),
        },
      }))

      console.log(`Guest registration ${guestRegistrationId} confirmed with payment`)
    } else {
      // Authenticated user registration payment
      const { eventId, distanceId, userId, registrationId } = metadata
      console.log(`Payment completed: registration=${registrationId}, amount=${session.amount_total}`)

      await ddb.send(new UpdateCommand({
        TableName: process.env.REGISTRATION_TABLE!,
        Key: { id: registrationId },
        UpdateExpression: 'SET #s = :s, paymentStatus = :ps, amountPaid = :ap, stripeSessionId = :ss, paidAt = :pa',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':s': 'CONFIRMED',
          ':ps': 'PAID',
          ':ap': session.amount_total,
          ':ss': session.id,
          ':pa': new Date().toISOString(),
        },
      }))

      // Create order record
      await ddb.send(new UpdateCommand({
        TableName: process.env.ORDER_TABLE!,
        Key: { id: `ord_${registrationId}` },
        UpdateExpression: 'SET userId = :u, eventId = :e, registrationId = :r, amount = :a, currency = :c, stripeSessionId = :ss, #s = :s, createdAt = :ca',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: {
          ':u': userId,
          ':e': eventId,
          ':r': registrationId,
          ':a': session.amount_total,
          ':c': 'MXN',
          ':ss': session.id,
          ':s': 'COMPLETED',
          ':ca': new Date().toISOString(),
        },
      }))

      console.log(`Registration ${registrationId} confirmed with payment`)
    }
  }

  return { statusCode: 200, body: 'OK' }
}
