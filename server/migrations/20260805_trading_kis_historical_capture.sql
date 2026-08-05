BEGIN;

CREATE TABLE IF NOT EXISTS trading_kis_market_data_minutes (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'KIS',
  symbol TEXT NOT NULL,
  minute_start TIMESTAMPTZ NOT NULL,
  minute_end TIMESTAMPTZ NOT NULL,
  session_date DATE NOT NULL,
  open NUMERIC NOT NULL,
  high NUMERIC NOT NULL,
  low NUMERIC NOT NULL,
  close NUMERIC NOT NULL,
  volume NUMERIC NOT NULL,
  trade_count INTEGER NOT NULL,
  bid NUMERIC NOT NULL,
  ask NUMERIC NOT NULL,
  bid_size NUMERIC,
  ask_size NUMERIC,
  spread_bps NUMERIC NOT NULL,
  source TEXT NOT NULL,
  calendar_version TEXT NOT NULL,
  row_checksum TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL,
  UNIQUE (provider, symbol, minute_start)
);

CREATE INDEX IF NOT EXISTS trading_kis_market_data_minutes_session_idx
  ON trading_kis_market_data_minutes (session_date, minute_start, symbol);

CREATE TABLE IF NOT EXISTS trading_kis_market_data_revisions (
  id UUID PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'KIS',
  session_date DATE NOT NULL,
  dataset_id TEXT NOT NULL,
  source_revision TEXT NOT NULL,
  raw_data_checksum TEXT NOT NULL,
  calendar_version TEXT NOT NULL,
  license_policy_id TEXT NOT NULL,
  selected_symbols JSONB NOT NULL,
  coverage JSONB NOT NULL,
  row_count INTEGER NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT TRUE,
  ready_for_model_research BOOLEAN NOT NULL DEFAULT FALSE,
  sealed_at TIMESTAMPTZ NOT NULL,
  sealed_by TEXT NOT NULL,
  UNIQUE (provider, session_date)
);

COMMIT;
