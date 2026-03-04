import Stripe from 'stripe'
import type { AppSyncResolverHandler } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))

interface CreateCheckoutArgs {
  eventId: string
  distanceId: string
  distanceName: string
  eventTitle: string
  priceInCentavos: number
  userId: string
  userEmail: string
  registrationId: string
}

export const handler: AppSyncResolverHandler<CreateCheckoutArgs, string> = async (event) => {
  const args = event.arguments

  // --- Bug 1: Input validation ---
  if (!args.eventId || typeof args.eventId !== 'string') {
    throw new Error('eventId is required and must be a string')
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
  if (!args.userId || typeof args.userId !== 'string') {
    throw new Error('userId is required and must be a string')
  }
  if (!args.userEmail || typeof args.userEmail !== 'string') {
    throw new Error('userEmail is required and must be a string')
  }
  if (!args.registrationId || typeof args.registrationId !== 'string') {
    throw new Error('registrationId is required and must be a string')
  }

  // --- Bug 2: Event existence and capacity check ---
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

  // Look up EventDistance from DynamoDB for server-side price and capacity check
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

  const successUrl = `${process.env.APP_URL}/atleta/mis-eventos?payment=success`
  const cancelUrl = `${process.env.APP_URL}/evento/${args.eventId}?payment=cancelled`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: args.userEmail,
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
      eventId: args.eventId,
      distanceId: args.distanceId,
      userId: args.userId,
      registrationId: args.registrationId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  })

  return session.url!
}
