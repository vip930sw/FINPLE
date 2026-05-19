import express from "express";

import {
  getUserByAuthHeader,
  getUserBySessionToken,
  loginWithEmail,
  logoutSession,
  signupWithEmail,
} from "../db/authRepository.js";

const router = express.Router();

function getRequestMeta(request) {
  return {
    userAgent: request.get("user-agent") || "",
    ipAddress:
      request.ip ||
      request.get("x-forwarded-for")?.split(",")?.[0]?.trim() ||
      "",
  };
}

function getSessionToken(request) {
  const authHeader = request.get("authorization") || "";
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  return (
    bearerMatch?.[1] ||
    request.get("x-finple-session-token") ||
    request.body?.sessionToken ||
    ""
  );
}

router.post("/signup", async (request, response, next) => {
  try {
    const result = await signupWithEmail(request.body, getRequestMeta(request));
    response.status(201).json({
      ok: true,
      authMode: "email-password",
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (request, response, next) => {
  try {
    const result = await loginWithEmail(request.body, getRequestMeta(request));
    response.json({
      ok: true,
      authMode: "email-password",
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (request, response, next) => {
  try {
    const sessionToken = getSessionToken(request);
    const result = await logoutSession(sessionToken);
    response.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (request, response, next) => {
  try {
    const sessionToken = getSessionToken(request);
    const headerUserId = request.get("x-finple-user-id") || "";
    const user = sessionToken
      ? await getUserBySessionToken(sessionToken)
      : await getUserByAuthHeader(headerUserId);

    response.json({
      ok: Boolean(user),
      user,
      authMode: sessionToken ? "session-token" : "user-id-header",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
