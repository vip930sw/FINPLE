const DEFAULT_FROM_EMAIL = "FINPLE <no-reply@finple.local>";

function getMailProvider() {
  if (process.env.RESEND_API_KEY) return "resend";
  return "development";
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return "24시간";

  try {
    return new Date(expiresAt).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    return "24시간";
  }
}

function createVerificationEmailHtml({ name, verificationUrl, expiresAt }) {
  const displayName = name || "FINPLE 사용자";
  const expiryText = formatExpiry(expiresAt);

  return `
    <div style="font-family: Arial, 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #0f172a;">
      <h1 style="margin: 0 0 16px; font-size: 24px;">FINPLE 이메일 인증</h1>
      <p>${displayName}님, FINPLE 회원가입을 완료하려면 아래 버튼을 눌러 이메일 인증을 진행해 주세요.</p>
      <p style="margin: 24px 0;">
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: 700;">이메일 인증하기</a>
      </p>
      <p>버튼이 열리지 않으면 아래 주소를 브라우저에 복사해 주세요.</p>
      <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
      <p style="font-size: 13px; color: #64748b;">이 인증 링크는 ${expiryText}까지 유효합니다. 직접 요청하지 않은 메일이라면 무시하셔도 됩니다.</p>
    </div>
  `;
}

function createVerificationEmailText({ name, verificationUrl, expiresAt }) {
  const displayName = name || "FINPLE 사용자";
  const expiryText = formatExpiry(expiresAt);

  return [
    "FINPLE 이메일 인증",
    "",
    `${displayName}님, FINPLE 회원가입을 완료하려면 아래 링크를 열어 이메일 인증을 진행해 주세요.`,
    "",
    verificationUrl,
    "",
    `이 인증 링크는 ${expiryText}까지 유효합니다.`,
  ].join("\n");
}

async function sendWithResend({ to, subject, html, text }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.FINPLE_EMAIL_FROM || DEFAULT_FROM_EMAIL,
      to,
      subject,
      html,
      text,
    }),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }

  if (!response.ok) {
    const error = new Error(payload?.message || "인증 메일 발송에 실패했습니다.");
    error.statusCode = 502;
    throw error;
  }

  return { sent: true, mode: "resend", providerId: payload?.id || null };
}

export async function sendVerificationEmail({ to, name, verificationUrl, expiresAt }) {
  const provider = getMailProvider();
  const subject = "FINPLE 이메일 인증을 완료해 주세요";
  const html = createVerificationEmailHtml({ name, verificationUrl, expiresAt });
  const text = createVerificationEmailText({ name, verificationUrl, expiresAt });

  if (provider === "resend") {
    return sendWithResend({ to, subject, html, text });
  }

  console.log("[FINPLE email verification development mode]", {
    to,
    subject,
    verificationUrl,
    expiresAt,
  });

  return {
    sent: false,
    mode: "development",
    includeDebugUrl: process.env.NODE_ENV !== "production" || process.env.FINPLE_EMAIL_DEBUG_URL === "true",
  };
}
