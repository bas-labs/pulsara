import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Shield, FileText, CheckCircle, Plus, Trash2, Zap, ArrowLeft, ChevronDown, ChevronUp, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/LoadingSpinner'
import monteverdeLogoUrl from '@/assets/logos/monteverde-logo.svg'

const client = generateClient<Schema>()

// ─── Constants ──────────────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const SHIRT_SIZES_DAMA      = ['XCH Dama','CH Dama','M Dama','G Dama','XG Dama','2XG Dama','3XG Dama']
const SHIRT_SIZES_CABALLERO = ['XCH Caballero','CH Caballero','M Caballero','G Caballero','XG Caballero','2XG Caballero','3XG Caballero']
const SHIRT_SIZES_NINO      = ['2 Niño','4 Niño','6 Niño','8 Niño','10 Niño','12 Niño','14 Niño']

const PLATFORM_FEE_CENTAVOS = 2000  // 20 MXN

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

8. Aceptación
Al marcar la casilla de aceptación y completar la inscripción, el participante declara haber leído, entendido y aceptado todos los términos y condiciones aquí establecidos.`

const EXONERATION_TEXT = `CARTA EXONERACIÓN.

3a Carrera APA Colegio Monteverde. Sábado 25 de abril del 2026.

Yo, por el sólo hecho de firmar este documento, acepto cualquier y todos los riesgos y peligros que sobre mi persona recaigan en cuanto a mi participación en el evento antes referido en adelante el "Evento". Por lo tanto, yo soy el único responsable de (l) mi salud, (ll) cualquier consecuencia, accidente, perjuicios, deficiencias que puedan causar, de cualquier manera posible alteraciones a mi salud, integridad física o inclusive la muerte. Por esta razón libero de cualquier responsabilidad a la APA, Colegio Monteverde, al comité organizador, sus directores, patrocinadores, Roberto Sánchez Carrasco (organizador del evento) y por medio de este conducto renuncio, sin limitación alguna a cualquier derecho, demanda o indemnización al respecto.

También reconozco y acepto que todas las personas y entidades referidas no son ni serán consideradas responsables de mi salud. Además, no serán responsables por cualquier desperfecto, pérdida o robo relacionado con mis pertenencias personales.

Así mismo, autorizo al Comité Organizador y/o a quien ésta designe, el uso de mi imagen y voz, ya sea parcial o totalmente, en cuanto a todo lo relacionado en el "Evento", de cualquier manera y en cualquier momento. Por este conducto reconozco que sé y entiendo todas las regulaciones del "Evento".

