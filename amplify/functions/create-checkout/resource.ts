import { defineFunction, secret } from '@aws-amplify/backend'

export const createCheckout = defineFunction({
  name: 'create-checkout',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    APP_URL: '', // wired in backend.ts
    EVENT_TABLE: '', // wired in backend.ts
    EVENT_DISTANCE_TABLE: '', // wired in backend.ts
  },
  timeoutSeconds: 15,
})
