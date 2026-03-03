import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { useAuth } from '../context/AuthContext'
import { uploadData, getUrl } from 'aws-amplify/storage'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { User, Camera, Save, MapPin, Trophy, Zap } from 'lucide-react'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'
import LoadingSpinner from '@/components/LoadingSpinner'
import { fadeUp, stagger } from '@/lib/animations'

const client = generateClient<Schema>()

const selectClass = 'w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs transition-shadow duration-200 outline-none focus-visible:border-emerald-400 focus-visible:ring-[3px] focus-visible:ring-emerald-500/20 md:text-sm'

export default function Profile() {
  const { user, groups } = useAuth()
  const [profile, setProfile] = useState<Schema['UserProfile']['type'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [form, setForm] = useState({
    displayName: '',
    city: '',
    state: '',
    dateOfBirth: '',
    gender: '' as string,
    phone: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    bloodType: '',
    shirtSize: '',
  })

  useEffect(() => {
    if (user) loadProfile()
  }, [user])

  async function loadProfile() {
    try {
      const { data } = await client.models.UserProfile.get({ id: user!.userId })
      if (data) {
        setProfile(data)
        setForm({
          displayName: data.displayName ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          dateOfBirth: data.dateOfBirth ?? '',
          gender: data.gender ?? '',
          phone: data.phone ?? '',
          emergencyContactName: data.emergencyContactName ?? '',
          emergencyContactPhone: data.emergencyContactPhone ?? '',
          bloodType: data.bloodType ?? '',
          shirtSize: data.shirtSize ?? '',
        })
        if (data.avatarUrl) {
          try {
            const { url } = await getUrl({ path: data.avatarUrl })
            setAvatarUrl(url.toString())
          } catch { /* no avatar */ }
        }
      }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    const path = `avatars/${user.userId}/${Date.now()}.${file.name.split('.').pop()}`
    try {
      await uploadData({ path, data: file, options: { contentType: file.type } })
      await client.models.UserProfile.update({ id: user.userId, avatarUrl: path })
      const { url } = await getUrl({ path })
      setAvatarUrl(url.toString())
      toast.success('Avatar actualizado')
    } catch (err) {
      console.error(err)
      toast.error('Error al subir avatar')
    }
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      await client.models.UserProfile.update({
        id: user.userId,
        displayName: form.displayName,
        city: form.city,
        state: form.state,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: (['M','F','NB','OTHER'].includes(form.gender) ? form.gender : undefined) as any || undefined,
        phone: form.phone,
        emergencyContactName: form.emergencyContactName,
        emergencyContactPhone: form.emergencyContactPhone,
        bloodType: form.bloodType,
        shirtSize: (['XS','S','M','L','XL','XXL'].includes(form.shirtSize) ? form.shirtSize : undefined) as any,
      })
      toast.success('Perfil actualizado')
    } catch (err) {
      console.error(err)
      toast.error('Error al guardar')
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  const isOrg = groups.includes('organizadores')

  return (
    <PageWrapper>
      <motion.div
        className="max-w-3xl mx-auto px-6 py-10"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.h1 variants={fadeUp} custom={0} className="text-3xl font-bold text-zinc-900 mb-8">Mi Perfil</motion.h1>

        {/* Avatar + header */}
        <motion.div variants={fadeUp} custom={1}>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-zinc-400" />
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-emerald-700">
                    <Camera className="w-3.5 h-3.5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{form.displayName || user?.userId}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={isOrg ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                      {isOrg ? 'Organizador' : 'Atleta'}
                    </Badge>
                    {profile?.plusActive && (
                      <Badge className="bg-purple-100 text-purple-700">
                        <Zap className="w-3 h-3 mr-1" /> PLUS
                      </Badge>
                    )}
                  </div>
                  {profile && (
                    <div className="flex gap-4 mt-3 text-sm text-zinc-500">
                      <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5" /> {profile.totalEvents ?? 0} eventos</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.city ?? 'Sin ciudad'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Form */}
        <motion.div variants={fadeUp} custom={2}>
          <Card className="mb-6">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold text-zinc-900 text-lg">Información personal</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Nombre</label>
                  <Input value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Teléfono</label>
                  <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Ciudad</label>
                  <Input value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Estado</label>
                  <Input value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Fecha de nacimiento</label>
                  <Input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Género</label>
                  <select
                    value={form.gender}
                    onChange={e => setForm({...form, gender: e.target.value})}
                    className={selectClass}
                  >
                    <option value="">Seleccionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                    <option value="NB">No binario</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Emergency / race info */}
        <motion.div variants={fadeUp} custom={3}>
          <Card className="mb-6">
            <CardContent className="p-6 space-y-5">
              <h3 className="font-semibold text-zinc-900 text-lg">Información de carrera</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Contacto de emergencia</label>
                  <Input value={form.emergencyContactName} onChange={e => setForm({...form, emergencyContactName: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Tel. emergencia</label>
                  <Input value={form.emergencyContactPhone} onChange={e => setForm({...form, emergencyContactPhone: e.target.value})} />
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Tipo de sangre</label>
                  <select
                    value={form.bloodType}
                    onChange={e => setForm({...form, bloodType: e.target.value})}
                    className={selectClass}
                  >
                    <option value="">Seleccionar</option>
                    {['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-zinc-700 mb-1.5 block">Talla playera</label>
                  <select
                    value={form.shirtSize}
                    onChange={e => setForm({...form, shirtSize: e.target.value})}
                    className={selectClass}
                  >
                    <option value="">Seleccionar</option>
                    {['XS','S','M','L','XL','XXL'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeUp} custom={4}>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </motion.div>
      </motion.div>
    </PageWrapper>
  )
}
