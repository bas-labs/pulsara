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

  const targetUserId = event.arguments?.userId
  if (targetUserId && targetUserId !== username) {
    throw new Error('Forbidden: you can only switch your own account')
  }

  // Remove from atletas (ignore if not in the group)
  try {
    await client.send(new AdminRemoveUserFromGroupCommand({
      GroupName: 'atletas',
      UserPoolId: USER_POOL_ID,
      Username: username,
    }))
  } catch (err: any) {
    // User may not be in atletas group — that's fine, continue
    console.log(`Could not remove ${username} from atletas (may not be a member):`, err.message)
  }

  // Add to organizadores
  try {
    await client.send(new AdminAddUserToGroupCommand({
      GroupName: 'organizadores',
      UserPoolId: USER_POOL_ID,
      Username: username,
    }))

    console.log(`Switched ${username} to organizadores`)
    return true
  } catch (err) {
    console.error('Failed to add to organizadores:', err)
    throw err
  }
}
