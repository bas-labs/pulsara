import { defineAuth } from '@aws-amplify/backend'
import { postConfirmation } from '../functions/post-confirmation/resource'

export const auth = defineAuth({
  loginWith: {
    email: true,
  },
  userAttributes: {
    preferredUsername: { mutable: true },
  },
  groups: ['organizadores', 'atletas'],
  triggers: {
    postConfirmation,
  },
})
