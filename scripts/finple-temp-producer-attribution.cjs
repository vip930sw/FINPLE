const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  AGE_BUCKET_KEYS,
  buildFinpleTempBaselineAudit,
  classifyFinpleTempEntry,
  collectFinpleTempInventory,
} = require("./finple-temp-baseline-audit.cjs");

const AUDIT_ID = "finple_temp_producer_attribution";
const SOURCE_ROOTS = Object.freeze(["scripts", "server/src", "src"]);
const SOURCE_EXTENSIONS = Object.freeze([".js", ".cjs", ".mjs", ".ts", ".tsx", ".jsx"]);
const EXCLUDED_SEGMENTS = new Set(["node_modules", "dist", ".vite", "coverage", ".git"]);
const ATTRIBUTION_STATUSES = Object.freeze([
  "matched_source_producer",
  "ambiguous_source_producer",
  "unmatched_runtime_shape",
  "guard_owned_current_contract",
]);
const MATCH_REASONS = Object.freeze([
  "exact_literal_prefix",
  "normalized_literal_prefix",
  "multiple_source_candidates",
  "no_source_candidate",
  "current_guard_marker",
]);
const COHORT_KEYS = Object.freeze(["recent_cohort", "older_cohort", "unknown"]);

function makeCounter(keys) {
  return Object.fromEntries(keys.map((key) => [key, 0]));
}

function freezePlain(value) {
  if (!value || typeof value !== "object") return value;
  for (const child of Object.values(value)) freezePlain(child);
  return Object.freeze(value);
}

function toRepoPath(filePath) {
  return filePath.replace(/\\/g, "/");
}

function sourceCategoryFor(sourceFile) {
  if (sourceFile.includes(".test.")) return "script_test";
  if (sourceFile.startsWith("scripts/")) return "script_runtime";
  if (sourceFile.startsWith("server/src/")) return "server_src";
  if (sourceFile.startsWith("src/")) return "frontend_src";
  return "unknown";
}

function walkSourceFiles({
  sourceRoots = SOURCE_ROOTS,
  readdirSync = fs.readdirSync,
  statSync = fs.statSync,
} = {}) {
  const files = [];
  const stack = [...sourceRoots].sort().reverse();
  while (stack.length > 0) {
    const current = stack.pop();
    const segments = toRepoPath(current).split("/");
    if (segments.some((segment) => EXCLUDED_SEGMENTS.has(segment))) continue;
    let stat;
    try {
      stat = statSync(current);
    } catch (_error) {
      continue;
    }
    if (stat.isDirectory()) {
      const children = readdirSync(current).map((name) => path.join(current, name)).sort().reverse();
      stack.push(...children);
      continue;
    }
    if (!stat.isFile()) continue;
    if (!SOURCE_EXTENSIONS.includes(path.extname(current))) continue;
    files.push(toRepoPath(current));
  }
  return files.sort();
}

