import { defineFunction, secret } from '@aws-amplify/backend'

export const createCheckout = defineFunction({
  name: 'create-checkout',
  entry: './handler.ts',
  environment: {
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    APP_URL: 'https://pulsara.com', // will be updated per env
  },
  timeoutSeconds: 15,
})
