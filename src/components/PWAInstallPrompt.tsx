import { useState, useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'pulsara-pwa-dismissed'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Don't show if already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Don't show if previously dismissed
    if (localStorage.getItem(DISMISS_KEY)) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setVisible(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setVisible(false)
    setDeferredPrompt(null)
    localStorage.setItem(DISMISS_KEY, '1')
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-4 shadow-2xl shadow-emerald-900/30">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Instalar Pulsara</p>
            <p className="text-emerald-100 text-xs mt-0.5">
              Accede más rápido y recibe notificaciones de tus eventos.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1 text-emerald-200 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleInstall}
            className="flex-1 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm"
            size="sm"
          >
            Instalar
          </Button>
          <Button
            onClick={handleDismiss}
            variant="ghost"
            className="text-emerald-100 hover:bg-white/10 hover:text-white text-sm"
            size="sm"
          >
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  )
}
