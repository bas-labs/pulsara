import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { postConfirmation } from './functions/post-confirmation/resource'
import { switchToOrganizer } from './functions/switch-to-organizer/resource'
import { createCheckout } from './functions/create-checkout/resource'
import { createGuestCheckout } from './functions/create-guest-checkout/resource'
import { stripeWebhook } from './functions/stripe-webhook/resource'
import { Aws, CfnOutput } from 'aws-cdk-lib'
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda'
import { CfnUserPool } from 'aws-cdk-lib/aws-cognito'

const backend = defineBackend({
  auth,
  data,
  storage,
  postConfirmation,
  switchToOrganizer,
  createCheckout,
  createGuestCheckout,
  stripeWebhook,
})

// Use Aws pseudo-parameters to construct ARN without direct UserPool reference.
// Referencing backend.auth.resources.userPool.userPoolArn directly creates a
// CloudFormation circular dependency within the auth stack (UserPool <-> Lambda trigger).
const cognitoPoolArn = `arn:aws:cognito-idp:${Aws.REGION}:${Aws.ACCOUNT_ID}:userpool/*`

// Grant postConfirmation Lambda permission to add users to groups
backend.postConfirmation.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['cognito-idp:AdminAddUserToGroup'],
    resources: [cognitoPoolArn],
  })
)

// Grant switchToOrganizer Lambda permission to manage Cognito groups
const userPoolId = backend.auth.resources.userPool.userPoolId

backend.switchToOrganizer.resources.lambda.addEnvironment('USER_POOL_ID', userPoolId)
backend.switchToOrganizer.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      'cognito-idp:AdminAddUserToGroup',
      'cognito-idp:AdminRemoveUserFromGroup',
    ],
    resources: [cognitoPoolArn],
  })
)

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
// During Amplify CI/CD builds, AWS_APP_ID and AWS_BRANCH are available.
// For sandbox/local dev, fall back to localhost.
const ampBranch = process.env.AWS_BRANCH || 'main'
const ampAppId = process.env.AWS_APP_ID || ''
const appUrl = process.env.APP_URL
  || (ampAppId ? `https://${ampBranch}.${ampAppId}.amplifyapp.com` : 'http://localhost:5173')
backend.createCheckout.resources.lambda.addEnvironment('APP_URL', appUrl)
backend.createGuestCheckout.resources.lambda.addEnvironment('APP_URL', appUrl)

// Wire Event and EventDistance tables for create-checkout (event/capacity validation)
const eventTable = backend.data.resources.tables['Event']
const eventDistanceTable = backend.data.resources.tables['EventDistance']
if (eventTable) {
  backend.createCheckout.resources.lambda.addEnvironment('EVENT_TABLE', eventTable.tableName)
  eventTable.grantReadData(backend.createCheckout.resources.lambda)
  backend.createGuestCheckout.resources.lambda.addEnvironment('EVENT_TABLE', eventTable.tableName)
  eventTable.grantReadData(backend.createGuestCheckout.resources.lambda)
  // Wire Event table for stripe-webhook (email confirmations)
  backend.stripeWebhook.resources.lambda.addEnvironment('EVENT_TABLE', eventTable.tableName)
  eventTable.grantReadData(backend.stripeWebhook.resources.lambda)
}
if (eventDistanceTable) {
  backend.createCheckout.resources.lambda.addEnvironment('EVENT_DISTANCE_TABLE', eventDistanceTable.tableName)
  eventDistanceTable.grantReadData(backend.createCheckout.resources.lambda)
  backend.createGuestCheckout.resources.lambda.addEnvironment('EVENT_DISTANCE_TABLE', eventDistanceTable.tableName)
  eventDistanceTable.grantReadData(backend.createGuestCheckout.resources.lambda)
}

// ─── EMAIL CONFIGURATION ───
// Domain used for all outbound emails (Cognito auth + registration confirmations).
// Must be verified in SES with DKIM before deploying to production.
const emailDomain = process.env.SES_DOMAIN || 'alfallo.mx'
const senderEmail = process.env.SENDER_EMAIL || `no-reply@${emailDomain}`

// Configure Cognito to send emails via SES instead of default (50/day limit).
// Requires the domain to be verified in SES first.
const cfnUserPool = backend.auth.resources.userPool.node.defaultChild as CfnUserPool
cfnUserPool.emailConfiguration = {
  emailSendingAccount: 'DEVELOPER',
  sourceArn: `arn:aws:ses:${Aws.REGION}:${Aws.ACCOUNT_ID}:identity/${emailDomain}`,
  from: `Pulsara <${senderEmail}>`,
  replyToEmailAddress: senderEmail,
}

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
