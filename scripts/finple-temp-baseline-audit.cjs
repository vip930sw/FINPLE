const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const AUDIT_ID = "finple_temp_baseline_provenance";
const GUARD_MARKER = ".finple-test-guard-owned";

const FAMILY_KEYS = Object.freeze([
  "guard_owned_prefix",
  "step_runner_prefix",
  "test_fixture_prefix",
  "other_known_finple_prefix",
  "unclassified_finple_prefix",
]);

const AGE_BUCKET_KEYS = Object.freeze([
  "less_than_1_hour",
  "1_to_24_hours",
  "1_to_7_days",
  "7_to_30_days",
  "more_than_30_days",
  "unknown",
]);

const MARKER_STATUS_KEYS = Object.freeze(["present", "missing"]);

function makeCounter(keys) {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}

function freezePlain(value) {
  if (!value || typeof value !== "object") return value;
  for (const child of Object.values(value)) freezePlain(child);
  return Object.freeze(value);
}

function classifyFamily(name) {
  if (typeof name !== "string") return "unclassified_finple_prefix";
  if (name.startsWith("finple-test-guard-")) return "guard_owned_prefix";
  if (/^finple-step\d+-runner-/.test(name)) return "step_runner_prefix";
  if (/^finple-(?:temp-baseline-audit|test-fixture|fixture|baseline-fixture)-/.test(name)) return "test_fixture_prefix";
  if (/^finple-(?:pre-existing|existing|ai-live-check|ai-production-check)/.test(name)) return "other_known_finple_prefix";
  return "unclassified_finple_prefix";
}

function classifyType(entry) {
  if (entry?.isDirectory === true) return "directory";
  if (entry?.isFile === true) return "file";
  return "other";
}

function classifyAgeBucket(mtimeMs, nowMs) {
  if (!Number.isFinite(mtimeMs) || !Number.isFinite(nowMs)) return "unknown";
  const ageMs = Math.max(0, nowMs - mtimeMs);
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  if (ageMs < hourMs) return "less_than_1_hour";
  if (ageMs < dayMs) return "1_to_24_hours";
  if (ageMs < 7 * dayMs) return "1_to_7_days";
  if (ageMs < 30 * dayMs) return "7_to_30_days";
  return "more_than_30_days";
}

function classifyFinpleTempEntry(entry, { nowMs = Date.now() } = {}) {
  return freezePlain({
    family: classifyFamily(entry?.name),
    type: classifyType(entry),
    ageBucket: classifyAgeBucket(entry?.mtimeMs, nowMs),
    markerStatus: entry?.markerExists === true ? "present" : "missing",
  });
}

function collectFinpleTempInventory({
  tmpDir = os.tmpdir(),
  readdirSync = fs.readdirSync,
  statSync = fs.statSync,
  existsSync = fs.existsSync,
} = {}) {
  try {
    return readdirSync(tmpDir, { withFileTypes: true })
      .filter((entry) => entry.name.startsWith("finple-"))
      .map((entry) => {
        const entryPath = path.join(tmpDir, entry.name);
        let stat = null;
        try {
          stat = statSync(entryPath);
        } catch (_error) {
          stat = null;
        }
        const isDirectory = stat ? stat.isDirectory() : entry.isDirectory();
        const markerExists = isDirectory ? existsSync(path.join(entryPath, GUARD_MARKER)) : false;
        return {
          name: entry.name,
          isDirectory,
          isFile: stat ? stat.isFile() : entry.isFile(),
          mtimeMs: stat ? stat.mtimeMs : null,
          markerExists,
        };
      });
  } catch (_error) {
    return null;
  }
}

function buildFinpleTempBaselineAudit({
  inventory = null,
  nowMs = Date.now(),
  tmpDir = os.tmpdir(),
  readdirSync = fs.readdirSync,
  statSync = fs.statSync,
  existsSync = fs.existsSync,
} = {}) {
  const entries = Array.isArray(inventory)
    ? inventory.map((entry) => ({ ...entry }))
    : collectFinpleTempInventory({ tmpDir, readdirSync, statSync, existsSync });

  const familyCounts = makeCounter(FAMILY_KEYS);
  const ageBucketCounts = makeCounter(AGE_BUCKET_KEYS);
  const markerStatusCounts = makeCounter(MARKER_STATUS_KEYS);
  const typeCounts = { directory: 0, file: 0, other: 0 };

  if (!Array.isArray(entries)) {
    return freezePlain({
      auditId: AUDIT_ID,
      status: "unknown",
      totalFinpleEntryCount: null,
      directoryCount: null,
      fileCount: null,
      guardOwnedPrefixCount: null,
      markerPresentCount: null,
      markerMissingCount: null,
      guardPrefixWithMarkerCount: null,
      guardPrefixWithoutMarkerCount: null,
      unmanagedEntryCount: null,
      familyCounts,
      ageBucketCounts,
      markerStatusCounts,
      rawNamesExposed: false,
      absolutePathsExposed: false,
      deletionAttempted: false,
      redacted: true,
    });
  }

  let guardPrefixWithMarkerCount = 0;
  let guardPrefixWithoutMarkerCount = 0;

  for (const entry of entries) {
    const classified = classifyFinpleTempEntry(entry, { nowMs });
    familyCounts[classified.family] += 1;
    ageBucketCounts[classified.ageBucket] += 1;
    markerStatusCounts[classified.markerStatus] += 1;
    typeCounts[classified.type] += 1;
    if (classified.family === "guard_owned_prefix" && classified.markerStatus === "present") {
      guardPrefixWithMarkerCount += 1;
    }
    if (classified.family === "guard_owned_prefix" && classified.markerStatus === "missing") {
      guardPrefixWithoutMarkerCount += 1;
    }
  }

  const totalFinpleEntryCount = entries.length;
  const markerPresentCount = markerStatusCounts.present;
  const markerMissingCount = markerStatusCounts.missing;
  const guardOwnedPrefixCount = familyCounts.guard_owned_prefix;
  const unmanagedEntryCount = totalFinpleEntryCount - guardPrefixWithMarkerCount;

  return freezePlain({
    auditId: AUDIT_ID,
    status: "stable",
    totalFinpleEntryCount,
    directoryCount: typeCounts.directory,
    fileCount: typeCounts.file,
    guardOwnedPrefixCount,
    markerPresentCount,
    markerMissingCount,
    guardPrefixWithMarkerCount,
    guardPrefixWithoutMarkerCount,
    unmanagedEntryCount,
    familyCounts,
    ageBucketCounts,
    markerStatusCounts,
    rawNamesExposed: false,
    absolutePathsExposed: false,
    deletionAttempted: false,
    redacted: true,
  });
}

