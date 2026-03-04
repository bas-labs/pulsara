import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Calendar, Users, Clock, ArrowLeft } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import StorageImage from '@/components/StorageImage'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fadeUp, stagger, springHover } from '@/lib/animations'

const client = generateClient<Schema>()

export default function EventDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Schema['Event']['type'] | null>(null)
  const [distances, setDistances] = useState<Schema['EventDistance']['type'][]>([])
  const [selectedDistance, setSelectedDistance] = useState<string | null>(null)
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
        const firstAvailable = dists.find(d => d.spotsRemaining === null || d.spotsRemaining === undefined || d.spotsRemaining > 0)
        if (firstAvailable) setSelectedDistance(firstAvailable.id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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
            <StorageImage path={event.bannerUrl ?? event.imageUrl} alt={event.title} className="w-full h-64 md:h-80 object-cover" />
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
                  <motion.div key="form" initial={{ opacity: 1 }}>
                    <h3 className="font-bold text-lg text-zinc-900 mb-4">Inscripción</h3>
                    {distances.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {distances.map(dist => {
                          const isSoldOut = dist.spotsRemaining !== null && dist.spotsRemaining !== undefined && dist.spotsRemaining <= 0
                          return (
                            <motion.label
                              key={dist.id}
                              whileHover={isSoldOut ? {} : { scale: 1.01 }}
                              transition={springHover}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                isSoldOut
                                  ? 'border-zinc-200 bg-zinc-100 opacity-60 cursor-not-allowed'
                                  : selectedDistance === dist.id
                                    ? 'border-emerald-500 bg-emerald-50 cursor-pointer'
                                    : 'border-zinc-200 hover:border-emerald-200 cursor-pointer'
                              }`}
                              onClick={() => { if (!isSoldOut) setSelectedDistance(dist.id) }}
                            >
                              <div>
                                <p className={`font-semibold ${isSoldOut ? 'text-zinc-400' : 'text-zinc-900'}`}>{dist.name}</p>
                                {dist.distanceKm && <p className={`text-xs ${isSoldOut ? 'text-zinc-400' : 'text-zinc-500'}`}>{dist.distanceKm} km</p>}
                              </div>
                              {isSoldOut ? (
                                <span className="font-bold text-red-400">Agotado</span>
                              ) : (
                                <span className="font-bold text-emerald-600">${((dist.price ?? 0) / 100).toLocaleString('es-MX')}</span>
                              )}
                            </motion.label>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-sm mb-6">Precio por confirmar</p>
                    )}

                    {event.status === 'CANCELLED' ? (
                      <Button disabled className="w-full">Evento cancelado</Button>
                    ) : event.status === 'COMPLETED' ? (
                      <Button disabled className="w-full">Evento finalizado</Button>
                    ) : event.status === 'DRAFT' ? (
                      <Button disabled className="w-full">Próximamente</Button>
                    ) : event.status === 'SOLDOUT' ? (
                      <Button disabled className="w-full">Agotado</Button>
                    ) : event.registrationDeadline && new Date() > new Date(event.registrationDeadline) ? (
                      <Button disabled className="w-full">Inscripción cerrada</Button>
                    ) : (
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate(`/evento/${slug}/inscripcion`)}>
                        Inscribirme
                      </Button>
                    )}
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
