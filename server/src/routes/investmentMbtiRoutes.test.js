import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROUTE_SOURCE = new URL("./investmentMbtiRoutes.js", import.meta.url);
const INDEX_SOURCE = new URL("../index.js", import.meta.url);
const MIGRATION_SOURCE = new URL("../../db/migrations/008_user_investment_mbti_profiles.sql", import.meta.url);

test("investment MBTI route exposes authenticated latest-profile GET and upsert PUT only", async () => {
  const source = await readFile(ROUTE_SOURCE, "utf8");
  const indexSource = await readFile(INDEX_SOURCE, "utf8");

  assert.match(indexSource, /app\.use\("\/api\/account\/investment-mbti", investmentMbtiRoutes\)/);
  assert.match(source, /router\.get\("\/"/);
  assert.match(source, /router\.put\("\/"/);
  assert.doesNotMatch(source, /router\.delete\(/);
  assert.match(source, /getUserBySessionToken\(sessionToken\)/);
  assert.match(source, /getUserByAuthHeader\(headerUserId\)/);
  assert.match(source, /ON CONFLICT \(user_id\)/);
});

test("investment MBTI migration is idempotent and stores profile dimensions", async () => {
  const migration = await readFile(MIGRATION_SOURCE, "utf8");

  assert.match(migration, /CREATE TABLE IF NOT EXISTS user_investment_mbti_profiles/);
  assert.match(migration, /user_id UUID NOT NULL REFERENCES users\(id\) ON DELETE CASCADE/);
  assert.match(migration, /type_id TEXT NOT NULL/);
  assert.match(migration, /axes JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
  assert.match(migration, /axis_scores JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
  assert.match(migration, /preset_weights JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
  assert.match(migration, /CONSTRAINT user_investment_mbti_profiles_user_unique UNIQUE \(user_id\)/);
  assert.doesNotMatch(migration, /\bDROP\b|\bTRUNCATE\b/i);
  assert.doesNotMatch(migration, /\bDELETE\s+FROM\b/i);
});
