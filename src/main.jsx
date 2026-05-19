import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './HomeResponsive.css'
import './FooterDisclaimer.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
