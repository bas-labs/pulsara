import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Trophy, Building, ArrowRight, Zap } from 'lucide-react'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState<'role' | 'profile'>('role')
  const [role, setRole] = useState<'ATLETA' | 'ORGANIZADOR' | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!user || !role) return
    setLoading(true)
    try {
      await client.models.UserProfile.create({
        userId: user.userId,
        email: user.signInDetails?.loginId ?? '',
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`,
        city,
        role,
        country: 'MX',
      })
      if (role === "ORGANIZADOR") {
        await client.mutations.switchToOrganizer({})
      }
      navigate(role === "ORGANIZADOR" ? "/org" : "/atleta")
    } catch (err) {
      console.error('Error creating profile:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-2xl text-zinc-900">Pulsara</span>
        </div>

        {step === 'role' ? (
          <>
            <h1 className="text-3xl font-bold text-zinc-900 text-center mb-2">¡Bienvenido a Pulsara!</h1>
            <p className="text-zinc-500 text-center mb-10">¿Cómo quieres usar la plataforma?</p>
            <div className="grid md:grid-cols-2 gap-6">
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
            </div>
            <div className="mt-8 text-center">
              <Button
                size="lg"
                disabled={!role}
                onClick={() => setStep('profile')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 rounded-xl"
              >
                Continuar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
