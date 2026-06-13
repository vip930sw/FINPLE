import express from "express";

import { isDatabaseConfigured, withTransaction } from "../db/database.js";
import {
  checkEmailAvailability,
  getUserByAuthHeader,
  getUserBySessionToken,
  loginWithEducationAccount,
  loginWithEmail,
  logoutSession,
  resendVerificationEmail,
  signupWithEmail,
  verifyEmailToken,
} from "../db/authRepository.js";
import {
  buildGoogleOAuthUrl,
  buildOAuthFailureRedirect,
  buildOAuthSuccessRedirect,
  completeGoogleOAuthLogin,
} from "../db/googleOAuthRepository.js";
import {
  buildKakaoOAuthFailureRedirect,
  buildKakaoOAuthSuccessRedirect,
  buildKakaoOAuthUrl,
  completeKakaoOAuthLogin,
} from "../db/kakaoOAuthRepository.js";
import {
  buildNaverOAuthFailureRedirect,
  buildNaverOAuthSuccessRedirect,
  buildNaverOAuthUrl,
  completeNaverOAuthLogin,
} from "../db/naverOAuthRepository.js";

const router = express.Router();

function getRequestMeta(request) {
  return {
    userAgent: request.get("user-agent") || "",
    ipAddress: request.ip || request.get("x-forwarded-for")?.split(",")?.[0]?.trim() || "",
  };
}

function getSessionToken(request) {
  const authHeader = request.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return bearerMatch?.[1] || request.get("x-finple-session-token") || request.body?.sessionToken || "";
}

async function getRequestUser(request) {
  const sessionToken = getSessionToken(request);
  const headerUserId = request.get("x-finple-user-id") || request.body?.userId || "";
  return sessionToken ? getUserBySessionToken(sessionToken) : getUserByAuthHeader(headerUserId);
}

