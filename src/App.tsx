import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

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

function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  )
}

function ProtectedRoute({ children, requiredGroup }: { children: React.ReactNode; requiredGroup?: string }) {
  const { user, groups, loading } = useAuth()
  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" />
  if (requiredGroup && !groups.includes(requiredGroup)) return <Navigate to="/" />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/eventos" element={<Layout><EventBrowser /></Layout>} />
        <Route path="/evento/:slug" element={<Layout><EventDetail /></Layout>} />
        <Route path="/login" element={
          <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <Authenticator>
              {() => <Navigate to="/onboarding" />}
            </Authenticator>
          </div>
        } />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/org" element={<ProtectedRoute requiredGroup="organizadores"><Layout><OrgDashboard /></Layout></ProtectedRoute>} />
        <Route path="/org/crear-evento" element={<ProtectedRoute requiredGroup="organizadores"><Layout><OrgCreateEvent /></Layout></ProtectedRoute>} />
        <Route path="/org/evento/:eventId" element={<ProtectedRoute requiredGroup="organizadores"><Layout><OrgEventManage /></Layout></ProtectedRoute>} />
        <Route path="/atleta" element={<ProtectedRoute requiredGroup="atletas"><Layout><AtletaDashboard /></Layout></ProtectedRoute>} />
        <Route path="/atleta/mis-eventos" element={<ProtectedRoute requiredGroup="atletas"><Layout><AtletaMyEvents /></Layout></ProtectedRoute>} />
        <Route path="/atleta/resultados" element={<ProtectedRoute requiredGroup="atletas"><Layout><AtletaResults /></Layout></ProtectedRoute>} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
