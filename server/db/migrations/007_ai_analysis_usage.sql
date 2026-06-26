BEGIN;

CREATE TABLE IF NOT EXISTS ai_analysis_usage_events (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_key TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'ip')),
  plan TEXT NOT NULL DEFAULT 'guest',
  mode TEXT,
  provider TEXT,
  portfolio_id TEXT,
  input_hash TEXT,
  status TEXT NOT NULL CHECK (status IN ('reserved', 'succeeded', 'failed', 'canceled')),
  reserved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  window_started_at TIMESTAMPTZ NOT NULL,
  window_ends_at TIMESTAMPTZ NOT NULL,
  request_ip TEXT,
  user_agent TEXT,
  error_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_actor_window
  ON ai_analysis_usage_events(actor_key, reserved_at DESC, status);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_user_reserved
  ON ai_analysis_usage_events(user_id, reserved_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_usage_status_reserved
  ON ai_analysis_usage_events(status, reserved_at DESC);

COMMIT;
