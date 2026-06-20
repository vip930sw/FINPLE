/* global process */

import { fetchWithTimeout } from "../utils/fetchWithTimeout.js";

const DEFAULT_FROM = "FINPLE <onboarding@resend.dev>";

function getEmailConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY || "",
    from: process.env.FINPLE_EMAIL_FROM || process.env.SUPPORT_EMAIL_FROM || DEFAULT_FROM,
    appBaseUrl: process.env.FINPLE_APP_BASE_URL || "https://finple.co.kr",
  };
}

export function getUserNotificationStatus() {
  const config = getEmailConfig();
  return {
    enabled: Boolean(config.apiKey),
    provider: "resend",
    apiKeyConfigured: Boolean(config.apiKey),
    fromConfigured: Boolean(config.from),
  };
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function formatKrw(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

function normalizeRecipient(to) {
  const email = String(to || "").trim();
  return email && email.includes("@") ? email : "";
}

function getDetailsText(details = {}) {
  return Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function getDetailsHtml(details = {}) {
  const rows = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => (
      `<tr><th align="left" style="width:150px;padding:8px;border:1px solid #e5e7eb;background:#f8fafc;">${escapeHtml(label)}</th><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`
    ));

  if (!rows.length) return "";
  return `<table style="border-collapse:collapse;width:100%;max-width:680px;margin:18px 0;"><tbody>${rows.join("")}</tbody></table>`;
}

async function sendUserNotificationEmail({ to, subject, title, intro, details, actionUrl, actionLabel = "MY PAGE 확인" }) {
  const config = getEmailConfig();
  const recipient = normalizeRecipient(to);

  if (!config.apiKey || !recipient) {
    return {
      enabled: Boolean(config.apiKey),
      sent: false,
      reason: !recipient ? "recipient_email_missing" : "RESEND_API_KEY is not configured",
    };
  }

  const text = [
    title,
    "",
    intro,
    "",
    getDetailsText(details),
    actionUrl ? `\n${actionLabel}: ${actionUrl}` : "",
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family:Arial,'Apple SD Gothic Neo',sans-serif;line-height:1.6;color:#0f172a;">
      <h1 style="margin:0 0 14px;font-size:22px;">${escapeHtml(title)}</h1>
      <p style="margin:0 0 14px;">${escapeHtml(intro)}</p>
      ${getDetailsHtml(details)}
      ${actionUrl ? `<p style="margin:22px 0;"><a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0f172a;color:#fff;text-decoration:none;font-weight:800;">${escapeHtml(actionLabel)}</a></p>` : ""}
      <p style="margin-top:24px;font-size:12px;color:#64748b;">본 메일은 FINPLE 서비스 이용 상태 안내를 위해 발송되었습니다.</p>
    </div>
  `;

  const response = await fetchWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [recipient],
      subject,
      text,
      html,
    }),
  }, 15000);

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      enabled: true,
      sent: false,
      error: payload?.message || `email_send_failed_${response.status}`,
    };
  }

  return {
    enabled: true,
    sent: true,
    provider: "resend",
    emailId: payload?.id || null,
  };
}

export async function sendInquiryReceivedNotification({ to, inquiry }) {
  return sendUserNotificationEmail({
    to,
    subject: "[FINPLE] 문의가 접수되었습니다",
    title: "문의가 접수되었습니다",
    intro: "보내주신 문의를 확인했습니다. 처리 상태가 변경되면 다시 안내드리겠습니다.",
    details: {
      문의번호: inquiry.id,
      문의유형: inquiry.category,
      제목: inquiry.title,
      접수일: formatDate(inquiry.createdAt || inquiry.created_at),
    },
    actionUrl: `${getEmailConfig().appBaseUrl}/mypage`,
  });
}

const INQUIRY_STATUS_EMAIL_COPY = {
  open: {
    subject: "문의가 접수되었습니다",
    title: "문의 접수가 완료되었습니다",
    intro: "보내주신 문의가 정상적으로 접수되었습니다. 담당자가 내용을 확인한 뒤 다음 진행 상황을 안내드리겠습니다.",
  },
  in_progress: {
    subject: "문의 내용을 확인하고 있습니다",
    title: "문의 확인이 시작되었습니다",
    intro: "담당자가 문의 내용을 확인하고 있습니다. 검토 또는 추가 조치가 끝나면 처리 결과를 다시 안내드리겠습니다.",
  },
  resolved: {
    subject: "문의 처리가 완료되었습니다",
    title: "문의 처리가 완료되었습니다",
    intro: "요청하신 문의에 대한 확인과 필요한 처리가 완료되었습니다. 추가 확인이나 보완이 필요하면 문의 내역을 통해 알려주세요.",
  },
  closed: {
    subject: "문의가 종료되었습니다",
    title: "문의가 최종 종료되었습니다",
    intro: "처리 완료 후 추가 요청이 없어 문의가 최종 종료되었습니다. 새로운 도움이 필요하면 새 문의를 접수해 주세요.",
  },
};

export async function sendInquiryStatusNotification({ to, inquiry, status, statusLabel }) {
  const copy = INQUIRY_STATUS_EMAIL_COPY[status] || {
    subject: `문의 상태가 ${statusLabel}로 변경되었습니다`,
    title: "문의 처리 상태가 변경되었습니다",
    intro: `문의 처리 상태가 '${statusLabel}'로 변경되었습니다.`,
  };

  return sendUserNotificationEmail({
    to,
    subject: `[FINPLE] ${copy.subject}`,
    title: copy.title,
    intro: copy.intro,
    details: {
      문의번호: inquiry.id,
      제목: inquiry.title,
      처리상태: statusLabel,
      변경일: formatDate(inquiry.updatedAt || inquiry.updated_at),
    },
    actionUrl: `${getEmailConfig().appBaseUrl}/mypage`,
  });
}

export async function sendSubscriptionNotification({ to, type, plan = "Personal", amount, currentPeriodEnd, receiptUrl }) {
  const variants = {
    activated: {
      subject: "[FINPLE] 구독이 등록되었습니다",
      title: "구독이 등록되었습니다",
      intro: "FINPLE Personal 구독과 결제가 정상 처리되었습니다.",
    },
    changed: {
      subject: "[FINPLE] 구독 정보가 변경되었습니다",
      title: "구독 정보가 변경되었습니다",
      intro: "FINPLE 구독 정보가 변경되었습니다.",
    },
    cancelScheduled: {
      subject: "[FINPLE] 구독 해제가 예약되었습니다",
      title: "구독 해제가 예약되었습니다",
      intro: "현재 결제 기간 종료일까지 Personal 기능을 계속 사용할 수 있습니다.",
    },
  };
  const variant = variants[type] || variants.changed;

  return sendUserNotificationEmail({
    to,
    subject: variant.subject,
    title: variant.title,
    intro: variant.intro,
    details: {
      플랜: plan,
      결제금액: amount ? formatKrw(amount) : undefined,
      이용가능기간: currentPeriodEnd ? formatDate(currentPeriodEnd) : undefined,
      영수증: receiptUrl,
    },
    actionUrl: `${getEmailConfig().appBaseUrl}/mypage`,
  });
}
