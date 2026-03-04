import { defineFunction, secret } from '@aws-amplify/backend'

export const createCheckout = defineFunction({
  name: 'create-checkout',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    APP_URL: 'https://main.d96et8gd30uo0.amplifyapp.com', // will be updated per env
    EVENT_TABLE: '', // wired in backend.ts
    EVENT_DISTANCE_TABLE: '', // wired in backend.ts
  },
  timeoutSeconds: 15,
})
