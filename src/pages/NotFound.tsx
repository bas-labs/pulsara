import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'
import { scaleIn, fadeUp, stagger } from '@/lib/animations'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative blur */}
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        className="text-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.h1 variants={scaleIn} className="text-8xl font-black text-emerald-600 mb-4">
          404
        </motion.h1>
        <motion.h2 variants={fadeUp} custom={1} className="text-2xl font-bold text-zinc-900 mb-2">
          Página no encontrada
        </motion.h2>
        <motion.p variants={fadeUp} custom={2} className="text-zinc-500 mb-8 max-w-md mx-auto">
          La página que buscas no existe o fue movida. ¿Buscabas un evento?
        </motion.p>
        <motion.div variants={fadeUp} custom={3} className="flex gap-3 justify-center">
          <Link to="/">
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Home className="w-4 h-4 mr-2" /> Inicio
            </Button>
          </Link>
          <Link to="/eventos">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" /> Ver eventos
            </Button>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}
