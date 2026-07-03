import express from "express";

import { buildTradingReadinessSnapshot } from "../services/tradingImplementationShell.js";

const router = express.Router();

router.get("/readiness", (request, response) => {
  response.json(buildTradingReadinessSnapshot());
});

export default router;
