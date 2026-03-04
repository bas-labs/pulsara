import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Check, Zap, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/LoadingSpinner'
import { smooth } from '@/lib/animations'

const client = generateClient<Schema>()

const stepVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.4, ease: smooth } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const SHIRT_SIZES_M = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const SHIRT_SIZES_F = ['XS Dama', 'S Dama', 'M Dama', 'L Dama', 'XL Dama', 'XXL Dama']

const TOTAL_STEPS = 10 // 0-9

export default function GuestRegistration() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  // Event data
  const [event, setEvent] = useState<Schema['Event']['type'] | null>(null)
  const [distances, setDistances] = useState<Schema['EventDistance']['type'][]>([])
  const [loading, setLoading] = useState(true)

  // Form state
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selectedDistanceId, setSelectedDistanceId] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dobDay, setDobDay] = useState('')
  const [dobMonth, setDobMonth] = useState('')
  const [dobYear, setDobYear] = useState('')
  const [gender, setGender] = useState<'F' | 'M' | null>(null)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [emailConfirm, setEmailConfirm] = useState('')
  const [shirtSize, setShirtSize] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check for payment success return
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess(true)
    }
  }, [searchParams])

  // Load event
  useEffect(() => {
    if (slug) loadEvent()
  }, [slug])

  // Auto-focus inputs when step changes
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 400)
    return () => clearTimeout(t)
  }, [step])

  async function loadEvent() {
    try {
      const { data } = await client.models.Event.listEventBySlug(
        { slug: slug! },
        { authMode: 'identityPool' }
      )
      if (data.length > 0) {
        const ev = data[0]
        setEvent(ev)
        const { data: dists } = await client.models.EventDistance.listEventDistanceByEventId(
          { eventId: ev.id },
          { authMode: 'identityPool' }
        )
        setDistances(dists)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedDistance = distances.find(d => d.id === selectedDistanceId)

  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!selectedDistanceId
      case 1: return firstName.trim().length > 0
      case 2: return lastName.trim().length > 0
      case 3: return !!dobDay && !!dobMonth && !!dobYear
      case 4: return !!gender
      case 5: return phone.trim().length >= 7
      case 6: return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
      case 7: return emailConfirm === email && email.length > 0
      case 8: return !!shirtSize
      case 9: return true
      default: return false
    }
  }

  function validationMessage(): string | null {
    switch (step) {
      case 7:
        if (emailConfirm && emailConfirm !== email) return 'Los correos no coinciden'
        return null
      case 6:
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Correo inválido'
        return null
      default: return null
    }
  }

  function goNext() {
    if (!canAdvance()) return
    setError(null)
    setDirection(1)
    setStep(s => Math.min(s + 1, TOTAL_STEPS - 1))
  }

  function goBack() {
    setError(null)
    setDirection(-1)
    setStep(s => Math.max(s - 1, 0))
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Enter' && canAdvance() && step < TOTAL_STEPS - 1) {
      e.preventDefault()
      goNext()
    }
  }, [step, selectedDistanceId, firstName, lastName, dobDay, dobMonth, dobYear, gender, phone, email, emailConfirm, shirtSize])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  async function handleSubmit() {
    if (!event || !selectedDistance) return

    // Client-side validation
    if (!firstName.trim()) { toast.error('El nombre es obligatorio.'); return }
    if (!lastName.trim()) { toast.error('El apellido es obligatorio.'); return }
    if (!phone.trim()) { toast.error('El número de celular es obligatorio.'); return }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Ingresa un correo electrónico válido.')
      return
    }

    setSubmitting(true)
    setError(null)

    const dob = `${dobYear}-${dobMonth.padStart(2, '0')}-${dobDay.padStart(2, '0')}`
    const isFree = !selectedDistance.price || selectedDistance.price === 0

    try {
      const { data: regData } = await client.models.GuestRegistration.create(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          dateOfBirth: dob,
          gender,
          eventId: event.id,
          distanceId: selectedDistance.id,
          distanceName: selectedDistance.name,
          distanceKm: selectedDistance.distanceKm,
          category: selectedDistance.category ?? 'GENERAL',
          status: isFree ? 'CONFIRMED' : 'PENDING',
          paymentStatus: isFree ? 'PAID' : 'PENDING',
          amountPaid: selectedDistance.price ?? 0,
          registeredAt: new Date().toISOString(),
          waiverSigned: true,
          shirtSize,
          currency: 'MXN',
        },
        { authMode: 'identityPool' }
      )

      if (isFree) {
        setSuccess(true)
        return
      }

      // Paid event — create Stripe checkout session
      if (regData) {
        const { data: checkoutUrl } = await client.mutations.createGuestCheckoutSession(
          {
            eventId: event.id,
            distanceId: selectedDistance.id,
            distanceName: selectedDistance.name,
            eventTitle: event.title,
            priceInCentavos: selectedDistance.price,
            guestEmail: email.trim().toLowerCase(),
            guestRegistrationId: regData.id,
          },
          { authMode: 'identityPool' }
        )
        if (checkoutUrl) {
          window.location.href = checkoutUrl
          return
        }
      }
    } catch (err) {
      console.error('Registration failed:', err)
      setError('Hubo un error al crear tu inscripción. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingSpinner className="h-screen items-center" />
  if (!event) return <div className="flex items-center justify-center h-screen text-zinc-400">Evento no encontrado</div>

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-white flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: smooth }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">¡Inscripción confirmada!</h1>
          <p className="text-zinc-500 mb-6">Tu inscripción a <strong>{event.title}</strong> ha sido registrada exitosamente.</p>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8"
            onClick={() => navigate(`/evento/${slug}`)}
          >
            Volver al evento
          </Button>
        </motion.div>
      </div>
    )
  }

  const progress = ((step + 1) / TOTAL_STEPS) * 100
  const valMsg = validationMessage()

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-white flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-zinc-100">
        <motion.div
          className="h-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: smooth }}
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={step === 0 ? () => navigate(`/evento/${slug}`) : goBack}
          className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {step === 0 ? 'Volver' : 'Atrás'}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-zinc-900 text-sm">{event.title}</span>
        </div>
        <span className="text-xs text-zinc-400">{step + 1}/{TOTAL_STEPS}</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Distance selection */}
            {step === 0 && (
              <motion.div key="step0" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Elige tu distancia</h2>
                <p className="text-zinc-500 mb-8">Selecciona la modalidad en la que quieres participar.</p>
                <div className="space-y-3">
                  {distances.map(dist => (
                    <motion.button
                      key={dist.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setSelectedDistanceId(dist.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                        selectedDistanceId === dist.id
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-zinc-200 hover:border-emerald-200 bg-white'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-zinc-900 text-lg">{dist.name}</p>
                        {dist.distanceKm && <p className="text-sm text-zinc-500">{dist.distanceKm} km</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-600 text-lg">
                          {dist.price && dist.price > 0 ? `$${(dist.price / 100).toLocaleString('es-MX')}` : 'Gratis'}
                        </span>
                        {selectedDistanceId === dist.id && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 1: First name */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">¿Cuál es tu nombre?</h2>
                <p className="text-zinc-500 mb-8">Nombre(s) como aparecerá en tu inscripción.</p>
                <Input
                  ref={inputRef}
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="Ej. María José"
                  className="text-lg py-6 border-2 border-zinc-200 focus:border-emerald-500"
                />
              </motion.div>
            )}

            {/* Step 2: Last name */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">¿Cuáles son tus apellidos?</h2>
                <p className="text-zinc-500 mb-8">Apellido(s) completos.</p>
                <Input
                  ref={inputRef}
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Ej. González López"
                  className="text-lg py-6 border-2 border-zinc-200 focus:border-emerald-500"
                />
              </motion.div>
            )}

            {/* Step 3: Date of birth */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Fecha de nacimiento</h2>
                <p className="text-zinc-500 mb-8">Necesaria para asignarte categoría de edad.</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Día</label>
                    <select
                      value={dobDay}
                      onChange={e => setDobDay(e.target.value)}
                      className="w-full rounded-xl border-2 border-zinc-200 focus:border-emerald-500 py-3 px-3 text-zinc-900 bg-white text-lg outline-none"
                    >
                      <option value="">--</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Mes</label>
                    <select
                      value={dobMonth}
                      onChange={e => setDobMonth(e.target.value)}
                      className="w-full rounded-xl border-2 border-zinc-200 focus:border-emerald-500 py-3 px-3 text-zinc-900 bg-white text-lg outline-none"
                    >
                      <option value="">--</option>
                      {MONTHS.map((m, i) => (
                        <option key={m} value={String(i + 1)}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 mb-1 block">Año</label>
                    <select
                      value={dobYear}
                      onChange={e => setDobYear(e.target.value)}
                      className="w-full rounded-xl border-2 border-zinc-200 focus:border-emerald-500 py-3 px-3 text-zinc-900 bg-white text-lg outline-none"
                    >
                      <option value="">--</option>
                      {Array.from({ length: 80 }, (_, i) => {
                        const y = new Date().getFullYear() - 5 - i
                        return <option key={y} value={String(y)}>{y}</option>
                      })}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Gender */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Rama</h2>
                <p className="text-zinc-500 mb-8">Selecciona tu categoría.</p>
                <div className="grid grid-cols-2 gap-4">
                  {([['F', 'Femenil'], ['M', 'Varonil']] as const).map(([val, label]) => (
                    <motion.button
                      key={val}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setGender(val)}
                      className={`p-6 rounded-xl border-2 text-center transition-all ${
                        gender === val
                          ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                          : 'border-zinc-200 hover:border-emerald-200 bg-white'
                      }`}
                    >
                      <p className="text-xl font-bold text-zinc-900">{label}</p>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 5: Phone */}
            {step === 5 && (
              <motion.div key="step5" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Número de celular</h2>
                <p className="text-zinc-500 mb-8">Para contactarte el día del evento.</p>
                <Input
                  ref={inputRef}
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. 55 1234 5678"
                  className="text-lg py-6 border-2 border-zinc-200 focus:border-emerald-500"
                />
              </motion.div>
            )}

            {/* Step 6: Email */}
            {step === 6 && (
              <motion.div key="step6" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Correo electrónico</h2>
                <p className="text-zinc-500 mb-8">Te enviaremos la confirmación aquí.</p>
                <Input
                  ref={inputRef}
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="text-lg py-6 border-2 border-zinc-200 focus:border-emerald-500"
                />
                {valMsg && <p className="text-sm text-red-500 mt-2">{valMsg}</p>}
              </motion.div>
            )}

            {/* Step 7: Confirm email */}
            {step === 7 && (
              <motion.div key="step7" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Confirma tu correo</h2>
                <p className="text-zinc-500 mb-8">Escríbelo de nuevo para verificar.</p>
                <Input
                  ref={inputRef}
                  type="email"
                  value={emailConfirm}
                  onChange={e => setEmailConfirm(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="text-lg py-6 border-2 border-zinc-200 focus:border-emerald-500"
                />
                {valMsg && <p className="text-sm text-red-500 mt-2">{valMsg}</p>}
              </motion.div>
            )}

            {/* Step 8: Shirt size */}
            {step === 8 && (
              <motion.div key="step8" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Talla de playera</h2>
                <p className="text-zinc-500 mb-8">Selecciona tu talla {gender === 'F' ? '(Dama)' : '(Caballero)'}.</p>
                <div className="grid grid-cols-3 gap-3">
                  {(gender === 'F' ? SHIRT_SIZES_F : SHIRT_SIZES_M).map(size => (
                    <motion.button
                      key={size}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setShirtSize(size)}
                      className={`py-4 rounded-xl border-2 font-semibold transition-all ${
                        shirtSize === size
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-zinc-200 hover:border-emerald-200 bg-white text-zinc-700'
                      }`}
                    >
                      {size}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 9: Summary */}
            {step === 9 && (
              <motion.div key="step9" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Confirma tu inscripción</h2>
                <p className="text-zinc-500 mb-6">Revisa que tus datos sean correctos.</p>
                <div className="bg-white rounded-xl border-2 border-zinc-200 divide-y divide-zinc-100">
                  {[
                    ['Distancia', selectedDistance?.name],
                    ['Nombre', `${firstName} ${lastName}`],
                    ['Fecha de nacimiento', `${dobDay}/${dobMonth}/${dobYear}`],
                    ['Rama', gender === 'F' ? 'Femenil' : 'Varonil'],
                    ['Celular', phone],
                    ['Correo', email],
                    ['Playera', shirtSize],
                    ['Precio', selectedDistance?.price && selectedDistance.price > 0
                      ? `$${(selectedDistance.price / 100).toLocaleString('es-MX')} MXN`
                      : 'Gratis'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between px-5 py-3">
                      <span className="text-sm text-zinc-500">{label}</span>
                      <span className="text-sm font-medium text-zinc-900">{value}</span>
                    </div>
                  ))}
                </div>
                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mt-4">{error}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div />
            {step < TOTAL_STEPS - 1 ? (
              <div className="flex items-center gap-3">
                <Button
                  disabled={!canAdvance()}
                  onClick={goNext}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-xl"
                >
                  Siguiente <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <span className="text-xs text-zinc-400 hidden sm:block">
                  Enter ↵
                </span>
              </div>
            ) : (
              <Button
                disabled={submitting}
                onClick={handleSubmit}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-xl"
              >
                {submitting
                  ? 'Procesando...'
                  : selectedDistance?.price && selectedDistance.price > 0
                    ? 'Pagar e inscribirme'
                    : 'Confirmar inscripción'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
