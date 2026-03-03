import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Trophy, Timer, Medal } from 'lucide-react'

const client = generateClient<Schema>()

export default function ResultsBrowser() {
  const [results, setResults] = useState<Schema['Result']['type'][]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadResults() }, [])

  async function loadResults() {
    try {
      const { data } = await client.models.Result.list({ limit: 100 })
      setResults(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = results.filter(r =>
    !search || (r.athleteName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (r.distanceName ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Resultados</h1>
        <p className="text-zinc-500">Busca tiempos, posiciones y resultados de todas las competencias</p>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <Input
          placeholder="Buscar por atleta o distancia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <Trophy className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">
              {search ? 'No se encontraron resultados' : 'Aún no hay resultados publicados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-zinc-500">
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Atleta</th>
                <th className="pb-3 font-medium">Distancia</th>
                <th className="pb-3 font-medium">Chip Time</th>
                <th className="pb-3 font-medium">General</th>
                <th className="pb-3 font-medium">Género</th>
                <th className="pb-3 font-medium">Categoría</th>
                <th className="pb-3 font-medium">Ritmo</th>
                <th className="pb-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                  <td className="py-3">
                    {(r.overallRank ?? i + 1) <= 3 ? (
                      <Medal className={`w-5 h-5 ${r.overallRank === 1 ? 'text-amber-500' : r.overallRank === 2 ? 'text-zinc-400' : 'text-orange-600'}`} />
                    ) : (
                      <span className="text-zinc-400">{r.overallRank ?? '—'}</span>
                    )}
                  </td>
                  <td className="py-3 font-medium text-zinc-900">{r.athleteName ?? '—'}</td>
                  <td className="py-3 text-zinc-600">{r.distanceName}</td>
                  <td className="py-3 font-mono font-bold text-zinc-900 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5 text-emerald-500" />
                    {r.chipTime ?? '—'}
                  </td>
                  <td className="py-3 text-zinc-700">#{r.overallRank ?? '—'}</td>
                  <td className="py-3 text-zinc-700">#{r.genderRank ?? '—'}</td>
                  <td className="py-3 text-zinc-500">{r.ageGroup ?? '—'}</td>
                  <td className="py-3 text-zinc-700">{r.pace ?? '—'}/km</td>
                  <td className="py-3">
                    <Badge className={r.status === 'FINISHED' ? 'bg-emerald-100 text-emerald-700' : r.status === 'DNS' ? 'bg-red-100 text-red-700' : 'bg-zinc-100 text-zinc-600'}>
                      {r.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
