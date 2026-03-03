/**
 * Seed script — run with: npx tsx scripts/seed.ts
 * Requires amplify_outputs.json (run after first deploy)
 */
import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/data'
import outputs from '../amplify_outputs.json'

Amplify.configure(outputs as any)
const client = generateClient<any>()

const seedEvents = [
  {slug:"triatlon-la-paz-2026",title:"Triatlón La Paz 2026",sport:"TRIATLON",eventDate:"2026-03-07T07:00:00Z",city:"La Paz",state:"Baja California Sur",status:"PUBLISHED"},
  {slug:"17va-carrera-ceulver-2026",title:"17va Carrera CEULVER 3km/5km/10km",sport:"RUNNING",eventDate:"2026-03-08T07:00:00Z",city:"Veracruz",state:"Veracruz",status:"PUBLISHED",distances:[{name:"3K",distanceKm:3},{name:"5K",distanceKm:5},{name:"10K",distanceKm:10}]},
  {slug:"womans-day-2026",title:"Womans Day 2026",sport:"RUNNING",eventDate:"2026-03-08T07:00:00Z",city:"CDMX",state:"CDMX",status:"PUBLISHED"},
  {slug:"nomadix-adventure-2026",title:"Nomadix Adventure Ocean to Ocean 2026",sport:"TRAIL",eventDate:"2026-03-13T07:00:00Z",city:"Todos Santos",state:"Baja California Sur",status:"PUBLISHED"},
  {slug:"ultra-combo-spartan-deka-2026",title:"ULTRA COMBO Spartan + DEKA 2026",sport:"OCR",eventDate:"2026-04-18T07:00:00Z",city:"CDMX",state:"CDMX",status:"PUBLISHED",tags:["combo"]},
  {slug:"trail-luciernaga-2026",title:"Trail Luciérnaga 21k-12k-5k 2026",sport:"TRAIL",eventDate:"2026-05-03T07:00:00Z",city:"San Felipe Hidalgo",state:"Tlaxcala",status:"PUBLISHED",distances:[{name:"21K",distanceKm:21},{name:"12K",distanceKm:12},{name:"5K",distanceKm:5}]},
  {slug:"ironman-703-cozumel-2026",title:"IRONMAN 70.3 Cozumel 2026 HSBC",sport:"TRIATLON",eventDate:"2026-09-20T07:00:00Z",city:"Cozumel",state:"Quintana Roo",status:"PUBLISHED",featured:true,distances:[{name:"70.3",distanceKm:113}]},
  {slug:"running-day-2026",title:"Running Day COMBO 2026",sport:"RUNNING",eventDate:"2026-04-18T07:00:00Z",city:"CDMX",state:"CDMX",status:"PUBLISHED"},
  {slug:"senderismo-iztaccihuatl-2026",title:"Senderismo en el Iztaccíhuatl",sport:"SENDERISMO",eventDate:"2026-04-04T07:00:00Z",city:"Puebla",state:"Puebla",status:"PUBLISHED",tags:["nuevo"]},
  {slug:"color-run-mexico-2026",title:"Carrera Color Run México 2026",sport:"RUNNING",eventDate:"2026-04-26T07:00:00Z",city:"CDMX",state:"CDMX",status:"PUBLISHED"},
  {slug:"mujer-queretaro-medio-maraton-2026",title:"Mujer Querétaro Medio Maratón 2026",sport:"RUNNING",eventDate:"2026-03-15T07:00:00Z",city:"Querétaro",state:"Querétaro",status:"PUBLISHED",distances:[{name:"21K",distanceKm:21.1}]},
  {slug:"wonder-woman-run-2026",title:"Wonder Woman Run 2026 CDMX",sport:"RUNNING",eventDate:"2026-05-31T07:00:00Z",city:"CDMX",state:"CDMX",status:"PUBLISHED"},
]

async function seed() {
  console.log('🌱 Seeding Pulsara database...\n')

  for (const ev of seedEvents) {
    try {
      const { data } = await client.models.Event.create({
        slug: ev.slug, title: ev.title, sport: ev.sport,
        eventDate: ev.eventDate, city: ev.city, state: ev.state,
        country: 'MX', status: ev.status, organizerId: 'system',
        organizerName: 'Pulsara', featured: (ev as any).featured ?? false,
        tags: (ev as any).tags ?? [], priceMin: 39500, priceMax: 89000,
      })
      console.log(`✅ ${ev.title}`)
      if ((ev as any).distances && data) {
        for (const d of (ev as any).distances) {
          await client.models.EventDistance.create({
            eventId: data.id, name: d.name, distanceKm: d.distanceKm,
            price: 39500, category: 'GENERAL', spotsTotal: 500, spotsRemaining: 500,
          })
        }
      }
    } catch (err) { console.error(`❌ ${ev.title}:`, err) }
  }

  console.log('\n🌱 Seeding serials...')
  for (const s of [
    {slug:'circuito-estaciones-2026',name:'Circuito de las Estaciones 2026',color:'#10B981',year:2026,cities:['CDMX','GDL','MTY'],sports:['running'],totalEvents:4,status:'ACTIVE'},
    {slug:'tour-france-mexico-2026',name:'Tour de France México 2026',color:'#F59E0B',year:2026,cities:['CDMX','Oaxaca','Puebla'],sports:['ciclismo'],totalEvents:3,status:'ACTIVE'},
  ]) {
    await client.models.Serial.create({...s, organizerId:'system'}).then(() => console.log(`✅ ${s.name}`)).catch((e: any) => console.error(`❌ ${s.name}:`, e))
  }

  console.log('\n🌱 Seeding articles...')
  for (const a of [
    {slug:'plan-primer-21k',title:'Plan de entrenamiento: tu primer 21K',category:'RUNNING',readTimeMinutes:8,imageUrl:'/images/blog-running.jpg'},
    {slug:'nutricion-triatlon',title:'Nutrición para triatlón',category:'NUTRICION',readTimeMinutes:5,imageUrl:'/images/blog-nutrition.jpg'},
    {slug:'elegir-bici-ruta',title:'Cómo elegir tu primera bici de ruta',category:'CICLISMO',readTimeMinutes:6,imageUrl:'/images/blog-cycling.jpg'},
  ]) {
    await client.models.Article.create({...a, authorName:'Pulsara', status:'PUBLISHED', publishedAt:new Date().toISOString()}).then(() => console.log(`✅ ${a.title}`)).catch((e: any) => console.error(`❌ ${a.title}:`, e))
  }

  console.log('\n✅ Seed complete!')
}

seed()
