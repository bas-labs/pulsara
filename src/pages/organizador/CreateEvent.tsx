import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../amplify/data/resource'
import { useAuth } from '../../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'

const client = generateClient<Schema>()

const sports = [
  { value: 'RUNNING', label: 'Running' }, { value: 'CICLISMO', label: 'Ciclismo' },
  { value: 'NATACION', label: 'Natación' }, { value: 'TRAIL', label: 'Trail' },
  { value: 'TRIATLON', label: 'Triatlón' }, { value: 'OCR', label: 'OCR' },
  { value: 'SENDERISMO', label: 'Senderismo' }, { value: 'DOWNHILL', label: 'Downhill' },
  { value: 'OTRO', label: 'Otro' },
]

interface DistanceForm { name: string; distanceKm: string; price: string; spots: string }

export default function OrgCreateEvent() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sport, setSport] = useState('RUNNING')
  const [eventDate, setEventDate] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [venue, setVenue] = useState('')
  const [distances, setDistances] = useState<DistanceForm[]>([
    { name: '10K', distanceKm: '10', price: '395', spots: '500' },
  ])

  function addDistance() {
    setDistances([...distances, { name: '', distanceKm: '', price: '', spots: '' }])
  }

  function removeDistance(i: number) {
    setDistances(distances.filter((_, idx) => idx !== i))
  }

  function updateDistance(i: number, field: keyof DistanceForm, value: string) {
    const updated = [...distances]
    updated[i] = { ...updated[i], [field]: value }
    setDistances(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setLoading(true)

    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      const totalSpots = distances.reduce((sum, d) => sum + (parseInt(d.spots) || 0), 0)
      const prices = distances.map(d => parseInt(d.price) || 0).filter(p => p > 0)

      const { data: event } = await client.models.Event.create({
        slug,
        title,
        description,
        sport: sport as Schema['Event']['type']['sport'],
        eventDate: new Date(eventDate).toISOString(),
        city,
        state,
        venue,
        country: 'MX',
        organizerId: user.userId,
        totalSpots,
        spotsRemaining: totalSpots,
        priceMin: prices.length ? Math.min(...prices) * 100 : undefined,
        priceMax: prices.length ? Math.max(...prices) * 100 : undefined,
        status: 'DRAFT',
      })

      if (event) {
        for (const dist of distances) {
          await client.models.EventDistance.create({
            eventId: event.id,
            name: dist.name,
            distanceKm: parseFloat(dist.distanceKm) || undefined,
            price: (parseInt(dist.price) || 0) * 100,
            spotsTotal: parseInt(dist.spots) || undefined,
            spotsRemaining: parseInt(dist.spots) || undefined,
            category: 'GENERAL',
          })
        }
      }

      navigate('/org')
    } catch (err) {
      console.error('Error creating event:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Volver
      </button>

      <h1 className="text-3xl font-bold text-zinc-900 mb-8">Crear Evento</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="p-6 space-y-5">
            <h2 className="font-bold text-lg text-zinc-900">Información General</h2>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Nombre del evento *</label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Maratón Ciudad de México 2026" required />
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Descripción</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe tu evento..."
                className="w-full rounded-md border border-zinc-200 p-3 text-sm min-h-[100px] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Deporte *</label>
                <select
                  value={sport}
                  onChange={e => setSport(e.target.value)}
                  className="w-full rounded-md border border-zinc-200 p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {sports.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Fecha *</label>
                <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-5">
            <h2 className="font-bold text-lg text-zinc-900">Ubicación</h2>
            <div>
              <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Lugar / Venue</label>
              <Input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Bosque de Chapultepec" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Ciudad *</label>
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="CDMX" required />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Estado</label>
                <Input value={state} onChange={e => setState(e.target.value)} placeholder="Ciudad de México" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg text-zinc-900">Distancias / Categorías</h2>
              <Button type="button" variant="outline" size="sm" onClick={addDistance}>
                <Plus className="w-3 h-3 mr-1" /> Agregar
              </Button>
            </div>
            {distances.map((dist, i) => (
              <div key={i} className="grid grid-cols-5 gap-3 items-end">
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Nombre</label>
                  <Input value={dist.name} onChange={e => updateDistance(i, 'name', e.target.value)} placeholder="10K" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Km</label>
                  <Input type="number" value={dist.distanceKm} onChange={e => updateDistance(i, 'distanceKm', e.target.value)} placeholder="10" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Precio (MXN)</label>
                  <Input type="number" value={dist.price} onChange={e => updateDistance(i, 'price', e.target.value)} placeholder="395" />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Lugares</label>
                  <Input type="number" value={dist.spots} onChange={e => updateDistance(i, 'spots', e.target.value)} placeholder="500" />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeDistance(i)} disabled={distances.length <= 1}>
                  <Trash2 className="w-4 h-4 text-zinc-400" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" disabled={loading || !title || !eventDate || !city}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
          {loading ? 'Creando...' : 'Crear Evento'}
        </Button>
      </form>
    </div>
  )
}
