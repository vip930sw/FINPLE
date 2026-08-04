BEGIN;

CREATE TABLE IF NOT EXISTS trading_shadow_runs (
  id UUID PRIMARY KEY,
  strategy_key TEXT NOT NULL,
  strategy_version_id UUID NOT NULL REFERENCES trading_strategy_versions(id),
  strategy_version_number INTEGER NOT NULL,
  strategy_checksum TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'running', 'stopped', 'failed')),
  initial_cash NUMERIC(22, 6) NOT NULL CHECK (initial_cash > 0),
  started_at TIMESTAMPTZ,
  stopped_at TIMESTAMPTZ,
  stop_reason TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trading_shadow_snapshots (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES trading_shadow_runs(id) ON DELETE CASCADE,
  sequence_number BIGINT NOT NULL CHECK (sequence_number >= 0),
  as_of TIMESTAMPTZ,
  worker_status TEXT NOT NULL,
  observation_sessions INTEGER NOT NULL DEFAULT 0 CHECK (observation_sessions >= 0),
  cycle_count BIGINT NOT NULL DEFAULT 0 CHECK (cycle_count >= 0),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  promotion_assessment JSONB NOT NULL DEFAULT '{}'::jsonb,
  positions JSONB NOT NULL DEFAULT '{}'::jsonb,
  recent_orders JSONB NOT NULL DEFAULT '[]'::jsonb,
  recent_fills JSONB NOT NULL DEFAULT '[]'::jsonb,
  recent_trades JSONB NOT NULL DEFAULT '[]'::jsonb,
  equity_curve JSONB NOT NULL DEFAULT '[]'::jsonb,
  daily_pnl JSONB NOT NULL DEFAULT '[]'::jsonb,
  rolling_windows JSONB NOT NULL DEFAULT '[]'::jsonb,
  performance_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  snapshot_checksum TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (run_id, sequence_number)
);

CREATE INDEX IF NOT EXISTS idx_trading_shadow_runs_strategy_status
  ON trading_shadow_runs(strategy_key, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trading_shadow_snapshots_run_sequence
  ON trading_shadow_snapshots(run_id, sequence_number DESC);

CREATE INDEX IF NOT EXISTS idx_trading_shadow_snapshots_created
  ON trading_shadow_snapshots(created_at DESC);

COMMENT ON TABLE trading_shadow_runs IS
  'Private Trading Lab virtual-only shadow runs. No account identifier or broker order payload is stored.';

COMMENT ON TABLE trading_shadow_snapshots IS
  'Sanitized virtual execution and performance snapshots. Raw provider responses and credentials are prohibited.';

COMMIT;
