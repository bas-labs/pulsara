import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, MapPin, Calendar, ArrowRight, Timer, Trophy,
  Mountain, Bike, Waves, Footprints, Star,
  Zap, Shield, Heart, Clock, Dumbbell, Medal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import Navbar from '@/components/Navbar'
import { fadeUp, stagger, useCountUp, springHover } from '@/lib/animations'

/* ─── Data ─── */
const sports = [
  { icon: Footprints, label: 'Running', count: 142 },
  { icon: Bike, label: 'Ciclismo', count: 67 },
  { icon: Waves, label: 'Natación', count: 38 },
  { icon: Mountain, label: 'Trail', count: 54 },
  { icon: Trophy, label: 'Triatlón', count: 29 },
  { icon: Zap, label: 'OCR', count: 18 },
]

const featuredEvents = [
  {
    title: 'Maratón Ciudad de México 2026',
    date: '24 Ago 2026',
    location: 'Zócalo, CDMX',
    sport: 'Running',
    image: '/images/marathon.jpg',
    distances: ['42K', '21K', '10K'],
    price: 'Desde $890',
    spots: 847,
    featured: true,
  },
  {
    title: 'Ruta Ciclista Sierra Norte',
    date: '15 Mar 2026',
    location: 'Oaxaca',
    sport: 'Ciclismo',
    image: '/images/cycling.jpg',
    distances: ['120K', '80K'],
    price: 'Desde $1,200',
    spots: 234,
    featured: false,
  },
  {
    title: 'Triatlón Cozumel Sprint',
    date: '05 Abr 2026',
    location: 'Cozumel, Q.Roo',
    sport: 'Triatlón',
    image: '/images/triathlon.jpg',
    distances: ['Sprint', 'Olímpico'],
    price: 'Desde $1,650',
    spots: 156,
    featured: false,
  },
  {
    title: 'Spartan Trail Ajusco',
    date: '22 May 2026',
    location: 'Ajusco, CDMX',
    sport: 'OCR',
    image: '/images/ocr.jpg',
    distances: ['Beast', 'Super', 'Sprint'],
    price: 'Desde $1,400',
    spots: 312,
    featured: false,
  },
]

const serials = [
  { name: 'Circuito de las Estaciones', events: 4, cities: 'CDMX · GDL · MTY · QRO', color: '#10B981' },
  { name: 'Tour de France México', events: 3, cities: 'CDMX · Oaxaca · Puebla', color: '#F59E0B' },
  { name: 'Reto Acuático Nacional', events: 5, cities: '5 playas de México', color: '#3B82F6' },
]

const statsData = [
  { value: 500, suffix: '+', label: 'Eventos al año', icon: Calendar },
  { value: 180, suffix: 'K+', label: 'Atletas registrados', icon: Footprints },
  { value: 32, suffix: '', label: 'Estados de México', icon: MapPin },
  { value: 15, suffix: '+', label: 'Disciplinas', icon: Trophy },
]

/* ─── Components ─── */

function AnimatedStat({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: typeof Calendar }) {
  const { count, ref } = useCountUp(value)
  return (
    <div ref={ref} className="text-center">
      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-5 h-5 text-emerald-400" />
      </div>
      <div className="text-4xl md:text-5xl font-bold text-white mb-2">
        {count}{suffix}
      </div>
      <p className="text-zinc-400 text-sm">{label}</p>
    </div>
  )
}

