import Stripe from 'stripe'
import type { AppSyncResolverHandler } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

const PLATFORM_FEE_CENTAVOS = 2000  // 20 MXN — always charged on top of race price

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

interface CreateGuestCheckoutArgs {
  eventId: string
  eventSlug: string
  distanceId: string
  distanceName: string
  eventTitle: string
  priceInCentavos: number
  guestEmail: string
  guestRegistrationIds: string
  quantity: number
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const handler: AppSyncResolverHandler<CreateGuestCheckoutArgs, string> = async (event) => {
  const args = event.arguments

  // --- Input validation ---
  if (!args.eventId || typeof args.eventId !== 'string') {
    throw new Error('eventId is required and must be a string')
  }
  if (!args.eventSlug || typeof args.eventSlug !== 'string') {
    throw new Error('eventSlug is required and must be a string')
  }
  if (!args.distanceId || typeof args.distanceId !== 'string') {
    throw new Error('distanceId is required and must be a string')
  }
  if (!args.distanceName || typeof args.distanceName !== 'string') {
    throw new Error('distanceName is required and must be a string')
  }
  if (!args.eventTitle || typeof args.eventTitle !== 'string') {
    throw new Error('eventTitle is required and must be a string')
  }
  if (typeof args.priceInCentavos !== 'number' || args.priceInCentavos <= 0) {
    throw new Error('priceInCentavos is required and must be a positive number')
  }
  if (!args.guestEmail || typeof args.guestEmail !== 'string') {
    throw new Error('guestEmail is required and must be a string')
  }
  if (!EMAIL_REGEX.test(args.guestEmail)) {
    throw new Error('guestEmail must be a valid email address')
  }
  if (!args.guestRegistrationIds || typeof args.guestRegistrationIds !== 'string') {
    throw new Error('guestRegistrationIds is required and must be a string')
  }
  if (typeof args.quantity !== 'number' || args.quantity < 1) {
    throw new Error('quantity is required and must be at least 1')
  }
  if (args.quantity > 10) {
    throw new Error('Maximum 10 participants per transaction')
  }

  const registrationIds = args.guestRegistrationIds.split(',').filter(Boolean)
  if (registrationIds.length !== args.quantity) {
    throw new Error('Number of registration IDs must match quantity')
  }

  // Check for duplicate guest registration (same email + eventId), excluding
  // current batch AND PENDING records (which may be from abandoned checkouts).
  // Only CONFIRMED registrations should block a retry.
  if (process.env.GUEST_REGISTRATION_TABLE) {
    const existing = await ddb.send(new ScanCommand({
      TableName: process.env.GUEST_REGISTRATION_TABLE,
      FilterExpression: 'email = :email AND eventId = :eventId AND #s = :confirmed',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':email': args.guestEmail,
        ':eventId': args.eventId,
        ':confirmed': 'CONFIRMED',
      },
    }))

    const batchIds = new Set(registrationIds)
    const duplicates = (existing.Items || []).filter(item => !batchIds.has(item.id))

    if (duplicates.length > 0) {
      throw new Error('DUPLICATE_REGISTRATION: A registration for this email and event already exists')
    }
  }

  // Verify event exists and is published
  if (process.env.EVENT_TABLE) {
    const eventResult = await ddb.send(new GetCommand({
      TableName: process.env.EVENT_TABLE,
      Key: { id: args.eventId },
    }))

    if (!eventResult.Item) {
      throw new Error('Event not found')
    }

    if (eventResult.Item.status !== 'PUBLISHED') {
      throw new Error('Event is not available for registration')
    }

    // Check registration deadline
    if (eventResult.Item.registrationDeadline) {
      const deadline = new Date(eventResult.Item.registrationDeadline)
      if (new Date() > deadline) {
        throw new Error('Registration deadline has passed')
      }
    }
  }

  // Look up EventDistance from DynamoDB for server-side price verification
  if (!process.env.EVENT_DISTANCE_TABLE) {
    throw new Error('EVENT_DISTANCE_TABLE environment variable is not configured')
  }

  const distanceResult = await ddb.send(new GetCommand({
    TableName: process.env.EVENT_DISTANCE_TABLE,
    Key: { id: args.distanceId },
  }))

  if (!distanceResult.Item) {
    throw new Error('Distance not found')
  }

  // Check enough spots for all participants
  if (
    distanceResult.Item.spotsRemaining !== undefined &&
    distanceResult.Item.spotsRemaining !== null
  ) {
    if (distanceResult.Item.spotsRemaining < args.quantity) {
      throw new Error('No hay suficientes lugares disponibles para esta distancia')
    }
  }

  // Use server-side price instead of client-provided value
  const verifiedPrice = distanceResult.Item.price as number
  if (typeof verifiedPrice !== 'number' || verifiedPrice <= 0) {
    throw new Error('Invalid price configured for this distance')
  }

  const successUrl = `${process.env.APP_URL}/evento/${encodeURIComponent(args.eventSlug)}/inscripcion?success=true&count=${args.quantity}`
  const cancelUrl = `${process.env.APP_URL}/evento/${encodeURIComponent(args.eventSlug)}/inscripcion?cancelled=true`

  // Check if event has a Stripe connected account for payment split (Stripe Connect)
  const stripeConnectedAccountId: string | undefined = eventResult?.Item?.stripeConnectedAccountId

  // Build session params
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    customer_email: args.guestEmail,
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          unit_amount: verifiedPrice,
          product_data: {
            name: `${args.eventTitle} — ${args.distanceName}`,
            description: args.quantity > 1
              ? `Inscripción a ${args.distanceName} (${args.quantity} participantes)`
              : `Inscripción a ${args.distanceName}`,
          },
        },
        quantity: args.quantity,
      },
      {
        price_data: {
          currency: 'mxn',
          unit_amount: PLATFORM_FEE_CENTAVOS,
          product_data: {
            name: 'Tarifa de plataforma — Al Fallo',
            description: 'Al Fallo platform registration fee',
          },
        },
        quantity: args.quantity,
      },
    ],
    metadata: {
      type: 'guest',
      eventId: args.eventId,
      distanceId: args.distanceId,
      guestRegistrationIds: args.guestRegistrationIds,
      // Internal split for accounting (centavos × quantity)
      beneficiary_amount: String(verifiedPrice * args.quantity),
      platform_fee:       String(PLATFORM_FEE_CENTAVOS * args.quantity),
      race_slug:          args.eventSlug,
    },
    success_url: successUrl,
    cancel_url:  cancelUrl,
  }

  // Stripe Connect: route race fee to beneficiary account if configured
  if (stripeConnectedAccountId) {
    sessionParams.payment_intent_data = {
      // Platform keeps PLATFORM_FEE_CENTAVOS × quantity; race fee goes to beneficiary
      application_fee_amount: PLATFORM_FEE_CENTAVOS * args.quantity,
      transfer_data: {
        destination: stripeConnectedAccountId,
      },
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return session.url!
}
