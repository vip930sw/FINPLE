import express from "express";
import { randomUUID } from "node:crypto";

import { isDatabaseConfigured, query } from "../db/database.js";
import { getAdminSecurityStatus, requireAdminAccess } from "../middleware/adminGuard.js";
import { getInquiryNotificationStatus, sendInquiryNotification } from "../services/inquiryNotificationService.js";
import {
  getUserNotificationStatus,
  sendInquiryReceivedNotification,
  sendInquiryStatusNotification,
} from "../services/userNotificationService.js";

const router = express.Router();

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

function getRequestUserId(request) {
  const value = request.get("x-finple-user-id") || request.body?.userId || request.query?.userId;
  return isUuid(value) ? value : null;
}

function normalizeCategory(value) {
  const allowed = new Set(["bug", "feature", "payment", "data", "etc"]);
  return allowed.has(value) ? value : "etc";
}

function normalizeStatus(value) {
  const allowed = new Set(["open", "in_progress", "resolved", "closed"]);
  return allowed.has(value) ? value : "open";
}

const INQUIRY_STATUS_LABELS = {
  open: "접수",
  in_progress: "확인 중",
  resolved: "처리 완료",
  closed: "종료",
};

function normalizeText(value, maxLength = 5000) {
  return String(value || "").trim().slice(0, maxLength);
}

function extractEmailFromText(value = "") {
  const match = String(value || "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0] || "";
}

function createStoredMessage({ email, message, pageUrl, userAgent }) {
  const parts = [message.trim()];
  const meta = [];

  if (email) meta.push(`답변 이메일: ${email}`);
  if (pageUrl) meta.push(`페이지 URL: ${pageUrl}`);
  if (userAgent) meta.push(`User Agent: ${userAgent}`);

  if (meta.length > 0) {
    parts.push("");
    parts.push("--- 문의 메타 정보 ---");
    parts.push(...meta);
  }

  return parts.join("\n");
}

function mapInquiryRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    title: row.title,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/notification-status", (request, response) => {
  response.json({
    ok: true,
    notification: getInquiryNotificationStatus(),
    userNotification: getUserNotificationStatus(),
  });
});

router.get("/admin-status", (request, response) => {
  response.json({
    ok: true,
    admin: getAdminSecurityStatus(),
  });
});

router.get("/", async (request, response, next) => {
  try {
    if (!isDatabaseConfigured()) {
      response.status(503).json({
        ok: false,
        message: "DATABASE_URL이 설정되어 있지 않습니다.",
      });
      return;
    }

    const scope = request.query?.scope === "all" ? "all" : "mine";
    const userId = getRequestUserId(request);

    if (scope === "all") {
      requireAdminAccess(request, response, async () => {
        try {
          const result = await query(
            `SELECT id, user_id, category, title, message, status, created_at, updated_at
               FROM inquiries
              ORDER BY created_at DESC
              LIMIT 100`
          );

          response.json({
            ok: true,
            inquiries: result.rows.map(mapInquiryRow),
          });
        } catch (error) {
          next(error);
        }
      });
      return;
    }

    if (!userId) {
      response.json({ ok: true, inquiries: [] });
      return;
    }

    const result = await query(
      `SELECT id, user_id, category, title, message, status, created_at, updated_at
         FROM inquiries
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50`,
      [userId]
    );

    response.json({
      ok: true,
      inquiries: result.rows.map(mapInquiryRow),
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:inquiryId/status", async (request, response, next) => {
  try {
    if (!isDatabaseConfigured()) {
      response.status(503).json({
        ok: false,
        message: "DATABASE_URL이 설정되어 있지 않습니다.",
      });
      return;
    }

    requireAdminAccess(request, response, () => {});
    if (response.headersSent) return;

    const inquiryId = request.params?.inquiryId;

    if (!isUuid(inquiryId)) {
      response.status(400).json({
        ok: false,
        message: "문의 ID 형식이 올바르지 않습니다.",
      });
      return;
    }

    const status = normalizeStatus(request.body?.status);
    const result = await query(
      `WITH updated AS (
        UPDATE inquiries
          SET status = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING id, user_id, category, title, message, status, created_at, updated_at
      )
      SELECT updated.*, users.email AS user_email
        FROM updated
        LEFT JOIN users ON users.id = updated.user_id`,
      [inquiryId, status]
    );

    if (result.rowCount === 0) {
      response.status(404).json({
        ok: false,
        message: "해당 문의를 찾지 못했습니다.",
      });
      return;
    }

    const row = result.rows[0];
    const notification = await sendInquiryStatusNotification({
      to: row.user_email || extractEmailFromText(row.message),
      inquiry: row,
      statusLabel: INQUIRY_STATUS_LABELS[status] || status,
    }).catch((error) => ({
      enabled: true,
      sent: false,
      error: error?.message || "inquiry_status_notification_failed",
    }));

    response.json({
      ok: true,
      inquiry: mapInquiryRow(row),
      notification,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (request, response, next) => {
  try {
    if (!isDatabaseConfigured()) {
      response.status(503).json({
        ok: false,
        message: "DATABASE_URL이 설정되어 있지 않습니다. 문의 저장은 DB 연결 후 사용할 수 있습니다.",
      });
      return;
    }

    const category = normalizeCategory(request.body?.category);
    const title = normalizeText(request.body?.title || "FINPLE 문의사항", 120) || "FINPLE 문의사항";
    const message = normalizeText(request.body?.message, 5000);
    const email = normalizeText(request.body?.email, 120);
    const pageUrl = normalizeText(request.body?.pageUrl, 300);
    const userAgent = normalizeText(request.body?.userAgent, 500);
    const userId = getRequestUserId(request);

    if (!message) {
      response.status(400).json({
        ok: false,
        message: "문의 내용을 입력해 주세요.",
      });
      return;
    }

    const id = randomUUID();
    const storedMessage = createStoredMessage({ email, message, pageUrl, userAgent });

    const result = await query(
      `INSERT INTO inquiries (id, user_id, category, title, message, status)
       VALUES ($1, $2, $3, $4, $5, 'open')
       RETURNING id, user_id, category, title, message, status, created_at, updated_at`,
      [id, userId, category, title, storedMessage]
    );

    const row = result.rows[0];
    const notification = await sendInquiryNotification({
      id,
      userId,
      category,
      title,
      email,
      message,
      pageUrl,
      userAgent,
    }).catch((error) => ({
      enabled: true,
      sent: false,
      error: error?.message || "메일 알림 처리 중 오류가 발생했습니다.",
    }));

    const userNotification = await sendInquiryReceivedNotification({
      to: email,
      inquiry: row,
    }).catch((error) => ({
      enabled: true,
      sent: false,
      error: error?.message || "inquiry_received_notification_failed",
    }));

    response.status(201).json({
      ok: true,
      inquiry: mapInquiryRow(row),
      notification,
      userNotification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
