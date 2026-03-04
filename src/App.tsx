import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Layout from './components/Layout'
import LoadingSpinner from './components/LoadingSpinner'
import PWAInstallPrompt from './components/PWAInstallPrompt'

// Lazy load all pages
const Landing = lazy(() => import('./pages/Landing'))
const EventBrowser = lazy(() => import('./pages/EventBrowser'))
const EventDetail = lazy(() => import('./pages/EventDetail'))
const ResultsBrowser = lazy(() => import('./pages/ResultsBrowser'))
const SerialsBrowser = lazy(() => import('./pages/SerialsBrowser'))
const Blog = lazy(() => import('./pages/Blog'))
const GuestRegistration = lazy(() => import('./pages/GuestRegistration'))
const NotFound = lazy(() => import('./pages/NotFound'))

function Loading() {
  return <LoadingSpinner className="h-screen items-center" />
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
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster richColors position="top-right" />
      <PWAInstallPrompt />
    </BrowserRouter>
  )
}
