import express from "express";

const router = express.Router();

router.post("/subscription/end-at-period", (request, response) => {
  response.status(501).json({ ok: false, message: "Subscription end scheduling is not connected yet." });
});

export default router;
