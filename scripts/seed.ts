/**
 * Seed script — run with: npx tsx scripts/seed.ts
 * Seeds 118 real Mexican sports events + serials + blog articles
 * Uses DynamoDB directly (bypasses AppSync auth)
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'crypto'
import seedEvents from '../infra/seed-events-full.json'

const REGION = 'us-east-1'
const SUFFIX = process.env.SEED_SUFFIX ?? 'tcnflzpturdtratjqzwrhjyu3a-NONE'

const EVENT_TABLE = `Event-${SUFFIX}`
const DISTANCE_TABLE = `EventDistance-${SUFFIX}`
const SERIAL_TABLE = `Serial-${SUFFIX}`
const ARTICLE_TABLE = `Article-${SUFFIX}`

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }))

// Price ranges by sport (centavos MXN)
const PRICES: Record<string, [number, number]> = {
  RUNNING: [29500, 89500],
  TRIATLON: [150000, 350000],
  CICLISMO: [45000, 150000],
  TRAIL: [35000, 120000],
  OCR: [80000, 200000],
  NATACION: [25000, 75000],
  SENDERISMO: [15000, 45000],
  DOWNHILL: [50000, 120000],
}

function randPrice(sport: string): number {
  const [min, max] = PRICES[sport] ?? [30000, 90000]
  return Math.round((Math.random() * (max - min) + min) / 100) * 100
}

function randSpots(): number {
  return [200, 300, 500, 750, 1000, 1500, 2000, 3000][Math.floor(Math.random() * 8)]
}

const now = new Date().toISOString()

async function seed() {
  console.log(`🌱 Seeding ${seedEvents.length} events...\n`)
  let ok = 0, fail = 0

  for (const ev of seedEvents) {
    const price = randPrice(ev.sport)
    const spots = randSpots()
    const id = randomUUID()
    try {
      await ddb.send(new PutCommand({
        TableName: EVENT_TABLE,
        Item: {
          id,
          slug: ev.slug,
          title: ev.title,
          sport: ev.sport,
          eventDate: ev.eventDate,
          city: ev.city,
          state: ev.state,
          country: 'MX',
          status: 'PUBLISHED',
          organizerId: 'system',
          organizerName: 'Pulsara',
          featured: Math.random() < 0.1,
          tags: [],
          priceMin: price,
          priceMax: Math.round(price * 1.5),
          totalSpots: spots,
          spotsRemaining: spots,
          __typename: 'Event',
          createdAt: now,
          updatedAt: now,
        },
      }))
      ok++
      process.stdout.write(`\r  ✅ ${ok}/${seedEvents.length}`)

      // Auto-create distances for running events
      if (['RUNNING', 'TRAIL'].includes(ev.sport)) {
        const distances = ev.sport === 'TRAIL'
          ? [{name:'21K',km:21},{name:'12K',km:12},{name:'5K',km:5}]
          : ev.title.toLowerCase().includes('maratón') || ev.title.toLowerCase().includes('maraton')
            ? [{name:'42K',km:42.195},{name:'21K',km:21.0975},{name:'10K',km:10}]
            : ev.title.includes('21k') || ev.title.includes('Medio Maratón')
              ? [{name:'21K',km:21.0975},{name:'10K',km:10},{name:'5K',km:5}]
              : [{name:'10K',km:10},{name:'5K',km:5},{name:'3K',km:3}]

        for (const d of distances) {
          const dp = randPrice(ev.sport)
          await ddb.send(new PutCommand({
            TableName: DISTANCE_TABLE,
            Item: {
              id: randomUUID(),
              eventId: id,
              name: d.name,
              distanceKm: d.km,
              price: dp,
              currency: 'MXN',
              category: 'GENERAL',
              spotsTotal: Math.round(spots / distances.length),
              spotsRemaining: Math.round(spots / distances.length),
              __typename: 'EventDistance',
              createdAt: now,
              updatedAt: now,
            },
          }))
        }
      }
    } catch (err) {
      fail++
      console.error(`\n  ❌ ${ev.title}:`, (err as Error).message)
    }
  }

  console.log(`\n\n  Events: ${ok} created, ${fail} failed\n`)

  // Serials
  console.log('🌱 Seeding serials...')
  const serials = [
    { slug: 'circuito-estaciones-2026', name: 'Circuito de las Estaciones 2026', color: '#10B981', year: 2026, cities: ['CDMX'], sports: ['running'], totalEvents: 4, status: 'ACTIVE' },
    { slug: 'ironman-mexico-2026', name: 'IRONMAN México Series 2026', color: '#E11D48', year: 2026, cities: ['Monterrey', 'Cozumel'], sports: ['triatlon'], totalEvents: 3, status: 'ACTIVE' },
    { slug: 'serial-downhill-nacional-2026', name: 'Serial Nacional de Downhill 2026', color: '#7C3AED', year: 2026, cities: ['Atlixco', 'CDMX', 'Monterrey'], sports: ['downhill'], totalEvents: 6, status: 'ACTIVE' },
    { slug: 'tour-france-mexico-2026', name: "L'Étape by Tour de France México 2026", color: '#F59E0B', year: 2026, cities: ['La Paz', 'CDMX', 'Oaxaca'], sports: ['ciclismo'], totalEvents: 3, status: 'ACTIVE' },
    { slug: 'spartan-race-mexico-2026', name: 'Spartan Race México 2026', color: '#DC2626', year: 2026, cities: ['CDMX', 'Monterrey', 'Guadalajara'], sports: ['ocr'], totalEvents: 4, status: 'ACTIVE' },
    { slug: 'aguas-abiertas-nacional-2026', name: 'Circuito Nacional de Aguas Abiertas 2026', color: '#0EA5E9', year: 2026, cities: ['Acapulco', 'Cozumel', 'Isla Mujeres', 'Ensenada'], sports: ['natacion'], totalEvents: 6, status: 'ACTIVE' },
  ]
  for (const s of serials) {
    try {
      await ddb.send(new PutCommand({
        TableName: SERIAL_TABLE,
        Item: {
          id: randomUUID(),
          ...s,
          organizerId: 'system',
          __typename: 'Serial',
          createdAt: now,
          updatedAt: now,
        },
      }))
      console.log(`  ✅ ${s.name}`)
    } catch (e: any) {
      console.error(`  ❌ ${s.name}:`, e.message)
    }
  }

  // Blog articles
  console.log('\n🌱 Seeding articles...')
  const articles = [
    { slug: 'plan-primer-21k', title: 'Plan de entrenamiento: tu primer medio maratón', excerpt: 'De cero a 21K en 16 semanas. La guía completa con plan día por día, nutrición y prevención de lesiones.', category: 'RUNNING', readTimeMinutes: 12, imageUrl: '/images/blog-running.jpg' },
    { slug: 'nutricion-dia-carrera', title: 'Qué comer antes, durante y después de una carrera', excerpt: 'La nutrición correcta puede ser la diferencia entre tu mejor marca y un DNF. Aprende a fuelearte como profesional.', category: 'NUTRICION', readTimeMinutes: 8, imageUrl: '/images/blog-nutrition.jpg' },
    { slug: 'elegir-bici-ruta', title: 'Guía definitiva: cómo elegir tu primera bici de ruta', excerpt: 'Aluminio vs carbono, groupset, geometría — todo lo que necesitas saber antes de invertir.', category: 'CICLISMO', readTimeMinutes: 10, imageUrl: '/images/blog-cycling.jpg' },
    { slug: 'transicion-triatlon', title: 'Domina las transiciones en triatlón', excerpt: 'Las transiciones T1 y T2 pueden ahorrarte (o costarte) minutos valiosos. Tips de los pros.', category: 'TRIATLON', readTimeMinutes: 7, imageUrl: '/images/triathlon.jpg' },
    { slug: 'trail-running-principiantes', title: 'Trail running: de la calle a la montaña', excerpt: 'Todo lo que un corredor de asfalto necesita saber antes de lanzarse al trail.', category: 'TRAIL', readTimeMinutes: 9, imageUrl: '/images/ocr.jpg' },
    { slug: 'prevenir-lesiones-running', title: '5 lesiones más comunes en running y cómo prevenirlas', excerpt: 'Fascitis plantar, rodilla del corredor, periostitis... Aprende a identificarlas y evitarlas.', category: 'RUNNING', readTimeMinutes: 6, imageUrl: '/images/marathon.jpg' },
  ]
  for (const a of articles) {
    try {
      await ddb.send(new PutCommand({
        TableName: ARTICLE_TABLE,
        Item: {
          id: randomUUID(),
          ...a,
          authorName: 'Pulsara',
          status: 'PUBLISHED',
          publishedAt: now,
          __typename: 'Article',
          createdAt: now,
          updatedAt: now,
        },
      }))
      console.log(`  ✅ ${a.title}`)
    } catch (e: any) {
      console.error(`  ❌ ${a.title}:`, e.message)
    }
  }

  console.log('\n✅ Seed complete!')
}

seed()
