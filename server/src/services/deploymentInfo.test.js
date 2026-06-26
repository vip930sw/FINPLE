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

test("getDeploymentInfo prefers FINPLE deployment metadata over platform fallbacks", () => {
  const previousEnv = snapshotEnv();

  try {
    for (const key of ENV_KEYS) delete process.env[key];
    process.env.FINPLE_DEPLOY_COMMIT_SHA = "abcdef1234567890";
    process.env.RENDER_GIT_COMMIT = "render-sha";
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
    assert.equal(info.commitSource, "FINPLE_DEPLOY_COMMIT_SHA");
    assert.equal(info.branch, "main");
    assert.equal(info.branchSource, "FINPLE_DEPLOY_BRANCH");
    assert.equal(info.serviceName, "finple-api");
    assert.equal(info.environment, "production");
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
  } finally {
    restoreEnv(previousEnv);
  }
});
