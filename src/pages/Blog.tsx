import { useEffect, useState } from 'react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, BookOpen } from 'lucide-react'

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
      const { data } = await client.models.Article.list()
      setArticles(data.filter(a => a.status === 'PUBLISHED').sort((a, b) =>
        new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
      ))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Blog</h1>
        <p className="text-zinc-500">Consejos, guías y noticias del mundo deportivo</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <Card>
          <CardContent className="p-16 text-center">
            <BookOpen className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">Próximamente — artículos y guías</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map(article => (
            <Card key={article.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
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
          ))}
        </div>
      )}
    </div>
  )
}
