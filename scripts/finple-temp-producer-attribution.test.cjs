const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  buildFinpleTempProducerAttributionAudit,
  buildFinpleTempProducerAttributionPublicSummary,
  buildFinpleTempProducerRegistry,
  classifyFinpleTempEntryProducer,
  diffFinpleTempProducerAttributionAudits,
  main,
  normalizeProducerStem,
  walkSourceFiles,
} = require("./finple-temp-producer-attribution.cjs");

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

function sampleRegistry(producers) {
  return {
    producerCount: producers.length,
    producers: producers.map((producer, index) => ({
      producerId: producer.producerId || `producer_${String(index + 1).padStart(3, "0")}`,
      sourceCategory: producer.sourceCategory || "script_test",
      sourceFile: producer.sourceFile || `scripts/source-${index}.test.cjs`,
      literalPrefix: producer.literalPrefix,
      normalizedStem: producer.normalizedStem || normalizeProducerStem(producer.literalPrefix),
      prefixPatternStatus: "literal_prefix_detected",
    })),
  };
}

test("Scenario A: exact source producer match", () => {
  const registry = sampleRegistry([{ literalPrefix: "finple-known-producer-" }]);
  const result = classifyFinpleTempEntryProducer(sampleEntry("finple-known-producer-12345"), registry);

  assert.equal(result.attributionStatus, "matched_source_producer");
  assert.equal(result.matchReason, "exact_literal_prefix");
  assert.deepEqual(result.producerIds, ["producer_001"]);
});

test("Scenario B: normalized suffix match removes numeric uuid and hex suffixes", () => {
  const registry = sampleRegistry([{ literalPrefix: "finple-step216-runner-" }]);
  for (const name of [
    "finple-step216-runner-12345",
    "finple-step216-runner-550e8400-e29b-41d4-a716-446655440000",
    "finple-step216-runner-abcdefabcdef",
  ]) {
    const result = classifyFinpleTempEntryProducer(sampleEntry(name), registry);
    assert.equal(result.attributionStatus, "matched_source_producer");
  }
});

test("Scenario C: ambiguous producer reports multiple candidates without raw names", () => {
  const registry = sampleRegistry([
    { literalPrefix: "finple-same-source-" },
    { literalPrefix: "finple-same-source-" },
  ]);
  const result = classifyFinpleTempEntryProducer(sampleEntry("finple-same-source-123"), registry);

  assert.equal(result.attributionStatus, "ambiguous_source_producer");
  assert.equal(result.matchReason, "multiple_source_candidates");
  assert.equal(JSON.stringify(result).includes("finple-same-source-123"), false);
});

test("Scenario D: unmatched shape exposes structure and shape ID only", () => {
  const audit = buildFinpleTempProducerAttributionAudit({
    inventory: [sampleEntry("finple-private-runtime-abc123", { mtimeMs: 1_000 })],
    registry: sampleRegistry([]),
    nowMs: 2_000,
  });
  const serialized = JSON.stringify(buildFinpleTempProducerAttributionPublicSummary(audit));

  assert.equal(audit.unmatchedCount, 1);
  assert.equal(Object.keys(audit.unmatchedShapeCounts)[0], "unmatched_shape_001");
  assert.equal(serialized.includes("finple-private-runtime-abc123"), false);
});

test("Scenario E: deterministic producer IDs ignore source traversal order", () => {
  const fakeSource = {
    "scripts/a.cjs": "const a = 'finple-alpha-';",
    "scripts/b.cjs": "const b = 'finple-beta-';",
  };
  const registry = buildFinpleTempProducerRegistry({
    sourceRoots: ["scripts"],
    statSync: (filePath) => ({
      isDirectory: () => filePath === "scripts",
      isFile: () => filePath !== "scripts",
    }),
    readdirSync: () => ["b.cjs", "a.cjs"],
    readFileSync: (filePath) => fakeSource[filePath.replace(/\\/g, "/")],
  });

  assert.equal(registry.producers[0].sourceFile, "scripts/a.cjs");
  assert.equal(registry.producers[0].producerId, "producer_001");
  assert.equal(registry.producers[1].producerId, "producer_002");
});

