import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { createGuestCheckout } from './functions/create-guest-checkout/resource'
import { stripeWebhook } from './functions/stripe-webhook/resource'
import { Aws, CfnOutput } from 'aws-cdk-lib'
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'

const backend = defineBackend({
  auth,
  data,
  storage,
  createGuestCheckout,
  stripeWebhook,
})

// Wire DynamoDB table names for stripe webhook
const registrationTable = backend.data.resources.tables['Registration']
const orderTable = backend.data.resources.tables['Order']
if (registrationTable) {
  backend.stripeWebhook.resources.lambda.addEnvironment('REGISTRATION_TABLE', registrationTable.tableName)
  registrationTable.grantReadWriteData(backend.stripeWebhook.resources.lambda)
}
if (orderTable) {
  backend.stripeWebhook.resources.lambda.addEnvironment('ORDER_TABLE', orderTable.tableName)
  orderTable.grantReadWriteData(backend.stripeWebhook.resources.lambda)
}

// Wire GuestRegistration table for stripe webhook and create-guest-checkout
const guestRegistrationTable = backend.data.resources.tables['GuestRegistration']
if (guestRegistrationTable) {
  backend.stripeWebhook.resources.lambda.addEnvironment('GUEST_REGISTRATION_TABLE', guestRegistrationTable.tableName)
  guestRegistrationTable.grantReadWriteData(backend.stripeWebhook.resources.lambda)

  // Wire for create-guest-checkout (duplicate registration check)
  backend.createGuestCheckout.resources.lambda.addEnvironment('GUEST_REGISTRATION_TABLE', guestRegistrationTable.tableName)
  guestRegistrationTable.grantReadData(backend.createGuestCheckout.resources.lambda)
}

// Wire APP_URL for checkout functions (Stripe redirect URLs).
const ampBranch = process.env.AWS_BRANCH || 'main'
const ampAppId = process.env.AWS_APP_ID || ''
const appUrl = process.env.APP_URL
  || (ampAppId ? `https://${ampBranch}.${ampAppId}.amplifyapp.com` : 'http://localhost:5173')
backend.createGuestCheckout.resources.lambda.addEnvironment('APP_URL', appUrl)

// Wire Event and EventDistance tables for create-guest-checkout
const eventTable = backend.data.resources.tables['Event']
const eventDistanceTable = backend.data.resources.tables['EventDistance']
if (eventTable) {
  backend.createGuestCheckout.resources.lambda.addEnvironment('EVENT_TABLE', eventTable.tableName)
  eventTable.grantReadData(backend.createGuestCheckout.resources.lambda)
  // Wire Event table for stripe-webhook (email confirmations)
  backend.stripeWebhook.resources.lambda.addEnvironment('EVENT_TABLE', eventTable.tableName)
  eventTable.grantReadData(backend.stripeWebhook.resources.lambda)
}
if (eventDistanceTable) {
  backend.createGuestCheckout.resources.lambda.addEnvironment('EVENT_DISTANCE_TABLE', eventDistanceTable.tableName)
  eventDistanceTable.grantReadData(backend.createGuestCheckout.resources.lambda)
}

// ─── EMAIL CONFIGURATION ───
const emailDomain = process.env.SES_DOMAIN || 'alfallo.mx'
const senderEmail = process.env.SENDER_EMAIL || `no-reply@${emailDomain}`

// Wire SENDER_EMAIL for registration confirmation emails
backend.stripeWebhook.resources.lambda.addEnvironment('SENDER_EMAIL', senderEmail)

// Grant SES permissions for sending registration confirmation emails
backend.stripeWebhook.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*'],
  })
)

// Create a public Function URL for the Stripe webhook so Stripe can POST to it
const webhookFnUrl = backend.stripeWebhook.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
})

new CfnOutput(backend.stripeWebhook.resources.lambda.stack, 'StripeWebhookUrl', {
  value: webhookFnUrl.url,
  description: 'Stripe webhook endpoint URL',
})
