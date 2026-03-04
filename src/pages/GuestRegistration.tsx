import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, ArrowRight, Check, Zap, CheckCircle, Plus, Trash2, FileText, Shield, Pencil } from 'lucide-react'
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

// ─── Shirt sizes: Dama, Caballero, Niño ───
const SHIRT_SIZES_DAMA = ['XCH Dama', 'CH Dama', 'M Dama', 'G Dama', 'XG Dama', '2XG Dama', '3XG Dama']
const SHIRT_SIZES_CABALLERO = ['XCH Caballero', 'CH Caballero', 'M Caballero', 'G Caballero', 'XG Caballero', '2XG Caballero', '3XG Caballero']
const SHIRT_SIZES_NINO = ['2 Niño', '4 Niño', '6 Niño', '8 Niño', '10 Niño', '12 Niño', '14 Niño']

const TOTAL_STEPS = 5 // 0-4

// ─── T&C Text ───
const TERMS_TEXT = `TÉRMINOS Y CONDICIONES DE INSCRIPCIÓN

1. Inscripción y Pago
Al completar el formulario de inscripción y realizar el pago correspondiente, el participante acepta estos términos y condiciones en su totalidad. La inscripción es personal e intransferible, salvo autorización expresa del comité organizador.

2. Requisitos de Participación
El participante declara encontrarse en condiciones físicas adecuadas para participar en el evento deportivo. Se recomienda contar con un certificado médico vigente. En caso de menores de edad, es indispensable la autorización del padre, madre o tutor legal.

3. Política de Reembolso
Una vez confirmado el pago, la inscripción no es reembolsable. En caso de cancelación del evento por causas de fuerza mayor, el comité organizador informará a los participantes sobre las alternativas disponibles.

4. Protección de Datos Personales
Los datos personales proporcionados serán tratados conforme a la legislación aplicable en materia de protección de datos. Se utilizarán exclusivamente para la gestión del evento, comunicaciones oficiales y publicación de resultados.

5. Uso de Imagen y Voz
El participante autoriza al comité organizador el uso de fotografías, videos y grabaciones de audio captados durante el evento, con fines informativos, promocionales y de difusión, sin derecho a compensación alguna.

6. Responsabilidad del Participante
La participación en el evento es bajo la entera responsabilidad del inscrito. El comité organizador, patrocinadores y colaboradores no serán responsables por lesiones, accidentes, enfermedades o pérdida de pertenencias personales ocurridas durante el evento.

7. Reglamento Deportivo
El participante se compromete a respetar el reglamento del evento, las indicaciones del personal organizador, jueces, paramédicos y autoridades competentes. El incumplimiento del reglamento podrá resultar en descalificación sin derecho a reembolso.

8. Kit de Participación
El kit de participación (playera, número de competidor y accesorios) deberá ser recogido en las fechas y horarios establecidos por el comité organizador. No se realizarán envíos ni entregas fuera de los puntos designados.

9. Modificaciones al Evento
El comité organizador se reserva el derecho de modificar la fecha, horario, ruta o cualquier aspecto del evento por razones de seguridad o fuerza mayor, sin que esto genere derecho a reembolso.

10. Aceptación
Al marcar la casilla de aceptación y completar la inscripción, el participante declara haber leído, entendido y aceptado todos los términos y condiciones aquí establecidos.`

