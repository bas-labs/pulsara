import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-8xl font-black text-emerald-600 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">Página no encontrada</h2>
        <p className="text-zinc-500 mb-8 max-w-md mx-auto">
          La página que buscas no existe o fue movida. ¿Buscabas un evento?
        </p>
        <div className="flex gap-3 justify-center">
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
        </div>
      </div>
    </div>
  )
}
