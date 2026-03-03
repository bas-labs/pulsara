import { defineFunction, secret } from '@aws-amplify/backend'

export const createGuestCheckout = defineFunction({
  name: 'create-guest-checkout',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    APP_URL: 'https://main.d96et8gd30uo0.amplifyapp.com',
  },
  timeoutSeconds: 15,
})
