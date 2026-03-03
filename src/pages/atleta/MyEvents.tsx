import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle } from 'lucide-react'

const client = generateClient<Schema>()

export default function AtletaMyEvents() {
  const { user } = useAuth()
  const [registrations, setRegistrations] = useState<Schema['Registration']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadRegs()
  }, [user])

  async function loadRegs() {
    try {
      const { data } = await client.models.Registration.listRegistrationByUserIdAndEventId({
        userId: user!.userId,
      })
      setRegistrations(data.sort((a, b) =>
        new Date(b.registeredAt ?? 0).getTime() - new Date(a.registeredAt ?? 0).getTime()
      ))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Mis Eventos</h1>
      <p className="text-zinc-500 mb-8">Todas tus inscripciones</p>

      {loading ? (
        <p className="text-zinc-400">Cargando...</p>
      ) : registrations.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-zinc-400">
            No tienes inscripciones aún.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {registrations.map(reg => (
            <Card key={reg.id}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{reg.distanceName} — {reg.distanceKm ? `${reg.distanceKm}km` : ''}</h3>
                    <p className="text-sm text-zinc-500">
                      Inscrito: {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString('es-MX') : '—'}
                      {reg.bibNumber ? ` · Dorsal #${reg.bibNumber}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {reg.amountPaid && (
                    <span className="text-sm text-zinc-600">${((reg.amountPaid) / 100).toLocaleString('es-MX')}</span>
                  )}
                  <Badge className={reg.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : reg.status === 'FINISHED' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-600'}>
                    {reg.status === 'CONFIRMED' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {reg.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
