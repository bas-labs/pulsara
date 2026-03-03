import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Users, TrendingUp, BarChart3 } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { fadeUp, stagger, springHover } from '@/lib/animations'

const client = generateClient<Schema>()

const statusLabels: Record<string, string> = {
  DRAFT: 'Borrador', PUBLISHED: 'Publicado', SOLDOUT: 'Agotado', CANCELLED: 'Cancelado', COMPLETED: 'Completado',
}

export default function OrgDashboard() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Schema['Event']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadEvents()
  }, [user])

  async function loadEvents() {
    try {
      const { data } = await client.models.Event.list({
        filter: { organizerId: { eq: user!.userId } },
      })
      setEvents(data.sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const published = events.filter(e => e.status === 'PUBLISHED').length
  const totalSpots = events.reduce((sum, e) => sum + (e.totalSpots ?? 0), 0)

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Panel de Organizador</h1>
            <p className="text-zinc-500 mt-1">Gestiona tus eventos deportivos</p>
          </div>
          <Link to="/org/crear-evento">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Crear Evento
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {[
            { icon: Calendar, label: 'Eventos totales', value: events.length },
            { icon: TrendingUp, label: 'Publicados', value: published },
            { icon: Users, label: 'Lugares totales', value: totalSpots.toLocaleString() },
            { icon: BarChart3, label: 'Completados', value: events.filter(e => e.status === 'COMPLETED').length },
          ].map((stat, i) => (
            <motion.div key={stat.label} variants={fadeUp} custom={i} whileHover={{ y: -4 }} transition={springHover}>
              <Card className="hover:shadow-lg hover:border-emerald-100 transition-all duration-300">
                <CardContent className="p-5">
                  <stat.icon className="w-5 h-5 text-emerald-600 mb-2" />
                  <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Events List */}
        <h2 className="text-xl font-bold text-zinc-900 mb-4">Mis Eventos</h2>
        {loading ? (
          <LoadingSpinner />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="Aún no tienes eventos"
            description="¡Crea tu primero!"
            action={
              <Link to="/org/crear-evento">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Crear Evento
                </Button>
              </Link>
            }
          />
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={stagger}>
            {events.map((event, i) => (
              <motion.div key={event.id} variants={fadeUp} custom={i}>
                <Link to={`/org/evento/${event.id}`}>
                  <Card className="hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-200/60 transition-all duration-300 cursor-pointer mb-3">
                    <CardContent className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900">{event.title}</h3>
                          <p className="text-sm text-zinc-500">
                            {new Date(event.eventDate).toLocaleDateString('es-MX')} · {event.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs">
                          {event.spotsRemaining ?? '?'} lugares
                        </Badge>
                        <Badge className={event.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}>
                          {statusLabels[event.status ?? 'DRAFT']}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
