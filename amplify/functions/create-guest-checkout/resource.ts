import { defineFunction, secret } from '@aws-amplify/backend'

export const createGuestCheckout = defineFunction({
  name: 'create-guest-checkout',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    APP_URL: '', // wired in backend.ts
  },
  timeoutSeconds: 15,
})
