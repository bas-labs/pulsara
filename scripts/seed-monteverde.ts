/**
 * Seed the Carrera Monteverde event
 * Run: SEED_SUFFIX=<table-suffix> npx tsx scripts/seed-monteverde.ts
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'

const REGION = 'us-east-1'
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))
const now = new Date().toISOString()

const SEED_SUFFIX = process.env.SEED_SUFFIX
if (!SEED_SUFFIX) throw new Error('SEED_SUFFIX env var is required')

async function seed() {
  console.log(`\n🌱 Seeding Carrera Monteverde...`)
  const EVENT_TABLE = `Event-${SEED_SUFFIX}`
  const DISTANCE_TABLE = `EventDistance-${SEED_SUFFIX}`

  const eventId = randomUUID()
  try {
    await ddb.send(new PutCommand({
      TableName: EVENT_TABLE,
      Item: {
        id: eventId,
        slug: 'carrera-colegio-monteverde-2026',
        title: '3ª Carrera Colegio Monteverde 2026',
        description: 'La Asociación de Padres de Familia y Amigos del Colegio Monteverde invita a todos los alumnos, familiares y amigos a participar en la 3ª edición de la Carrera Monteverde. La carrera se lleva a cabo en el icónico Bosque de Chapultepec, Sección 1, en la Ciudad de México. Disfruta de un recorrido rodeado de naturaleza en el corazón de la ciudad con dos modalidades: Carrera 5 Km y Caminata 3 Km. Un evento para toda la familia con playera conmemorativa, medalla de finalista y kit de corredor incluidos en la inscripción.',
        shortDescription: '3ª edición de la Carrera Monteverde — Carrera 5K y Caminata 3K en el Bosque de Chapultepec, CDMX.',
        sport: 'RUNNING',
        eventDate: '2026-04-25T07:00:00Z',
        venue: 'Bosque de Chapultepec, 1ª Sección',
        city: 'CDMX',
        state: 'Ciudad de México',
        country: 'MX',
        status: 'PUBLISHED',
        organizerId: 'system',
        organizerName: 'Asociación de Padres de Familia y Amigos del Colegio Monteverde',
        featured: true,
        tags: ['familiar', 'colegio', 'chapultepec', '5k', '3k'],
        priceMin: 20000,
        priceMax: 20000,
        currency: 'MXN',
        totalSpots: 800,
        spotsRemaining: 800,
        imageUrl: '/images/carrera-monteverde-2026.png',
        __typename: 'Event',
        createdAt: now,
        updatedAt: now,
      },
    }))
    console.log(`  ✅ Event created`)

    await ddb.send(new PutCommand({
      TableName: DISTANCE_TABLE,
      Item: {
        id: randomUUID(),
        eventId,
        name: 'Carrera 5K',
        distanceKm: 5,
        price: 20000,
        currency: 'MXN',
        category: 'GENERAL',
        spotsTotal: 500,
        spotsRemaining: 500,
        __typename: 'EventDistance',
        createdAt: now,
        updatedAt: now,
      },
    }))
    console.log(`  ✅ Distance: Carrera 5K`)

    await ddb.send(new PutCommand({
      TableName: DISTANCE_TABLE,
      Item: {
        id: randomUUID(),
        eventId,
        name: 'Caminata 3K',
        distanceKm: 3,
        price: 20000,
        currency: 'MXN',
        category: 'GENERAL',
        spotsTotal: 300,
        spotsRemaining: 300,
        __typename: 'EventDistance',
        createdAt: now,
        updatedAt: now,
      },
    }))
    console.log(`  ✅ Distance: Caminata 3K`)
  } catch (err: any) {
    console.error(`  ❌ Error:`, err.message)
  }
  console.log('\n✅ Done!')
}

seed()
