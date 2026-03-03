import { defineBackend } from '@aws-amplify/backend'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'
import { switchToOrganizer } from './functions/switch-to-organizer/resource'
import { createCheckout } from './functions/create-checkout/resource'
import { stripeWebhook } from './functions/stripe-webhook/resource'
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam'

const backend = defineBackend({
  auth,
  data,
  storage,
  switchToOrganizer,
  createCheckout,
  stripeWebhook,
})

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
    resources: [backend.auth.resources.userPool.userPoolArn],
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
