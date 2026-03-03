import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Timer, Medal } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { fadeUp, stagger } from '@/lib/animations'

const client = generateClient<Schema>()

export default function AtletaResults() {
  const { user } = useAuth()
  const [results, setResults] = useState<Schema['Result']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadResults()
  }, [user])

  async function loadResults() {
    try {
      const { data } = await client.models.Result.listResultByUserId({ userId: user!.userId })
      setResults(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Mis Resultados</h1>
        <p className="text-zinc-500 mb-8">Tu historial de competencias</p>

        {loading ? (
          <LoadingSpinner />
        ) : results.length === 0 ? (
          <EmptyState icon={Trophy} title="Aún no tienes resultados" description="¡Compite en tu próximo evento!" />
        ) : (
          <motion.div className="space-y-3" initial="hidden" animate="visible" variants={stagger}>
            {results.map((result, i) => (
              <motion.div key={result.id} variants={fadeUp} custom={i}>
                <Card className="hover:shadow-md hover:shadow-emerald-500/5 hover:border-emerald-200/60 transition-all duration-300">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${(result.overallRank ?? 999) <= 3 ? 'bg-amber-100' : 'bg-zinc-100'}`}>
                          {(result.overallRank ?? 999) <= 3 ? (
                            <Medal className="w-5 h-5 text-amber-600" />
                          ) : (
                            <Trophy className="w-5 h-5 text-zinc-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-zinc-900">{result.distanceName}</h3>
                          <p className="text-xs text-zinc-500">{result.ageGroup}</p>
                        </div>
                      </div>
                      <Badge className={result.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}>
                        {result.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-zinc-400">Tiempo chip</p>
                        <p className="font-mono font-bold text-zinc-900 flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-emerald-500" /> {result.chipTime ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">General</p>
                        <p className="font-bold text-zinc-900">#{result.overallRank ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Género</p>
                        <p className="font-bold text-zinc-900">#{result.genderRank ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Ritmo</p>
                        <p className="font-bold text-zinc-900">{result.pace ?? '—'}/km</p>
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
