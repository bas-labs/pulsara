import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, CheckCircle, Eye } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { fadeUp, fadeIn, stagger, staggerFast, springHover } from '@/lib/animations'

const client = generateClient<Schema>()

export default function OrgEventManage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Schema['Event']['type'] | null>(null)
  const [registrations, setRegistrations] = useState<Schema['Registration']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (eventId) loadData()
  }, [eventId])

  async function loadData() {
    try {
      const { data: ev } = await client.models.Event.get({ id: eventId! })
      setEvent(ev)
      if (ev) {
        const { data: regs } = await client.models.Registration.listRegistrationByEventIdAndStatus({ eventId: ev.id })
        setRegistrations(regs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function publishEvent() {
    if (!event) return
    await client.models.Event.update({ id: event.id, status: 'PUBLISHED' })
    setEvent({ ...event, status: 'PUBLISHED' })
  }

  if (loading) return <LoadingSpinner />
  if (!event) return <div className="flex items-center justify-center h-64 text-zinc-400">Evento no encontrado</div>

  const confirmed = registrations.filter(r => r.status === 'CONFIRMED').length

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <button onClick={() => navigate('/org')} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6">
          <ArrowLeft className="w-4 h-4" /> Volver al panel
        </button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">{event.title}</h1>
            <p className="text-zinc-500 mt-1">{event.city} · {new Date(event.eventDate).toLocaleDateString('es-MX')}</p>
          </div>
          <div className="flex gap-3">
            {event.status === 'DRAFT' && (
              <Button onClick={publishEvent} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Eye className="w-4 h-4 mr-2" /> Publicar
              </Button>
            )}
            <Badge className={event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}>
              {event.status}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-3 gap-4 mb-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {[
            { value: confirmed, label: 'Inscritos' },
            { value: event.spotsRemaining ?? '—', label: 'Lugares restantes' },
            { value: event.totalSpots ?? '—', label: 'Capacidad total' },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i} whileHover={{ y: -4 }} transition={springHover}>
              <Card className="hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
                <CardContent className="p-5 text-center">
                  <p className="text-3xl font-bold text-zinc-900">{stat.value}</p>
                  <p className="text-sm text-zinc-500">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Registrations */}
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Inscripciones ({registrations.length})</h2>
        {registrations.length === 0 ? (
          <EmptyState icon={CheckCircle} title="Aún no hay inscripciones" description="Las inscripciones aparecerán aquí cuando los atletas se registren." />
        ) : (
          <Card>
            <CardContent className="p-0">
              <motion.table className="w-full" initial="hidden" animate="visible" variants={staggerFast}>
                <thead>
                  <tr className="border-b border-zinc-100">
                    <th className="text-left text-xs text-zinc-500 font-medium p-4">ID</th>
                    <th className="text-left text-xs text-zinc-500 font-medium p-4">Distancia</th>
                    <th className="text-left text-xs text-zinc-500 font-medium p-4">Estado</th>
                    <th className="text-left text-xs text-zinc-500 font-medium p-4">Pago</th>
                    <th className="text-left text-xs text-zinc-500 font-medium p-4">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((reg, i) => (
                    <motion.tr key={reg.id} variants={fadeIn} custom={i} className="border-b border-zinc-50 hover:bg-zinc-50 transition-colors">
                      <td className="p-4 text-sm font-mono text-zinc-600">{reg.id.substring(0, 8)}...</td>
                      <td className="p-4 text-sm text-zinc-900">{reg.distanceName ?? '—'}</td>
                      <td className="p-4">
                        <Badge variant="outline" className="text-xs">
                          {reg.status === 'CONFIRMED' && <CheckCircle className="w-3 h-3 mr-1 text-emerald-500" />}
                          {reg.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-zinc-600">{reg.paymentStatus}</td>
                      <td className="p-4 text-sm text-zinc-500">
                        {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('es-MX') : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            </CardContent>
          </Card>
        )}
      </div>
    </PageWrapper>
  )
}
