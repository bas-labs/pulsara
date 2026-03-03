import { defineFunction } from '@aws-amplify/backend'

export const switchToOrganizer = defineFunction({
  name: 'switch-to-organizer',
  entry: './handler.ts',
  environment: {
    USER_POOL_ID: '', // Wired in backend.ts
  },
})