function EventCard({ event, index }: { event: typeof featuredEvents[0]; index: number }) {
  return (
    <motion.div variants={fadeUp} custom={index} whileHover={{ y: -6 }} transition={springHover}>
      <Link to="/eventos" className="block h-full">
        <Card className="group overflow-hidden border-zinc-200/60 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 h-full">
          <div className="relative overflow-hidden">
            <img
              src={event.image}
              alt={event.title}
              className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute top-3 left-3 flex gap-2">
              <Badge className="bg-white/90 text-zinc-800 backdrop-blur-sm text-xs font-semibold">
                {event.sport}
              </Badge>
              {event.featured && (
                <Badge className="bg-emerald-600 text-white text-xs font-semibold">
                  Destacado
                </Badge>
              )}
            </div>
            <div className="absolute bottom-3 right-3">
              <Badge variant="secondary" className="bg-zinc-900/70 text-white backdrop-blur-sm text-xs">
                {event.spots} lugares
              </Badge>
            </div>
          </div>
          <CardContent className="p-5">
            <h3 className="font-semibold text-zinc-900 text-lg leading-tight mb-3 group-hover:text-emerald-700 transition-colors">
              {event.title}
            </h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {event.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <MapPin className="w-4 h-4 text-emerald-600" />
                {event.location}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.distances.map(d => (
                <span key={d} className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-medium rounded-full">
                  {d}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <span className="font-semibold text-zinc-900">{event.price}</span>
              <span className="inline-flex items-center bg-emerald-600 text-white rounded-lg text-xs h-8 px-3 font-medium">
                Inscribirme <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */

export default function Landing() {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const navigate = useNavigate()


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/eventos?q=${encodeURIComponent(searchQuery.trim())}`)
    } else {
      navigate('/eventos')
    }
  }

  return (
    <div className="snap-landing bg-white">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="snap-section relative min-h-screen flex flex-col justify-center overflow-hidden">
        {/* Base fade to white at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />

        {/* Dynamic mesh gradient blobs */}
        <div
          className="hero-blob w-[500px] h-[500px] -top-32 right-[5%] bg-gradient-to-br from-emerald-400/70 to-teal-300/50"
          style={{ animation: 'hero-blob-1 12s ease-in-out infinite' }}
        />
        <div
          className="hero-blob w-[400px] h-[400px] top-20 -left-24 bg-gradient-to-br from-amber-300/60 to-orange-300/40"
          style={{ animation: 'hero-blob-2 14s ease-in-out infinite' }}
        />
        <div
          className="hero-blob w-[350px] h-[350px] -top-10 left-[35%] bg-gradient-to-br from-teal-300/55 to-cyan-300/40"
          style={{ animation: 'hero-blob-3 16s ease-in-out infinite' }}
        />
        <div
          className="hero-blob w-[300px] h-[300px] top-48 right-[25%] bg-gradient-to-br from-emerald-300/50 to-lime-300/35"
          style={{ animation: 'hero-blob-4 18s ease-in-out infinite' }}
        />

        {/* Floating sport icons */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Footprints — top-right on mobile, further left on desktop */}
          <div className="absolute top-[12%] right-[6%] lg:top-[15%] lg:right-[8%] w-10 h-10 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-200/50 shadow-lg shadow-emerald-500/10 flex items-center justify-center" style={{ animation: 'float-1 4s ease-in-out infinite' }}>
            <Footprints className="w-5 h-5 lg:w-7 lg:h-7 text-emerald-600" />
          </div>
          {/* Bike — bottom-right area */}
          <div className="absolute top-[70%] right-[4%] lg:top-[50%] lg:right-[20%] w-9 h-9 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white/80 backdrop-blur-sm border border-blue-200/50 shadow-lg shadow-blue-500/10 flex items-center justify-center" style={{ animation: 'float-2 5s ease-in-out infinite 0.5s' }}>
            <Bike className="w-4 h-4 lg:w-6 lg:h-6 text-blue-500" />
          </div>
          {/* Waves — upper-right cluster */}
          <div className="absolute top-[22%] right-[22%] lg:top-[28%] lg:right-[32%] w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-white/80 backdrop-blur-sm border border-cyan-200/50 shadow-lg shadow-cyan-500/10 flex items-center justify-center" style={{ animation: 'float-3 4.5s ease-in-out infinite 1s' }}>
            <Waves className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-500" />
          </div>
          {/* Trophy — mid-right */}
          <div className="absolute top-[55%] right-[8%] lg:top-[65%] lg:right-[10%] w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white/80 backdrop-blur-sm border border-amber-200/50 shadow-lg shadow-amber-500/10 flex items-center justify-center" style={{ animation: 'float-4 5.5s ease-in-out infinite 0.3s' }}>
            <Trophy className="w-5 h-5 lg:w-6 lg:h-6 text-amber-500" />
          </div>
          {/* Mountain — hidden on small mobile, visible from sm */}
          <div className="absolute top-[16%] right-[38%] lg:top-[18%] lg:right-[24%] w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-white/80 backdrop-blur-sm border border-rose-200/50 shadow-lg shadow-rose-500/10 hidden sm:flex items-center justify-center" style={{ animation: 'float-5 4.8s ease-in-out infinite 0.7s' }}>
            <Mountain className="w-4 h-4 lg:w-5 lg:h-5 text-rose-500" />
          </div>
          {/* Dumbbell — hidden on small mobile, visible from sm */}
          <div className="absolute top-[42%] right-[3%] lg:top-[55%] lg:right-[30%] w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-white/80 backdrop-blur-sm border border-violet-200/50 shadow-lg shadow-violet-500/10 hidden sm:flex items-center justify-center" style={{ animation: 'float-1 5.2s ease-in-out infinite 1.2s' }}>
            <Dumbbell className="w-4 h-4 lg:w-5 lg:h-5 text-violet-500" />
          </div>
          {/* Medal — always visible */}
          <div className="absolute top-[35%] right-[2%] lg:top-[38%] lg:right-[5%] w-8 h-8 lg:w-10 lg:h-10 rounded-lg lg:rounded-xl bg-white/80 backdrop-blur-sm border border-orange-200/50 shadow-lg shadow-orange-500/10 flex items-center justify-center" style={{ animation: 'float-3 4.2s ease-in-out infinite 0.9s' }}>
            <Medal className="w-4 h-4 lg:w-5 lg:h-5 text-orange-500" />
          </div>
        </div>

        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10 pt-20">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-6 text-emerald-700 border-emerald-200 bg-emerald-50 font-medium px-4 py-1.5">
                <Footprints className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Eventos deportivos en México
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl font-bold text-zinc-900 leading-[1.05] tracking-tight mb-6"
            >
              Corre, pedalea,{' '}
              <span className="shimmer-text bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-clip-text text-transparent">
                compite
              </span>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-xl text-zinc-500 leading-relaxed mb-10 max-w-xl">
              Inscríbete a carreras, triatlones, ciclismo y más. <span className="text-zinc-700 font-medium">500+ eventos</span> en los 32 estados de México.
            </motion.p>

            {/* Search bar */}
            <motion.form
              variants={fadeUp}
              custom={3}
              onSubmit={handleSearch}
              onFocusCapture={() => setSearchFocused(true)}
              onBlurCapture={() => setSearchFocused(false)}
              className={`flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-lg shadow-zinc-200/50 border border-zinc-200/60 max-w-2xl transition-shadow duration-300 ${
                searchFocused ? 'glow-emerald' : ''
              }`}
            >
              <div className="flex-1 flex items-center gap-2 px-4">
                <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                <Input
                  placeholder="Busca un evento, deporte o ciudad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-zinc-400"
                />
              </div>
              <Button type="submit" size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 rounded-xl shrink-0">
                Buscar eventos
              </Button>
            </motion.form>

            {/* Quick filters */}
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap gap-2 mt-6">
              {['Running', 'Ciclismo', 'Triatlón', 'CDMX', 'Este mes'].map(tag => (
                <Link
                  key={tag}
                  to={`/eventos?q=${encodeURIComponent(tag)}`}
                  className="px-3.5 py-1.5 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full text-sm text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 hover:scale-[1.03] active:scale-[0.97] transition-all"
                >
                  {tag}
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── SPORT CATEGORIES ─── */}
      <section className="snap-section min-h-screen flex flex-col justify-center py-20 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span variants={fadeUp} custom={0} className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Disciplinas
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-zinc-900 mt-2">
              Elige tu deporte
            </motion.h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-3 md:grid-cols-6 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {sports.map((sport, i) => (
              <motion.div
                key={sport.label}
                variants={fadeUp}
                custom={i}
                whileHover={{ scale: 1.06, y: -4 }}
                whileTap={{ scale: 0.95 }}
                transition={springHover}
              >
                <Link
                  to={`/eventos?sport=${encodeURIComponent(sport.label)}`}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-transparent hover:border-emerald-200/60 hover:bg-emerald-50/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300"
                >
                  <div className="w-16 h-16 rounded-2xl bg-zinc-100 group-hover:bg-emerald-100 flex items-center justify-center transition-all duration-300 group-hover:shadow-md group-hover:shadow-emerald-500/10">
                    <sport.icon className="w-7 h-7 text-zinc-500 group-hover:text-emerald-700 transition-colors" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-zinc-800">{sport.label}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{sport.count} eventos</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURED EVENTS ─── */}
      <section id="eventos" className="snap-section min-h-screen flex flex-col justify-center py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="flex items-end justify-between mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div>
              <motion.span variants={fadeUp} custom={0} className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
                Próximos eventos
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-zinc-900 mt-2">
                No te quedes fuera
              </motion.h2>
            </div>
            <motion.div variants={fadeUp} custom={2}>
              <Link to="/eventos">
                <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 font-semibold hidden md:flex">
                  Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={stagger}
          >
            {featuredEvents.map((event, i) => (
              <EventCard key={event.title} event={event} index={i} />
            ))}
          </motion.div>

          <div className="md:hidden mt-8 text-center">
            <Link to="/eventos">
              <Button variant="outline" className="border-emerald-200 text-emerald-700">
                Ver todos los eventos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="snap-section min-h-screen flex flex-col justify-center py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span variants={fadeUp} custom={0} className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Cómo funciona
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-zinc-900 mt-2">
              De la búsqueda a la meta
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-zinc-500 text-lg mt-3 max-w-lg mx-auto">
              Tres pasos. Sin complicaciones.
            </motion.p>
          </motion.div>

          <motion.div
            className="relative grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-[2px] bg-gradient-to-r from-emerald-200 via-emerald-300 to-emerald-200" />

            {[
              { icon: Search, step: '01', title: 'Encuentra', desc: 'Explora por deporte, ciudad o fecha entre cientos de eventos.' },
              { icon: Zap, step: '02', title: 'Inscríbete', desc: 'Paga en línea con Stripe y recibe tu confirmación al instante.' },
              { icon: Trophy, step: '03', title: 'Compite', desc: 'Check-in digital, resultados en vivo y tus métricas personales.' },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i} className="text-center relative">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-md shadow-emerald-500/5">
                    <item.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-sm">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{item.title}</h3>
                <p className="text-zinc-500 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SERIALS ─── */}
      <section id="seriales" className="snap-section min-h-screen flex flex-col justify-center py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span variants={fadeUp} custom={0} className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
              Seriales
            </motion.span>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-zinc-900 mt-2">
              Más que un evento, una temporada
            </motion.h2>
            <motion.p variants={fadeUp} custom={2} className="text-zinc-500 text-lg mt-3 max-w-xl">
              Compite en una serie de eventos y acumula puntos para el ranking general.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {serials.map((serial, i) => (
              <motion.div key={serial.name} variants={fadeUp} custom={i}>
                <Card className="group border-zinc-200/60 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200/60 transition-all duration-300 overflow-hidden h-full">
                  <CardContent className="p-0">
                    <div className="h-2" style={{ backgroundColor: serial.color }} />
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: serial.color + '15' }}>
                          <Trophy className="w-5 h-5" style={{ color: serial.color }} />
                        </div>
                        <Badge variant="outline" className="text-xs">{serial.events} eventos</Badge>
                      </div>
                      <h3 className="font-bold text-lg text-zinc-900 mb-2">{serial.name}</h3>
                      <p className="text-sm text-zinc-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {serial.cities}
                      </p>
                      <Link to="/seriales" className="inline-flex items-center mt-4 text-sm text-emerald-600 hover:text-emerald-700 font-semibold nav-underline">
                        Ver serie <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="snap-section py-20 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {statsData.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i}>
                <AnimatedStat value={stat.value} suffix={stat.suffix} label={stat.label} icon={stat.icon} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── PLUS SUBSCRIPTION ─── */}
      <section className="snap-section min-h-screen flex flex-col justify-center py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 p-10 md:p-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative circles */}
            <motion.div
              className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"
              animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"
              animate={{ y: [0, -8, 0], scale: [1, 1.03, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            <div className="relative z-10 max-w-2xl">
              <Badge className="bg-white/20 text-white border-0 mb-6 font-semibold">
                <Star className="w-3 h-3 mr-1 fill-white" /> PLUS
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight mb-4">
                Entrena sin límites
              </h2>
              <p className="text-white/80 text-lg mb-8 max-w-lg">
                Descuentos en inscripciones, acceso a resultados premium, fotos ilimitadas y métricas avanzadas.
              </p>
              <motion.div
                className="flex flex-wrap gap-4 mb-10"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                {[
                  { icon: Timer, text: 'Resultados en vivo' },
                  { icon: Heart, text: 'Métricas de salud' },
                  { icon: Shield, text: 'Seguro deportivo' },
                ].map((perk, i) => (
                  <motion.span
                    key={perk.text}
                    variants={fadeUp}
                    custom={i}
                    className="flex items-center gap-2 text-sm text-white/90 bg-white/10 px-4 py-2 rounded-full"
                  >
                    <perk.icon className="w-4 h-4" />
                    {perk.text}
                  </motion.span>
                ))}
              </motion.div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-white">$99</span>
                <span className="text-white/60">MXN/mes</span>
              </div>
              <Link to="/eventos">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="inline-block">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-bold px-10 rounded-xl text-base shadow-xl">
                    Suscribirme a PLUS <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── ARTICLES ─── */}
      <section className="snap-section min-h-screen flex flex-col justify-center py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="flex items-end justify-between mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div>
              <motion.span variants={fadeUp} custom={0} className="text-emerald-600 font-semibold text-sm uppercase tracking-wider">
                Blog
              </motion.span>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-bold text-zinc-900 mt-2">
                Para que rindas más
              </motion.h2>
            </div>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              {
                title: 'Plan de entrenamiento: tu primer 21K',
                category: 'Running',
                image: '/images/blog-running.jpg',
                time: '8 min',
              },
              {
                title: 'Nutrición para triatlón: qué comer antes y después',
                category: 'Nutrición',
                image: '/images/blog-nutrition.jpg',
                time: '5 min',
              },
              {
                title: 'Cómo elegir tu primera bici de ruta',
                category: 'Ciclismo',
                image: '/images/blog-cycling.jpg',
                time: '6 min',
              },
            ].map((article, i) => (
              <motion.div key={article.title} variants={fadeUp} custom={i}>
                <Link to="/blog" className="block h-full">
                  <Card className="group overflow-hidden border-zinc-200/60 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200/60 transition-all duration-300 h-full cursor-pointer">
                    <div className="relative overflow-hidden">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-3 left-3 bg-white/90 text-zinc-700 text-xs">{article.category}</Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-zinc-900 leading-snug mb-3 group-hover:text-emerald-700 transition-colors">
                        {article.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        {article.time} de lectura
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="snap-section min-h-screen flex flex-col justify-center py-24 relative overflow-hidden">
        {/* Subtle background sport icons */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]">
          <Footprints className="absolute top-12 left-[10%] w-20 h-20 text-zinc-900 rotate-12" />
          <Bike className="absolute bottom-16 right-[15%] w-16 h-16 text-zinc-900 -rotate-6" />
          <Waves className="absolute top-20 right-[8%] w-14 h-14 text-zinc-900 rotate-6" />
          <Mountain className="absolute bottom-12 left-[20%] w-18 h-18 text-zinc-900 -rotate-12" />
        </div>

        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-4xl md:text-5xl font-bold text-zinc-900 leading-tight mb-6">
              ¿Listo para cruzar{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                la meta
              </span>
              ?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-zinc-500 text-lg mb-10 max-w-xl mx-auto">
              Encuentra tu próximo evento deportivo.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/eventos">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 rounded-xl text-base shadow-lg shadow-emerald-500/25">
                  Explorar Eventos <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="snap-section bg-zinc-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl text-white">Al Fallo</span>
              </Link>
              <p className="text-zinc-400 text-sm leading-relaxed">
                La plataforma deportiva líder en México. Descubre, compite y supera tus límites.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Plataforma</h4>
              <ul className="space-y-2.5">
                <li><Link to="/eventos" className="nav-underline text-sm text-zinc-400 hover:text-white transition-colors">Eventos</Link></li>
                <li><Link to="/seriales" className="nav-underline text-sm text-zinc-400 hover:text-white transition-colors">Seriales</Link></li>
                <li><Link to="/resultados" className="nav-underline text-sm text-zinc-400 hover:text-white transition-colors">Resultados</Link></li>
                <li><Link to="/eventos" className="nav-underline text-sm text-zinc-400 hover:text-white transition-colors">PLUS</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Empresa</h4>
              <ul className="space-y-2.5">
                <li><Link to="/blog" className="nav-underline text-sm text-zinc-400 hover:text-white transition-colors">Blog</Link></li>
                <li><span className="text-sm text-zinc-500 cursor-default">Nosotros</span></li>
                <li><span className="text-sm text-zinc-500 cursor-default">Contacto</span></li>
                <li><span className="text-sm text-zinc-500 cursor-default">Prensa</span></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5">
                <li><span className="text-sm text-zinc-500 cursor-default">Términos</span></li>
                <li><span className="text-sm text-zinc-500 cursor-default">Privacidad</span></li>
                <li><span className="text-sm text-zinc-500 cursor-default">Cookies</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-500 text-sm">&copy; 2026 Al Fallo. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              <span className="text-sm text-zinc-500 cursor-default">Instagram</span>
              <span className="text-sm text-zinc-500 cursor-default">Facebook</span>
              <span className="text-sm text-zinc-500 cursor-default">TikTok</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
