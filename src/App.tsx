import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Authenticator } from '@aws-amplify/ui-react'
import '@aws-amplify/ui-react/styles.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import Landing from './pages/Landing'
import Onboarding from './pages/Onboarding'
import EventBrowser from './pages/EventBrowser'
import EventDetail from './pages/EventDetail'
import OrgDashboard from './pages/organizador/Dashboard'
import OrgCreateEvent from './pages/organizador/CreateEvent'
import OrgEventManage from './pages/organizador/ManageEvent'
import AtletaDashboard from './pages/atleta/Dashboard'
import AtletaMyEvents from './pages/atleta/MyEvents'
import AtletaResults from './pages/atleta/Results'
import Layout from './components/Layout'

function ProtectedRoute({ children, requiredGroup }: { children: React.ReactNode; requiredGroup?: string }) {
  const { user, groups, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!user) return <Navigate to="/login" />
  if (requiredGroup && !groups.includes(requiredGroup)) return <Navigate to="/" />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
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
      <Route path="/onboarding" element={
        <ProtectedRoute><Onboarding /></ProtectedRoute>
      } />

      {/* Organizador */}
      <Route path="/org" element={
        <ProtectedRoute requiredGroup="organizadores">
          <Layout><OrgDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/org/crear-evento" element={
        <ProtectedRoute requiredGroup="organizadores">
          <Layout><OrgCreateEvent /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/org/evento/:eventId" element={
        <ProtectedRoute requiredGroup="organizadores">
          <Layout><OrgEventManage /></Layout>
        </ProtectedRoute>
      } />

      {/* Atleta */}
      <Route path="/atleta" element={
        <ProtectedRoute requiredGroup="atletas">
          <Layout><AtletaDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/atleta/mis-eventos" element={
        <ProtectedRoute requiredGroup="atletas">
          <Layout><AtletaMyEvents /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/atleta/resultados" element={
        <ProtectedRoute requiredGroup="atletas">
          <Layout><AtletaResults /></Layout>
        </ProtectedRoute>
      } />
    </Routes>
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
