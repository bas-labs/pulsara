import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, BookOpen } from 'lucide-react'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import EmptyState from '@/components/EmptyState'
import { fadeUp, stagger } from '@/lib/animations'

const client = generateClient<Schema>()

const CATEGORY_LABELS: Record<string, string> = {
  RUNNING: 'Running', CICLISMO: 'Ciclismo', NATACION: 'Natación',
  TRAIL: 'Trail', TRIATLON: 'Triatlón', NUTRICION: 'Nutrición',
  ENTRENAMIENTO: 'Entrenamiento', EQUIPO: 'Equipo', OTRO: 'General',
}

export default function Blog() {
  const [articles, setArticles] = useState<Schema['Article']['type'][]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      const { data } = await client.models.Article.list({ authMode: 'identityPool' })
      setArticles(data.filter(a => a.status === 'PUBLISHED').sort((a, b) =>
        new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
      ))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <PageWrapper>
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">Blog</h1>
          <p className="text-zinc-500">Consejos, guías y noticias del mundo deportivo</p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : articles.length === 0 ? (
          <EmptyState icon={BookOpen} title="Próximamente" description="Artículos y guías deportivas" />
        ) : (
          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            {articles.map((article, i) => (
              <motion.div key={article.id} variants={fadeUp} custom={i}>
                <Card className="overflow-hidden hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200/60 transition-all duration-300 cursor-pointer group">
                  {article.imageUrl && (
                    <div className="aspect-[16/9] overflow-hidden bg-zinc-100">
                      <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[article.category ?? 'OTRO'] ?? article.category}
                      </Badge>
                      {article.readTimeMinutes && (
                        <span className="text-xs text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {article.readTimeMinutes} min
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors mb-2">
                      {article.title}
                    </h3>
                    {article.excerpt && (
                      <p className="text-sm text-zinc-500 line-clamp-2">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-4 text-xs text-zinc-400">
                      <span>{article.authorName}</span>
                      {article.publishedAt && (
                        <>
                          <span>·</span>
                          <span>{new Date(article.publishedAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </>
                      )}
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
