import type { AppSyncResolverHandler } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient()
const USER_POOL_ID = process.env.USER_POOL_ID!

interface SwitchArgs { userId: string }

export const handler: AppSyncResolverHandler<SwitchArgs, boolean> = async (event) => {
  const username = event.identity && 'username' in event.identity ? event.identity.username : null
  if (!username) throw new Error('Unauthorized')

  try {
    // Remove from atletas
    await client.send(new AdminRemoveUserFromGroupCommand({
      GroupName: 'atletas',
      UserPoolId: USER_POOL_ID,
      Username: username,
    }))

    // Add to organizadores
    await client.send(new AdminAddUserToGroupCommand({
      GroupName: 'organizadores',
      UserPoolId: USER_POOL_ID,
      Username: username,
    }))

    console.log(`Switched ${username} to organizadores`)
    return true
  } catch (err) {
    console.error('Failed to switch group:', err)
    throw err
  }
}
