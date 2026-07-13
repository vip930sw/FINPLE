const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  AGE_BUCKET_KEYS,
  GUARD_MARKER,
  buildFinpleTempBaselineAudit,
  buildFinpleTempBaselinePublicSummary,
  classifyFinpleTempEntry,
  diffFinpleTempBaselineAudits,
  main,
} = require("./finple-temp-baseline-audit.cjs");

function withFixture(fn) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "finple-temp-baseline-audit-fixture-"));
  try {
    return fn(fixture);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function sampleEntry(name, overrides = {}) {
  return {
    name,
    isDirectory: true,
    isFile: false,
    mtimeMs: 10_000,
    markerExists: false,
    ...overrides,
  };
}

test("Scenario A: family classification avoids raw suffix exposure", () => {
  const unique = "secret-unique-suffix-12345";
  assert.equal(classifyFinpleTempEntry(sampleEntry(`finple-test-guard-${unique}`)).family, "guard_owned_prefix");
  assert.equal(classifyFinpleTempEntry(sampleEntry("finple-step221-runner-999")).family, "step_runner_prefix");
  assert.equal(classifyFinpleTempEntry(sampleEntry("finple-temp-baseline-audit-fixture-abc")).family, "test_fixture_prefix");
  assert.equal(classifyFinpleTempEntry(sampleEntry("finple-pre-existing-artifact")).family, "other_known_finple_prefix");
  const unknown = classifyFinpleTempEntry(sampleEntry(`finple-mystery-${unique}`));
  assert.equal(unknown.family, "unclassified_finple_prefix");
  assert.equal(JSON.stringify(unknown).includes(unique), false);
});

test("Scenario B: marker classification separates guard and unmanaged entries", () => {
  const audit = buildFinpleTempBaselineAudit({
    nowMs: 20_000,
    inventory: [
      sampleEntry("finple-test-guard-a", { markerExists: true }),
      sampleEntry("finple-test-guard-b", { markerExists: false }),
      sampleEntry("finple-pre-existing-c", { markerExists: true }),
    ],
  });

  assert.equal(audit.markerPresentCount, 2);
  assert.equal(audit.markerMissingCount, 1);
  assert.equal(audit.guardPrefixWithMarkerCount, 1);
  assert.equal(audit.guardPrefixWithoutMarkerCount, 1);
  assert.equal(audit.unmanagedEntryCount, 2);
});

test("Scenario C: age buckets use injectable nowMs boundaries", () => {
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const nowMs = 100 * dayMs;
  const entries = [
    sampleEntry("finple-a", { mtimeMs: nowMs - 30 * 60 * 1000 }),
    sampleEntry("finple-b", { mtimeMs: nowMs - hourMs }),
    sampleEntry("finple-c", { mtimeMs: nowMs - dayMs }),
    sampleEntry("finple-d", { mtimeMs: nowMs - 7 * dayMs }),
    sampleEntry("finple-e", { mtimeMs: nowMs - 30 * dayMs }),
    sampleEntry("finple-f", { mtimeMs: null }),
  ];
  const audit = buildFinpleTempBaselineAudit({ nowMs, inventory: entries });

  for (const bucket of AGE_BUCKET_KEYS) {
    assert.equal(audit.ageBucketCounts[bucket], 1, bucket);
  }
});

test("Scenario D: public summary exposes no raw path or raw entry identity", () => {
  withFixture((fixture) => {
    const rawName = "finple-test-guard-raw-unique-999";
    const rawPath = path.join(fixture, rawName);
    fs.mkdirSync(rawPath);
    fs.writeFileSync(path.join(rawPath, GUARD_MARKER), "owned\n");

    const audit = buildFinpleTempBaselineAudit({ tmpDir: fixture, nowMs: Date.now() });
    const summary = buildFinpleTempBaselinePublicSummary(audit);
    const serialized = JSON.stringify(summary);

    assert.equal(serialized.includes(fixture), false);
    assert.equal(serialized.includes(rawName), false);
    assert.equal(serialized.includes(os.userInfo().username), false);
    assert.equal(summary.rawNamesExposed, false);
    assert.equal(summary.absolutePathsExposed, false);
    assert.equal(summary.deletionAttempted, false);
  });
});

test("Scenario E: snapshot increase reports increased delta", () => {
  const before = buildFinpleTempBaselineAudit({ inventory: Array.from({ length: 10 }, (_, index) => sampleEntry(`finple-before-${index}`)) });
  const after = buildFinpleTempBaselineAudit({ inventory: Array.from({ length: 12 }, (_, index) => sampleEntry(`finple-after-${index}`)) });
  const diff = diffFinpleTempBaselineAudits(before, after);

  assert.equal(diff.totalCountDelta, 2);
  assert.equal(diff.status, "increased");
});

test("Scenario F: identical snapshots report stable", () => {
  const audit = buildFinpleTempBaselineAudit({ inventory: [sampleEntry("finple-stable")] });
  const diff = diffFinpleTempBaselineAudits(audit, audit);

  assert.equal(diff.totalCountDelta, 0);
  assert.equal(diff.unmanagedEntryDelta, 0);
  assert.equal(diff.guardOwnedPrefixDelta, 0);
  assert.equal(diff.status, "stable");
});

test("Scenario G: audit source has no deletion or write capability", () => {
  const source = fs.readFileSync("scripts/finple-temp-baseline-audit.cjs", "utf8");
  for (const forbidden of [
    "fs.rm",
    "fs.unlink",
    "fs.rmdir",
    "fs.writeFile",
    "fs.mkdir",
    "fs.rename",
    "child_process",
    "spawn",
    "exec",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("Scenario H: mutation resistance keeps inventory and options unchanged", () => {
  const inventory = [sampleEntry("finple-test-guard-mut", { markerExists: true })];
  const options = { inventory, nowMs: 30_000 };
  const before = JSON.stringify(options);
  const audit = buildFinpleTempBaselineAudit(options);

  assert.equal(JSON.stringify(options), before);
  assert.equal(audit.guardPrefixWithMarkerCount, 1);
});

test("CLI prints public summary JSON only", () => {
  let output = "";
  const code = main([], {
    stdout: {
      write: (chunk) => {
        output += chunk;
      },
    },
  });
  const parsed = JSON.parse(output);

  assert.equal(code, 0);
  assert.equal(parsed.auditId, "finple_temp_baseline_provenance");
  assert.equal(parsed.snapshotStatus, "complete");
  assert.equal(parsed.rawNamesExposed, false);
  assert.equal(parsed.absolutePathsExposed, false);
});
