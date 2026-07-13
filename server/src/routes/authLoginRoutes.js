import express from "express";

import { loginWithEmailStable } from "../db/authLoginRepository.js";

const router = express.Router();

function getRequestMeta(request) {
  return {
    userAgent: request.get("user-agent") || "",
    ipAddress: request.ip || request.get("x-forwarded-for")?.split(",")?.[0]?.trim() || "",
  };
}

router.post("/login", async (request, response, next) => {
  try {
    const result = await loginWithEmailStable(request.body, getRequestMeta(request));
    response.json({ ok: true, authMode: "email-password", ...result });
  } catch (error) {
    next(error);
  }
});

export default router;
