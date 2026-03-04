import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'alfalloMedia',
  access: (allow) => ({
    'event-images/*': [
      allow.guest.to(['read']),
    ],
    'avatars/{entity_id}/*': [
      allow.guest.to(['read']),
    ],
    'result-photos/{entity_id}/*': [
      allow.guest.to(['read']),
    ],
    'blog-images/*': [
      allow.guest.to(['read']),
    ],
  }),
})
