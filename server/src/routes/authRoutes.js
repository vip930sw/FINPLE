import express from "express";

import {
  checkEmailAvailability,
  getUserByAuthHeader,
  getUserBySessionToken,
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
    const sessionToken = getSessionToken(request);
    const headerUserId = request.get("x-finple-user-id") || "";
    const user = sessionToken ? await getUserBySessionToken(sessionToken) : await getUserByAuthHeader(headerUserId);
    response.json({ ok: Boolean(user), user, authMode: sessionToken ? "session-token" : "user-id-header" });
  } catch (error) {
    next(error);
  }
});

export default router;
