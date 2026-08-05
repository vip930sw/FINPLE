BEGIN;

CREATE TABLE IF NOT EXISTS trading_kis_shadow_feed_checkpoints (
  id UUID PRIMARY KEY,
  feed_key TEXT NOT NULL,
  shadow_run_id UUID,
  strategy_version_id UUID,
  strategy_version_number INTEGER,
  operational_state TEXT NOT NULL,
  runner_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  guard_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_symbols JSONB NOT NULL DEFAULT '[]'::jsonb,
  stop_reason TEXT,
  manual_resume_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trading_kis_shadow_feed_checkpoints_latest
  ON trading_kis_shadow_feed_checkpoints (feed_key, created_at DESC);

COMMIT;
