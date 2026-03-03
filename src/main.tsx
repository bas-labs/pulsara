import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Amplify } from 'aws-amplify'
import './index.css'
import App from './App.tsx'

async function init() {
  try {
    const outputs = await import('../amplify_outputs.json')
    Amplify.configure(outputs.default)
  } catch {
    console.log('amplify_outputs.json not found — running without backend')
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

init()
