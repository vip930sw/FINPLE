import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import SimulatorDetailStandalonePage from './components/SimulatorDetailStandalonePage.jsx'

export function isSimulatorDetailStandalonePath() {
  if (typeof window === 'undefined') return false
  return window.location.pathname === '/simulator/detail'
}

export function renderSimulatorDetailStandalonePage() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <SimulatorDetailStandalonePage />
    </StrictMode>,
  )
}
