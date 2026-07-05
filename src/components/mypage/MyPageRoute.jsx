import { useCallback, useEffect, useMemo, useState } from "react";
import { getLocalPortfolioSnapshot, getStoredFinpleAuthUser } from "../portfolio/services/serverPortfolioService";
import { getStoredFinplePlan } from "../portfolio/config/planConfig";
import { useInvestmentMbti } from "./hooks/useInvestmentMbti";
import { useMyInquiries } from "./hooks/useMyInquiries";
import { usePaymentHistory } from "./hooks/usePaymentHistory";
import { usePaymentMethod } from "./hooks/usePaymentMethod";
import { useSubscriptionStatus } from "./hooks/useSubscriptionStatus";
import MyPageLayout from "./MyPageLayout";
import MyAccountPanel from "./panels/MyAccountPanel";
import MyBillingPlanPanel from "./panels/MyBillingPlanPanel";
import MyInquiriesPanel from "./panels/MyInquiriesPanel";
import MyInvestmentProfilePanel from "./panels/MyInvestmentProfilePanel";
import MyPaymentHistoryPanel from "./panels/MyPaymentHistoryPanel";
import MyPaymentMethodPanel from "./panels/MyPaymentMethodPanel";
import MyStoragePanel from "./panels/MyStoragePanel";
import { isEducationAccount } from "./utils";
import "./MyPageReact.css";

function getInitialSection() {
  if (typeof window === "undefined") return "account";
  const params = new URLSearchParams(window.location.search);
  const section = params.get("section") || window.location.hash.replace("#", "");
  const allowed = new Set(["account", "investment", "billing", "payment-method", "payment-history", "inquiries", "storage"]);
  return allowed.has(section) ? section : "account";
}

export default function MyPageRoute({ onNavigate }) {
  const [activeSection, setActiveSection] = useState(getInitialSection);
  const [user, setUser] = useState(() => getStoredFinpleAuthUser());
  const [snapshot, setSnapshot] = useState(() => getLocalPortfolioSnapshot());
  const subscription = useSubscriptionStatus(user);
  const paymentMethod = usePaymentMethod(user, activeSection === "payment-method");
  const paymentHistory = usePaymentHistory(user, activeSection === "payment-history");
  const mbti = useInvestmentMbti(user, activeSection === "investment");
  const inquiriesState = useMyInquiries(user, activeSection === "inquiries");
  const hiddenPaymentSections = isEducationAccount(user);

  const effectivePlan = subscription.effectivePlan || getStoredFinplePlan();

  useEffect(() => {
    document.body?.setAttribute("data-finple-mypage-react", "true");
    window.__FINPLE_REACT_MYPAGE_ROUTE = true;
    return () => {
      document.body?.removeAttribute("data-finple-mypage-react");
      window.__FINPLE_REACT_MYPAGE_ROUTE = false;
    };
  }, []);

  useEffect(() => {
    function handleStorageUpdate() {
      setUser(getStoredFinpleAuthUser());
      setSnapshot(getLocalPortfolioSnapshot());
    }

    window.addEventListener("finple-auth-updated", handleStorageUpdate);
    window.addEventListener("finple-local-storage-updated", handleStorageUpdate);
    window.addEventListener("storage", handleStorageUpdate);
    return () => {
      window.removeEventListener("finple-auth-updated", handleStorageUpdate);
      window.removeEventListener("finple-local-storage-updated", handleStorageUpdate);
      window.removeEventListener("storage", handleStorageUpdate);
    };
  }, []);

  const handleSectionChange = useCallback((section) => {
    setActiveSection(section);
    if (typeof window !== "undefined") {
      const nextUrl = section === "account" ? "/mypage" : `/mypage?section=${encodeURIComponent(section)}`;
      window.history.replaceState({ page: "mypage", section }, "", nextUrl);
    }
  }, []);

  const activePanel = useMemo(() => {
    switch (activeSection) {
      case "investment":
        return <MyInvestmentProfilePanel mbti={mbti} onNavigate={onNavigate} />;
      case "billing":
        return <MyBillingPlanPanel subscription={subscription} onNavigate={onNavigate} />;
      case "payment-method":
        return <MyPaymentMethodPanel paymentMethod={paymentMethod} onNavigate={onNavigate} />;
      case "payment-history":
        return <MyPaymentHistoryPanel history={paymentHistory} />;
      case "inquiries":
        return <MyInquiriesPanel inquiriesState={inquiriesState} onNavigate={onNavigate} />;
      case "storage":
        return <MyStoragePanel snapshot={snapshot} effectivePlan={effectivePlan} />;
      case "account":
      default:
        return <MyAccountPanel user={user} effectivePlan={effectivePlan} onNavigate={onNavigate} />;
    }
  }, [activeSection, effectivePlan, inquiriesState, mbti, onNavigate, paymentHistory, paymentMethod, snapshot, subscription, user]);

  return (
    <MyPageLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      hiddenPaymentSections={hiddenPaymentSections}
    >
      {activePanel}
    </MyPageLayout>
  );
}
