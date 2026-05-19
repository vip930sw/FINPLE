import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './FriendlyFetchErrors.js'
import './index.css'
import './HomeResponsive.css'
import './FooterDisclaimer.css'
import './LookupNotice.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
