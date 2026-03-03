import { defineStorage } from '@aws-amplify/backend'

export const storage = defineStorage({
  name: 'pulsaraMedia',
  access: (allow) => ({
    'event-images/{entity_id}/*': [
      allow.authenticated.to(['read']),
      allow.groups(['organizadores']).to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
    'avatars/{entity_id}/*': [
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.authenticated.to(['read']),
    ],
    'result-photos/{entity_id}/*': [
      allow.authenticated.to(['read']),
      allow.groups(['organizadores']).to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
    'blog-images/*': [
      allow.authenticated.to(['read']),
      allow.groups(['organizadores']).to(['read', 'write', 'delete']),
      allow.guest.to(['read']),
    ],
  }),
})
