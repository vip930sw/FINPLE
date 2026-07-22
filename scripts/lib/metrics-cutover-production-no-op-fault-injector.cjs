"use strict";

const { createHash } = require("node:crypto");

const VERSION = "finple.step114-2x-zb-r.production-no-op-fault-injector.v1";
const SOURCE_PATH = "scripts/lib/metrics-cutover-production-no-op-fault-injector.cjs";
const approvedInstances = new WeakSet();

function canonicalJson(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return JSON.stringify(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object" && !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype) {
    return `{${Object.keys(value).sort().map((key) =>
      `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  throw new TypeError("unsupported_canonical_value");
}
function hashContract(domain, value) {
  return createHash("sha256").update(domain).update(canonicalJson(value)).digest("hex");
}
function noOpHit() { return undefined; }
function buildDescriptor() {
  const body = {
    contractVersion: VERSION,
    factorySourcePath: SOURCE_PATH,
    mode: "no_op",
    hitBehavior: "return_without_side_effect",
    productionSafe: true,
    invocationCount: 0,
    mutationCount: 0,
    rawMaterialPresent: false,
  };
  return Object.freeze({ ...body, descriptorHash: hashContract(
    "FINPLE_STEP114_2X_ZB_R_PRODUCTION_NO_OP_DESCRIPTOR\0", body) });
}

const DESCRIPTOR = buildDescriptor();

function createNoOpProductionFaultInjector() {
  const instance = Object.freeze({ descriptor: DESCRIPTOR, hit: noOpHit });
  approvedInstances.add(instance);
  return instance;
}
function isApprovedNoOpProductionFaultInjector(value) {
  return Boolean(value && typeof value === "object" && approvedInstances.has(value) &&
    Object.isFrozen(value) && Object.keys(value).length === 2 &&
    value.descriptor === DESCRIPTOR && value.hit === noOpHit);
}

module.exports = {
  DESCRIPTOR,
  SOURCE_PATH,
  VERSION,
  createNoOpProductionFaultInjector,
  isApprovedNoOpProductionFaultInjector,
};
