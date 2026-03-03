import { type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Zap, LogOut, LayoutDashboard, User } from 'lucide-react'

export default function Layout({ children }: { children: ReactNode }) {
  const { user, isOrganizador, isAtleta, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl text-zinc-900 tracking-tight">Pulsara</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/eventos" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Eventos</Link>
            <Link to="/seriales" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Seriales</Link>
            <Link to="/resultados" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Resultados</Link>
            <Link to="/blog" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Blog</Link>
            {isOrganizador && (
              <Link to="/org" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" /> Mi Panel
              </Link>
            )}
            {isAtleta && (
              <>
                <Link to="/atleta" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Mi Dashboard</Link>
                <Link to="/atleta/mis-eventos" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Mis Eventos</Link>
                <Link to="/atleta/resultados" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">Resultados</Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-zinc-500 hidden md:block">
                  {isOrganizador ? '🏢 Organizador' : '🏃 Atleta'}
                </span>
                <Link to="/perfil">
                  <Button variant="ghost" size="sm" className="text-zinc-500">
                    <User className="w-4 h-4" />
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-500">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-zinc-700">Iniciar Sesión</Button>
                </Link>
                <Link to="/login">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
                    Crear Cuenta
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
      <main className="pt-16">{children}</main>
    </div>
  )
}
