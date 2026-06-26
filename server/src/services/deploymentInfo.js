import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const serverPackage = require("../../package.json");

const COMMIT_ENV_KEYS = [
  "FINPLE_DEPLOY_COMMIT_SHA",
  "RENDER_GIT_COMMIT",
  "SOURCE_VERSION",
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

export function getDeploymentInfo() {
  const commit = firstEnvValue(COMMIT_ENV_KEYS);
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
  };
}