function diffCounter(beforeCounts = {}, afterCounts = {}, keys) {
  return Object.fromEntries(keys.map((key) => [key, (afterCounts[key] || 0) - (beforeCounts[key] || 0)]));
}

function classifyDeltaStatus(delta) {
  if (!Number.isFinite(delta)) return "unknown";
  if (delta > 0) return "increased";
  if (delta < 0) return "decreased";
  return "stable";
}

function diffFinpleTempBaselineAudits(before, after) {
  const totalCountDelta = Number.isFinite(before?.totalFinpleEntryCount) && Number.isFinite(after?.totalFinpleEntryCount)
    ? after.totalFinpleEntryCount - before.totalFinpleEntryCount
    : null;
  const guardOwnedPrefixDelta = Number.isFinite(before?.guardOwnedPrefixCount) && Number.isFinite(after?.guardOwnedPrefixCount)
    ? after.guardOwnedPrefixCount - before.guardOwnedPrefixCount
    : null;
  const markerPresentDelta = Number.isFinite(before?.markerPresentCount) && Number.isFinite(after?.markerPresentCount)
    ? after.markerPresentCount - before.markerPresentCount
    : null;
  const unmanagedEntryDelta = Number.isFinite(before?.unmanagedEntryCount) && Number.isFinite(after?.unmanagedEntryCount)
    ? after.unmanagedEntryCount - before.unmanagedEntryCount
    : null;

  return freezePlain({
    status: classifyDeltaStatus(totalCountDelta),
    totalCountDelta,
    guardOwnedPrefixDelta,
    markerPresentDelta,
    unmanagedEntryDelta,
    familyCountDeltas: diffCounter(before?.familyCounts, after?.familyCounts, FAMILY_KEYS),
    ageBucketCountDeltas: diffCounter(before?.ageBucketCounts, after?.ageBucketCounts, AGE_BUCKET_KEYS),
  });
}

function buildFinpleTempBaselinePublicSummary(audit) {
  return freezePlain({
    auditId: AUDIT_ID,
    status: audit?.status || "unknown",
    totalFinpleEntryCount: audit?.totalFinpleEntryCount ?? null,
    directoryCount: audit?.directoryCount ?? null,
    fileCount: audit?.fileCount ?? null,
    guardOwnedPrefixCount: audit?.guardOwnedPrefixCount ?? null,
    markerPresentCount: audit?.markerPresentCount ?? null,
    markerMissingCount: audit?.markerMissingCount ?? null,
    guardPrefixWithMarkerCount: audit?.guardPrefixWithMarkerCount ?? null,
    guardPrefixWithoutMarkerCount: audit?.guardPrefixWithoutMarkerCount ?? null,
    unmanagedEntryCount: audit?.unmanagedEntryCount ?? null,
    familyCounts: { ...audit?.familyCounts },
    ageBucketCounts: { ...audit?.ageBucketCounts },
    markerStatusCounts: { ...audit?.markerStatusCounts },
    rawNamesExposed: false,
    absolutePathsExposed: false,
    deletionAttempted: false,
    redacted: true,
  });
}

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function main(_argv = process.argv.slice(2), { stdout = process.stdout } = {}) {
  const audit = buildFinpleTempBaselineAudit();
  printJson(buildFinpleTempBaselinePublicSummary(audit), stdout);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  AGE_BUCKET_KEYS,
  AUDIT_ID,
  FAMILY_KEYS,
  GUARD_MARKER,
  MARKER_STATUS_KEYS,
  buildFinpleTempBaselineAudit,
  buildFinpleTempBaselinePublicSummary,
  classifyFinpleTempEntry,
  diffFinpleTempBaselineAudits,
  main,
};
