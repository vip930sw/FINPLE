const DEFAULT_FROM = "FINPLE <onboarding@resend.dev>";

function getResendConfig() {
  return {
    apiKey: process.env.RESEND_API_KEY || "",
    to: process.env.SUPPORT_NOTIFY_EMAIL || "",
    from: process.env.SUPPORT_EMAIL_FROM || DEFAULT_FROM,
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

export async function sendInquiryNotification(inquiry) {
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
      subject: `[FINPLE 문의] ${inquiry.title}`,
      text: buildTextBody(inquiry),
      html: buildHtmlBody(inquiry),
      reply_to: inquiry.email || undefined,
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
