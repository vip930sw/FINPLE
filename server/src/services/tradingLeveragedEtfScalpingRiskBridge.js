import { evaluateTradingRiskGate } from "./tradingRiskEngine.js";
import { buildLeveragedEtfScalpingDecision } from "./tradingLeveragedEtfScalpingStrategy.js";

function clean(value) {
  return String(value ?? "").trim();
}

export function evaluateLeveragedEtfScalpingCycle(input = {}) {
  const decision = buildLeveragedEtfScalpingDecision(input);
  if (!decision.orderIntent) {
    return {
      ...decision,
      riskGate: null,
      execution: {
        paperFillAllowed: false,
        shadowRecordAllowed: false,
        liveOrderIntentEligible: false,
        orderSubmissionAllowed: false,
        providerCallsAllowed: false,
      },
    };
  }

  const sessionName = clean(input.session?.name || input.session?.currentSession).toUpperCase();
  const riskGate = evaluateTradingRiskGate(decision.orderIntent, input.riskLimits, {
    ...input.runtime,
    currentSession: sessionName,
  });

  return {
    ...decision,
    riskGate,
    execution: {
      paperFillAllowed: riskGate.paperFillAllowed === true,
      shadowRecordAllowed: riskGate.shadowRecordAllowed === true,
      liveOrderIntentEligible: riskGate.liveOrderIntentEligible === true,
      orderSubmissionAllowed: false,
      providerCallsAllowed: false,
    },
  };
}