AUTORIZACIÓN DEL MENOR (EN CASO DE QUE EL INSCRITO SEA MENOR DE EDAD): Autorizo a mi hijo a participar en esta carrera. Declaro conocer las condiciones de la competencia y los riesgos que esto implica. Declaro haber leído y comprendido la presente exoneración y aceptarla en su totalidad.`

// ─── Types ──────────────────────────────────────────────────────────────────
interface ParticipantForm {
  _id: string
  firstName: string
  lastName: string
  dobDay: string
  dobMonth: string
  dobYear: string
  gender: 'F' | 'M' | null
  phone: string
  email: string
  shirtSize: string
  emergencyContactName: string
  emergencyContactPhone: string
  errors: Record<string, string>
  collapsed: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 9) }

function getAge(day: string, month: string, year: string): number | null {
  if (!day || !month || !year) return null
  const today = new Date()
  const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return isNaN(age) ? null : age
}

function isValidDate(day: string, month: string, year: string): boolean {
  if (!day || !month || !year) return false
  const d = parseInt(day), m = parseInt(month), y = parseInt(year)
  if (isNaN(d) || isNaN(m) || isNaN(y)) return false
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

function getShirtSizes(gender: 'F' | 'M' | null, age: number | null): string[] {
  if (age !== null && age < 15) return SHIRT_SIZES_NINO
  return gender === 'F' ? SHIRT_SIZES_DAMA : SHIRT_SIZES_CABALLERO
}

function blankParticipant(): ParticipantForm {
  return {
    _id: uid(), firstName: '', lastName: '', dobDay: '', dobMonth: '', dobYear: '',
    gender: null, phone: '', email: '', shirtSize: '', emergencyContactName: '',
    emergencyContactPhone: '', errors: {}, collapsed: false,
  }
}

function fmtMXN(centavos: number) {
  return `$${(centavos / 100).toLocaleString('es-MX', { minimumFractionDigits: 0 })} MXN`
}

// ─── Field components ────────────────────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
      <p className="text-sm text-red-500">{msg}</p>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{children}</p>
}

// ─── Participant Card ────────────────────────────────────────────────────────
function ParticipantCard({
  p, index, total, onChange, onRemove,
}: {
  p: ParticipantForm
  index: number
  total: number
  onChange: (field: keyof ParticipantForm, value: any) => void
  onRemove: () => void
}) {
  const age = getAge(p.dobDay, p.dobMonth, p.dobYear)
  const sizes = getShirtSizes(p.gender, age)

  // Clear shirt size when it's no longer valid for new gender/age
  useEffect(() => {
    if (p.shirtSize && !sizes.includes(p.shirtSize)) {
      onChange('shirtSize', '')
    }
  }, [p.gender, p.dobDay, p.dobMonth, p.dobYear])

  return (
    <div className="rounded-2xl border-2 border-zinc-200 overflow-hidden bg-white">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 py-3 bg-zinc-50 border-b border-zinc-200">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {index + 1}
          </div>
          <span className="font-semibold text-zinc-800 text-sm">
            {p.firstName ? `${p.firstName}${p.lastName ? ' ' + p.lastName : ''}` : `Participante ${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {total > 1 && (
            <button type="button" onClick={onRemove} className="text-zinc-400 hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button type="button" onClick={() => onChange('collapsed', !p.collapsed)} className="text-zinc-400 hover:text-zinc-700 p-1">
            {p.collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!p.collapsed && (
        <div className="px-5 py-5 space-y-6">
          {/* Personal info */}
          <div>
            <SectionLabel>Datos personales</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Nombre(s) *</label>
                <Input
                  value={p.firstName}
                  onChange={e => onChange('firstName', e.target.value)}
                  placeholder="María José"
                  className={`border-2 ${p.errors.firstName ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-emerald-500'}`}
                  data-error-field={`firstName-${p._id}`}
                />
                <FieldError msg={p.errors.firstName} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Apellido(s) *</label>
                <Input
                  value={p.lastName}
                  onChange={e => onChange('lastName', e.target.value)}
                  placeholder="González López"
                  className={`border-2 ${p.errors.lastName ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-emerald-500'}`}
                  data-error-field={`lastName-${p._id}`}
                />
                <FieldError msg={p.errors.lastName} />
              </div>
            </div>

            {/* Date of birth */}
            <div className="mt-4">
              <label className="text-sm font-medium text-zinc-700 block mb-1.5">Fecha de nacimiento *</label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Día</label>
                  <select value={p.dobDay} onChange={e => onChange('dobDay', e.target.value)}
                    className={`w-full rounded-lg border-2 py-2.5 px-3 text-zinc-900 bg-white outline-none text-sm ${p.errors.dob ? 'border-red-400' : 'border-zinc-200 focus:border-emerald-500'}`}
                    data-error-field={`dob-${p._id}`}>
                    <option value="">--</option>
                    {Array.from({ length: 31 }, (_, i) => <option key={i+1} value={String(i+1)}>{i+1}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Mes</label>
                  <select value={p.dobMonth} onChange={e => onChange('dobMonth', e.target.value)}
                    className={`w-full rounded-lg border-2 py-2.5 px-3 text-zinc-900 bg-white outline-none text-sm ${p.errors.dob ? 'border-red-400' : 'border-zinc-200 focus:border-emerald-500'}`}>
                    <option value="">--</option>
                    {MONTHS.map((m, i) => <option key={m} value={String(i+1)}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 mb-1 block">Año</label>
                  <select value={p.dobYear} onChange={e => onChange('dobYear', e.target.value)}
                    className={`w-full rounded-lg border-2 py-2.5 px-3 text-zinc-900 bg-white outline-none text-sm ${p.errors.dob ? 'border-red-400' : 'border-zinc-200 focus:border-emerald-500'}`}>
                    <option value="">--</option>
                    {Array.from({ length: 80 }, (_, i) => { const y = new Date().getFullYear() - 5 - i; return <option key={y} value={String(y)}>{y}</option> })}
                  </select>
                </div>
              </div>
              <FieldError msg={p.errors.dob} />
            </div>

            {/* Gender */}
            <div className="mt-4">
              <label className="text-sm font-medium text-zinc-700 block mb-2">Rama *</label>
              <div className="flex gap-3">
                {([['F', 'Femenil'], ['M', 'Varonil']] as const).map(([val, label]) => (
                  <button key={val} type="button" onClick={() => onChange('gender', val)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${p.gender === val ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-200 text-zinc-700 hover:border-emerald-200'}`}>
                    {label}
                  </button>
                ))}
              </div>
              <FieldError msg={p.errors.gender} />
            </div>

            {/* Phone + Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Celular *</label>
                <Input type="tel" value={p.phone} onChange={e => onChange('phone', e.target.value)}
                  placeholder="55 1234 5678"
                  className={`border-2 ${p.errors.phone ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-emerald-500'}`}
                  data-error-field={`phone-${p._id}`} />
                <FieldError msg={p.errors.phone} />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Correo electrónico *</label>
                <Input type="email" value={p.email} onChange={e => onChange('email', e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className={`border-2 ${p.errors.email ? 'border-red-400 focus:border-red-500' : 'border-zinc-200 focus:border-emerald-500'}`}
                  data-error-field={`email-${p._id}`} />
                <FieldError msg={p.errors.email} />
              </div>
            </div>
          </div>

          {/* Shirt size */}
          <div>
            <SectionLabel>Talla de playera</SectionLabel>
            {!p.gender && !p.dobYear ? (
              <p className="text-sm text-zinc-400 italic">Selecciona rama y fecha de nacimiento primero</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button key={size} type="button" onClick={() => onChange('shirtSize', size)}
                      className={`px-3 py-2 rounded-lg border-2 text-xs font-semibold transition-all ${p.shirtSize === size ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-zinc-200 text-zinc-600 hover:border-emerald-200'}`}>
                      {size}
                    </button>
                  ))}
                </div>
                <FieldError msg={p.errors.shirtSize} />
              </>
            )}
          </div>

          {/* Emergency contact */}
          <div>
            <SectionLabel>Contacto de emergencia</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Nombre del contacto</label>
                <Input value={p.emergencyContactName} onChange={e => onChange('emergencyContactName', e.target.value)}
                  placeholder="Nombre completo" className="border-2 border-zinc-200 focus:border-emerald-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-zinc-700 block mb-1.5">Teléfono de contacto</label>
                <Input type="tel" value={p.emergencyContactPhone} onChange={e => onChange('emergencyContactPhone', e.target.value)}
                  placeholder="55 1234 5678" className="border-2 border-zinc-200 focus:border-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function GuestRegistration() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const submittingRef = useRef(false)
  const formTopRef = useRef<HTMLDivElement>(null)

  // Event data
  const [event,     setEvent]     = useState<Schema['Event']['type'] | null>(null)
  const [distances, setDistances] = useState<Schema['EventDistance']['type'][]>([])
  const [loading,   setLoading]   = useState(true)

  // Form state
  const [selectedDistanceId, setSelectedDistanceId] = useState<string | null>(null)
  const [participants,       setParticipants]        = useState<ParticipantForm[]>([blankParticipant()])
  const [acceptTerms,        setAcceptTerms]         = useState(false)
  const [acceptExoneration,  setAcceptExoneration]   = useState(false)
  const [showTermsDetail,    setShowTermsDetail]      = useState(false)
  const [showExonerationDetail, setShowExonerationDetail] = useState(false)
  const [globalError,        setGlobalError]         = useState<string | null>(null)
  const [submitting,         setSubmitting]           = useState(false)
  const [success,            setSuccess]             = useState(false)
  const [distanceError,      setDistanceError]       = useState('')
  const [termsError,         setTermsError]          = useState('')

  const distanceRef       = useRef<HTMLDivElement>(null)
  const termsRef          = useRef<HTMLDivElement>(null)
  const participantRefs   = useRef<(HTMLDivElement | null)[]>([])

  // Handle redirect back from Stripe
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

  useEffect(() => { if (slug) loadEvent() }, [slug])

  async function loadEvent() {
    try {
      const { data } = await client.models.Event.listEventBySlug({ slug: slug! }, { authMode: 'identityPool' })
      if (data.length > 0) {
        const ev = data[0]
        setEvent(ev)
        const { data: dists } = await client.models.EventDistance.listEventDistanceByEventId({ eventId: ev.id }, { authMode: 'identityPool' })
        setDistances(dists)
        // Pre-select first available distance
        const first = dists.find(d => d.spotsRemaining === null || d.spotsRemaining === undefined || d.spotsRemaining > 0)
        if (first) setSelectedDistanceId(first.id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectedDistance = distances.find(d => d.id === selectedDistanceId)

  // ─── Participant helpers ─────────────────────────────────────────────────
  const updateParticipant = useCallback((index: number, field: keyof ParticipantForm, value: any) => {
    setParticipants(prev => prev.map((p, i) => {
      if (i !== index) return p
      const updated = { ...p, [field]: value }
      // Clear error on edit
      if (p.errors[field]) {
        const errors = { ...p.errors }
        delete errors[field as string]
        updated.errors = errors
      }
      return updated
    }))
  }, [])

  const addParticipant = () => {
    if (participants.length >= 10) { toast.error('Máximo 10 participantes por transacción.'); return }
    // Collapse all existing, add new open one
    setParticipants(prev => [...prev.map(p => ({ ...p, collapsed: true })), blankParticipant()])
    setTimeout(() => {
      participantRefs.current[participants.length]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const removeParticipant = (index: number) => {
    setParticipants(prev => prev.filter((_, i) => i !== index))
  }

  // ─── Validation ──────────────────────────────────────────────────────────
  function validateAll(): boolean {
    let valid = true
    let firstErrorEl: HTMLElement | null = null

    // Distance
    if (!selectedDistanceId) {
      setDistanceError('Selecciona una distancia para continuar')
      valid = false
      if (!firstErrorEl) firstErrorEl = distanceRef.current
    } else {
      setDistanceError('')
    }

    // Participants
    const updated = participants.map(p => {
      const errors: Record<string, string> = {}
      if (!p.firstName.trim())                                        errors.firstName = 'El nombre es obligatorio'
      if (!p.lastName.trim())                                         errors.lastName  = 'El apellido es obligatorio'
      if (!isValidDate(p.dobDay, p.dobMonth, p.dobYear))              errors.dob       = 'Fecha inválida o incompleta'
      if (!p.gender)                                                  errors.gender    = 'Selecciona la rama'
      if (p.phone.replace(/\D/g, '').length < 7)                     errors.phone     = 'Ingresa al menos 7 dígitos'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()))        errors.email     = 'Correo electrónico inválido'
      if (!p.shirtSize)                                               errors.shirtSize = 'Selecciona una talla'
      return { ...p, errors }
    })
    setParticipants(updated)

    // Find first participant error to scroll to
    if (!firstErrorEl) {
      const firstErrIdx = updated.findIndex(p => Object.keys(p.errors).length > 0)
      if (firstErrIdx >= 0) {
        valid = false
        firstErrorEl = participantRefs.current[firstErrIdx]
        // Un-collapse the participant with errors
        setParticipants(prev => prev.map((p, i) => ({ ...p, collapsed: i !== firstErrIdx ? p.collapsed : false })))
      }
    }

    // Terms
    if (!acceptTerms || !acceptExoneration) {
      setTermsError('Debes aceptar los términos y la exoneración para continuar')
      valid = false
      if (!firstErrorEl) firstErrorEl = termsRef.current
    } else {
      setTermsError('')
    }

    if (firstErrorEl) {
      setTimeout(() => firstErrorEl!.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }

    return valid
  }

  // ─── Submit ──────────────────────────────────────────────────────────────
  async function handleSubmit() {
    if (submittingRef.current) return
    if (!validateAll()) return
    if (!event || !selectedDistance) return

    submittingRef.current = true
    setSubmitting(true)
    setGlobalError(null)

    const isFree = !selectedDistance.price || selectedDistance.price === 0

    try {
      const registrationIds: string[] = []

      for (const p of participants) {
        const dob = `${p.dobYear}-${p.dobMonth.padStart(2, '0')}-${p.dobDay.padStart(2, '0')}`
        const { data: regData } = await client.models.GuestRegistration.create(
          {
            firstName: p.firstName.trim(),
            lastName:  p.lastName.trim(),
            email:     p.email.trim().toLowerCase(),
            phone:     p.phone.trim(),
            dateOfBirth: dob,
            gender:    p.gender,
            eventId:   event.id,
            distanceId:   selectedDistance.id,
            distanceName: selectedDistance.name,
            distanceKm:   selectedDistance.distanceKm,
            category:  selectedDistance.category ?? 'GENERAL',
            status:    isFree ? 'CONFIRMED' : 'PENDING',
            paymentStatus: isFree ? 'PAID' : 'PENDING',
            amountPaid:    selectedDistance.price ?? 0,
            registeredAt:  new Date().toISOString(),
            waiverSigned:  true,
            shirtSize: p.shirtSize,
            emergencyContactName:  p.emergencyContactName.trim() || undefined,
            emergencyContactPhone: p.emergencyContactPhone.trim() || undefined,
            currency:  'MXN',
          },
          { authMode: 'identityPool' }
        )
        if (regData) registrationIds.push(regData.id)
      }

      if (isFree) {
        if (slug) localStorage.removeItem(`guest-reg-${slug}`)
        setSuccess(true)
        return
      }

      if (registrationIds.length > 0) {
        // Save summary for confirmation page (survives Stripe redirect)
        try {
          localStorage.setItem(`guest-reg-summary-${slug}`, JSON.stringify({
            eventTitle: event.title,
            eventDate:  event.eventDate,
            distanceName: selectedDistance.name,
            pricePerPerson: selectedDistance.price,
            platformFeePerPerson: PLATFORM_FEE_CENTAVOS,
            quantity: participants.length,
            participants: participants.map(p => ({
              name: `${p.firstName} ${p.lastName}`,
              email: p.email,
              gender: p.gender,
              shirtSize: p.shirtSize,
            })),
          }))
        } catch { /* storage full */ }

        const { data: checkoutUrl } = await client.mutations.createGuestCheckoutSession(
          {
            eventId:    event.id,
            eventSlug:  slug!,
            distanceId: selectedDistance.id,
            distanceName: selectedDistance.name,
            eventTitle: event.title,
            priceInCentavos: selectedDistance.price,
            guestEmail: participants[0].email.trim().toLowerCase(),
            guestRegistrationIds: registrationIds.join(','),
            quantity: participants.length,
          },
          { authMode: 'identityPool' }
        )
        if (checkoutUrl) {
          window.location.href = checkoutUrl
          return
        }
      }
    } catch (err: any) {
      console.error('Registration failed:', err)
      const msg = err?.message?.includes('DUPLICATE_REGISTRATION')
        ? 'Ya existe una inscripción confirmada con este correo para este evento.'
        : 'Hubo un error al procesar tu inscripción. Intenta de nuevo.'
      setGlobalError(msg)
      formTopRef.current?.scrollIntoView({ behavior: 'smooth' })
    } finally {
      setSubmitting(false)
      submittingRef.current = false
    }
  }

  // ─── Loading / not found ─────────────────────────────────────────────────
  if (loading) return <LoadingSpinner className="h-screen items-center" />
  if (!event)  return <div className="flex items-center justify-center h-screen text-zinc-400">Evento no encontrado</div>

  // ─── Success / confirmation screen ───────────────────────────────────────
  if (success) {
    let summary: any = null
    try {
      const raw = localStorage.getItem(`guest-reg-summary-${slug}`)
      if (raw) summary = JSON.parse(raw)
    } catch { /* ignore */ }

    const qty           = summary?.quantity ?? parseInt(searchParams.get('count') || '1', 10)
    const racePrice     = summary?.pricePerPerson ?? selectedDistance?.price ?? 0
    const feePerPerson  = PLATFORM_FEE_CENTAVOS
    const totalPerPerson = racePrice + feePerPerson
    const grandTotal    = totalPerPerson * qty

    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50/80 via-white to-white">
        <div className="max-w-lg mx-auto px-6 py-12">
          {/* Header */}
          <div className="text-center mb-8">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Tu inscripción está confirmada</h1>
            <p className="text-zinc-500">
              {qty > 1
                ? `${qty} inscripciones a `
                : 'Inscripción a '}
              <strong>{summary?.eventTitle || event.title}</strong> registradas exitosamente.
            </p>
          </div>

          {/* Event info */}
          <div className="bg-white rounded-2xl border-2 border-zinc-100 overflow-hidden mb-4">
            <div className="bg-emerald-600 px-5 py-3">
              <p className="text-white font-semibold text-sm">Detalles del evento</p>
            </div>
            <div className="divide-y divide-zinc-100">
              {[
                ['Evento',    summary?.eventTitle || event.title],
                ['Distancia', summary?.distanceName || selectedDistance?.name || '—'],
                ['Fecha',     event.eventDate ? new Date(event.eventDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—'],
                ['Participantes', String(qty)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between px-5 py-3">
                  <span className="text-sm text-zinc-500">{label}</span>
                  <span className="text-sm font-medium text-zinc-900 text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Participants list */}
          {summary?.participants && summary.participants.length > 0 && (
            <div className="bg-white rounded-2xl border-2 border-zinc-100 overflow-hidden mb-4">
              <div className="bg-zinc-800 px-5 py-3">
                <p className="text-white font-semibold text-sm">Participantes</p>
              </div>
              <div className="divide-y divide-zinc-100">
                {summary.participants.map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-400">{p.email} · {p.gender === 'F' ? 'Femenil' : 'Varonil'} · Playera {p.shirtSize}</p>
                    </div>
                    <span className="badge bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">✓</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment breakdown */}
          {racePrice > 0 && (
            <div className="bg-white rounded-2xl border-2 border-zinc-100 overflow-hidden mb-4">
              <div className="bg-zinc-800 px-5 py-3">
                <p className="text-white font-semibold text-sm">Desglose de pago</p>
              </div>
              <div className="divide-y divide-zinc-100">
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-zinc-600">Inscripción × {qty}</span>
                  <span className="text-sm font-medium text-zinc-900">{fmtMXN(racePrice * qty)}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-zinc-600">Tarifa plataforma × {qty}</span>
                  <span className="text-sm font-medium text-zinc-900">{fmtMXN(feePerPerson * qty)}</span>
                </div>
                <div className="flex justify-between px-5 py-3 bg-emerald-50">
                  <span className="text-sm font-bold text-zinc-900">Total cobrado</span>
                  <span className="text-sm font-bold text-emerald-700">{fmtMXN(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Support */}
          <div className="bg-zinc-50 rounded-2xl px-5 py-4 mb-6 text-center">
            <p className="text-sm text-zinc-600 mb-1">¿Preguntas o problemas con tu inscripción?</p>
            <a href="mailto:contacto@alfallo.mx" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
              contacto@alfallo.mx
            </a>
          </div>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate(`/evento/${slug}`)}>
            Volver al evento
          </Button>
        </div>
      </div>
    )
  }

  // ─── Registration closed guard ───────────────────────────────────────────
  const isRegistrationClosed = event.status !== 'PUBLISHED'
  const isDeadlinePassed = event.registrationDeadline ? new Date() > new Date(event.registrationDeadline) : false

  if (isRegistrationClosed || isDeadlinePassed) {
    const message = event.status === 'CANCELLED' ? 'Este evento ha sido cancelado.'
      : event.status === 'COMPLETED' ? 'Este evento ya finalizó.'
      : event.status === 'SOLDOUT'   ? 'Este evento está agotado.'
      : event.status === 'DRAFT'     ? 'Este evento aún no está disponible.'
      : isDeadlinePassed             ? 'El plazo de inscripción ha finalizado.'
      : 'La inscripción no está disponible.'
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <Shield className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Inscripción cerrada</h1>
          <p className="text-zinc-500 mb-6">{message}</p>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => navigate(`/evento/${slug}`)}>Volver al evento</Button>
        </div>
      </div>
    )
  }

  // ─── Price helpers ───────────────────────────────────────────────────────
  const racePrice       = selectedDistance?.price ?? 0
  const isFree          = !racePrice
  const feePerPerson    = isFree ? 0 : PLATFORM_FEE_CENTAVOS
  const totalPerPerson  = racePrice + feePerPerson
  const grandTotal      = totalPerPerson * participants.length

  // ─── Form ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-white to-white" ref={formTopRef}>
      {/* Header bar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-100 px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate(`/evento/${slug}`)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-900 text-sm truncate">{event.title}</span>
        </div>
        <span className="text-xs text-zinc-400 flex-shrink-0">{participants.length} participante{participants.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Global error */}
        {globalError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{globalError}</p>
          </div>
        )}

        {/* ── Section 1: Distancia ── */}
        <div ref={distanceRef}>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Elige tu distancia</h2>
          <p className="text-sm text-zinc-500 mb-3">Selecciona la modalidad en la que quieres participar.</p>
          <div className="space-y-2">
            {distances.map(dist => {
              const soldOut = dist.spotsRemaining !== null && dist.spotsRemaining !== undefined && dist.spotsRemaining <= 0
              const selected = selectedDistanceId === dist.id
              return (
                <button key={dist.id} type="button" disabled={soldOut}
                  onClick={() => { if (!soldOut) { setSelectedDistanceId(dist.id); setDistanceError('') } }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 text-left transition-all ${
                    soldOut ? 'border-zinc-200 bg-zinc-100 opacity-60 cursor-not-allowed'
                    : selected ? 'border-emerald-500 bg-emerald-50 shadow-sm'
                    : 'border-zinc-200 hover:border-emerald-300 bg-white'
                  }`}>
                  <div>
                    <p className={`font-semibold ${soldOut ? 'text-zinc-400' : 'text-zinc-900'}`}>{dist.name}</p>
                    {dist.distanceKm && <p className={`text-xs mt-0.5 ${soldOut ? 'text-zinc-400' : 'text-zinc-500'}`}>{dist.distanceKm} km</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {soldOut ? (
                      <span className="text-sm font-bold text-red-400">Agotado</span>
                    ) : (
                      <span className={`font-bold text-lg ${selected ? 'text-emerald-700' : 'text-emerald-600'}`}>
                        {dist.price && dist.price > 0 ? fmtMXN(dist.price) : 'Gratis'}
                      </span>
                    )}
                    {selected && !soldOut && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {distanceError && <p className="text-sm text-red-500 mt-2 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{distanceError}</p>}
        </div>

        {/* ── Section 2: Participantes ── */}
        <div>
          <h2 className="text-lg font-bold text-zinc-900 mb-1">Datos de los participantes</h2>
          <p className="text-sm text-zinc-500 mb-3">Completa los datos de cada persona que se inscribirá.</p>

          <div className="space-y-4">
            {participants.map((p, i) => (
              <div key={p._id} ref={el => { participantRefs.current[i] = el }}>
                <ParticipantCard
                  p={p}
                  index={i}
                  total={participants.length}
                  onChange={(field, value) => updateParticipant(i, field, value)}
                  onRemove={() => removeParticipant(i)}
                />
              </div>
            ))}
          </div>

          {participants.length < 10 && (
            <button type="button" onClick={addParticipant}
              className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-zinc-300 text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 transition-all">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Agregar otro participante</span>
            </button>
          )}
        </div>

        {/* ── Section 3: Términos ── */}
        <div ref={termsRef}>
          <h2 className="text-lg font-bold text-zinc-900 mb-3">Términos y exoneración</h2>
          <div className="space-y-3">
            {/* T&C */}
            <div className={`rounded-xl border-2 transition-all ${acceptTerms ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200 bg-white'}`}>
              <label className="flex items-center gap-3 p-4 cursor-pointer">
                <input type="checkbox" checked={acceptTerms} onChange={() => { setAcceptTerms(!acceptTerms); setTermsError('') }}
                  className="w-5 h-5 rounded border-zinc-300 text-emerald-600 accent-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium text-zinc-800">Acepto los Términos y Condiciones</span>
              </label>
              <button type="button" onClick={() => setShowTermsDetail(!showTermsDetail)}
                className="flex items-center gap-2 px-4 pb-3 text-xs text-emerald-600 hover:text-emerald-700">
                <FileText className="w-3.5 h-3.5" />
                {showTermsDetail ? 'Ocultar' : 'Ver términos y condiciones'}
              </button>
              {showTermsDetail && (
                <div className="mx-4 mb-4 bg-white rounded-lg p-4 max-h-48 overflow-y-auto text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap border border-zinc-100">
                  {TERMS_TEXT}
                </div>
              )}
            </div>

            {/* Exoneration */}
            <div className={`rounded-xl border-2 transition-all ${acceptExoneration ? 'border-emerald-500 bg-emerald-50/50' : 'border-zinc-200 bg-white'}`}>
              <label className="flex items-center gap-3 p-4 cursor-pointer">
                <input type="checkbox" checked={acceptExoneration} onChange={() => { setAcceptExoneration(!acceptExoneration); setTermsError('') }}
                  className="w-5 h-5 rounded border-zinc-300 text-emerald-600 accent-emerald-600 flex-shrink-0" />
                <span className="text-sm font-medium text-zinc-800">Acepto la Exoneración de Responsabilidad</span>
              </label>
              <button type="button" onClick={() => setShowExonerationDetail(!showExonerationDetail)}
                className="flex items-center gap-2 px-4 pb-3 text-xs text-emerald-600 hover:text-emerald-700">
                <Shield className="w-3.5 h-3.5" />
                {showExonerationDetail ? 'Ocultar' : 'Ver exoneración'}
              </button>
              {showExonerationDetail && (
                <div className="mx-4 mb-4 bg-white rounded-lg p-4 max-h-48 overflow-y-auto text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap border border-zinc-100">
                  {EXONERATION_TEXT}
                </div>
              )}
            </div>
            {termsError && <p className="text-sm text-red-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" />{termsError}</p>}
          </div>
        </div>

        {/* ── Section 4: Resumen + Submit ── */}
        <div className="bg-white rounded-2xl border-2 border-zinc-200 overflow-hidden">
          <div className="px-5 py-4 bg-zinc-50 border-b border-zinc-200">
            <h3 className="font-semibold text-zinc-800 text-sm">Resumen del pago</h3>
          </div>
          <div className="divide-y divide-zinc-100">
            {!isFree && (
              <>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-zinc-600">Inscripción ({selectedDistance?.name}) × {participants.length}</span>
                  <span className="text-sm font-medium text-zinc-900">{fmtMXN(racePrice * participants.length)}</span>
                </div>
                <div className="flex justify-between px-5 py-3">
                  <span className="text-sm text-zinc-600">Tarifa de plataforma × {participants.length}</span>
                  <span className="text-sm text-zinc-500">{fmtMXN(feePerPerson * participants.length)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between px-5 py-3 bg-emerald-50">
              <span className="text-sm font-bold text-zinc-900">
                {isFree ? 'Total' : 'Total a cobrar'}
              </span>
              <span className="text-lg font-bold text-emerald-700">
                {isFree ? 'Gratis' : fmtMXN(grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="button"
          size="lg"
          disabled={submitting}
          onClick={handleSubmit}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold py-6 rounded-2xl shadow-lg shadow-emerald-600/20 transition-all"
        >
          {submitting ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" /> Procesando…
            </span>
          ) : isFree ? (
            participants.length > 1 ? `Confirmar ${participants.length} inscripciones` : 'Confirmar inscripción'
          ) : (
            `Pagar e inscribirme — ${fmtMXN(grandTotal)}`
          )}
        </Button>

        <p className="text-center text-xs text-zinc-400 pb-8">
          Pago seguro procesado por Stripe · alfallo.mx
        </p>
      </div>
    </div>
  )
}
