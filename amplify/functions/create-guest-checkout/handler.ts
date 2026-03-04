import Stripe from 'stripe'
import type { AppSyncResolverHandler } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb'

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
  guestRegistrationId: string
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const handler: AppSyncResolverHandler<CreateGuestCheckoutArgs, string> = async (event) => {
  const args = event.arguments

  // --- Bug 3: Input validation ---
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
  if (!args.guestRegistrationId || typeof args.guestRegistrationId !== 'string') {
    throw new Error('guestRegistrationId is required and must be a string')
  }

  // Check for duplicate guest registration (same email + eventId)
  if (process.env.GUEST_REGISTRATION_TABLE) {
    const existing = await ddb.send(new ScanCommand({
      TableName: process.env.GUEST_REGISTRATION_TABLE,
      FilterExpression: 'email = :email AND eventId = :eventId AND #s <> :cancelled',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':email': args.guestEmail,
        ':eventId': args.eventId,
        ':cancelled': 'CANCELLED',
      },
    }))

    if (existing.Items && existing.Items.length > 0) {
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

  if (
    distanceResult.Item.spotsRemaining !== undefined &&
    distanceResult.Item.spotsRemaining !== null &&
    distanceResult.Item.spotsRemaining <= 0
  ) {
    throw new Error('No spots remaining for this distance')
  }

  // Use server-side price instead of client-provided value
  const verifiedPrice = distanceResult.Item.price as number
  if (typeof verifiedPrice !== 'number' || verifiedPrice <= 0) {
    throw new Error('Invalid price configured for this distance')
  }

  const successUrl = `${process.env.APP_URL}/evento/${encodeURIComponent(args.eventSlug)}/inscripcion?success=true`
  const cancelUrl = `${process.env.APP_URL}/evento/${encodeURIComponent(args.eventSlug)}/inscripcion?cancelled=true`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: args.guestEmail,
    line_items: [{
      price_data: {
        currency: 'mxn',
        unit_amount: verifiedPrice,
        product_data: {
          name: `${args.eventTitle} — ${args.distanceName}`,
          description: `Inscripción a ${args.distanceName}`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      type: 'guest',
      eventId: args.eventId,
      distanceId: args.distanceId,
      guestRegistrationId: args.guestRegistrationId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session.url!
}
