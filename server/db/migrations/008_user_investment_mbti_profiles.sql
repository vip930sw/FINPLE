CREATE TABLE IF NOT EXISTS user_investment_mbti_profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type_id TEXT NOT NULL,
  result_name TEXT,
  nickname TEXT,
  finple_type TEXT,
  risk_profile TEXT,
  risk_score NUMERIC,
  axes JSONB NOT NULL DEFAULT '{}'::jsonb,
  axis_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  preset_weights JSONB NOT NULL DEFAULT '{}'::jsonb,
  market_mode TEXT,
  source TEXT NOT NULL DEFAULT 'investment-mbti',
  profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_investment_mbti_profiles_user_unique UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_investment_mbti_profiles_user_updated
  ON user_investment_mbti_profiles(user_id, updated_at DESC);
