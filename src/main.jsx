import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './BetaNetworkFallback.js'
import './PaymentPrepFlowPatch.js'
import './TermsPaymentPolicyPatch.js'
import './index.css'
import './HomeResponsive.css'
import './FooterDisclaimer.css'
import './HeaderStartButtonPatch.css'
import './MyPageBetaSimplify.css'
import './AuthFormPolish.css'
import './PaymentPrepFlow.css'
import './BillingResultPages.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
