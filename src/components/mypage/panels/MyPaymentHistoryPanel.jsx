import { useState } from "react";
import PanelShell from "./PanelShell";
import { formatAmount, formatShortDate } from "../utils";

function getStatusLabel(status) {
  const normalized = String(status || "pending").toLowerCase();
  if (["paid", "confirmed"].includes(normalized)) return "결제완료";
  if (normalized === "failed") return "결제실패";
  if (["cancelled", "canceled"].includes(normalized)) return "취소";
  if (normalized === "refunded") return "환불완료";
  return "처리중";
}

export default function MyPaymentHistoryPanel({ history }) {
  const first = history.payments[0];
  const [expanded, setExpanded] = useState(false);
  const hasPayments = history.payments.length > 0;

  return (
    <PanelShell
      eyebrow="MY PAYMENT HISTORY"
      title="내 결제내역"
      description="FINPLE 구독 결제 이력과 영수증 링크를 확인합니다."
      badge={history.loading ? "조회 중" : "조회됨"}
    >
      <div className="paymentMethodEntryGrid paymentHistorySummaryGrid myPageSummaryGrid myPageSummaryGrid--three">
        <div><span>전체 결제</span><strong>{history.loading && !history.payments.length ? "확인 중" : `${history.payments.length}건`}</strong></div>
        <div><span>최근 결제</span><strong>{first ? formatShortDate(first.paidAt || first.createdAt) : "없음"}</strong></div>
        <div><span>최근 금액</span><strong>{first ? formatAmount(first.amount, first.currency) : "없음"}</strong></div>
      </div>
      <p className="serverStorageMessage compact">{history.error || (history.payments.length ? "최근 결제내역을 최신순으로 표시합니다." : "아직 결제내역이 없습니다.")}</p>
      <div className="serverStorageActions compactActions myPageInlineActions">
        <button type="button" className="primaryButton" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "결제내역 숨기기" : "결제내역 보기"}
        </button>
        <button type="button" className="secondaryButton" onClick={history.refresh} disabled={history.loading || history.refreshing}>결제내역 새로고침</button>
      </div>
      {expanded ? (
        <div className="paymentHistoryList" data-mypage-payment-history-list>
          {hasPayments ? history.payments.slice(0, 10).map((payment) => (
            <article className="paymentHistoryItem" key={payment.id || `${payment.createdAt}-${payment.amount}`}>
              <div className="paymentHistoryItemTop">
                <span className={`paymentStatusBadge status-${String(payment.status || "pending").toLowerCase()}`}>{getStatusLabel(payment.status)}</span>
                <em>{formatShortDate(payment.paidAt || payment.createdAt)}</em>
              </div>
              <strong>{payment.title || "FINPLE Personal"}</strong>
              <p>{formatAmount(payment.amount, payment.currency)}</p>
              <div className="paymentHistoryItemMeta">
                <span>{payment.provider || "toss-payments"}</span>
                {payment.receiptUrl ? <a href={payment.receiptUrl} target="_blank" rel="noreferrer">영수증 보기</a> : <span>영수증 없음</span>}
              </div>
            </article>
          )) : (
            <article className="paymentHistoryItem paymentHistoryItem--empty"><strong>아직 결제내역이 없습니다.</strong></article>
          )}
        </div>
      ) : null}
    </PanelShell>
  );
}
