import { randomUUID } from "node:crypto";

import { query } from "../db/database.js";

let schemaReady = false;

export async function ensureInquiryReplySchema() {
  if (schemaReady) return;

  await query(`
    CREATE TABLE IF NOT EXISTS inquiry_replies (
      id UUID PRIMARY KEY,
      inquiry_id UUID NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      body TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      email_sent BOOLEAN NOT NULL DEFAULT FALSE,
      email_id TEXT,
      email_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_inquiry_replies_inquiry_created
      ON inquiry_replies(inquiry_id, created_at)
  `);

  schemaReady = true;
}

function mapReplyRow(row) {
  return {
    id: row.id,
    inquiryId: row.inquiry_id,
    body: row.body,
    recipientEmail: row.recipient_email,
    emailSent: Boolean(row.email_sent),
    emailId: row.email_id || null,
    emailError: row.email_error || null,
    createdAt: row.created_at,
  };
}

export async function listInquiryReplies(inquiryId) {
  await ensureInquiryReplySchema();
  const result = await query(
    `SELECT id, inquiry_id, body, recipient_email, email_sent, email_id, email_error, created_at
       FROM inquiry_replies
      WHERE inquiry_id = $1
      ORDER BY created_at ASC`,
    [inquiryId]
  );
  return result.rows.map(mapReplyRow);
}

export async function createInquiryReply({ inquiryId, body, recipientEmail }) {
  await ensureInquiryReplySchema();
  const id = randomUUID();
  const result = await query(
    `INSERT INTO inquiry_replies (id, inquiry_id, body, recipient_email)
     VALUES ($1, $2, $3, $4)
     RETURNING id, inquiry_id, body, recipient_email, email_sent, email_id, email_error, created_at`,
    [id, inquiryId, body, recipientEmail]
  );
  return mapReplyRow(result.rows[0]);
}

export async function updateInquiryReplyDelivery(replyId, notification = {}) {
  await ensureInquiryReplySchema();
  const sent = Boolean(notification.sent);
  const result = await query(
    `UPDATE inquiry_replies
        SET email_sent = $2,
            email_id = $3,
            email_error = $4
      WHERE id = $1
      RETURNING id, inquiry_id, body, recipient_email, email_sent, email_id, email_error, created_at`,
    [
      replyId,
      sent,
      notification.emailId || null,
      sent ? null : (notification.error || notification.reason || "email_delivery_failed"),
    ]
  );
  return mapReplyRow(result.rows[0]);
}