const EXONERATION_TEXT = `CARTA EXONERACIÓN.

3a Carrera APA Colegio Monteverde. Sábado 25 de abril del 2026.

Yo, por el sólo hecho de firmar este documento, acepto cualquier y todos los riesgos y peligros que sobre mi persona recaigan en cuanto a mi participación en el evento antes referido en adelante el "Evento". Por lo tanto, yo soy el único responsable de (l) mi salud, (ll) cualquier consecuencia, accidente, perjuicios, deficiencias que puedan causar, de cualquier manera posible alteraciones a mi salud, integridad física o inclusive la muerte. Por esta razón libero de cualquier responsabilidad ala APA, Colegio Monteverde, al comité organizador, sus directores, patrocinadores, Roberto Sánchez Carrasco (organizador del evento) y por medio de este conducto renuncio, sin limitación alguna a cualquier derecho, demanda o indemnización al respecto. También reconozco y acepto que todas las personas y entidades referidas no son ni serán consideradas responsables de mi salud. Además, no serán responsables por cualquier desperfecto, pérdida o robo relacionado con mis pertenencias personales.

Así mismo, autorizo al Comité Organizador y/o a quien ésta designe, el uso de mi imagen y voz, ya sea parcial o totalmente, en cuanto a todo lo relacionado en el "Evento", de cualquier manera y en cualquier momento. Por este conducto reconozco que sé y entiendo todas las regulaciones del "Evento". Igualmente, manifiesto bajo protesta de decir verdad que mi equipo reúne y cumple con todos los requisitos reglamentarios aplicables y los temas establecidos en la mencionada normatividad.

AUTORIZACIÓN DEL MENOR (EN CASO DE QUE EL INSCRITO SEA MENOR DE EDAD)

Autorizo a mi hijo a participar en esta carrera. Declaro conocer las condiciones de la competencia y los riesgos que esto implica. Declaro haber leído y comprendido la presente exoneración y aceptarla en su totalidad. Firmo bajo absoluta voluntad.`

// ─── Participant data type ───
interface ParticipantData {
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
  gender: 'F' | 'M' | null
  phone: string
  email: string
  emailConfirm: string
  shirtSize: string
}