function extractFinpleLiterals(source) {
  const literals = [];
  const literalPattern = /(["'`])([\s\S]*?)\1/g;
  for (const match of source.matchAll(literalPattern)) {
    const value = match[2];
    const start = value.indexOf("finple-");
    if (start < 0) continue;
    const literal = value.slice(start).match(/^finple-[A-Za-z0-9._-]+/)?.[0];
    if (literal) literals.push(literal);
  }
  return literals;
}

function stripKnownDynamicSuffixes(value) {
  return value
    .replace(/[._-][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "")
    .replace(/[._-][0-9a-f]{12,}$/i, "")
    .replace(/[._-]\d{8,}$/i, "")
    .replace(/[._-]\d{3,}$/i, "")
    .replace(/[._-][A-Za-z0-9]{6,}$/i, "");
}

function normalizeProducerStem(value) {
  if (typeof value !== "string") return "unknown";
  const withoutPrefix = value.startsWith("finple-") ? value.slice("finple-".length) : value;
  const tokens = stripKnownDynamicSuffixes(withoutPrefix).split(/[._-]+/).filter(Boolean);
  if (tokens.length === 0) return "unknown";
  return tokens.map((token) => {
    if (/^step\d+$/i.test(token)) return "step";
    if (/^\d+$/.test(token)) return "number";
    if (/^[0-9a-f]{8,}$/i.test(token)) return "hex";
    return token.toLowerCase();
  }).slice(0, 5).join("_");
}

function buildFinpleTempProducerRegistry({
  sourceRoots = SOURCE_ROOTS,
  readdirSync = fs.readdirSync,
  statSync = fs.statSync,
  readFileSync = fs.readFileSync,
} = {}) {
  const candidates = [];
  for (const sourceFile of walkSourceFiles({ sourceRoots, readdirSync, statSync })) {
    let source;
    try {
      source = readFileSync(sourceFile, "utf8");
    } catch (_error) {
      continue;
    }
    for (const literalPrefix of [...new Set(extractFinpleLiterals(source))].sort()) {
      candidates.push({
        sourceFile,
        sourceCategory: sourceCategoryFor(sourceFile),
        literalPrefix,
        normalizedStem: normalizeProducerStem(literalPrefix),
        prefixPatternStatus: "literal_prefix_detected",
      });
    }
  }
  const producers = candidates
    .sort((a, b) => a.sourceFile.localeCompare(b.sourceFile) || a.normalizedStem.localeCompare(b.normalizedStem) || a.literalPrefix.localeCompare(b.literalPrefix))
    .map((candidate, index) => Object.freeze({
      producerId: `producer_${String(index + 1).padStart(3, "0")}`,
      ...candidate,
    }));
  return freezePlain({
    sourceRoots: [...SOURCE_ROOTS],
    sourceExtensions: [...SOURCE_EXTENSIONS],
    producerCount: producers.length,
    producers,
    rawNamesExposed: false,
    absolutePathsExposed: false,
    redacted: true,
  });
}

function publicProducer(producer) {
  return {
    producerId: producer.producerId,
    sourceCategory: producer.sourceCategory,
    sourceFile: producer.sourceFile,
    prefixPatternStatus: producer.prefixPatternStatus,
    matchingConfidence: "source_literal_candidate",
  };
}

function entryType(entry) {
  if (entry?.isDirectory === true) return "directory";
  if (entry?.isFile === true) return "file";
  return "other";
}

function nameLengthBucket(name) {
  const length = typeof name === "string" ? name.length : 0;
  if (length < 32) return "under_32";
  if (length < 64) return "32_to_63";
  if (length < 128) return "64_to_127";
  return "128_or_more";
}

function suffixClass(name) {
  const suffix = typeof name === "string" ? name.split(/[._-]+/).filter(Boolean).at(-1) || "" : "";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(suffix)) return "uuid_like";
  if (/^\d+$/.test(suffix)) return "numeric";
  if (/^[0-9a-f]{12,}$/i.test(suffix)) return "hex";
  if (/^[A-Za-z0-9]{6,}$/.test(suffix)) return "alphanumeric";
  if (/^[A-Za-z0-9]+\.[A-Za-z0-9]+$/.test(suffix)) return "extension_like";
  return "other";
}

function buildUnmatchedShape(entry, classified) {
  return {
    tokenCount: typeof entry?.name === "string" ? entry.name.split(/[._-]+/).filter(Boolean).length : 0,
    suffixClass: suffixClass(entry?.name),
    entryType: entryType(entry),
    nameLengthBucket: nameLengthBucket(entry?.name),
    ageBucket: classified.ageBucket,
    markerStatus: classified.markerStatus,
  };
}

function classifyHistoricalCohort(ageBucket) {
  if (ageBucket === "less_than_1_hour") return "recent_cohort";
  if (AGE_BUCKET_KEYS.includes(ageBucket)) return "older_cohort";
  return "unknown";
}

function classifyFinpleTempEntryProducer(entry, registry, { nowMs = Date.now() } = {}) {
  const classified = classifyFinpleTempEntry(entry, { nowMs });
  if (entry?.markerExists === true && typeof entry?.name === "string" && entry.name.startsWith("finple-test-guard-")) {
    return freezePlain({
      attributionStatus: "guard_owned_current_contract",
      matchReason: "current_guard_marker",
      producerIds: [],
      classified,
      shape: null,
    });
  }
  const producers = registry?.producers || [];
  const exactMatches = producers.filter((producer) => typeof entry?.name === "string" && entry.name.startsWith(producer.literalPrefix));
  const normalizedStem = normalizeProducerStem(entry?.name);
  const normalizedMatches = producers.filter((producer) => producer.normalizedStem === normalizedStem);
  const candidates = exactMatches.length > 0 ? exactMatches : normalizedMatches;
  const producerIds = [...new Set(candidates.map((producer) => producer.producerId))].sort();
  if (producerIds.length === 1) {
    return freezePlain({
      attributionStatus: "matched_source_producer",
      matchReason: exactMatches.length > 0 ? "exact_literal_prefix" : "normalized_literal_prefix",
      producerIds,
      classified,
      shape: null,
    });
  }
  if (producerIds.length > 1) {
    return freezePlain({
      attributionStatus: "ambiguous_source_producer",
      matchReason: "multiple_source_candidates",
      producerIds,
      classified,
      shape: null,
    });
  }
  return freezePlain({
    attributionStatus: "unmatched_runtime_shape",
    matchReason: "no_source_candidate",
    producerIds: [],
    classified,
    shape: buildUnmatchedShape(entry, classified),
  });
}

function buildFinpleTempProducerAttributionAudit({
  inventory = null,
  registry = null,
  nowMs = Date.now(),
  tmpDir = os.tmpdir(),
  readdirSync = fs.readdirSync,
  statSync = fs.statSync,
  existsSync = fs.existsSync,
  readFileSync = fs.readFileSync,
} = {}) {
  const entries = Array.isArray(inventory)
    ? inventory.map((entry) => ({ ...entry }))
    : collectFinpleTempInventory({ tmpDir, readdirSync, statSync, existsSync }) || [];
  const safeRegistry = registry || buildFinpleTempProducerRegistry({ readdirSync, statSync, readFileSync });
  const baseline = buildFinpleTempBaselineAudit({ inventory: entries, nowMs });
  const attributionStatusCounts = makeCounter(ATTRIBUTION_STATUSES);
  const matchReasonCounts = makeCounter(MATCH_REASONS);
  const producerCounts = {};
  const producerAgeBucketCounts = {};
  const producerEntryTypeCounts = {};
  const producerEvidence = {};
  const cohortCounts = makeCounter(COHORT_KEYS);
  const shapeCountsByKey = new Map();
  const shapeSummaryByKey = new Map();

  for (const producer of safeRegistry.producers || []) {
    producerCounts[producer.producerId] = 0;
    producerAgeBucketCounts[producer.producerId] = makeCounter(AGE_BUCKET_KEYS);
    producerEntryTypeCounts[producer.producerId] = { directory: 0, file: 0, other: 0 };
    producerEvidence[producer.producerId] = {
      sourceMatched: false,
      markerPresent: false,
      createdDuringControlledRun: false,
      countStableAcrossControlledRun: "not_measured",
      ageDistribution: makeCounter(AGE_BUCKET_KEYS),
      entryTypeDistribution: { directory: 0, file: 0, other: 0 },
      cleanupEligibility: "not_assessed",
      deletionApproved: false,
      deletionAttempted: false,
    };
  }

  for (const entry of entries) {
    const attribution = classifyFinpleTempEntryProducer(entry, safeRegistry, { nowMs });
    attributionStatusCounts[attribution.attributionStatus] += 1;
    matchReasonCounts[attribution.matchReason] += 1;
    cohortCounts[classifyHistoricalCohort(attribution.classified.ageBucket)] += 1;
    if (attribution.attributionStatus === "unmatched_runtime_shape") {
      const key = JSON.stringify(attribution.shape);
      shapeCountsByKey.set(key, (shapeCountsByKey.get(key) || 0) + 1);
      shapeSummaryByKey.set(key, attribution.shape);
      continue;
    }
    for (const producerId of attribution.producerIds) {
      producerCounts[producerId] = (producerCounts[producerId] || 0) + 1;
      producerAgeBucketCounts[producerId][attribution.classified.ageBucket] += 1;
      producerEntryTypeCounts[producerId][attribution.classified.type] += 1;
      producerEvidence[producerId].sourceMatched = true;
      producerEvidence[producerId].markerPresent = producerEvidence[producerId].markerPresent || attribution.classified.markerStatus === "present";
      producerEvidence[producerId].ageDistribution[attribution.classified.ageBucket] += 1;
      producerEvidence[producerId].entryTypeDistribution[attribution.classified.type] += 1;
    }
  }

  const unmatchedShapeCounts = {};
  const unmatchedShapeSummaries = [];
  [...shapeCountsByKey.keys()].sort().forEach((key, index) => {
    const shapeId = `unmatched_shape_${String(index + 1).padStart(3, "0")}`;
    unmatchedShapeCounts[shapeId] = shapeCountsByKey.get(key);
    unmatchedShapeSummaries.push({ shapeId, ...shapeSummaryByKey.get(key) });
  });

  return freezePlain({
    auditId: AUDIT_ID,
    snapshotStatus: "complete",
    sourceProducerCount: safeRegistry.producerCount || 0,
    totalFinpleEntryCount: baseline.totalFinpleEntryCount,
    directoryCount: baseline.directoryCount,
    fileCount: baseline.fileCount,
    attributionStatusCounts,
    matchReasonCounts,
    matchedProducerCount: attributionStatusCounts.matched_source_producer,
    ambiguousCount: attributionStatusCounts.ambiguous_source_producer,
    unmatchedCount: attributionStatusCounts.unmatched_runtime_shape,
    guardOwnedCurrentContractCount: attributionStatusCounts.guard_owned_current_contract,
    producerCounts,
    producerAgeBucketCounts,
    producerEntryTypeCounts,
    producerEvidence,
    unmatchedShapeCounts,
    unmatchedShapeSummaries,
    historicalCohortCounts: cohortCounts,
    producers: (safeRegistry.producers || []).map(publicProducer),
    cleanupEligibility: "not_assessed",
    deletionApproved: false,
    deletionAttempted: false,
    rawNamesExposed: false,
    absolutePathsExposed: false,
    redacted: true,
  });
}

function diffCounter(beforeCounts = {}, afterCounts = {}, keys = []) {
  const allKeys = keys.length > 0 ? keys : [...new Set([...Object.keys(beforeCounts || {}), ...Object.keys(afterCounts || {})])].sort();
  return Object.fromEntries(allKeys.map((key) => [key, (afterCounts[key] || 0) - (beforeCounts[key] || 0)]));
}

function diffFinpleTempProducerAttributionAudits(before, after) {
  return freezePlain({
    totalCountDelta: (after?.totalFinpleEntryCount ?? 0) - (before?.totalFinpleEntryCount ?? 0),
    matchedProducerCountDelta: (after?.matchedProducerCount ?? 0) - (before?.matchedProducerCount ?? 0),
    ambiguousCountDelta: (after?.ambiguousCount ?? 0) - (before?.ambiguousCount ?? 0),
    unmatchedCountDelta: (after?.unmatchedCount ?? 0) - (before?.unmatchedCount ?? 0),
    unmatchedShapeDelta: Object.values(diffCounter(before?.unmatchedShapeCounts, after?.unmatchedShapeCounts)).reduce((sum, value) => sum + value, 0),
    producerCountDeltas: diffCounter(before?.producerCounts, after?.producerCounts),
    attributionStatusDeltas: diffCounter(before?.attributionStatusCounts, after?.attributionStatusCounts, ATTRIBUTION_STATUSES),
  });
}

function buildFinpleTempProducerAttributionPublicSummary(audit) {
  return freezePlain({
    auditId: AUDIT_ID,
    snapshotStatus: audit?.snapshotStatus || "unknown",
    sourceProducerCount: audit?.sourceProducerCount ?? 0,
    totalFinpleEntryCount: audit?.totalFinpleEntryCount ?? null,
    directoryCount: audit?.directoryCount ?? null,
    fileCount: audit?.fileCount ?? null,
    attributionStatusCounts: { ...audit?.attributionStatusCounts },
    matchReasonCounts: { ...audit?.matchReasonCounts },
    matchedProducerCount: audit?.matchedProducerCount ?? 0,
    ambiguousCount: audit?.ambiguousCount ?? 0,
    unmatchedCount: audit?.unmatchedCount ?? 0,
    guardOwnedCurrentContractCount: audit?.guardOwnedCurrentContractCount ?? 0,
    producerCounts: { ...audit?.producerCounts },
    producerAgeBucketCounts: { ...audit?.producerAgeBucketCounts },
    producerEntryTypeCounts: { ...audit?.producerEntryTypeCounts },
    producerEvidence: { ...audit?.producerEvidence },
    unmatchedShapeCounts: { ...audit?.unmatchedShapeCounts },
    unmatchedShapeSummaries: [...(audit?.unmatchedShapeSummaries || [])],
    historicalCohortCounts: { ...audit?.historicalCohortCounts },
    producers: [...(audit?.producers || [])],
    cleanupEligibility: "not_assessed",
    deletionApproved: false,
    deletionAttempted: false,
    rawNamesExposed: false,
    absolutePathsExposed: false,
    redacted: true,
  });
}

function printJson(value, stream = process.stdout) {
  stream.write(`${JSON.stringify(value, null, 2)}\n`);
}

function main(_argv = [], { stdout = process.stdout } = {}) {
  const audit = buildFinpleTempProducerAttributionAudit();
  printJson(buildFinpleTempProducerAttributionPublicSummary(audit), stdout);
  return 0;
}

if (require.main === module) {
  process.exitCode = main();
}

module.exports = {
  ATTRIBUTION_STATUSES,
  AUDIT_ID,
  COHORT_KEYS,
  SOURCE_EXTENSIONS,
  SOURCE_ROOTS,
  buildFinpleTempProducerAttributionAudit,
  buildFinpleTempProducerAttributionPublicSummary,
  buildFinpleTempProducerRegistry,
  classifyFinpleTempEntryProducer,
  diffFinpleTempProducerAttributionAudits,
  extractFinpleLiterals,
  main,
  normalizeProducerStem,
  walkSourceFiles,
};
