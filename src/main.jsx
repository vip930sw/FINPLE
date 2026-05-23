import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './BetaNetworkFallback.js'
import './PaymentPrepFlowPatch.js'
import './PaymentAlreadySubscribedPatch.js'
import './TermsPaymentPolicyPatch.js'
import './MyPageSubscriptionStatusPatch.js'
import './MyPageSidebarPatch.js'
import './MbtiResultUxPatch.js'
import './GlobalNavigationPatch.js'
import { isBillingResultPath, renderBillingResultPage } from './BillingResultRoutePatch.js'
import { isPaymentMethodPath, renderPaymentMethodPage } from './PaymentMethodRoutePatch.js'
import './index.css'
import './HomeResponsive.css'
import './FooterDisclaimer.css'
import './HeaderStartButtonPatch.css'
import './MyPageBetaSimplify.css'
import './AuthFormPolish.css'
import './PaymentPrepFlow.css'
import './BillingResultPages.css'
import './MyPageSubscriptionStatus.css'
import './MyPageSidebar.css'
import './MbtiResultUx.css'
import './GlobalNavigation.css'
import './MobileUxHotfix.css'
import './MobileAssetTableFix.css'
import './SupportNoticeMerge.css'
import './SimulatorNavComparePolish.css'
import './DetailStep3Refactor.css'
import './DetailStep3PrintCompact.css'
import App from './App.jsx'

if (isBillingResultPath()) {
  renderBillingResultPage()
} else if (isPaymentMethodPath()) {
  renderPaymentMethodPage()
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}