import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const serverPackage = require("../../package.json");

const RENDER_COMMIT_ENV_KEYS = [
  "RENDER_GIT_COMMIT",
  "SOURCE_VERSION",
];

const MANUAL_COMMIT_ENV_KEYS = [
  "FINPLE_DEPLOY_COMMIT_SHA",
  "GIT_COMMIT_SHA",
  "COMMIT_SHA",
  "VERCEL_GIT_COMMIT_SHA",
];

const BRANCH_ENV_KEYS = [
  "FINPLE_DEPLOY_BRANCH",
  "RENDER_GIT_BRANCH",
  "GIT_BRANCH",
  "VERCEL_GIT_COMMIT_REF",
];

function clean(value) {
  return String(value ?? "").trim();
}

function firstEnvValue(keys) {
  for (const key of keys) {
    const value = clean(process.env[key]);
    if (value) return { key, value };
  }
  return { key: null, value: null };
}

function getCommitEnvKeys() {
  if (process.env.RENDER) return [...RENDER_COMMIT_ENV_KEYS, ...MANUAL_COMMIT_ENV_KEYS];
  return [...MANUAL_COMMIT_ENV_KEYS, ...RENDER_COMMIT_ENV_KEYS];
}

function buildMetadataWarnings(commit) {
  const warnings = [];
  const manualCommit = firstEnvValue(MANUAL_COMMIT_ENV_KEYS);
  const renderCommit = firstEnvValue(RENDER_COMMIT_ENV_KEYS);

  if (process.env.RENDER && !renderCommit.value) {
    warnings.push("render_platform_commit_metadata_missing");
  }
  if (process.env.RENDER && renderCommit.value && manualCommit.value && commit.key === renderCommit.key) {
    warnings.push("manual_commit_metadata_ignored_in_favor_of_render_platform");
  }
  if (!commit.value) warnings.push("commit_metadata_unavailable");

  return warnings;
}

export function getDeploymentInfo() {
  const commit = firstEnvValue(getCommitEnvKeys());
  const branch = firstEnvValue(BRANCH_ENV_KEYS);
  const serviceName = clean(process.env.RENDER_SERVICE_NAME || process.env.FINPLE_SERVICE_NAME);
  const serviceId = clean(process.env.RENDER_SERVICE_ID || process.env.FINPLE_SERVICE_ID);
  const instanceId = clean(process.env.RENDER_INSTANCE_ID);
  const environment = clean(process.env.FINPLE_DEPLOY_ENV || process.env.NODE_ENV || "development");

  return {
    appVersion: serverPackage.version || "0.0.0",
    environment,
    nodeEnv: clean(process.env.NODE_ENV || "development"),
    platform: process.env.RENDER ? "render" : "unknown",
    serviceName: serviceName || null,
    serviceId: serviceId || null,
    instanceId: instanceId || null,
    branch: branch.value,
    branchSource: branch.key,
    commitSha: commit.value,
    commitShortSha: commit.value ? commit.value.slice(0, 7) : null,
    commitSource: commit.key,
    commitSourceKind: RENDER_COMMIT_ENV_KEYS.includes(commit.key) ? "render_platform" : commit.key ? "manual_or_fallback" : null,
    metadataWarnings: buildMetadataWarnings(commit),
  };
}
