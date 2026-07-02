const path = require("node:path");
const { runContract } = require("./trading-forbidden-item-unlock-taxonomy-gate.cjs");

runContract({
  step: "Step 116-9D",
  scope: "live_guarded_forbidden_item_unlock_request_preflight",
  readyField: "readyForLiveGuardedForbiddenItemUnlockRequestPreflight",
  contractPath: path.join(
    "data",
    "processed",
    "trading_lab_step116_forbidden_item_unlock_request_preflight_contract.json",
  ),
  logName: "generate-trading-forbidden-item-unlock-request-preflight-contract",
  sources: [
    {
      key: "forbiddenItemUnlockSequenceMap",
      path: path.join("data", "processed", "trading_lab_step116_forbidden_item_unlock_sequence_map_contract.json"),
      readyField: "readyForLiveGuardedForbiddenItemUnlockSequenceMap",
    },
  ],
});
