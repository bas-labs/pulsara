import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Zap, LogOut, User, Menu, X, LayoutDashboard } from 'lucide-react'

const publicLinks = [
  { label: 'Eventos', to: '/eventos' },
  { label: 'Seriales', to: '/seriales' },
  { label: 'Resultados', to: '/resultados' },
  { label: 'Blog', to: '/blog' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { user, isOrganizador, isAtleta, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const isActive = (to: string) =>
    location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 border-zinc-200/80 shadow-md'
          : 'bg-white/80 border-zinc-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-xl text-zinc-900 tracking-tight">Pulsara</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {publicLinks.map(link => (
            <Link
              key={link.label}
              to={link.to}
              className={`nav-underline text-sm font-medium transition-colors ${
                isActive(link.to)
                  ? 'active text-zinc-900'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isOrganizador && (
            <Link
              to="/org"
              className={`nav-underline text-sm font-medium transition-colors flex items-center gap-1 ${
                isActive('/org') ? 'active text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Mi Panel
            </Link>
          )}
          {isAtleta && (
            <>
              <Link
                to="/atleta"
                className={`nav-underline text-sm font-medium transition-colors ${
                  location.pathname === '/atleta' ? 'active text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Mi Dashboard
              </Link>
              <Link
                to="/atleta/mis-eventos"
                className={`nav-underline text-sm font-medium transition-colors ${
                  isActive('/atleta/mis-eventos') ? 'active text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Mis Eventos
              </Link>
              <Link
                to="/atleta/resultados"
                className={`nav-underline text-sm font-medium transition-colors ${
                  isActive('/atleta/resultados') ? 'active text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'
                }`}
              >
                Resultados
              </Link>
            </>
          )}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <>
              {(isOrganizador || isAtleta) && (
                <Badge variant="secondary" className="text-xs">
                  {isOrganizador ? 'Organizador' : 'Atleta'}
                </Badge>
              )}
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

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-zinc-100 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-1">
              {publicLinks.map(link => (
                <Link
                  key={link.label}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className={`block text-sm font-medium py-2.5 ${
                    isActive(link.to) ? 'text-emerald-600' : 'text-zinc-600'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isOrganizador && (
                <Link to="/org" onClick={() => setOpen(false)} className="block text-sm font-medium py-2.5 text-zinc-600">
                  Mi Panel
                </Link>
              )}
              {isAtleta && (
                <>
                  <Link to="/atleta" onClick={() => setOpen(false)} className="block text-sm font-medium py-2.5 text-zinc-600">Mi Dashboard</Link>
                  <Link to="/atleta/mis-eventos" onClick={() => setOpen(false)} className="block text-sm font-medium py-2.5 text-zinc-600">Mis Eventos</Link>
                  <Link to="/atleta/resultados" onClick={() => setOpen(false)} className="block text-sm font-medium py-2.5 text-zinc-600">Resultados</Link>
                </>
              )}
              <div className="pt-3 border-t border-zinc-100">
                {user ? (
                  <Button variant="ghost" className="w-full text-zinc-600" onClick={() => { handleLogout(); setOpen(false) }}>
                    Cerrar Sesión
                  </Button>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">Crear Cuenta</Button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