export default function GuestRegistration() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)
  const submittingRef = useRef(false)
  const loadedRef = useRef(false)

  // Event data
  const [event, setEvent] = useState<Schema['Event']['type'] | null>(null)
  const [distances, setDistances] = useState<Schema['EventDistance']['type'][]>([])
  const [loading, setLoading] = useState(true)

  // Multi-participant state
  const [participants, setParticipants] = useState<ParticipantData[]>([])

  // Current participant form state
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

  // T&C state
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [acceptExoneration, setAcceptExoneration] = useState(false)
  const [showTermsDetail, setShowTermsDetail] = useState(false)
  const [showExonerationDetail, setShowExonerationDetail] = useState(false)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Check for payment success/cancel return
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess(true)
      if (slug) localStorage.removeItem(`guest-reg-${slug}`)
    }
    if (searchParams.get('cancelled') === 'true') {
      toast('El pago fue cancelado. Puedes intentar de nuevo.', { icon: '⚠️' })
      window.history.replaceState({}, '', window.location.pathname)
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

  // Clear shirtSize when gender or age bracket changes
  useEffect(() => {
    const sizes = getShirtSizes()
    if (shirtSize && !sizes.includes(shirtSize)) {
      setShirtSize('')
    }
  }, [gender, dobDay, dobMonth, dobYear])

  // Restore saved form state from localStorage
  useEffect(() => {
    if (!slug) { loadedRef.current = true; return }
    try {
      const raw = localStorage.getItem(`guest-reg-${slug}`)
      if (raw) {
        const s = JSON.parse(raw)
        // Expire data older than 24 hours
        if (s.savedAt && Date.now() - s.savedAt > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(`guest-reg-${slug}`)
          loadedRef.current = true
          return
        }
        // Don't restore emailConfirm — force user to re-type email confirmation.
        // Clamp the restored step to max 2 (contact step) so the user isn't
        // placed past the email confirmation with an empty emailConfirm field.
        const restoredStep = s.step ?? 0
        setStep(restoredStep > 2 ? 2 : restoredStep)
        setSelectedDistanceId(s.selectedDistanceId ?? null)
        setParticipants(s.participants ?? [])
        setFirstName(s.firstName ?? '')
        setLastName(s.lastName ?? '')
        setDobDay(s.dobDay ?? '')
        setDobMonth(s.dobMonth ?? '')
        setDobYear(s.dobYear ?? '')
        setGender(s.gender ?? null)
        setPhone(s.phone ?? '')
        setEmail(s.email ?? '')
        setEmailConfirm('')
        setShirtSize(s.shirtSize ?? '')
        setAcceptTerms(s.acceptTerms ?? false)
        setAcceptExoneration(s.acceptExoneration ?? false)
      }
    } catch { /* corrupted data, start fresh */ }
    setTimeout(() => { loadedRef.current = true }, 50)
  }, [])

  // Persist form state to localStorage
  useEffect(() => {
    if (!loadedRef.current || !slug) return
    try {
      localStorage.setItem(`guest-reg-${slug}`, JSON.stringify({
        savedAt: Date.now(),
        step, selectedDistanceId, participants,
        firstName, lastName, dobDay, dobMonth, dobYear,
        gender, phone, email, emailConfirm, shirtSize,
        acceptTerms, acceptExoneration,
      }))
    } catch { /* storage full */ }
  }, [slug, step, selectedDistanceId, participants, firstName, lastName, dobDay, dobMonth, dobYear, gender, phone, email, emailConfirm, shirtSize, acceptTerms, acceptExoneration])

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

  // If we restored to a late step but distances haven't loaded yet (or the
  // distance was removed), clamp back to step 0 so the user doesn't see
  // undefined values on the summary screen.
  useEffect(() => {
    if (!loading && selectedDistanceId && distances.length > 0 && !selectedDistance) {
      setSelectedDistanceId(null)
      setStep(0)
    }
  }, [loading, distances, selectedDistanceId, selectedDistance])

  // ─── Age & size helpers ───
  function getParticipantAge(): number | null {
    if (!dobYear || !dobMonth || !dobDay) return null
    const today = new Date()
    const birth = new Date(parseInt(dobYear), parseInt(dobMonth) - 1, parseInt(dobDay))
    let age = today.getFullYear() - birth.getFullYear()
    const m = today.getMonth() - birth.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
    return age
  }

  function getShirtSizes(): string[] {
    const age = getParticipantAge()
    if (age !== null && age < 15) return SHIRT_SIZES_NINO
    return gender === 'F' ? SHIRT_SIZES_DAMA : SHIRT_SIZES_CABALLERO
  }

  function getShirtSizeLabel(): string {
    const age = getParticipantAge()
    if (age !== null && age < 15) return '(Niño)'
    return gender === 'F' ? '(Dama)' : '(Caballero)'
  }

  // ─── All participants for display (saved + current) ───
  function getAllParticipants(): ParticipantData[] {
    const current: ParticipantData = {
      firstName, lastName, dobDay, dobMonth, dobYear,
      gender, phone, email, emailConfirm, shirtSize,
    }
    return [...participants, current]
  }

  // ─── Date validation helper ───
  function isValidDate(day: string, month: string, year: string): boolean {
    if (!day || !month || !year) return false
    const d = parseInt(day), m = parseInt(month), y = parseInt(year)
    if (isNaN(d) || isNaN(m) || isNaN(y)) return false
    // Use Date constructor: if the day overflows (e.g. Feb 31 -> Mar 3),
    // the resulting month won't match the input month.
    const date = new Date(y, m - 1, d)
    return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
  }

  // ─── Validation ───
  function canAdvance(): boolean {
    switch (step) {
      case 0: return !!selectedDistanceId
      case 1: return firstName.trim().length > 0 && lastName.trim().length > 0 && isValidDate(dobDay, dobMonth, dobYear) && !!gender
      case 2: {
        const digits = phone.replace(/\D/g, '')
        return digits.length >= 7 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && emailConfirm === email && email.length > 0
      }
      case 3: return !!shirtSize && acceptTerms && acceptExoneration
      case 4: return true
      default: return false
    }
  }

  function validationMessage(): string | null {
    switch (step) {
      case 1:
        if (dobDay && dobMonth && dobYear && !isValidDate(dobDay, dobMonth, dobYear))
          return 'Fecha inválida'
        return null
      case 2:
        if (phone && phone.replace(/\D/g, '').length < 7 && phone.trim().length > 0)
          return 'Ingresa al menos 7 dígitos numéricos'
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Correo inválido'
        if (emailConfirm && emailConfirm !== email) return 'Los correos no coinciden'
        return null
      default: return null
    }
  }

  // ─── Navigation ───
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
  }, [step, selectedDistanceId, firstName, lastName, dobDay, dobMonth, dobYear, gender, phone, email, emailConfirm, shirtSize, acceptTerms, acceptExoneration])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // ─── Multi-participant handlers ───
  function validateCurrentParticipant(): boolean {
    if (!firstName.trim()) { toast.error('El nombre es obligatorio.'); return false }
    if (!lastName.trim()) { toast.error('El apellido es obligatorio.'); return false }
    if (!isValidDate(dobDay, dobMonth, dobYear)) { toast.error('La fecha de nacimiento es inválida.'); return false }
    if (!gender) { toast.error('La rama es obligatoria.'); return false }
    if (phone.replace(/\D/g, '').length < 7) { toast.error('El número de celular debe tener al menos 7 dígitos.'); return false }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('El correo electrónico es inválido.'); return false }
    if (!shirtSize) { toast.error('La talla de playera es obligatoria.'); return false }
    return true
  }

  function addAnotherParticipant() {
    // Validate current participant before saving
    if (!validateCurrentParticipant()) return
    // Enforce max 10 participants
    if (participants.length + 1 >= 10) {
      toast.error('Máximo 10 participantes por transacción.')
      return
    }
    const current: ParticipantData = {
      firstName, lastName, dobDay, dobMonth, dobYear,
      gender, phone, email, emailConfirm, shirtSize,
    }
    setParticipants(prev => [...prev, current])
    // Clear per-participant fields, keep phone for convenience
    setFirstName('')
    setLastName('')
    setDobDay('')
    setDobMonth('')
    setDobYear('')
    setGender(null)
    setShirtSize('')
    setEmail('')
    setEmailConfirm('')
    setDirection(-1)
    setStep(1)
  }

  function removeParticipant(index: number) {
    setParticipants(prev => prev.filter((_, i) => i !== index))
  }

  function editParticipant(index: number) {
    if (index >= participants.length) return
    const target = participants[index]
    // Swap: store current form data in the edited slot, load target into form
    const current: ParticipantData = {
      firstName, lastName, dobDay, dobMonth, dobYear,
      gender, phone, email, emailConfirm, shirtSize,
    }
    setParticipants(prev => prev.map((p, i) => i === index ? current : p))
    setFirstName(target.firstName)
    setLastName(target.lastName)
    setDobDay(target.dobDay)
    setDobMonth(target.dobMonth)
    setDobYear(target.dobYear)
    setGender(target.gender)
    setPhone(target.phone)
    setEmail(target.email)
    setEmailConfirm(target.emailConfirm)
    setShirtSize(target.shirtSize)
    setDirection(-1)
    setStep(1)
  }

  // ─── Submit ───
  async function handleSubmit() {
    if (!event || !selectedDistance) return
    if (submittingRef.current) return
    submittingRef.current = true

    const allParticipants = getAllParticipants()

    // Validate all participants
    for (const p of allParticipants) {
      if (!p.firstName.trim()) { toast.error('El nombre es obligatorio para todos los participantes.'); submittingRef.current = false; return }
      if (!p.lastName.trim()) { toast.error('El apellido es obligatorio para todos los participantes.'); submittingRef.current = false; return }
      if (!p.gender) { toast.error('La rama es obligatoria para todos los participantes.'); submittingRef.current = false; return }
      if (!p.dobDay || !p.dobMonth || !p.dobYear || !isValidDate(p.dobDay, p.dobMonth, p.dobYear)) { toast.error('La fecha de nacimiento es inválida para alguno de los participantes.'); submittingRef.current = false; return }
      if (p.phone.replace(/\D/g, '').length < 7) { toast.error('El número de celular debe tener al menos 7 dígitos numéricos.'); submittingRef.current = false; return }
      if (!p.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) {
        toast.error(`Correo inválido para ${p.firstName} ${p.lastName}.`)
        submittingRef.current = false
        return
      }
      if (!p.shirtSize) { toast.error('La talla de playera es obligatoria para todos los participantes.'); submittingRef.current = false; return }
    }

    // Limit participants to avoid Stripe metadata overflow (max ~13 UUIDs in 500 chars)
    if (allParticipants.length > 10) {
      toast.error('Máximo 10 participantes por transacción.')
      submittingRef.current = false
      return
    }

    if (!acceptTerms || !acceptExoneration) {
      toast.error('Debes aceptar los términos y la exoneración.')
      submittingRef.current = false
      return
    }

    setSubmitting(true)
    setError(null)

    const isFree = !selectedDistance.price || selectedDistance.price === 0

    try {
      // Create all guest registrations
      const registrationIds: string[] = []

      for (const p of allParticipants) {
        const dob = `${p.dobYear}-${p.dobMonth.padStart(2, '0')}-${p.dobDay.padStart(2, '0')}`
        const { data: regData } = await client.models.GuestRegistration.create(
          {
            firstName: p.firstName.trim(),
            lastName: p.lastName.trim(),
            email: p.email.trim().toLowerCase(),
            phone: p.phone.trim(),
            dateOfBirth: dob,
            gender: p.gender,
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
            shirtSize: p.shirtSize,
            currency: 'MXN',
          },
          { authMode: 'identityPool' }
        )
        if (regData) registrationIds.push(regData.id)
      }

      if (isFree) {
        setSuccess(true)
        if (slug) localStorage.removeItem(`guest-reg-${slug}`)
        return
      }

      // Paid event — create Stripe checkout session for all participants
      if (registrationIds.length > 0) {
        const { data: checkoutUrl } = await client.mutations.createGuestCheckoutSession(
          {
            eventId: event.id,
            eventSlug: slug!,
            distanceId: selectedDistance.id,
            distanceName: selectedDistance.name,
            eventTitle: event.title,
            priceInCentavos: selectedDistance.price,
            guestEmail: allParticipants[0].email.trim().toLowerCase(),
            guestRegistrationIds: registrationIds.join(','),
            quantity: allParticipants.length,
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
      submittingRef.current = false
    }
  }

  if (loading) return <LoadingSpinner className="h-screen items-center" />
  if (!event) return <div className="flex items-center justify-center h-screen text-zinc-400">Evento no encontrado</div>

  // Success screen (must be checked before registration-closed guard,
  // because the event may become SOLDOUT or deadline may pass during payment)
  if (success) {
    const countParam = parseInt(searchParams.get('count') || '1', 10)
    const totalParticipants = countParam >= 1 ? countParam : 1
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-white flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: smooth }}
          className="text-center max-w-md"
        >
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-zinc-900 mb-2">
            {totalParticipants > 1 ? '¡Inscripciones confirmadas!' : '¡Inscripción confirmada!'}
          </h1>
          <p className="text-zinc-500 mb-6">
            {totalParticipants > 1
              ? `${totalParticipants} inscripciones a `
              : 'Tu inscripción a '}
            <strong>{event.title}</strong>
            {totalParticipants > 1
              ? ' han sido registradas exitosamente.'
              : ' ha sido registrada exitosamente.'}
          </p>
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

  // Check event status — block registration for non-published events
  const isRegistrationClosed = event.status !== 'PUBLISHED'
  const isDeadlinePassed = event.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false

  if (isRegistrationClosed || isDeadlinePassed) {
    const message = event.status === 'CANCELLED'
      ? 'Este evento ha sido cancelado.'
      : event.status === 'COMPLETED'
        ? 'Este evento ya finalizó.'
        : event.status === 'SOLDOUT'
          ? 'Este evento está agotado.'
          : event.status === 'DRAFT'
            ? 'Este evento aún no está disponible para inscripción.'
            : isDeadlinePassed
              ? 'El plazo de inscripción ha finalizado.'
              : 'La inscripción no está disponible.'

    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-white flex items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: smooth }}
          className="text-center max-w-md"
        >
          <Shield className="w-16 h-16 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Inscripcion cerrada</h1>
          <p className="text-zinc-500 mb-6">{message}</p>
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
  const shirtSizes = getShirtSizes()
  const sizeLabel = getShirtSizeLabel()
  const allParticipantsDisplay = getAllParticipants()
  const unitPrice = selectedDistance?.price ?? 0
  const totalPrice = unitPrice * allParticipantsDisplay.length

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
        <div className="flex items-center gap-2">
          {participants.length > 0 && step >= 1 && step <= 3 && (
            <span className="text-xs text-emerald-600 font-medium">
              Participante {participants.length + 1}
            </span>
          )}
          <span className="text-xs text-zinc-400">{step + 1}/{TOTAL_STEPS}</span>
        </div>
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
                  {distances.map(dist => {
                    const isSoldOut = dist.spotsRemaining !== null && dist.spotsRemaining !== undefined && dist.spotsRemaining <= 0
                    return (
                      <motion.button
                        key={dist.id}
                        whileHover={isSoldOut ? {} : { scale: 1.01 }}
                        whileTap={isSoldOut ? {} : { scale: 0.99 }}
                        onClick={() => { if (!isSoldOut) setSelectedDistanceId(dist.id) }}
                        disabled={isSoldOut}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                          isSoldOut
                            ? 'border-zinc-200 bg-zinc-100 opacity-60 cursor-not-allowed'
                            : selectedDistanceId === dist.id
                              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                              : 'border-zinc-200 hover:border-emerald-200 bg-white'
                        }`}
                      >
                        <div>
                          <p className={`font-semibold text-lg ${isSoldOut ? 'text-zinc-400' : 'text-zinc-900'}`}>{dist.name}</p>
                          {dist.distanceKm && <p className={`text-sm ${isSoldOut ? 'text-zinc-400' : 'text-zinc-500'}`}>{dist.distanceKm} km</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          {isSoldOut ? (
                            <span className="font-bold text-red-400 text-lg">Agotado</span>
                          ) : (
                            <span className="font-bold text-emerald-600 text-lg">
                              {dist.price && dist.price > 0 ? `$${(dist.price / 100).toLocaleString('es-MX')}` : 'Gratis'}
                            </span>
                          )}
                          {selectedDistanceId === dist.id && !isSoldOut && (
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 1: Personal info — name, last name, DOB, gender */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Datos personales</h2>
                <p className="text-zinc-500 mb-6">Información del participante.</p>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Nombre(s)</label>
                    <Input
                      ref={inputRef}
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder="Ej. María José"
                      className="text-lg py-5 border-2 border-zinc-200 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Apellido(s)</label>
                    <Input
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder="Ej. González López"
                      className="text-lg py-5 border-2 border-zinc-200 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Fecha de nacimiento</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-zinc-500 mb-1 block">Día</label>
                        <select
                          value={dobDay}
                          onChange={e => setDobDay(e.target.value)}
                          className="w-full rounded-xl border-2 border-zinc-200 focus:border-emerald-500 py-3 px-3 text-zinc-900 bg-white text-base outline-none"
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
                          className="w-full rounded-xl border-2 border-zinc-200 focus:border-emerald-500 py-3 px-3 text-zinc-900 bg-white text-base outline-none"
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
                          className="w-full rounded-xl border-2 border-zinc-200 focus:border-emerald-500 py-3 px-3 text-zinc-900 bg-white text-base outline-none"
                        >
                          <option value="">--</option>
                          {Array.from({ length: 80 }, (_, i) => {
                            const y = new Date().getFullYear() - 5 - i
                            return <option key={y} value={String(y)}>{y}</option>
                          })}
                        </select>
                      </div>
                    </div>
                    {valMsg && <p className="text-sm text-red-500 mt-2">{valMsg}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Rama</label>
                    <div className="grid grid-cols-2 gap-3">
                      {([['F', 'Femenil'], ['M', 'Varonil']] as const).map(([val, label]) => (
                        <motion.button
                          key={val}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setGender(val)}
                          className={`py-4 rounded-xl border-2 text-center transition-all ${
                            gender === val
                              ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                              : 'border-zinc-200 hover:border-emerald-200 bg-white'
                          }`}
                        >
                          <p className="text-lg font-bold text-zinc-900">{label}</p>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Contact — phone, email, confirm email */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Contacto</h2>
                <p className="text-zinc-500 mb-6">Para enviarte confirmación y contactarte el día del evento.</p>
                <div className="space-y-5">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Número de celular</label>
                    <Input
                      ref={inputRef}
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="Ej. 55 1234 5678"
                      className="text-lg py-5 border-2 border-zinc-200 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Correo electrónico</label>
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="text-lg py-5 border-2 border-zinc-200 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Confirma tu correo</label>
                    <Input
                      type="email"
                      value={emailConfirm}
                      onChange={e => setEmailConfirm(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="text-lg py-5 border-2 border-zinc-200 focus:border-emerald-500"
                    />
                  </div>
                </div>
                {valMsg && <p className="text-sm text-red-500 mt-3">{valMsg}</p>}
              </motion.div>
            )}

            {/* Step 3: Shirt size + Terms & Conditions */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Playera y términos</h2>
                <p className="text-zinc-500 mb-6">Selecciona tu talla y acepta los documentos.</p>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium text-zinc-700 mb-2 block">Talla de playera {sizeLabel}</label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {shirtSizes.map(size => (
                        <motion.button
                          key={size}
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setShirtSize(size)}
                          className={`py-3 rounded-xl border-2 font-semibold transition-all text-sm ${
                            shirtSize === size
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                              : 'border-zinc-200 hover:border-emerald-200 bg-white text-zinc-700'
                          }`}
                        >
                          {size}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Terms checkbox */}
                    <div className={`rounded-xl border-2 transition-all ${acceptTerms ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200'}`}>
                      <label className="flex items-center gap-3 p-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={() => setAcceptTerms(!acceptTerms)}
                          className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 flex-shrink-0"
                        />
                        <span className="text-sm text-zinc-800 font-medium">Acepto Términos y Condiciones</span>
                      </label>
                      <button
                        onClick={() => setShowTermsDetail(!showTermsDetail)}
                        className="flex items-center gap-2 px-4 pb-3 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {showTermsDetail ? 'Ocultar' : 'Ver términos y condiciones'}
                      </button>
                      {showTermsDetail && (
                        <div className="mx-4 mb-4 bg-white rounded-lg p-4 max-h-36 overflow-y-auto text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap border border-zinc-100">
                          {TERMS_TEXT}
                        </div>
                      )}
                    </div>

                    {/* Exoneration checkbox */}
                    <div className={`rounded-xl border-2 transition-all ${acceptExoneration ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200'}`}>
                      <label className="flex items-center gap-3 p-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptExoneration}
                          onChange={() => setAcceptExoneration(!acceptExoneration)}
                          className="w-5 h-5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 flex-shrink-0"
                        />
                        <span className="text-sm text-zinc-800 font-medium">Acepto Exoneración de Responsabilidad</span>
                      </label>
                      <button
                        onClick={() => setShowExonerationDetail(!showExonerationDetail)}
                        className="flex items-center gap-2 px-4 pb-3 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {showExonerationDetail ? 'Ocultar' : 'Ver exoneración de responsabilidad'}
                      </button>
                      {showExonerationDetail && (
                        <div className="mx-4 mb-4 bg-white rounded-lg p-4 max-h-36 overflow-y-auto text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap border border-zinc-100">
                          {EXONERATION_TEXT}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <motion.div key="step10" custom={direction} variants={stepVariants} initial="enter" animate="center" exit="exit">
                <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 mb-2">Confirma tu inscripción</h2>
                <p className="text-zinc-500 mb-6">
                  {allParticipantsDisplay.length > 1
                    ? `Revisa los datos de los ${allParticipantsDisplay.length} participantes.`
                    : 'Revisa que tus datos sean correctos.'}
                </p>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                  {allParticipantsDisplay.map((p, i) => (
                    <div key={i} className="bg-white rounded-xl border-2 border-zinc-200 overflow-hidden">
                      {/* Participant header (shown if multiple) */}
                      {allParticipantsDisplay.length > 1 && (
                        <div className="flex items-center justify-between px-5 py-2 bg-zinc-50 border-b border-zinc-100">
                          <span className="text-sm font-semibold text-zinc-700">Participante {i + 1}</span>
                          <div className="flex items-center gap-2">
                            {i < participants.length ? (
                              <>
                                <button
                                  onClick={() => editParticipant(i)}
                                  className="text-zinc-400 hover:text-emerald-600 transition-colors"
                                  title="Editar participante"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => removeParticipant(i)}
                                  className="text-red-400 hover:text-red-600 transition-colors"
                                  title="Eliminar participante"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => { setDirection(-1); setStep(1) }}
                                className="text-zinc-400 hover:text-emerald-600 transition-colors"
                                title="Editar datos"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="divide-y divide-zinc-100">
                        {[
                          ['Distancia', selectedDistance?.name],
                          ['Nombre', `${p.firstName} ${p.lastName}`],
                          ['Fecha de nacimiento', `${p.dobDay.padStart(2, '0')}/${p.dobMonth.padStart(2, '0')}/${p.dobYear}`],
                          ['Rama', p.gender === 'F' ? 'Femenil' : 'Varonil'],
                          ['Celular', p.phone],
                          ['Correo', p.email],
                          ['Playera', p.shirtSize],
                        ].map(([label, value]) => (
                          <div key={label} className="flex justify-between px-5 py-2.5">
                            <span className="text-sm text-zinc-500">{label}</span>
                            <span className="text-sm font-medium text-zinc-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total price */}
                <div className="mt-4 bg-emerald-50 rounded-xl border-2 border-emerald-200 px-5 py-3 flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-700">
                    {allParticipantsDisplay.length > 1
                      ? `Total (${allParticipantsDisplay.length} inscripciones)`
                      : 'Precio'}
                  </span>
                  <span className="text-lg font-bold text-emerald-700">
                    {totalPrice > 0
                      ? `$${(totalPrice / 100).toLocaleString('es-MX')} MXN`
                      : 'Gratis'}
                  </span>
                </div>

                {/* Add another participant (hidden at max 10) */}
                {allParticipantsDisplay.length < 10 && (
                  <button
                    onClick={addAnotherParticipant}
                    className="mt-4 w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Agregar otro participante</span>
                  </button>
                )}

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
                  : totalPrice > 0
                    ? `Pagar ${allParticipantsDisplay.length > 1 ? `${allParticipantsDisplay.length} inscripciones` : 'e inscribirme'}`
                    : allParticipantsDisplay.length > 1
                      ? `Confirmar ${allParticipantsDisplay.length} inscripciones`
                      : 'Confirmar inscripción'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
