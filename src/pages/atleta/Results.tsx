import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Timer, Medal } from 'lucide-react'

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
    <div className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Mis Resultados</h1>
      <p className="text-zinc-500 mb-8">Tu historial de competencias</p>

      {loading ? (
        <p className="text-zinc-400">Cargando...</p>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Trophy className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-400">Aún no tienes resultados. ¡Compite en tu próximo evento!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map(result => (
            <Card key={result.id}>
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
          ))}
        </div>
      )}
    </div>
  )
}
