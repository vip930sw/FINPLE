import { useState } from "react";
import PanelShell from "./PanelShell";
import { formatShortDate } from "../utils";

const INQUIRY_META_MARKERS = [
  "--- 문의 메타 정보 ---",
  "--- 문의 메타 정보---",
  "--- 문의 메타",
];

const INQUIRY_META_LINE_PATTERNS = [
  /^답변 이메일\s*:/i,
  /^페이지 URL\s*:/i,
  /^User Agent\s*:/i,
  /^Browser\s*:/i,
  /^browser metadata\s*:/i,
  /^debug metadata\s*:/i,
  /^internal admin notes\s*:/i,
];

function sanitizeInquiryMessage(message = "") {
  const text = String(message || "");
  const markerIndex = INQUIRY_META_MARKERS
    .map((marker) => text.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const userText = markerIndex >= 0 ? text.slice(0, markerIndex) : text;
  return userText
    .split(/\r?\n/)
    .filter((line) => !INQUIRY_META_LINE_PATTERNS.some((pattern) => pattern.test(line.trim())))
    .join("\n")
    .trim();
}

function getInquiryMessagePreview(inquiry) {
  return sanitizeInquiryMessage(inquiry?.message) || "문의 내용 확인 중";
}

export default function MyInquiriesPanel({ inquiriesState, onNavigate }) {
  const inquiries = inquiriesState.inquiries || [];
  const [expanded, setExpanded] = useState(false);

  return (
    <PanelShell
      eyebrow="MY INQUIRIES"
      title="내 문의내역"
      description="접수한 문의와 처리 현황을 확인합니다."
      badge={inquiriesState.loading ? "조회 중" : `${inquiries.length}건`}
      actions={(
        <>
          <button type="button" className="primaryButton" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "문의내역 숨기기" : "문의내역 보기"}
          </button>
          <button type="button" className="secondaryButton" onClick={inquiriesState.refresh} disabled={inquiriesState.loading || inquiriesState.refreshing}>문의내역 새로고침</button>
          <button type="button" className="secondaryButton" onClick={() => onNavigate?.("support")}>문의하기</button>
        </>
      )}
    >
      <p className="serverStorageMessage compact">{inquiriesState.error || (inquiries.length ? "최근 문의내역을 최신순으로 표시합니다." : "아직 문의내역이 없습니다.")}</p>
      {expanded ? (
      <div className="paymentHistoryList" data-mypage-inquiries-list>
        {inquiries.length ? inquiries.slice(0, 10).map((inquiry) => (
          <article className="paymentHistoryItem" key={inquiry.id || inquiry.createdAt}>
            <div className="paymentHistoryItemTop">
              <span className="paymentStatusBadge">{inquiry.status || "open"}</span>
              <em>{formatShortDate(inquiry.createdAt || inquiry.created_at)}</em>
            </div>
            <strong>{inquiry.title || "문의"}</strong>
            <p>{getInquiryMessagePreview(inquiry)}</p>
          </article>
        )) : (
          <article className="paymentHistoryItem paymentHistoryItem--empty"><strong>아직 문의내역이 없습니다.</strong></article>
        )}
      </div>
      ) : null}
    </PanelShell>
  );
}
