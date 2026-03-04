import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { postConfirmation } from './functions/post-confirmation/resource'
import { switchToOrganizer } from './functions/switch-to-organizer/resource'
import { createCheckout } from './functions/create-checkout/resource'
import { createGuestCheckout } from './functions/create-guest-checkout/resource'
import { stripeWebhook } from './functions/stripe-webhook/resource'
import { Aws } from 'aws-cdk-lib'
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'

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

// Wire GuestRegistration table for stripe webhook
const guestRegistrationTable = backend.data.resources.tables['GuestRegistration']
if (guestRegistrationTable) {
  backend.stripeWebhook.resources.lambda.addEnvironment('GUEST_REGISTRATION_TABLE', guestRegistrationTable.tableName)
  guestRegistrationTable.grantReadWriteData(backend.stripeWebhook.resources.lambda)
}
