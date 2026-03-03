import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Users, Clock, ArrowLeft, CheckCircle } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fadeUp, stagger, scaleIn, springHover } from '@/lib/animations'

const client = generateClient<Schema>()

export default function EventDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Schema['Event']['type'] | null>(null)
  const [distances, setDistances] = useState<Schema['EventDistance']['type'][]>([])
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null)
  const [registering, setRegistering] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) loadEvent()
  }, [slug])

  async function loadEvent() {
    try {
      const { data } = await client.models.Event.listEventBySlug({ slug: slug! }, { authMode: 'identityPool' })
      if (data.length > 0) {
        const ev = data[0]
        setEvent(ev)
        const { data: dists } = await client.models.EventDistance.listEventDistanceByEventId({ eventId: ev.id }, { authMode: 'identityPool' })
        setDistances(dists)
        if (dists.length > 0) setSelectedDistance(dists[0].id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!user || !event || !selectedDistance) return
    setRegistering(true)
    try {
      const dist = distances.find(d => d.id === selectedDistance)
      const { data: regData } = await client.models.Registration.create({
        userId: user.userId,
        eventId: event.id,
        distanceId: selectedDistance,
        distanceName: dist?.name ?? '',
        distanceKm: dist?.distanceKm,
        category: dist?.category ?? 'GENERAL',
        status: 'CONFIRMED',
        paymentStatus: 'PENDING',
        amountPaid: dist?.price ?? 0,
        registeredAt: new Date().toISOString(),
        waiverSigned: true,
      })
      if (event.spotsRemaining && event.spotsRemaining > 0) {
        await client.models.Event.update({
          id: event.id,
          spotsRemaining: event.spotsRemaining - 1,
        })
      }
      if (dist) {
        const currentSpots = dist.spotsRemaining ?? dist.spotsTotal ?? 0
        if (currentSpots > 0) {
          await client.models.EventDistance.update({
            id: dist.id,
            spotsRemaining: currentSpots - 1,
          })
        }
      }
      setRegistered(true)

      if (dist && dist.price && dist.price > 0 && regData) {
        try {
          const { data: checkoutUrl } = await client.mutations.createCheckoutSession({
            eventId: event.id,
            distanceId: dist.id,
            distanceName: dist.name,
            eventTitle: event.title,
            priceInCentavos: dist.price,
            userId: user!.userId,
            userEmail: user!.userId,
            registrationId: regData.id,
          })
          if (checkoutUrl) {
            window.location.href = checkoutUrl
            return
          }
        } catch (payErr) {
          console.error('Checkout creation failed:', payErr)
        }
      }
    } catch (err) {
      console.error('Registration failed:', err)
    } finally {
      setRegistering(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!event) return <div className="flex items-center justify-center h-64 text-zinc-400">Evento no encontrado</div>

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        {/* Hero */}
        <motion.div
          className="relative rounded-2xl overflow-hidden mb-8"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          {event.bannerUrl || event.imageUrl ? (
            <img src={event.bannerUrl ?? event.imageUrl ?? ''} alt={event.title} className="w-full h-64 md:h-80 object-cover" />
          ) : (
            <div className="w-full h-64 md:h-80 bg-gradient-to-br from-emerald-100 to-teal-100" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-6 left-6">
            <Badge className="bg-emerald-600 text-white mb-3">{event.sport}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-white">{event.title}</h1>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Info */}
          <div className="md:col-span-2 space-y-6">
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              {[
                { icon: Calendar, label: 'Fecha', value: new Date(event.eventDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) },
                { icon: MapPin, label: 'Ubicación', value: `${event.city}${event.state ? ', ' + event.state : ''}` },
                { icon: Users, label: 'Lugares', value: event.spotsRemaining ? `${event.spotsRemaining} disponibles` : 'Disponible' },
                { icon: Clock, label: 'Cierre inscripción', value: event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString('es-MX') : 'Abierta' },
              ].map((item, i) => (
                <motion.div key={item.label} variants={fadeUp} custom={i} className="bg-zinc-50 rounded-xl p-4">
                  <item.icon className="w-5 h-5 text-emerald-600 mb-2" />
                  <p className="text-xs text-zinc-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-semibold text-zinc-900">{item.value}</p>
                </motion.div>
              ))}
            </motion.div>

            {event.description && (
              <div>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Descripción</h2>
                <p className="text-zinc-600 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {event.venue && (
              <div>
                <h2 className="text-xl font-bold text-zinc-900 mb-3">Lugar</h2>
                <p className="text-zinc-600">{event.venue}</p>
                {event.address && <p className="text-zinc-500 text-sm mt-1">{event.address}</p>}
              </div>
            )}
          </div>

          {/* Registration sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <AnimatePresence mode="wait">
                  {registered ? (
                    <motion.div
                      key="success"
                      variants={scaleIn}
                      initial="hidden"
                      animate="visible"
                      className="text-center py-6"
                    >
                      <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                      <h3 className="font-bold text-xl text-zinc-900 mb-1">¡Inscrito!</h3>
                      <p className="text-zinc-500 text-sm">Te enviamos la confirmación por email.</p>
                      <Button className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate('/atleta/mis-eventos')}>
                        Ver mis eventos
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div key="form" initial={{ opacity: 1 }}>
                      <h3 className="font-bold text-lg text-zinc-900 mb-4">Inscripción</h3>
                      {distances.length > 0 ? (
                        <div className="space-y-3 mb-6">
                          {distances.map(dist => (
                            <motion.label
                              key={dist.id}
                              whileHover={{ scale: 1.01 }}
                              transition={springHover}
                              className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${selectedDistance === dist.id ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-200 hover:border-emerald-200'}`}
                              onClick={() => setSelectedDistance(dist.id)}
                            >
                              <div>
                                <p className="font-semibold text-zinc-900">{dist.name}</p>
                                {dist.distanceKm && <p className="text-xs text-zinc-500">{dist.distanceKm} km</p>}
                              </div>
                              <span className="font-bold text-emerald-600">${(dist.price / 100).toLocaleString('es-MX')}</span>
                            </motion.label>
                          ))}
                        </div>
                      ) : (
                        <p className="text-zinc-500 text-sm mb-6">Precio por confirmar</p>
                      )}

                      {event.status === 'SOLDOUT' ? (
                        <Button disabled className="w-full">Agotado</Button>
                      ) : !user ? (
                        <div className="space-y-2">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate(`/evento/${slug}/inscripcion`)}>
                            Inscribirme
                          </Button>
                          <Button variant="outline" className="w-full" onClick={() => navigate('/login')}>
                            Ya tengo cuenta
                          </Button>
                        </div>
                      ) : (
                        <Button
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={registering || !selectedDistance}
                          onClick={handleRegister}
                        >
                          {registering ? 'Inscribiendo...' : 'Inscribirme'}
                        </Button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
