import express from "express";

import { checkDatabaseConnection, getDatabaseMode, isDatabaseConfigured } from "../db/database.js";
import { ensureDevUser, getDefaultUserId, getUserById } from "../db/portfolioRepository.js";

const router = express.Router();

router.get("/health", async (request, response) => {
  const dbStatus = await checkDatabaseConnection();

  response.status(dbStatus.ok ? 200 : 200).json({
    ok: dbStatus.ok,
    app: "FINPLE DB Layer",
    database: dbStatus,
    mode: getDatabaseMode(),
    configured: isDatabaseConfigured(),
    checkedAt: new Date().toISOString(),
  });
});

router.post("/dev-user", async (request, response, next) => {
  try {
    const user = await ensureDevUser(getDefaultUserId());
    response.json({
      ok: true,
      user,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me", async (request, response, next) => {
  try {
    const userId = request.header("x-finple-user-id") || getDefaultUserId();
    const user = await getUserById(userId);
    response.json({
      ok: true,
      user,
      authMode: "dev-header",
    });
  } catch (error) {
    next(error);
  }
});

export default router;
