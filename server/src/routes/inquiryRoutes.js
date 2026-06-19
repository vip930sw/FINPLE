import express from "express";
import { randomUUID } from "node:crypto";
import multer from "multer";

import { isDatabaseConfigured, query } from "../db/database.js";
import { getAdminSecurityStatus, requireAdminAccess } from "../middleware/adminGuard.js";
import {
  applyInquiryAttachmentRetention,
  checkInquiryAttachmentStorageConnection,
  ensureInquiryAttachmentSchema,
  getInquiryAttachmentStatus,
  getInquiryUploadLimits,
  isAllowedInquiryImage,
  listInquiryAttachmentsForAdmin,
  storeInquiryAttachments,
} from "../services/inquiryAttachmentService.js";
import { getInquiryNotificationStatus, sendInquiryNotification } from "../services/inquiryNotificationService.js";
import {
  getUserNotificationStatus,
  sendInquiryReceivedNotification,
  sendInquiryStatusNotification,
} from "../services/userNotificationService.js";

const router = express.Router();
const attachmentRateLimit = new Map();
const uploadLimits = getInquiryUploadLimits();
const inquiryImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: uploadLimits,
  fileFilter: (request, file, callback) => {
    if (isAllowedInquiryImage({ ...file, size: 1 })) {
      callback(null, true);
      return;
    }
    callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
  },
}).array("attachments", uploadLimits.files);

function handleInquiryImageUpload(request, response, next) {
  inquiryImageUpload(request, response, (error) => {
    if (!error) {
      next();
      return;
    }

    const isSizeError = error?.code === "LIMIT_FILE_SIZE";
    const isCountError = error?.code === "LIMIT_FILE_COUNT";
    response.status(400).json({
      ok: false,
      code: error?.code || "INQUIRY_ATTACHMENT_INVALID",
      message: isSizeError
        ? "사진은 장당 5MB까지 첨부할 수 있습니다."
        : isCountError
          ? "사진은 최대 3장까지 첨부할 수 있습니다."
          : "JPG, PNG, WebP 사진만 첨부할 수 있습니다.",
    });
  });
}

function checkAttachmentRateLimit(request) {
  if (!Array.isArray(request.files) || request.files.length === 0) return true;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const key = String(request.ip || request.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  const recent = (attachmentRateLimit.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
  if (recent.length >= 5) return false;
  recent.push(now);
  attachmentRateLimit.set(key, recent);
  return true;
}

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
    attachmentCount: Number(row.attachment_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/notification-status", async (request, response, next) => {
  try {
    const attachments = await checkInquiryAttachmentStorageConnection();
    response.json({
      ok: true,
      notification: getInquiryNotificationStatus(),
      userNotification: getUserNotificationStatus(),
      attachments,
    });
  } catch (error) {
    next(error);
  }
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
    await ensureInquiryAttachmentSchema();

    if (scope === "all") {
      requireAdminAccess(request, response, async () => {
        try {
          const result = await query(
            `SELECT inquiries.id, inquiries.user_id, inquiries.category, inquiries.title,
                    inquiries.message, inquiries.status, inquiries.created_at, inquiries.updated_at,
                    COUNT(inquiry_attachments.id) FILTER (
                      WHERE inquiry_attachments.deleted_at IS NULL
                        AND inquiry_attachments.expires_at > NOW()
                    ) AS attachment_count
               FROM inquiries
               LEFT JOIN inquiry_attachments ON inquiry_attachments.inquiry_id = inquiries.id
              GROUP BY inquiries.id
              ORDER BY inquiries.created_at DESC
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
      `SELECT inquiries.id, inquiries.user_id, inquiries.category, inquiries.title,
              inquiries.message, inquiries.status, inquiries.created_at, inquiries.updated_at,
              COUNT(inquiry_attachments.id) FILTER (
                WHERE inquiry_attachments.deleted_at IS NULL
                  AND inquiry_attachments.expires_at > NOW()
              ) AS attachment_count
         FROM inquiries
         LEFT JOIN inquiry_attachments ON inquiry_attachments.inquiry_id = inquiries.id
        WHERE inquiries.user_id = $1
        GROUP BY inquiries.id
        ORDER BY inquiries.created_at DESC
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
    await applyInquiryAttachmentRetention(inquiryId, status);
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

router.get("/:inquiryId/attachments", async (request, response, next) => {
  try {
    requireAdminAccess(request, response, () => {});
    if (response.headersSent) return;

    const inquiryId = request.params?.inquiryId;
    if (!isUuid(inquiryId)) {
      response.status(400).json({ ok: false, message: "문의 ID 형식이 올바르지 않습니다." });
      return;
    }

    const attachments = await listInquiryAttachmentsForAdmin(inquiryId);
    response.json({
      ok: true,
      attachments,
      storage: getInquiryAttachmentStatus(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/", handleInquiryImageUpload, async (request, response, next) => {
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
    const files = Array.isArray(request.files) ? request.files : [];

    if (!checkAttachmentRateLimit(request)) {
      response.status(429).json({
        ok: false,
        code: "INQUIRY_ATTACHMENT_RATE_LIMITED",
        message: "사진 첨부 문의가 너무 자주 접수되었습니다. 1시간 후 다시 시도해 주세요.",
      });
      return;
    }

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
    let attachments = [];
    try {
      attachments = await storeInquiryAttachments({ inquiryId: id, files });
    } catch (error) {
      await query("DELETE FROM inquiries WHERE id = $1", [id]).catch(() => {});
      throw error;
    }
    const [notification, userNotification] = await Promise.all([
      sendInquiryNotification({
        id,
        userId,
        category,
        title,
        email,
        message,
        pageUrl,
        userAgent,
        attachments,
      }).catch((error) => ({
        enabled: true,
        sent: false,
        error: error?.message || "메일 알림 처리 중 오류가 발생했습니다.",
      })),
      sendInquiryReceivedNotification({
        to: email,
        inquiry: row,
      }).catch((error) => ({
        enabled: true,
        sent: false,
        error: error?.message || "inquiry_received_notification_failed",
      })),
    ]);

    response.status(201).json({
      ok: true,
      inquiry: mapInquiryRow(row),
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        fileName: attachment.file_name,
        mimeType: attachment.mime_type,
        fileSize: Number(attachment.file_size || 0),
        expiresAt: attachment.expires_at,
      })),
      notification,
      userNotification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
