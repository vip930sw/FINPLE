import { randomUUID } from "node:crypto";

import { query } from "../db/database.js";

const DEFAULT_BUCKET = "finple-inquiry-attachments";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILE_COUNT = 3;
const OPEN_RETENTION_DAYS = 180;
const CLOSED_RETENTION_DAYS = 90;
const SIGNED_URL_SECONDS = 600;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

let schemaReady = false;
let bucketReady = false;

function getStorageConfig() {
  return {
    url: String(process.env.SUPABASE_URL || "").replace(/\/+$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    bucket: process.env.SUPABASE_INQUIRY_BUCKET || DEFAULT_BUCKET,
  };
}

export function getInquiryAttachmentStatus() {
  const config = getStorageConfig();
  return {
    enabled: Boolean(config.url && config.serviceRoleKey),
    provider: "supabase-storage",
    bucket: config.bucket,
    maxFileCount: MAX_FILE_COUNT,
    maxFileSize: MAX_FILE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES),
    openRetentionDays: OPEN_RETENTION_DAYS,
    closedRetentionDays: CLOSED_RETENTION_DAYS,
    signedUrlSeconds: SIGNED_URL_SECONDS,
  };
}

export function isAllowedInquiryImage(file) {
  const basicValid = Boolean(
    file &&
    ALLOWED_MIME_TYPES.has(String(file.mimetype || "").toLowerCase()) &&
    Number(file.size || 0) > 0 &&
    Number(file.size || 0) <= MAX_FILE_SIZE
  );
  if (!basicValid || !file.buffer) return basicValid;

  const bytes = file.buffer;
  const mimeType = String(file.mimetype || "").toLowerCase();
  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }
  if (mimeType === "image/webp") {
    return (
      bytes.length >= 12 &&
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    );
  }
  return false;
}

export function getInquiryUploadLimits() {
  return {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILE_COUNT,
  };
}

