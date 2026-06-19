-- FINPLE inquiry image attachments
-- Original files are stored in a private Supabase Storage bucket.
-- PostgreSQL stores only object paths and lifecycle metadata.

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
);

CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_inquiry_created
  ON inquiry_attachments(inquiry_id, created_at);

CREATE INDEX IF NOT EXISTS idx_inquiry_attachments_expiry
  ON inquiry_attachments(expires_at)
  WHERE deleted_at IS NULL;
