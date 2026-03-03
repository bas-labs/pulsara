import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, MapPin, Calendar } from 'lucide-react'

const client = generateClient<Schema>()

export default function SerialsBrowser() {
  const [serials, setSerials] = useState<Schema['Serial']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await client.models.Serial.list()
      setSerials(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Seriales</h1>
        <p className="text-zinc-500">Compite en circuitos de múltiples eventos y acumula puntos</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : serials.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Trophy className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">Próximamente — seriales y circuitos</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {serials.map(serial => (
            <Card key={serial.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
              <div className="h-3" style={{ backgroundColor: serial.color ?? '#10B981' }} />
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">
                    {serial.name}
                  </h3>
                  <Badge className={
                    serial.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' :
                    serial.status === 'UPCOMING' ? 'bg-blue-100 text-blue-700' :
                    'bg-zinc-100 text-zinc-600'
                  }>
                    {serial.status === 'ACTIVE' ? 'Activo' : serial.status === 'UPCOMING' ? 'Próximo' : serial.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm text-zinc-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{serial.year}</span>
                    <span>·</span>
                    <span>{serial.totalEvents} eventos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{(serial.cities ?? []).join(', ')}</span>
                  </div>
                  <div className="flex gap-1 mt-3">
                    {(serial.sports ?? []).map(sport => (
                      <Badge key={sport} variant="outline" className="text-xs capitalize">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