async function ensureAttachmentSchema() {
  if (schemaReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS inquiry_attachments (
      id UUID PRIMARY KEY,
      inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      storage_path TEXT NOT NULL UNIQUE,
      file_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      deleted_at TIMESTAMPTZ
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_inquiry_created
      ON inquiry_attachments(inquiry_id, created_at)
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_expiry
      ON inquiry_attachments(expires_at)
      WHERE deleted_at IS NULL
  `);

  schemaReady = true;
}

export async function ensureInquiryAttachmentSchema() {
  await ensureAttachmentSchema();
}

function getStorageHeaders(contentType = "application/json") {
  const config = getStorageConfig();
  return {
    Authorization: `Bearer ${config.serviceRoleKey}`,
    apikey: config.serviceRoleKey,
    "Content-Type": contentType,
  };
}

async function ensurePrivateBucket() {
  if (bucketReady) return;
  const config = getStorageConfig();

  const response = await fetch(`${config.url}/storage/v1/bucket`, {
    method: "POST",
    headers: getStorageHeaders(),
    body: JSON.stringify({
      id: config.bucket,
      name: config.bucket,
      public: false,
      file_size_limit: MAX_FILE_SIZE,
      allowed_mime_types: Array.from(ALLOWED_MIME_TYPES),
    }),
  });

  if (!response.ok && response.status !== 409) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `첨부파일 저장소 준비에 실패했습니다. (${response.status})`);
  }

  bucketReady = true;
}

function sanitizeFileName(value = "") {
  const normalized = String(value || "image")
    .normalize("NFKC")
    .replace(/[^\w.\-가-힣]/g, "_")
    .replace(/_+/g, "_")
    .slice(-120);
  return normalized || "image";
}

function encodeStoragePath(path) {
  return String(path)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function uploadStorageObject(path, file) {
  const config = getStorageConfig();
  const response = await fetch(
    `${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}/${encodeStoragePath(path)}`,
    {
      method: "POST",
      headers: {
        ...getStorageHeaders(file.mimetype),
        "x-upsert": "false",
      },
      body: file.buffer,
    }
  );

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `사진 업로드에 실패했습니다. (${response.status})`);
  }
}

async function removeStorageObjects(paths = []) {
  if (!paths.length) return;
  const config = getStorageConfig();
  const response = await fetch(`${config.url}/storage/v1/object/${encodeURIComponent(config.bucket)}`, {
    method: "DELETE",
    headers: getStorageHeaders(),
    body: JSON.stringify({ prefixes: paths }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.message || `만료 사진 삭제에 실패했습니다. (${response.status})`);
  }
}

async function createSignedUrl(path) {
  const config = getStorageConfig();
  const response = await fetch(
    `${config.url}/storage/v1/object/sign/${encodeURIComponent(config.bucket)}/${encodeStoragePath(path)}`,
    {
      method: "POST",
      headers: getStorageHeaders(),
      body: JSON.stringify({ expiresIn: SIGNED_URL_SECONDS }),
    }
  );
  const payload = await response.json().catch(() => ({}));

  if (!response.ok || !payload?.signedURL) {
    throw new Error(payload?.message || "첨부 사진 임시 URL 생성에 실패했습니다.");
  }

  return payload.signedURL.startsWith("http")
    ? payload.signedURL
    : `${config.url}/storage/v1${payload.signedURL}`;
}

export async function storeInquiryAttachments({ inquiryId, files = [] }) {
  if (!files.length) return [];
  const status = getInquiryAttachmentStatus();
  if (!status.enabled) {
    const error = new Error("사진 첨부 저장소가 아직 설정되지 않았습니다.");
    error.statusCode = 503;
    error.code = "INQUIRY_ATTACHMENT_STORAGE_NOT_CONFIGURED";
    throw error;
  }

  await ensureAttachmentSchema();
  await ensurePrivateBucket();
  await cleanupExpiredInquiryAttachments();

  const stored = [];
  const uploadedPaths = [];
  try {
    for (const file of files) {
      if (!isAllowedInquiryImage(file)) {
        const error = new Error("JPG, PNG, WebP 사진만 장당 5MB까지 첨부할 수 있습니다.");
        error.statusCode = 400;
        throw error;
      }

      const id = randomUUID();
      const fileName = sanitizeFileName(file.originalname);
      const storagePath = `${inquiryId}/${id}-${fileName}`;
      await uploadStorageObject(storagePath, file);
      uploadedPaths.push(storagePath);

      const result = await query(
        `INSERT INTO inquiry_attachments (
           id, inquiry_id, storage_path, file_name, mime_type, file_size, expires_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + ($7 || ' days')::interval)
         RETURNING id, inquiry_id, storage_path, file_name, mime_type, file_size, expires_at, created_at`,
        [id, inquiryId, storagePath, fileName, file.mimetype, file.size, String(OPEN_RETENTION_DAYS)]
      );
      stored.push(result.rows[0]);
    }
  } catch (error) {
    await removeStorageObjects(uploadedPaths).catch(() => {});
    await query("DELETE FROM inquiry_attachments WHERE inquiry_id = $1", [inquiryId]).catch(() => {});
    throw error;
  }

  return stored;
}

export async function listInquiryAttachmentsForAdmin(inquiryId) {
  const status = getInquiryAttachmentStatus();
  if (!status.enabled) return [];

  await ensureAttachmentSchema();
  await cleanupExpiredInquiryAttachments();

  const result = await query(
    `SELECT id, inquiry_id, storage_path, file_name, mime_type, file_size, expires_at, created_at
       FROM inquiry_attachments
      WHERE inquiry_id = $1
        AND deleted_at IS NULL
        AND expires_at > NOW()
      ORDER BY created_at ASC`,
    [inquiryId]
  );

  return Promise.all(result.rows.map(async (row) => ({
    id: row.id,
    inquiryId: row.inquiry_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size || 0),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    signedUrl: await createSignedUrl(row.storage_path),
    signedUrlExpiresIn: SIGNED_URL_SECONDS,
  })));
}

export async function applyInquiryAttachmentRetention(inquiryId, status) {
  if (!["resolved", "closed"].includes(status)) return;
  await ensureAttachmentSchema();
  await query(
    `UPDATE inquiry_attachments
        SET expires_at = NOW() + ($2 || ' days')::interval
      WHERE inquiry_id = $1
        AND deleted_at IS NULL`,
    [inquiryId, String(CLOSED_RETENTION_DAYS)]
  );
}

export async function cleanupExpiredInquiryAttachments() {
  const status = getInquiryAttachmentStatus();
  if (!status.enabled) return { deleted: 0 };

  await ensureAttachmentSchema();
  const result = await query(
    `SELECT id, storage_path
       FROM inquiry_attachments
      WHERE deleted_at IS NULL
        AND expires_at <= NOW()
      ORDER BY expires_at ASC
      LIMIT 100`
  );
  if (!result.rowCount) return { deleted: 0 };

  await removeStorageObjects(result.rows.map((row) => row.storage_path));
  await query(
    `UPDATE inquiry_attachments
        SET deleted_at = NOW()
      WHERE id = ANY($1::uuid[])`,
    [result.rows.map((row) => row.id)]
  );

  return { deleted: result.rowCount };
}
