import PanelShell from "./PanelShell";
import { formatPlanLabel } from "../utils";

function getStatusLabel(status) {
  const normalized = String(status || "beta_free").toLowerCase();
  const labels = {
    active: "활성",
    trialing: "체험",
    cancel_at_period_end: "기간 종료 예정",
    expired: "만료",
    payment_failed: "결제 실패",
    past_due: "결제 대기",
    canceled: "취소",
    cancelled: "취소",
    refunded: "환불",
    beta_free: "무료",
    free: "무료",
    guest: "비로그인",
  };
  return labels[normalized] || normalized;
}

export default function MyBillingPlanPanel({ subscription, onNavigate }) {
  const planLabel = formatPlanLabel(subscription.effectivePlan);

  return (
    <PanelShell
      eyebrow="MY BILLING / PLAN"
      title="내 구독/플랜"
      description="현재 이용 중인 플랜, 결제 일정, 사용량과 저장 권한을 한눈에 확인합니다."
      badge={planLabel}
      actions={(
        <>
          <button type="button" className="primaryButton" onClick={() => onNavigate?.("pricing")}>요금제 변경</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate?.("support")}>결제 문의</button>
          <button type="button" className="secondaryButton" onClick={() => subscription.refresh({ force: true })} disabled={subscription.loading || subscription.refreshing}>
            {subscription.refreshing ? "새로고침 중" : "구독 상태 새로고침"}
          </button>
        </>
      )}
    >
      <div className="subscriptionStatusGrid">
        <div><span>현재 플랜</span><strong>{planLabel}</strong><em>서버 effective plan</em></div>
        <div><span>구독 상태</span><strong>{getStatusLabel(subscription.effectiveStatus)}</strong><em>결제 상태</em></div>
        <div><span>다음 결제일</span><strong>{subscription.nextBillingLabel}</strong><em>정기결제 기준</em></div>
        <div><span>이용 종료 예정일</span><strong>{subscription.accessUntilLabel}</strong><em>권한 종료 기준</em></div>
        <div><span>포트폴리오</span><strong>{subscription.effectivePlan === "personal" ? "30개" : "1개"}</strong><em>플랜 한도</em></div>
        <div><span>서버 저장</span><strong>{subscription.effectivePlan === "personal" ? "지원" : "제한"}</strong><em>저장 권한</em></div>
      </div>
      <p className="serverStorageMessage compact">
        {subscription.error || (subscription.loading ? "구독 상태를 확인하고 있습니다." : "서버 기준 유료 권한을 확인해 플랜 표시를 통일했습니다.")}
      </p>
    </PanelShell>
  );
}
