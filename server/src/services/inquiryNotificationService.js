const DEFAULT_FROM = "FINPLE <onboarding@resend.dev>";
const DEFAULT_ADMIN_EMAIL = "finple_lab@naver.com";

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY || "",
    to: process.env.SUPPORT_NOTIFY_EMAIL || DEFAULT_ADMIN_EMAIL,
    from: process.env.SUPPORT_EMAIL_FROM || process.env.FINPLE_EMAIL_FROM || DEFAULT_FROM,
  };
}

export function getInquiryNotificationStatus() {
  const config = getResendConfig();
  return {
    enabled: Boolean(config.apiKey && config.to),
    provider: "resend",
    toConfigured: Boolean(config.to),
    apiKeyConfigured: Boolean(config.apiKey),
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

function buildTextBody(inquiry) {
  const lines = [
    "FINPLE 문의사항이 접수되었습니다.",
    "",
    `접수번호: ${inquiry.id}`,
    `문의유형: ${inquiry.category}`,
    `제목: ${inquiry.title}`,
    `답변 이메일: ${inquiry.email || "미입력"}`,
    `페이지: ${inquiry.pageUrl || "-"}`,
    `사용자 ID: ${inquiry.userId || "-"}`,
    "",
    "문의 내용",
    "----------------",
    inquiry.message,
  ];

  return lines.join("\n");
}

function buildHtmlBody(inquiry) {
  return `
    <div style="font-family:Arial, sans-serif; line-height:1.6; color:#111827;">
      <h2 style="margin:0 0 12px;">FINPLE 문의사항 접수</h2>
      <table style="border-collapse:collapse; width:100%; max-width:720px; margin-bottom:16px;">
        <tbody>
          <tr><th align="left" style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb;">접수번호</th><td style="padding:8px; border:1px solid #e5e7eb;">${escapeHtml(inquiry.id)}</td></tr>
          <tr><th align="left" style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb;">문의유형</th><td style="padding:8px; border:1px solid #e5e7eb;">${escapeHtml(inquiry.category)}</td></tr>
          <tr><th align="left" style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb;">제목</th><td style="padding:8px; border:1px solid #e5e7eb;">${escapeHtml(inquiry.title)}</td></tr>
          <tr><th align="left" style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb;">답변 이메일</th><td style="padding:8px; border:1px solid #e5e7eb;">${escapeHtml(inquiry.email || "미입력")}</td></tr>
          <tr><th align="left" style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb;">페이지</th><td style="padding:8px; border:1px solid #e5e7eb;">${escapeHtml(inquiry.pageUrl || "-")}</td></tr>
          <tr><th align="left" style="padding:8px; border:1px solid #e5e7eb; background:#f9fafb;">사용자 ID</th><td style="padding:8px; border:1px solid #e5e7eb;">${escapeHtml(inquiry.userId || "-")}</td></tr>
        </tbody>
      </table>
      <h3 style="margin:0 0 8px;">문의 내용</h3>
      <pre style="white-space:pre-wrap; padding:12px; border:1px solid #e5e7eb; border-radius:10px; background:#f9fafb;">${escapeHtml(inquiry.message)}</pre>
    </div>
  `;
}

function formatKrw(value) {
  const amount = Number(value || 0);
  return amount > 0 ? `${amount.toLocaleString("ko-KR")}원` : "-";
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

async function sendAdminNotification({ subject, text, html, replyTo }) {
  const config = getResendConfig();

  if (!config.apiKey || !config.to) {
    return {
      enabled: false,
      sent: false,
      reason: "SUPPORT_NOTIFY_EMAIL 또는 RESEND_API_KEY가 설정되어 있지 않습니다.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [config.to],
      subject,
      text,
      html,
      reply_to: replyTo || undefined,
    }),
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      enabled: true,
      sent: false,
      error: payload?.message || `메일 발송 실패 (${response.status})`,
    };
  }

  return {
    enabled: true,
    sent: true,
    provider: "resend",
    emailId: payload?.id || null,
  };
}

export async function sendInquiryNotification(inquiry) {
  return sendAdminNotification({
    subject: `[FINPLE 문의] ${inquiry.title}`,
    text: buildTextBody(inquiry),
    html: buildHtmlBody(inquiry),
    replyTo: inquiry.email,
  });
}

export async function sendSubscriptionAdminNotification({
  user,
  plan = "Personal",
  amount,
  currentPeriodEnd,
  receiptUrl,
  orderId,
}) {
  const userEmail = user?.email || "미확인";
  const userName = user?.name || user?.nickname || "미확인";
  const details = {
    "회원 이름": userName,
    "회원 이메일": userEmail,
    "회원 ID": user?.id || "-",
    "구독 플랜": plan,
    "결제 금액": formatKrw(amount),
    "이용 종료일": formatDate(currentPeriodEnd),
    "주문 번호": orderId || "-",
    "영수증": receiptUrl || "-",
  };
  const text = [
    "FINPLE 신규 구독이 발생했습니다.",
    "",
    ...Object.entries(details).map(([label, value]) => `${label}: ${value}`),
  ].join("\n");
  const rows = Object.entries(details)
    .map(([label, value]) => (
      `<tr><th align="left" style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;">${escapeHtml(label)}</th><td style="padding:8px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`
    ))
    .join("");
  const html = `
    <div style="font-family:Arial,'Apple SD Gothic Neo',sans-serif;line-height:1.6;color:#111827;">
      <h2 style="margin:0 0 12px;">FINPLE 신규 구독 발생</h2>
      <table style="border-collapse:collapse;width:100%;max-width:720px;"><tbody>${rows}</tbody></table>
    </div>
  `;

  return sendAdminNotification({
    subject: `[FINPLE 신규 구독] ${userName} · ${plan}`,
    text,
    html,
    replyTo: user?.email,
  });
}
