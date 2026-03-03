import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, CheckCircle } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { fadeUp, stagger } from '@/lib/animations'

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
    <PageWrapper>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Mis Eventos</h1>
        <p className="text-zinc-500 mb-8">Todas tus inscripciones</p>

        {loading ? (
          <LoadingSpinner />
        ) : registrations.length === 0 ? (
          <EmptyState icon={Calendar} title="No tienes inscripciones aún" description="Explora eventos y encuentra tu próximo reto" />
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={stagger}>
            {registrations.map((reg, i) => (
              <motion.div key={reg.id} variants={fadeUp} custom={i}>
                <Card className="hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-200/60 transition-all duration-300">
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
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </PageWrapper>
  )
}