test("Scenario F: no raw identity exposure in public summary", () => {
  const rawName = "finple-secret-550e8400-e29b-41d4-a716-446655440000";
  const fixturePath = path.join(os.tmpdir(), rawName);
  const audit = buildFinpleTempProducerAttributionAudit({
    inventory: [sampleEntry(rawName)],
    registry: sampleRegistry([]),
  });
  const serialized = JSON.stringify(buildFinpleTempProducerAttributionPublicSummary(audit));

  assert.equal(serialized.includes(rawName), false);
  assert.equal(serialized.includes(fixturePath), false);
  assert.equal(serialized.includes("550e8400-e29b-41d4-a716-446655440000"), false);
  assert.equal(serialized.includes(String(process.pid)), false);
});

test("Scenario G: source allowlist scans only approved directories and extensions", () => {
  const files = walkSourceFiles({
    sourceRoots: ["scripts"],
    statSync: (filePath) => ({
      isDirectory: () => ["scripts", path.join("scripts", "nested")].includes(filePath),
      isFile: () => !["scripts", path.join("scripts", "nested")].includes(filePath),
    }),
    readdirSync: (filePath) => filePath === "scripts" ? ["a.cjs", "b.txt", "nested"] : ["c.jsx", "d.bin"],
  });

  assert.deepEqual(files, ["scripts/a.cjs", "scripts/nested/c.jsx"]);
});

test("Scenario H: source scan reads text without code execution", () => {
  const source = fs.readFileSync("scripts/finple-temp-producer-attribution.cjs", "utf8");
  for (const forbidden of ["eval(", "require(source", "import(source", "child_process"]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("Scenario I: production source has no deletion capability", () => {
  const source = fs.readFileSync("scripts/finple-temp-producer-attribution.cjs", "utf8");
  for (const forbidden of [
    "fs.rm",
    "fs.unlink",
    "fs.rmdir",
    "fs.writeFile",
    "fs.mkdir",
    "fs.rename",
    "fs.copyFile",
    "fs.chmod",
    "spawn",
    "exec",
    "fork",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("Scenario J: snapshot stable has zero producer delta", () => {
  const registry = sampleRegistry([{ literalPrefix: "finple-known-" }]);
  const before = buildFinpleTempProducerAttributionAudit({ inventory: [sampleEntry("finple-known-1")], registry });
  const after = buildFinpleTempProducerAttributionAudit({ inventory: [sampleEntry("finple-known-1")], registry });
  const diff = diffFinpleTempProducerAttributionAudits(before, after);

  assert.equal(diff.totalCountDelta, 0);
  assert.equal(diff.matchedProducerCountDelta, 0);
  assert.equal(diff.unmatchedShapeDelta, 0);
});

test("Scenario K: new producer entry increases producer delta", () => {
  const registry = sampleRegistry([{ literalPrefix: "finple-known-" }]);
  const before = buildFinpleTempProducerAttributionAudit({ inventory: [], registry });
  const after = buildFinpleTempProducerAttributionAudit({ inventory: [sampleEntry("finple-known-2")], registry });
  const diff = diffFinpleTempProducerAttributionAudits(before, after);

  assert.equal(diff.totalCountDelta, 1);
  assert.equal(diff.matchedProducerCountDelta, 1);
  assert.equal(diff.producerCountDeltas.producer_001, 1);
});

test("Scenario L: mutation resistance keeps inputs unchanged", () => {
  const inventory = [sampleEntry("finple-known-3")];
  const registry = sampleRegistry([{ literalPrefix: "finple-known-" }]);
  const before = JSON.stringify({ inventory, registry });
  const audit = buildFinpleTempProducerAttributionAudit({ inventory, registry });

  assert.equal(JSON.stringify({ inventory, registry }), before);
  assert.equal(audit.matchedProducerCount, 1);
  assert.equal(audit.cleanupEligibility, "not_assessed");
  assert.equal(audit.deletionApproved, false);
  assert.equal(audit.deletionAttempted, false);
});

test("CLI prints public producer summary JSON only", () => {
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
  assert.equal(parsed.auditId, "finple_temp_producer_attribution");
  assert.equal(parsed.rawNamesExposed, false);
  assert.equal(parsed.absolutePathsExposed, false);
});
