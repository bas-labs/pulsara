import { defineFunction, secret } from '@aws-amplify/backend'

export const stripeWebhook = defineFunction({
  name: 'stripe-webhook',
  entry: './handler.ts',
  resourceGroupName: 'data',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: secret('STRIPE_WEBHOOK_SECRET'),
    REGISTRATION_TABLE: '', // wired in backend.ts
    ORDER_TABLE: '', // wired in backend.ts
    GUEST_REGISTRATION_TABLE: '', // wired in backend.ts
    EVENT_TABLE: '', // wired in backend.ts
    SENDER_EMAIL: '', // wired in backend.ts
  },
  timeoutSeconds: 30,
})