router.get("/check-email", async (request, response, next) => {
  try {
    const result = await checkEmailAvailability(request.query.email);
    response.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.get("/google/start", async (request, response, next) => {
  try {
    response.redirect(buildGoogleOAuthUrl());
  } catch (error) {
    next(error);
  }
});

router.get("/google/callback", async (request, response) => {
  try {
    const result = await completeGoogleOAuthLogin({ code: request.query.code, state: request.query.state }, getRequestMeta(request));
    response.redirect(buildOAuthSuccessRedirect(result));
  } catch (error) {
    response.redirect(buildOAuthFailureRedirect(error?.message || "Google 로그인에 실패했습니다."));
  }
});

router.get("/naver/start", async (request, response, next) => {
  try {
    response.redirect(buildNaverOAuthUrl());
  } catch (error) {
    next(error);
  }
});

router.get("/naver/callback", async (request, response) => {
  try {
    const result = await completeNaverOAuthLogin(
      { code: request.query.code, state: request.query.state, error: request.query.error },
      getRequestMeta(request)
    );
    response.redirect(buildNaverOAuthSuccessRedirect(result));
  } catch (error) {
    response.redirect(buildNaverOAuthFailureRedirect(error?.message || "네이버 로그인에 실패했습니다."));
  }
});

router.get("/kakao/start", async (request, response, next) => {
  try {
    response.redirect(buildKakaoOAuthUrl());
  } catch (error) {
    next(error);
  }
});

router.get("/kakao/callback", async (request, response) => {
  try {
    const result = await completeKakaoOAuthLogin(
      {
        code: request.query.code,
        state: request.query.state,
        error: request.query.error,
        error_description: request.query.error_description,
      },
      getRequestMeta(request)
    );
    response.redirect(buildKakaoOAuthSuccessRedirect(result));
  } catch (error) {
    response.redirect(buildKakaoOAuthFailureRedirect(error?.message || "카카오 로그인에 실패했습니다."));
  }
});

router.post("/signup", async (request, response, next) => {
  try {
    const result = await signupWithEmail(request.body, getRequestMeta(request));
    response.status(201).json({ ok: true, authMode: "email-password", requiresEmailVerification: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.post("/verify-email", async (request, response, next) => {
  try {
    const result = await verifyEmailToken(request.body?.token || request.query?.token);
    response.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.post("/resend-verification", async (request, response, next) => {
  try {
    const result = await resendVerificationEmail(request.body, getRequestMeta(request));
    response.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const result = await loginWithEmail(request.body, getRequestMeta(request));
    response.json({ ok: true, authMode: "email-password", ...result });
  } catch (error) {
    next(error);
  }
});

router.post("/education-login", async (request, response, next) => {
  try {
    const result = await loginWithEducationAccount(request.body, getRequestMeta(request));
    response.json({ ok: true, authMode: "education-account", ...result });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (request, response, next) => {
  try {
    const result = await logoutSession(getSessionToken(request));
    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (request, response, next) => {
  try {
    const user = await getRequestUser(request);
    response.json({ ok: Boolean(user), user, authMode: getSessionToken(request) ? "session-token" : "user-id-header" });
  } catch (error) {
    next(error);
  }
});

router.delete("/me", async (request, response, next) => {
  try {
    if (!isDatabaseConfigured()) {
      response.status(503).json({ ok: false, code: "DATABASE_NOT_CONFIGURED", message: "회원탈퇴를 처리할 데이터베이스가 연결되어 있지 않습니다." });
      return;
    }

    const user = await getRequestUser(request);
    if (!user?.id) {
      response.status(401).json({ ok: false, code: "AUTH_REQUIRED", message: "회원탈퇴를 위해 로그인이 필요합니다." });
      return;
    }

    const confirmText = String(request.body?.confirmText || "").trim();
    const privacyConfirmed = Boolean(request.body?.privacyDeletionConfirmed);
    const subscriptionConfirmed = Boolean(request.body?.subscriptionAccessConfirmed);
    const refundConfirmed = Boolean(request.body?.refundPolicyConfirmed);

    if (confirmText !== "회원탈퇴" || !privacyConfirmed || !subscriptionConfirmed || !refundConfirmed) {
      response.status(400).json({
        ok: false,
        code: "WITHDRAWAL_CONFIRMATION_REQUIRED",
        message: "회원탈퇴 안내와 경고사항을 모두 확인해 주세요.",
      });
      return;
    }

    const result = await withTransaction(async (tx) => {
      await tx(
        `UPDATE subscriptions
            SET status = 'canceled',
                cancel_at_period_end = FALSE,
                canceled_at = COALESCE(canceled_at, NOW()),
                ended_at = COALESCE(ended_at, NOW()),
                metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
          WHERE user_id = $1`,
        [
          user.id,
          JSON.stringify({
            reason: "account_withdrawal",
            requestedAt: new Date().toISOString(),
            refundPolicy: "no_refund_by_withdrawal_only",
          }),
        ]
      );

      await tx(
        `UPDATE recurring_payment_methods
            SET status = 'disabled',
                disabled_at = COALESCE(disabled_at, NOW()),
                metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb
          WHERE user_id = $1`,
        [
          user.id,
          JSON.stringify({
            reason: "account_withdrawal",
            disabledBy: "user",
            disabledAt: new Date().toISOString(),
          }),
        ]
      );

      await tx("DELETE FROM inquiries WHERE user_id = $1", [user.id]);
      await tx("DELETE FROM api_usage_logs WHERE user_id = $1", [user.id]);
      await tx("DELETE FROM payment_events WHERE user_id = $1", [user.id]);
      const deleteResult = await tx("DELETE FROM users WHERE id = $1 RETURNING id", [user.id]);
      return { deleted: deleteResult.rowCount > 0 };
    });

    response.json({
      ok: true,
      deleted: Boolean(result.deleted),
      subscriptionCanceled: true,
      personalDataDeleted: true,
      message: "회원탈퇴가 완료되었습니다.",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
