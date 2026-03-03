import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Calendar, Users, TrendingUp, BarChart3 } from 'lucide-react'

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Calendar, label: 'Eventos totales', value: events.length, color: 'emerald' },
          { icon: TrendingUp, label: 'Publicados', value: published, color: 'teal' },
          { icon: Users, label: 'Lugares totales', value: totalSpots.toLocaleString(), color: 'cyan' },
          { icon: BarChart3, label: 'Completados', value: events.filter(e => e.status === 'COMPLETED').length, color: 'green' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-5">
              <stat.icon className="w-5 h-5 text-emerald-600 mb-2" />
              <p className="text-2xl font-bold text-zinc-900">{stat.value}</p>
              <p className="text-xs text-zinc-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Events List */}
      <h2 className="text-xl font-bold text-zinc-900 mb-4">Mis Eventos</h2>
      {loading ? (
        <p className="text-zinc-400">Cargando...</p>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <p className="text-zinc-500 mb-4">Aún no tienes eventos. ¡Crea tu primero!</p>
            <Link to="/org/crear-evento">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" /> Crear Evento
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map(event => (
            <Link key={event.id} to={`/org/evento/${event.id}`}>
              <Card className="hover:shadow-md transition-all cursor-pointer mb-3">
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
          ))}
        </div>
      )}
    </div>
  )
}
