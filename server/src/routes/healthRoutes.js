import express from "express";

import {
  checkDatabaseConnection,
  getDatabaseMode,
  isDatabaseConfigured,
} from "../db/database.js";

const router = express.Router();

function setNoStore(response) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
}

router.get("/live", (request, response) => {
  setNoStore(response);
  response.status(200).json({
    ok: true,
    status: "live",
    requestId: request.requestId || null,
    checkedAt: new Date().toISOString(),
  });
});

router.get("/ready", async (request, response) => {
  setNoStore(response);

  const database = await checkDatabaseConnection({
    timeoutMs: Number(process.env.FINPLE_READINESS_DB_TIMEOUT_MS || 4500),
  });
  const ready = Boolean(database.ok);

  response.status(ready ? 200 : 503).json({
    ok: ready,
    status: ready ? "ready" : "not_ready",
    database,
    databaseMode: getDatabaseMode(),
    databaseConfigured: isDatabaseConfigured(),
    requestId: request.requestId || null,
    checkedAt: new Date().toISOString(),
  });
});

export default router;
