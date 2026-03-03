import type { PostConfirmationTriggerHandler } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient()

export const handler: PostConfirmationTriggerHandler = async (event) => {
  // Default: add all new users to "atletas" group
  // They can switch to "organizadores" during onboarding
  const command = new AdminAddUserToGroupCommand({
    GroupName: 'atletas',
    UserPoolId: event.userPoolId,
    Username: event.userName,
  })

  try {
    await client.send(command)
    console.log(`Added ${event.userName} to atletas group`)
  } catch (err) {
    console.error('Failed to add user to group:', err)
  }

  return event
}
