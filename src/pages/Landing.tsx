import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, MapPin, Calendar, ArrowRight, Timer, Trophy,
  Mountain, Bike, Waves, Footprints, Star,
  Zap, Shield, Heart, Play, Menu, X, Clock, 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

/* ─── Animation ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }

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

const stats = [
  { value: '500+', label: 'Eventos al año' },
  { value: '180K+', label: 'Atletas registrados' },
  { value: '32', label: 'Estados de México' },
  { value: '15+', label: 'Disciplinas' },
]

/* ─── Components ─── */

function Navbar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-900 tracking-tight">Pulsara</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {['Eventos', 'Seriales', 'Resultados', 'Blog'].map(link => (
            <a key={link} href={`#${link.toLowerCase()}`} className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
              {link}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" className="text-zinc-700">Iniciar Sesión</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
            Crear Cuenta
          </Button>
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t border-zinc-100 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              {['Eventos', 'Seriales', 'Resultados', 'Blog'].map(link => (
                <a key={link} href="#" className="block text-sm font-medium text-zinc-600 py-2">{link}</a>
              ))}
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-3">Crear Cuenta</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

function EventCard({ event, index }: { event: typeof featuredEvents[0]; index: number }) {
  return (
    <motion.div variants={fadeUp} custom={index}>
      <Card className="group overflow-hidden border-zinc-200/60 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full">
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
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-8">
              Inscribirme <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ─── HERO ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/80 via-white to-white" />
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }} />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.div variants={fadeUp} custom={0}>
              <Badge variant="outline" className="mb-6 text-emerald-700 border-emerald-200 bg-emerald-50 font-medium px-4 py-1.5">
                <Play className="w-3 h-3 mr-1.5 fill-emerald-500 text-emerald-600" />
                La plataforma deportiva de México
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-5xl md:text-7xl font-bold text-zinc-900 leading-[1.05] tracking-tight mb-6"
            >
              Tu próximo{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                reto
              </span>
              {' '}te espera
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-xl text-zinc-500 leading-relaxed mb-10 max-w-xl">
              Descubre, inscríbete y compite en los mejores eventos deportivos de México. Running, ciclismo, triatlón y más.
            </motion.p>

            {/* Search bar */}
            <motion.div
              variants={fadeUp}
              custom={3}
              className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-lg shadow-zinc-200/50 border border-zinc-200/60 max-w-2xl"
            >
              <div className="flex-1 flex items-center gap-2 px-4">
                <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                <Input
                  placeholder="Busca un evento, deporte o ciudad..."
                  className="border-0 shadow-none focus-visible:ring-0 text-base placeholder:text-zinc-400"
                />
              </div>
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-8 rounded-xl shrink-0">
                Buscar
              </Button>
            </motion.div>

            {/* Quick filters */}
            <motion.div variants={fadeUp} custom={4} className="flex flex-wrap gap-2 mt-6">
              {['CDMX', 'Monterrey', 'Guadalajara', 'Este mes', '5K - 10K'].map(tag => (
                <button
                  key={tag}
                  className="px-3 py-1.5 bg-white border border-zinc-200 rounded-full text-sm text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── SPORT CATEGORIES ─── */}
      <section className="py-16 border-y border-zinc-100">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-3 md:grid-cols-6 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={stagger}
          >
            {sports.map((sport, i) => (
              <motion.button
                key={sport.label}
                variants={fadeUp}
                custom={i}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-emerald-50 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-zinc-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <sport.icon className="w-6 h-6 text-zinc-500 group-hover:text-emerald-700 transition-colors" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-zinc-800">{sport.label}</p>
                  <p className="text-xs text-zinc-400">{sport.count} eventos</p>
                </div>
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURED EVENTS ─── */}
      <section id="eventos" className="py-20">
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
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 font-semibold hidden md:flex">
                Ver todos <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
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
            <Button variant="outline" className="border-emerald-200 text-emerald-700">
              Ver todos los eventos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl md:text-4xl font-bold text-zinc-900">
              Así de simple
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-zinc-500 text-lg mt-3 max-w-lg mx-auto">
              De la inscripción a la meta en tres pasos.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {[
              { icon: Search, step: '01', title: 'Encuentra', desc: 'Explora eventos por deporte, ciudad o fecha.' },
              { icon: Zap, step: '02', title: 'Inscríbete', desc: 'Paga en línea y recibe tu confirmación al instante.' },
              { icon: Trophy, step: '03', title: 'Compite', desc: 'Check-in digital, resultados en vivo y fotos.' },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i} className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center shadow-sm">
                    <item.icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-emerald-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-2">{item.title}</h3>
                <p className="text-zinc-500">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── SERIALS ─── */}
      <section id="seriales" className="py-20">
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
                <Card className="group border-zinc-200/60 hover:shadow-lg transition-all overflow-hidden h-full">
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
                      <Button variant="ghost" size="sm" className="mt-4 text-emerald-600 hover:text-emerald-700 p-0 h-auto font-semibold">
                        Ver serie <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="py-20 bg-zinc-900">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            {stats.map((stat, i) => (
              <motion.div key={stat.label} variants={fadeUp} custom={i} className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
                <p className="text-zinc-400 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── PLUS SUBSCRIPTION ─── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 p-10 md:p-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

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
              <div className="flex flex-wrap gap-4 mb-10">
                {[
                  { icon: Timer, text: 'Resultados en vivo' },
                  { icon: Heart, text: 'Métricas de salud' },
                  { icon: Shield, text: 'Seguro deportivo' },
                ].map(perk => (
                  <span key={perk.text} className="flex items-center gap-2 text-sm text-white/90 bg-white/10 px-4 py-2 rounded-full">
                    <perk.icon className="w-4 h-4" />
                    {perk.text}
                  </span>
                ))}
              </div>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold text-white">$99</span>
                <span className="text-white/60">MXN/mes</span>
              </div>
              <Button size="lg" className="bg-white text-emerald-700 hover:bg-white/90 font-bold px-10 rounded-xl text-base shadow-xl">
                Suscribirme a PLUS <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── ARTICLES ─── */}
      <section className="py-20 bg-zinc-50">
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
                <Card className="group overflow-hidden border-zinc-200/60 hover:shadow-lg transition-all h-full cursor-pointer">
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
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
              Crea tu cuenta gratis y encuentra tu próximo evento.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-10 rounded-xl text-base shadow-lg shadow-emerald-500/25">
                Crear Cuenta Gratis <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-zinc-300 text-zinc-700 font-semibold px-10 rounded-xl text-base">
                Explorar Eventos
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-zinc-900 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl text-white">Pulsara</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">
                La plataforma deportiva líder en México. Descubre, compite y supera tus límites.
              </p>
            </div>
            {[
              { title: 'Plataforma', links: ['Eventos', 'Seriales', 'Resultados', 'PLUS'] },
              { title: 'Empresa', links: ['Nosotros', 'Blog', 'Contacto', 'Prensa'] },
              { title: 'Legal', links: ['Términos', 'Privacidad', 'Cookies'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-white text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-zinc-500 text-sm">© 2026 Pulsara. Todos los derechos reservados.</p>
            <div className="flex gap-4">
              {['Instagram', 'Facebook', 'TikTok'].map(social => (
                <a key={social} href="#" className="text-sm text-zinc-400 hover:text-white transition-colors">{social}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
