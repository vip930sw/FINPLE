BEGIN;

CREATE TABLE IF NOT EXISTS trading_strategy_drafts (
  id UUID PRIMARY KEY,
  strategy_key TEXT NOT NULL UNIQUE,
  draft_version TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  revision BIGINT NOT NULL CHECK (revision >= 1),
  lifecycle_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (lifecycle_status IN ('draft', 'review_requested', 'changes_requested', 'approved_snapshot_created')),
  strategy_config JSONB NOT NULL,
  research_objectives JSONB NOT NULL,
  portfolio_constraints JSONB NOT NULL,
  payload_checksum TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  review_requested_by TEXT,
  review_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading_strategy_versions (
  id UUID PRIMARY KEY,
  strategy_key TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  source_draft_id UUID NOT NULL REFERENCES trading_strategy_drafts(id) ON DELETE RESTRICT,
  source_draft_revision BIGINT NOT NULL CHECK (source_draft_revision >= 1),
  status TEXT NOT NULL DEFAULT 'approved'
    CHECK (status IN ('approved', 'retired')),
  draft_version TEXT NOT NULL,
  strategy_version TEXT NOT NULL,
  strategy_config JSONB NOT NULL,
  research_objectives JSONB NOT NULL,
  portfolio_constraints JSONB NOT NULL,
  payload_checksum TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  retired_by TEXT,
  retired_at TIMESTAMPTZ,
  retirement_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (strategy_key, version_number),
  UNIQUE (strategy_key, payload_checksum)
);

CREATE TABLE IF NOT EXISTS trading_strategy_audit_events (
  id UUID PRIMARY KEY,
  strategy_key TEXT NOT NULL,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('draft_created', 'draft_updated', 'review_requested', 'approval_created', 'version_retired')),
  actor TEXT NOT NULL,
  draft_id UUID REFERENCES trading_strategy_drafts(id) ON DELETE SET NULL,
  draft_revision BIGINT,
  strategy_version_id UUID REFERENCES trading_strategy_versions(id) ON DELETE SET NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_strategy_versions_key_status
  ON trading_strategy_versions (strategy_key, status, version_number DESC);

CREATE INDEX IF NOT EXISTS idx_trading_strategy_audit_events_key_created
  ON trading_strategy_audit_events (strategy_key, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trading_strategy_drafts_lifecycle
  ON trading_strategy_drafts (lifecycle_status, updated_at DESC);

COMMENT ON TABLE trading_strategy_drafts IS
  'Admin-only mutable strategy drafts. A draft never grants provider or order authority.';
COMMENT ON TABLE trading_strategy_versions IS
  'Immutable approved research strategy snapshots. Runtime activation is a separate gate.';
COMMENT ON TABLE trading_strategy_audit_events IS
  'Sanitized strategy lifecycle audit events. Credentials and account identifiers are prohibited.';

COMMIT;
