import { useEffect, useState, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Calendar, ArrowRight } from 'lucide-react'

import PageWrapper from '@/components/PageWrapper'
import StorageImage from '@/components/StorageImage'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { fadeUp, stagger, springHover } from '@/lib/animations'

const client = generateClient<Schema>()

const sportLabels: Record<string, string> = {
  RUNNING: 'Running', CICLISMO: 'Ciclismo', NATACION: 'Natación', TRAIL: 'Trail',
  TRIATLON: 'Triatlón', OCR: 'OCR', SENDERISMO: 'Senderismo', DOWNHILL: 'Downhill', OTRO: 'Otro',
}

export default function EventBrowser() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState<Schema['Event']['type'][]>([])
  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [sportFilter, setSportFilter] = useState<string | null>(() => {
    const sport = searchParams.get('sport')
    if (!sport) return null
    const key = Object.keys(sportLabels).find(k => sportLabels[k].toLowerCase() === sport.toLowerCase())
    return key ?? null
  })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextToken, setNextToken] = useState<string | null | undefined>(null)
  const loaderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setEvents([])
    setNextToken(null)
    loadEvents(null)
  }, [sportFilter])

  async function loadEvents(token: string | null | undefined) {
    if (token) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    try {
      const filter: Record<string, { eq: string }> = { status: { eq: 'PUBLISHED' } }
      if (sportFilter) filter.sport = { eq: sportFilter }
      const { data, nextToken: nt } = await client.models.Event.list({
        filter,
        authMode: 'identityPool',
        limit: 24,
        ...(token ? { nextToken: token } : {}),
      })
      setEvents(prev => {
        const merged = token ? [...prev, ...data] : data
        return merged.sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
      })
      setNextToken(nt ?? null)
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = useCallback(() => {
    if (nextToken && !loadingMore) {
      loadEvents(nextToken)
    }
  }, [nextToken, loadingMore])

  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) handleLoadMore() },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [handleLoadMore])

  const filtered = events.filter(e =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.city?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <PageWrapper>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Eventos</h1>
        <p className="text-zinc-500 mb-8">Encuentra tu próximo reto deportivo</p>

        {/* Search + Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por nombre o ciudad..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant={sportFilter === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSportFilter(null)}
                className={sportFilter === null ? 'bg-emerald-600 text-white' : ''}
              >
                Todos
              </Button>
            </motion.div>
            {Object.entries(sportLabels).map(([key, label]) => (
              <motion.div key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant={sportFilter === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSportFilter(key)}
                  className={sportFilter === key ? 'bg-emerald-600 text-white' : ''}
                >
                  {label}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={Search} title="No se encontraron eventos" description={search ? 'Intenta con otra búsqueda' : 'Aún no hay eventos publicados'} />
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {filtered.map((event, i) => (
              <motion.div key={event.id} variants={fadeUp} custom={i} whileHover={{ y: -6 }} transition={springHover}>
                <Link to={`/evento/${event.slug}`}>
                  <Card className="group overflow-hidden border-zinc-200/60 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full">
                    <div className="relative h-48 bg-gradient-to-br from-zinc-200 to-zinc-100 overflow-hidden">
                      {event.imageUrl ? (
                        <StorageImage path={event.imageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-400 text-sm">{sportLabels[event.sport ?? 'OTRO']}</div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2">
                        <Badge className="bg-white/90 text-zinc-800 text-xs">{sportLabels[event.sport ?? 'OTRO']}</Badge>
                        {event.status === 'SOLDOUT' && <Badge className="bg-red-500 text-white text-xs">Agotado</Badge>}
                        {event.featured && <Badge className="bg-emerald-500 text-white text-xs">Destacado</Badge>}
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-zinc-900 text-lg leading-tight mb-3 group-hover:text-emerald-600 transition-colors">
                        {event.title}
                      </h3>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <Calendar className="w-4 h-4 text-emerald-500" />
                          {new Date(event.eventDate).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-zinc-500">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          {event.city}{event.state ? `, ${event.state}` : ''}
                        </div>
                      </div>
                      {event.priceMin && (
                        <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                          <span className="font-semibold text-zinc-900">Desde ${(event.priceMin / 100).toLocaleString('es-MX')}</span>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-8">
                            Ver más <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Infinite scroll trigger & loading indicator */}
        {!loading && nextToken && (
          <div ref={loaderRef} className="flex justify-center py-8">
            {loadingMore ? (
              <LoadingSpinner />
            ) : (
              <span className="text-zinc-400 text-sm">Cargando más eventos...</span>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
