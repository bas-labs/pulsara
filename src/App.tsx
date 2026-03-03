import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import PWAInstallPrompt from './components/PWAInstallPrompt'

// Lazy load all pages
const Landing = lazy(() => import('./pages/Landing'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const EventBrowser = lazy(() => import('./pages/EventBrowser'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const OrgDashboard = lazy(() => import('./pages/organizador/Dashboard'))
const OrgCreateEvent = lazy(() => import('./pages/organizador/CreateEvent'))
const OrgEventManage = lazy(() => import('./pages/organizador/ManageEvent'))
const AtletaDashboard = lazy(() => import('./pages/atleta/Dashboard'))
const AtletaMyEvents = lazy(() => import('./pages/atleta/MyEvents'))
const AtletaResults = lazy(() => import('./pages/atleta/Results'))
const ResultsBrowser = lazy(() => import('./pages/ResultsBrowser'))
const SerialsBrowser = lazy(() => import('./pages/SerialsBrowser'))
const Blog = lazy(() => import('./pages/Blog'))
const OrgUploadResults = lazy(() => import('./pages/organizador/UploadResults'))
const Profile = lazy(() => import('./pages/Profile'))
const GuestRegistration = lazy(() => import('./pages/GuestRegistration'))
const NotFound = lazy(() => import('./pages/NotFound'))

function Loading() {
  return <LoadingSpinner className="h-screen items-center" />
}

function ProtectedRoute({ children, requiredGroup }: { children: React.ReactNode; requiredGroup?: string }) {
  const { user, groups, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" />
  if (requiredGroup && !groups.includes(requiredGroup)) return <Navigate to="/" />
  return <>{children}</>
}

function PostLoginRedirect() {
  const { isOrganizador, isAtleta } = useAuth()
  // Returning users go straight to their dashboard; new users go to onboarding
  if (isOrganizador) return <Navigate to="/org" replace />
  if (isAtleta) return <Navigate to="/atleta" replace />
  // New user (no group yet, or group just assigned by post-confirmation) → onboarding
  return <Navigate to="/onboarding" replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/eventos" element={<Layout><EventBrowser /></Layout>} />
        <Route path="/resultados" element={<Layout><ResultsBrowser /></Layout>} />
        <Route path="/seriales" element={<Layout><SerialsBrowser /></Layout>} />
        <Route path="/blog" element={<Layout><Blog /></Layout>} />
        <Route path="/evento/:slug" element={<Layout><EventDetail /></Layout>} />
        <Route path="/evento/:slug/inscripcion" element={<GuestRegistration />} />
        <Route path="/login" element={
          <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50/80 via-white to-white px-6 relative overflow-hidden">
            <div className="absolute -top-20 right-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-20 -left-20 w-56 h-56 rounded-full bg-gradient-to-br from-orange-200/20 to-amber-200/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center w-full max-w-md">
              <div className="flex items-center gap-2.5 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span className="font-bold text-2xl text-zinc-900 tracking-tight">Pulsara</span>
              </div>
              <Authenticator>
                {() => <PostLoginRedirect />}
              </Authenticator>
              <p className="mt-6 text-xs text-zinc-400 text-center">
                La plataforma deportiva de México
              </p>
            </div>
          </div>
        } />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/org" element={<ProtectedRoute requiredGroup="organizadores"><Layout><OrgDashboard /></Layout></ProtectedRoute>} />
        <Route path="/org/crear-evento" element={<ProtectedRoute requiredGroup="organizadores"><Layout><OrgCreateEvent /></Layout></ProtectedRoute>} />
        <Route path="/org/evento/:eventId" element={<ProtectedRoute requiredGroup="organizadores"><Layout><OrgEventManage /></Layout></ProtectedRoute>} />
        <Route path="/org/evento/:eventId/resultados" element={<ProtectedRoute requiredGroup="organizadores"><Layout><OrgUploadResults /></Layout></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/atleta" element={<ProtectedRoute requiredGroup="atletas"><Layout><AtletaDashboard /></Layout></ProtectedRoute>} />
        <Route path="/atleta/mis-eventos" element={<ProtectedRoute requiredGroup="atletas"><Layout><AtletaMyEvents /></Layout></ProtectedRoute>} />
        <Route path="/atleta/resultados" element={<ProtectedRoute requiredGroup="atletas"><Layout><AtletaResults /></Layout></ProtectedRoute>} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <PWAInstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  )
}
