export const STEP236C_COST_MODEL_VERSION = "1.0.0";
export const STEP236C_COST_MODEL_MODE = "synthetic_research_cost_model";

const COST_MODEL_KEYS = Object.freeze([
  "version",
  "mode",
  "commissionBps",
  "slippageBps",
  "taxBps",
  "actualMarketCostClaimed",
]);

export const STEP236C_SYNTHETIC_COST_POLICY = deepFreeze({
  version: STEP236C_COST_MODEL_VERSION,
  mode: STEP236C_COST_MODEL_MODE,
  commissionBps: 5,
  slippageBps: 5,
  taxBps: 0,
  fixedFeeUsed: false,
  leverageAllowed: false,
  shortExposureAllowed: false,
  actualMarketCostClaimed: false,
});

function deepFreeze(value) {
  if (!value || typeof value !== "object") return value;
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

function clonePlain(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameKeys(value, expectedKeys) {
  const keys = Object.keys(value ?? {}).sort();
  return JSON.stringify(keys) === JSON.stringify([...expectedKeys].sort());
}

function assertBasisPoints(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`Step236C ${label} must be finite basis points`);
  }
  if (value < 0) {
    throw new TypeError(`Step236C ${label} cannot be negative`);
  }
}

export function buildStep236CCostModel(input = {}) {
  const source = clonePlain(input);
  const policy = {
    ...STEP236C_SYNTHETIC_COST_POLICY,
    ...source,
  };
  validateStep236CCostPolicy(policy);
  return deepFreeze({
    version: policy.version,
    mode: policy.mode,
    commissionBps: policy.commissionBps,
    slippageBps: policy.slippageBps,
    taxBps: policy.taxBps,
    actualMarketCostClaimed: policy.actualMarketCostClaimed,
  });
}

export function validateStep236CCostPolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new TypeError("Step236C cost policy must be an object");
  }
  if (policy.version !== STEP236C_COST_MODEL_VERSION) {
    throw new TypeError("Step236C unknown cost model version");
  }
  if (policy.mode !== STEP236C_COST_MODEL_MODE) {
    throw new TypeError("Step236C cost model mode mismatch");
  }
  assertBasisPoints(policy.commissionBps, "commissionBps");
  assertBasisPoints(policy.slippageBps, "slippageBps");
  assertBasisPoints(policy.taxBps, "taxBps");
  if (policy.fixedFeeUsed === true) {
    throw new TypeError("Step236C fixed fee is not used");
  }
  if (policy.leverageAllowed === true) {
    throw new TypeError("Step236C leverage is not allowed");
  }
  if (policy.shortExposureAllowed === true) {
    throw new TypeError("Step236C short exposure is not allowed");
  }
  if (policy.actualMarketCostClaimed !== false) {
    throw new TypeError("Step236C actual market cost claim is not allowed");
  }
}

export function validateStep236CCostModel(model) {
  if (!sameKeys(model, COST_MODEL_KEYS)) {
    throw new TypeError("Step236C cost model key set mismatch");
  }
  validateStep236CCostPolicy({
    ...model,
    fixedFeeUsed: false,
    leverageAllowed: false,
    shortExposureAllowed: false,
  });
}

export const STEP236C_COST_POLICY_CONTRACT = deepFreeze({
  costModelKeys: COST_MODEL_KEYS,
  version: STEP236C_COST_MODEL_VERSION,
  mode: STEP236C_COST_MODEL_MODE,
  defaultPolicy: STEP236C_SYNTHETIC_COST_POLICY,
  actualMarketCostClaimed: false,
});
