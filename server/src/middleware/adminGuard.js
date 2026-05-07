function normalizeBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
}

function readBearerToken(request) {
  const authorization = request.get("authorization") || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

export function getAdminSecurityStatus() {
  const nodeEnv = process.env.NODE_ENV || "development";
  const isProduction = nodeEnv === "production";
  const previewEnabled = normalizeBoolean(
    process.env.FINPLE_ADMIN_PREVIEW_ENABLED,
    !isProduction
  );
  const tokenConfigured = Boolean(process.env.FINPLE_ADMIN_TOKEN);

  return {
    enabled: previewEnabled,
    tokenConfigured,
    mode: tokenConfigured ? "token" : previewEnabled && !isProduction ? "dev-open" : "locked",
    nodeEnv,
  };
}

export function requireAdminAccess(request, response, next) {
  const status = getAdminSecurityStatus();

  if (!status.enabled) {
    response.status(403).json({
      ok: false,
      code: "ADMIN_PREVIEW_DISABLED",
      message: "관리자 조회 기능이 비활성화되어 있습니다.",
    });
    return;
  }

  if (status.tokenConfigured) {
    const providedToken = request.get("x-finple-admin-token") || readBearerToken(request);

    if (providedToken && providedToken === process.env.FINPLE_ADMIN_TOKEN) {
      next();
      return;
    }

    response.status(403).json({
      ok: false,
      code: "ADMIN_TOKEN_REQUIRED",
      message: "관리자 토큰이 필요합니다.",
    });
    return;
  }

  if (status.nodeEnv !== "production") {
    next();
    return;
  }

  response.status(403).json({
    ok: false,
    code: "ADMIN_TOKEN_NOT_CONFIGURED",
    message: "운영 환경에서는 FINPLE_ADMIN_TOKEN 설정이 필요합니다.",
  });
}
