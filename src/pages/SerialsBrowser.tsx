import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, MapPin, Calendar } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { fadeUp, stagger } from '@/lib/animations'

const client = generateClient<Schema>()

export default function SerialsBrowser() {
  const [serials, setSerials] = useState<Schema['Serial']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await client.models.Serial.list({ authMode: 'iam' })
      setSerials(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Seriales</h1>
          <p className="text-zinc-500">Compite en circuitos de múltiples eventos y acumula puntos</p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : serials.length === 0 ? (
          <EmptyState icon={Trophy} title="Próximamente" description="Seriales y circuitos deportivos" />
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {serials.map((serial, i) => (
              <motion.div key={serial.id} variants={fadeUp} custom={i}>
                <Card className="overflow-hidden hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200/60 transition-all duration-300 cursor-pointer group">
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
