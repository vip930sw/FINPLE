export const STEP117_PROVIDER_ADAPTER_STATUSES = Object.freeze({
  blocked: "blocked_provider_calls_disabled",
  notImplemented: "not_implemented",
  failClosed: "fail_closed",
  mockOnly: "mock_only",
  dryRunOnly: "dry_run_only",
  shadowOnly: "shadow_only",
});

export const STEP117_PROVIDER_ADAPTER_INTERFACE = Object.freeze([
  "requestReadOnlySnapshot",
  "submitOrder",
]);

const ALLOWED_STEP117_MODES = Object.freeze(["mock", "dry_run", "shadow"]);

function clean(value) {
  return String(value ?? "").trim();
}

function normalizeProviderMode(mode) {
  const normalized = clean(mode).toLowerCase().replace(/-/g, "_");
  return ALLOWED_STEP117_MODES.includes(normalized) ? normalized : "mock";
}

function modeStatus(mode) {
  if (mode === "dry_run") return STEP117_PROVIDER_ADAPTER_STATUSES.dryRunOnly;
  if (mode === "shadow") return STEP117_PROVIDER_ADAPTER_STATUSES.shadowOnly;
  return STEP117_PROVIDER_ADAPTER_STATUSES.mockOnly;
}

export function createBlockedProviderAdapter(options = {}) {
  const mode = normalizeProviderMode(options.mode);
  const adapterStatus = modeStatus(mode);

  return Object.freeze({
    name: "finple_step117_blocked_provider_adapter",
    interfaceVersion: "step117_provider_adapter_skeleton_v1",
    mode,
    status: STEP117_PROVIDER_ADAPTER_STATUSES.failClosed,
    modeStatus: adapterStatus,
    supportedStatuses: { ...STEP117_PROVIDER_ADAPTER_STATUSES },
    mockOnly: true,
    dryRunOnly: mode === "dry_run",
    shadowOnly: mode === "shadow",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    async requestReadOnlySnapshot() {
      return {
        ok: false,
        status: STEP117_PROVIDER_ADAPTER_STATUSES.blocked,
        mode,
        modeStatus: adapterStatus,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        networkCallAttempted: false,
        reason: "step117_provider_adapter_skeleton_does_not_call_provider",
      };
    },
    async submitOrder() {
      return {
        ok: false,
        status: "blocked_order_submission_disabled",
        mode,
        modeStatus: adapterStatus,
        providerCallsAllowed: false,
        orderSubmissionAllowed: false,
        networkCallAttempted: false,
        reason: "step117_provider_adapter_skeleton_does_not_submit_orders",
      };
    },
  });
}
