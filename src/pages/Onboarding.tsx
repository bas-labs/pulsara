import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trophy, Building, ArrowRight, Zap } from 'lucide-react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { smooth } from '@/lib/animations'
import { toast } from 'sonner'

const client = generateClient<Schema>()

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: smooth } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
}

export default function Onboarding() {
  const { user, refreshAuth, isOrganizador, isAtleta } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'role' | 'profile'>('role')
  const [role, setRole] = useState<'ATLETA' | 'ORGANIZADOR' | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [direction, setDirection] = useState(1)

  // Redirect if user already completed onboarding
  useEffect(() => {
    if (!user) {
      setCheckingProfile(false)
      return
    }
    client.models.UserProfile.get({ id: user.userId }).then(({ data }) => {
      if (data) {
        // Already onboarded — send to their dashboard
        if (isOrganizador) {
          navigate('/org', { replace: true })
        } else if (isAtleta) {
          navigate('/atleta', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } else {
        setCheckingProfile(false)
      }
    }).catch(() => {
      setCheckingProfile(false)
    })
  }, [user, isOrganizador, isAtleta, navigate])

  function goToProfile() {
    setDirection(1)
    setStep('profile')
  }

  async function handleSubmit() {
    if (!user || !role) return
    setLoading(true)
    setError(null)
    try {
      await client.models.UserProfile.create({
        id: user.userId,
        userId: user.userId,
        email: user.signInDetails?.loginId ?? '',
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        city,
        role,
        country: 'MX',
      })
      if (role === 'ORGANIZADOR') {
        try {
          await client.mutations.switchToOrganizer({})
        } catch (switchErr) {
          console.error('Error switching to organizer:', switchErr)
          toast.error('Error al activar el rol de organizador. Intenta de nuevo.')
          setLoading(false)
          return
        }
        // Force-refresh tokens so the new group is reflected
        await refreshAuth()
      }
      navigate(role === 'ORGANIZADOR' ? '/org' : '/atleta')
    } catch (err) {
      console.error('Error creating profile:', err)
      setError('Hubo un error al crear tu perfil. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl text-zinc-900">Al Fallo</span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          {step === 'role' ? (
            <motion.div
              key="role"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className="text-3xl font-bold text-zinc-900 text-center mb-2">¡Bienvenido a Al Fallo!</h1>
              <p className="text-zinc-500 text-center mb-10">¿Cómo quieres usar la plataforma?</p>
              <div className="grid md:grid-cols-2 gap-6">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${role === 'ATLETA' ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:border-emerald-200'}`}
                    onClick={() => setRole('ATLETA')}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-xl text-zinc-900 mb-2">Soy Atleta</h3>
                      <p className="text-zinc-500 text-sm">Quiero descubrir eventos, inscribirme y consultar mis resultados.</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Card
                    className={`cursor-pointer transition-all hover:shadow-lg ${role === 'ORGANIZADOR' ? 'ring-2 ring-emerald-500 shadow-lg' : 'hover:border-emerald-200'}`}
                    onClick={() => setRole('ORGANIZADOR')}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center mx-auto mb-4">
                        <Building className="w-8 h-8 text-teal-600" />
                      </div>
                      <h3 className="font-bold text-xl text-zinc-900 mb-2">Soy Organizador</h3>
                      <p className="text-zinc-500 text-sm">Quiero crear y gestionar eventos deportivos.</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              <div className="mt-8 text-center">
                <Button
                  size="lg"
                  disabled={!role}
                  onClick={goToProfile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 rounded-xl"
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
            >
              <h1 className="text-3xl font-bold text-zinc-900 text-center mb-2">Completa tu perfil</h1>
              <p className="text-zinc-500 text-center mb-10">Solo necesitamos unos datos básicos.</p>
              <Card>
                <CardContent className="p-8 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Nombre</label>
                      <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Juan" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Apellido</label>
                      <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Pérez" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Ciudad</label>
                    <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Ciudad de México" />
                  </div>
                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
                  )}
                  <Button
                    size="lg"
                    disabled={!firstName || !lastName || loading}
                    onClick={handleSubmit}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    {loading ? 'Creando perfil...' : 'Empezar'} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
