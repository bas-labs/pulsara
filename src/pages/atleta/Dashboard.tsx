import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trophy, Calendar, MapPin, ArrowRight, TrendingUp } from 'lucide-react'

const client = generateClient<Schema>()

export default function AtletaDashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null)
  const [upcomingRegs, setUpcomingRegs] = useState<Schema['Registration']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadData()
  }, [user])

  async function loadData() {
    try {
      const { data: profiles } = await client.models.UserProfile.list({
        filter: { userId: { eq: user!.userId } },
      })
      if (profiles.length > 0) setProfile(profiles[0])

      const { data: regs } = await client.models.Registration.listRegistrationByUserIdAndEventId({
        userId: user!.userId,
      })
      setUpcomingRegs(regs.filter(r => r.status === 'CONFIRMED'))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900">
          Hola, {profile?.firstName ?? 'Atleta'} 👋
        </h1>
        <p className="text-zinc-500 mt-1">Tu resumen deportivo</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { icon: Calendar, label: 'Eventos', value: profile?.totalEvents ?? 0 },
          { icon: TrendingUp, label: 'Km totales', value: `${profile?.totalDistanceKm?.toFixed(0) ?? 0} km` },
          { icon: Trophy, label: 'Podiums', value: profile?.totalPodiums ?? 0 },
          { icon: MapPin, label: 'Próximos', value: upcomingRegs.length },
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

      {/* Upcoming Events */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900">Próximos Eventos</h2>
        <Link to="/eventos">
          <Button variant="ghost" className="text-emerald-600 text-sm">
            Buscar eventos <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-400">Cargando...</p>
      ) : upcomingRegs.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Trophy className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500 mb-4">No tienes eventos próximos. ¡Encuentra tu próximo reto!</p>
            <Link to="/eventos">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Explorar Eventos</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcomingRegs.map(reg => (
            <Card key={reg.id} className="hover:shadow-md transition-all">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{reg.distanceName ?? 'Evento'}</h3>
                    <p className="text-sm text-zinc-500">
                      {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('es-MX') : ''}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-emerald-600">{reg.status}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
