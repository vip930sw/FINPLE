import PanelShell from "./PanelShell";
import { formatShortDate } from "../utils";

export default function MyInquiriesPanel({ inquiriesState, onNavigate }) {
  const inquiries = inquiriesState.inquiries || [];

  return (
    <PanelShell
      eyebrow="MY INQUIRIES"
      title="내 문의내역"
      description="접수한 문의와 처리 현황을 확인합니다."
      badge={inquiriesState.loading ? "조회 중" : `${inquiries.length}건`}
      actions={(
        <>
          <button type="button" className="primaryButton" onClick={() => onNavigate?.("support")}>문의하기</button>
          <button type="button" className="secondaryButton" onClick={inquiriesState.refresh} disabled={inquiriesState.loading || inquiriesState.refreshing}>문의내역 새로고침</button>
        </>
      )}
    >
      <p className="serverStorageMessage compact">{inquiriesState.error || (inquiries.length ? "최근 문의내역을 최신순으로 표시합니다." : "아직 문의내역이 없습니다.")}</p>
      <div className="paymentHistoryList">
        {inquiries.length ? inquiries.slice(0, 10).map((inquiry) => (
          <article className="paymentHistoryItem" key={inquiry.id || inquiry.createdAt}>
            <div className="paymentHistoryItemTop">
              <span className="paymentStatusBadge">{inquiry.status || "open"}</span>
              <em>{formatShortDate(inquiry.createdAt || inquiry.created_at)}</em>
            </div>
            <strong>{inquiry.title || "문의"}</strong>
            <p>{inquiry.message || "문의 내용 확인 중"}</p>
          </article>
        )) : (
          <article className="paymentHistoryItem paymentHistoryItem--empty"><strong>아직 문의내역이 없습니다.</strong></article>
        )}
      </div>
    </PanelShell>
  );
}
