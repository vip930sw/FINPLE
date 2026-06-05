import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './BetaNetworkFallback.js'
import './AuthPortfolioDataGuard.js'
import './PaymentPrepFlowPatch.js'
import './PaymentAlreadySubscribedPatch.js'
import './TermsPaymentPolicyPatch.js'
import './MyPageSubscriptionStatusPatch.js'
import './MyPageBillingStatusDisplayPatch.js'
import './MyPageServerStorageDisplayPatch.js'
import './MyPagePaymentMethodDisplayPatch.js'
import './MyPageSidebarPatch.js'
import './MyPageInvestmentProfileDisplayPatch.js'
import './MyPageAccountStatusDisplayPatch.js'
import './MyPagePaymentHistoryPatch.js'
import './MyPageMenuFinalOrderPatch.js'
import './MyPageBillingPlanMergePatch.js'
import './MyPageHistoryPaginationPatch.js'
import './MbtiResultUxPatch.js'
import './MbtiImageExportPatch.js'
import './GlobalNavigationPatch.js'
import './FooterPolicyLinkScrollPatch.js'
import { isBillingResultPath, renderBillingResultPage } from './BillingResultRoutePatch.js'
import { isPaymentMethodPath, renderPaymentMethodPage } from './PaymentMethodRoutePatch.js'
import { isSimulatorDetailStandalonePath, renderSimulatorDetailStandalonePage } from './SimulatorDetailStandaloneRoutePatch.jsx'
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
import './MyPageAccountStatusDisplay.css'
import './MyPageInquiryActionsPatch.css'
import './MyPagePaymentHistoryPatch.css'
import './MyPageBillingPlanMergePatch.css'
import './MyPageHistoryPaginationPatch.css'
import './MbtiResultUx.css'
import './GlobalNavigation.css'
import './MobileUxHotfix.css'
import './MobileAssetTableFix.css'
import './SupportNoticeMerge.css'
import './SimulatorNavComparePolish.css'
import './DetailStep3Refactor.css'
import './DetailStep3PrintCompact.css'
import './DetailStep3CopySpacing.css'
import './UiLabelCleanup.css'
import App from './App.jsx'

if (isBillingResultPath()) {
  renderBillingResultPage()
} else if (isPaymentMethodPath()) {
  renderPaymentMethodPage()
} else if (isSimulatorDetailStandalonePath()) {
  renderSimulatorDetailStandalonePage()
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}