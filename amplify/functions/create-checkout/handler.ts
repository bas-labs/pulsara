import Stripe from 'stripe'
import type { AppSyncResolverHandler } from 'aws-lambda'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' })

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
  const successUrl = `${process.env.APP_URL}/atleta/mis-eventos?payment=success`
  const cancelUrl = `${process.env.APP_URL}/evento/${args.eventId}?payment=cancelled`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: args.userEmail,
    line_items: [{
      price_data: {
        currency: 'mxn',
        unit_amount: args.priceInCentavos,
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
