import assert from "node:assert/strict";
import test from "node:test";

import { getDeploymentInfo } from "./deploymentInfo.js";

const ENV_KEYS = [
  "FINPLE_DEPLOY_COMMIT_SHA",
  "RENDER_GIT_COMMIT",
  "SOURCE_VERSION",
  "GIT_COMMIT_SHA",
  "COMMIT_SHA",
  "VERCEL_GIT_COMMIT_SHA",
  "FINPLE_DEPLOY_BRANCH",
  "RENDER_GIT_BRANCH",
  "GIT_BRANCH",
  "VERCEL_GIT_COMMIT_REF",
  "FINPLE_DEPLOY_ENV",
  "NODE_ENV",
  "RENDER",
  "RENDER_SERVICE_NAME",
  "RENDER_SERVICE_ID",
  "RENDER_INSTANCE_ID",
];

function snapshotEnv() {
  return Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
}

function restoreEnv(snapshot) {
  for (const key of ENV_KEYS) {
    if (snapshot[key] === undefined) delete process.env[key];
    else process.env[key] = snapshot[key];
  }
}

test("getDeploymentInfo prefers Render platform commit metadata over stale manual commit metadata", () => {
  const previousEnv = snapshotEnv();

  try {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.FINPLE_DEPLOY_COMMIT_SHA = "manual-stale-sha";
    process.env.RENDER_GIT_COMMIT = "abcdef1234567890";
    process.env.FINPLE_DEPLOY_BRANCH = "main";
    process.env.RENDER = "true";
    process.env.RENDER_SERVICE_NAME = "finple-api";
    process.env.RENDER_SERVICE_ID = "srv-test";
    process.env.RENDER_INSTANCE_ID = "instance-test";
    process.env.FINPLE_DEPLOY_ENV = "production";

    const info = getDeploymentInfo();

    assert.equal(info.platform, "render");
    assert.equal(info.commitSha, "abcdef1234567890");
    assert.equal(info.commitShortSha, "abcdef1");
    assert.equal(info.commitSource, "RENDER_GIT_COMMIT");
    assert.equal(info.commitSourceKind, "render_platform");
    assert.deepEqual(info.metadataWarnings, ["manual_commit_metadata_ignored_in_favor_of_render_platform"]);
    assert.equal(info.branch, "main");
    assert.equal(info.branchSource, "FINPLE_DEPLOY_BRANCH");
    assert.equal(info.serviceName, "finple-api");
    assert.equal(info.environment, "production");
  } finally {
    restoreEnv(previousEnv);
  }
});

test("getDeploymentInfo falls back to manual commit metadata with a Render warning when platform metadata is missing", () => {
  const previousEnv = snapshotEnv();

  try {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.FINPLE_DEPLOY_COMMIT_SHA = "fedcba9876543210";
    process.env.RENDER = "true";

    const info = getDeploymentInfo();

    assert.equal(info.platform, "render");
    assert.equal(info.commitSha, "fedcba9876543210");
    assert.equal(info.commitShortSha, "fedcba9");
    assert.equal(info.commitSource, "FINPLE_DEPLOY_COMMIT_SHA");
    assert.equal(info.commitSourceKind, "manual_or_fallback");
    assert.deepEqual(info.metadataWarnings, ["render_platform_commit_metadata_missing"]);
  } finally {
    restoreEnv(previousEnv);
  }
});

test("getDeploymentInfo returns null commit fields when no metadata is configured", () => {
  const previousEnv = snapshotEnv();

  try {
    for (const key of ENV_KEYS) delete process.env[key];

    const info = getDeploymentInfo();

    assert.equal(info.platform, "unknown");
    assert.equal(info.commitSha, null);
    assert.equal(info.commitShortSha, null);
    assert.equal(info.commitSource, null);
    assert.equal(info.commitSourceKind, null);
    assert.deepEqual(info.metadataWarnings, ["commit_metadata_unavailable"]);
  } finally {
    restoreEnv(previousEnv);
  }
});
