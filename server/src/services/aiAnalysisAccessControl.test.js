import assert from "node:assert/strict";
import test from "node:test";

import {
  assertAiAnalysisAccessAllowed,
  getAiAnalysisAccessState,
} from "./aiAnalysisAccessControl.js";

test("getAiAnalysisAccessState allows public mode callers", () => {
  const access = getAiAnalysisAccessState(null, { accessMode: "public", allowedPlans: ["personal"] });

  assert.equal(access.allowed, true);
  assert.equal(access.mode, "public");
  assert.equal(access.currentPlan, "guest");
});

test("getAiAnalysisAccessState blocks guests when AI analysis is Personal only", () => {
  const access = getAiAnalysisAccessState(null, { accessMode: "personal", allowedPlans: ["personal", "pro"] });

  assert.equal(access.allowed, false);
  assert.equal(access.reason, "plan_required");
  assert.deepEqual(access.requiredPlans, ["personal", "pro"]);
});

test("assertAiAnalysisAccessAllowed permits entitled Personal users", () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE;
  process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE = "personal";

  try {
    const access = assertAiAnalysisAccessAllowed({ id: "user-a", plan: "personal" });
    assert.equal(access.allowed, true);
  } finally {
    if (previousMode === undefined) delete process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE;
    else process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE = previousMode;
  }
});

test("assertAiAnalysisAccessAllowed permits Pro and education-entitled users", () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE;
  process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE = "personal";

  try {
    const proAccess = assertAiAnalysisAccessAllowed({ id: "user-pro", plan: "pro" });
    const educationAccess = assertAiAnalysisAccessAllowed({
      id: "user-education",
      plan: "personal",
      aiPlanSource: "education",
    });

    assert.equal(proAccess.allowed, true);
    assert.equal(proAccess.currentPlan, "pro");
    assert.equal(educationAccess.allowed, true);
    assert.equal(educationAccess.currentPlan, "personal");
  } finally {
    if (previousMode === undefined) delete process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE;
    else process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE = previousMode;
  }
});

test("assertAiAnalysisAccessAllowed throws a typed 403 for blocked users", () => {
  const previousMode = process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE;
  process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE = "personal";

  try {
    assert.throws(
      () => assertAiAnalysisAccessAllowed({ id: "user-a", plan: "free" }),
      (error) => error.statusCode === 403 && error.access?.reason === "plan_required"
    );
    assert.throws(
      () => assertAiAnalysisAccessAllowed(null),
      (error) =>
        error.statusCode === 403 &&
        error.access?.reason === "plan_required" &&
        error.access?.currentPlan === "free"
    );
  } finally {
    if (previousMode === undefined) delete process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE;
    else process.env.FINPLE_AI_ANALYSIS_ACCESS_MODE = previousMode;
  }
});
