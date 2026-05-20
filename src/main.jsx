import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './BetaNetworkFallback.js'
import './PaymentPrepFlowPatch.js'
import './TermsPaymentPolicyPatch.js'
import './MyPageSubscriptionStatusPatch.js'
import { isBillingResultPath, renderBillingResultPage } from './BillingResultRoutePatch.js'
import './index.css'
import './HomeResponsive.css'
import './FooterDisclaimer.css'
import './HeaderStartButtonPatch.css'
import './MyPageBetaSimplify.css'
import './AuthFormPolish.css'
import './PaymentPrepFlow.css'
import './BillingResultPages.css'
import './MyPageSubscriptionStatus.css'
import App from './App.jsx'

if (isBillingResultPath()) {
  renderBillingResultPage()
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}