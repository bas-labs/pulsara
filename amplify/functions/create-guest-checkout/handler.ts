import Stripe from 'stripe'
import type { AppSyncResolverHandler } from 'aws-lambda'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-02-25.clover' })

interface CreateGuestCheckoutArgs {
  eventId: string
  distanceId: string
  distanceName: string
  eventTitle: string
  priceInCentavos: number
  guestEmail: string
  guestRegistrationId: string
}

export const handler: AppSyncResolverHandler<CreateGuestCheckoutArgs, string> = async (event) => {
  const args = event.arguments
  const successUrl = `${process.env.APP_URL}/eventos?payment=success`
  const cancelUrl = `${process.env.APP_URL}/eventos?payment=cancelled`

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: args.guestEmail,
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
