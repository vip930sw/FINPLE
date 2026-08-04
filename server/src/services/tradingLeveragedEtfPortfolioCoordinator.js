export const LEVERAGED_ETF_PAIR_GROUPS = Object.freeze({
  nasdaq_3x: Object.freeze(["TQQQ", "SQQQ"]),
  semiconductor_3x: Object.freeze(["SOXL", "SOXS"]),
  sp500_3x: Object.freeze(["UPRO", "SPXU"]),
  russell2000_3x: Object.freeze(["TNA", "TZA"]),
});

export const DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS = Object.freeze({
  maxConcurrentPositions: 2,
  maximumNewIntentsPerCycle: 1,
  maxGrossExposureFraction: 0.7,
  maxAggregateRiskFraction: 0.02,
  allowOpposingPairSimultaneously: false,
  allowDuplicatePendingSymbol: false,
});

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positive(value) {
  const number = finite(value);
  return number !== null && number > 0 ? number : null;
}

function nonNegative(value) {
  const number = finite(value);
  return number !== null && number >= 0 ? number : null;
}

function integer(value) {
  const number = finite(value);
  return number !== null && Number.isInteger(number) ? number : null;
}

function round(value, digits = 6) {
  const number = finite(value);
  if (number === null) return null;
  const factor = 10 ** digits;
  return Math.round((number + Number.EPSILON) * factor) / factor;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeSymbol(value) {
  return clean(value).toUpperCase();
}

function normalizeOpenPositions(value) {
  if (Array.isArray(value)) {
    return value.map((position) => ({
      symbol: normalizeSymbol(position?.symbol),
      notional: nonNegative(position?.notional) ?? 0,
      riskAmount: nonNegative(position?.riskAmount) ?? 0,
    })).filter((position) => position.symbol);
  }

  if (value && typeof value === "object") {
    return Object.entries(value).map(([symbol, position]) => ({
      symbol: normalizeSymbol(symbol),
      notional: nonNegative(position?.notional ?? position?.marketValue) ?? 0,
      riskAmount: nonNegative(position?.riskAmount) ?? 0,
    })).filter((position) => position.symbol);
  }

  return [];
}

function normalizePendingSymbols(value) {
  if (!Array.isArray(value)) return [];
  return unique(value.map(normalizeSymbol).filter(Boolean));
}

export function normalizeScalpingPortfolioConstraints(input = {}) {
  return {
    maxConcurrentPositions: integer(input.maxConcurrentPositions) ?? DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS.maxConcurrentPositions,
    maximumNewIntentsPerCycle: integer(input.maximumNewIntentsPerCycle) ?? DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS.maximumNewIntentsPerCycle,
    maxGrossExposureFraction: finite(input.maxGrossExposureFraction) ?? DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS.maxGrossExposureFraction,
    maxAggregateRiskFraction: finite(input.maxAggregateRiskFraction) ?? DEFAULT_SCALPING_PORTFOLIO_CONSTRAINTS.maxAggregateRiskFraction,
    allowOpposingPairSimultaneously: input.allowOpposingPairSimultaneously === true,
    allowDuplicatePendingSymbol: input.allowDuplicatePendingSymbol === true,
  };
}

export function validateScalpingPortfolioConstraints(input = {}) {
  const constraints = normalizeScalpingPortfolioConstraints(input);
  const reasons = unique([
    integer(constraints.maxConcurrentPositions) !== null && constraints.maxConcurrentPositions >= 1 && constraints.maxConcurrentPositions <= 8
      ? null
      : "max_concurrent_positions_out_of_range",
    integer(constraints.maximumNewIntentsPerCycle) !== null && constraints.maximumNewIntentsPerCycle >= 1 && constraints.maximumNewIntentsPerCycle <= 8
      ? null
      : "maximum_new_intents_per_cycle_out_of_range",
    finite(constraints.maxGrossExposureFraction) !== null && constraints.maxGrossExposureFraction > 0 && constraints.maxGrossExposureFraction <= 1
      ? null
      : "max_gross_exposure_fraction_out_of_range",
    finite(constraints.maxAggregateRiskFraction) !== null && constraints.maxAggregateRiskFraction > 0 && constraints.maxAggregateRiskFraction <= 0.2
      ? null
      : "max_aggregate_risk_fraction_out_of_range",
    constraints.maximumNewIntentsPerCycle <= constraints.maxConcurrentPositions
      ? null
      : "maximum_new_intents_exceeds_position_limit",
  ]);

  return {
    valid: reasons.length === 0,
    reasons,
    constraints,
  };
}

export function getLeveragedEtfPairGroup(symbol) {
  const normalized = normalizeSymbol(symbol);
  return Object.entries(LEVERAGED_ETF_PAIR_GROUPS).find(([, symbols]) => symbols.includes(normalized))?.[0] ?? null;
}

function getOpposingSymbol(symbol) {
  const normalized = normalizeSymbol(symbol);
  const pair = Object.values(LEVERAGED_ETF_PAIR_GROUPS).find((symbols) => symbols.includes(normalized));
  return pair ? pair.find((candidate) => candidate !== normalized) ?? null : null;
}

function estimateDecisionNotional(decision) {
  const quantity = positive(decision?.orderIntent?.quantity);
  const price = positive(decision?.orderIntent?.estimatedPrice ?? decision?.orderIntent?.limitPrice);
  return quantity !== null && price !== null ? quantity * price : null;
}

function estimateDecisionRisk(decision) {
  const direct = nonNegative(decision?.sizing?.riskBudget);
  if (direct !== null) return direct;
  const quantity = positive(decision?.orderIntent?.quantity);
  const entry = positive(decision?.positionPlan?.entryPrice);
  const stop = positive(decision?.positionPlan?.stopPrice);
  if (quantity === null || entry === null || stop === null) return null;
  return Math.abs(entry - stop) * quantity;
}

function candidateScore(decision) {
  const expectedNetEdgeBps = finite(decision?.orderIntent?.signalSnapshot?.expectedNetEdgeBps) ?? finite(decision?.model?.expectedReturnBps) ?? 0;
  const probabilityUp = finite(decision?.orderIntent?.signalSnapshot?.probabilityUp) ?? finite(decision?.model?.probabilityUp) ?? 0;
  const confidence = finite(decision?.model?.confidence) ?? 0;
  const spreadBps = finite(decision?.orderIntent?.signalSnapshot?.spreadBps) ?? finite(decision?.quote?.spreadBps) ?? 0;
  return round(expectedNetEdgeBps + probabilityUp * 10 + confidence * 5 - spreadBps, 6);
}

export function rankScalpingEntryCandidates(decisions = []) {
  return decisions
    .filter((decision) => decision?.action === "buy" && decision?.orderIntent)
    .map((decision) => ({
      decision,
      symbol: normalizeSymbol(decision.symbol ?? decision.orderIntent.symbol),
      score: candidateScore(decision),
      estimatedNotional: estimateDecisionNotional(decision),
      estimatedRiskAmount: estimateDecisionRisk(decision),
    }))
    .sort((left, right) => right.score - left.score || left.symbol.localeCompare(right.symbol));
}

function rejection(candidate, reasons, snapshot) {
  return {
    symbol: candidate.symbol,
    action: "rejected",
    score: candidate.score,
    reasonCodes: unique(reasons),
    estimatedNotional: candidate.estimatedNotional,
    estimatedRiskAmount: candidate.estimatedRiskAmount,
    snapshot,
    orderIntent: candidate.decision.orderIntent,
  };
}

function acceptance(candidate, snapshot) {
  return {
    symbol: candidate.symbol,
    action: "accepted",
    score: candidate.score,
    reasonCodes: ["portfolio_constraints_passed"],
    estimatedNotional: candidate.estimatedNotional,
    estimatedRiskAmount: candidate.estimatedRiskAmount,
    snapshot,
    decision: candidate.decision,
    orderIntent: candidate.decision.orderIntent,
  };
}

export function coordinateLeveragedEtfScalpingDecisions(input = {}) {
  const validation = validateScalpingPortfolioConstraints(input.constraints ?? {});
  const accountEquity = positive(input.account?.equity);
  const openPositions = normalizeOpenPositions(input.account?.openPositions ?? input.openPositions);
  const pendingSymbols = normalizePendingSymbols(input.account?.pendingSymbols ?? input.pendingSymbols);
  const decisions = Array.isArray(input.decisions) ? input.decisions : [];
  const reasons = unique([
    validation.valid ? null : validation.reasons,
    accountEquity !== null ? null : "missing_account_equity",
  ].flat());

  if (reasons.length > 0) {
    return {
      ok: false,
      status: "blocked_invalid_portfolio_context",
      reasons,
      constraints: validation.constraints,
      accepted: [],
      rejected: [],
      passthroughExits: [],
    };
  }

  const constraints = validation.constraints;
  const passthroughExits = decisions
    .filter((decision) => decision?.action === "sell" && decision?.orderIntent)
    .map((decision) => ({
      symbol: normalizeSymbol(decision.symbol ?? decision.orderIntent.symbol),
      action: "accepted_exit",
      reasonCodes: ["risk_reducing_exit_priority"],
      decision,
      orderIntent: decision.orderIntent,
    }));
  const candidates = rankScalpingEntryCandidates(decisions);
  const accepted = [];
  const rejected = [];
  const occupiedSymbols = new Set(openPositions.map((position) => position.symbol));
  const pendingSet = new Set(pendingSymbols);
  let projectedPositionCount = openPositions.length;
  let projectedGrossNotional = openPositions.reduce((sum, position) => sum + position.notional, 0);
  let projectedRiskAmount = openPositions.reduce((sum, position) => sum + position.riskAmount, 0);

  for (const candidate of candidates) {
    const rejectionReasons = [];
    const opposingSymbol = getOpposingSymbol(candidate.symbol);
    const nextNotional = candidate.estimatedNotional;
    const nextRisk = candidate.estimatedRiskAmount;

    if (!candidate.symbol) rejectionReasons.push("missing_candidate_symbol");
    if (occupiedSymbols.has(candidate.symbol)) rejectionReasons.push("symbol_position_already_open");
    if (!constraints.allowDuplicatePendingSymbol && pendingSet.has(candidate.symbol)) rejectionReasons.push("symbol_order_already_pending");
    if (!constraints.allowOpposingPairSimultaneously && opposingSymbol && (occupiedSymbols.has(opposingSymbol) || pendingSet.has(opposingSymbol) || accepted.some((item) => item.symbol === opposingSymbol))) {
      rejectionReasons.push("opposing_leveraged_pair_conflict");
    }
    if (projectedPositionCount >= constraints.maxConcurrentPositions) rejectionReasons.push("max_concurrent_positions_reached");
    if (accepted.length >= constraints.maximumNewIntentsPerCycle) rejectionReasons.push("maximum_new_intents_per_cycle_reached");
    if (nextNotional === null) rejectionReasons.push("candidate_notional_unavailable");
    if (nextRisk === null) rejectionReasons.push("candidate_risk_unavailable");
    if (nextNotional !== null && (projectedGrossNotional + nextNotional) / accountEquity > constraints.maxGrossExposureFraction) {
      rejectionReasons.push("max_gross_exposure_exceeded");
    }
    if (nextRisk !== null && (projectedRiskAmount + nextRisk) / accountEquity > constraints.maxAggregateRiskFraction) {
      rejectionReasons.push("max_aggregate_risk_exceeded");
    }

    const snapshot = {
      accountEquity: round(accountEquity, 2),
      projectedPositionCount,
      projectedGrossExposureFraction: round(projectedGrossNotional / accountEquity, 8),
      projectedAggregateRiskFraction: round(projectedRiskAmount / accountEquity, 8),
    };

    if (rejectionReasons.length > 0) {
      rejected.push(rejection(candidate, rejectionReasons, snapshot));
      continue;
    }

    projectedPositionCount += 1;
    projectedGrossNotional += nextNotional;
    projectedRiskAmount += nextRisk;
    occupiedSymbols.add(candidate.symbol);
    pendingSet.add(candidate.symbol);
    accepted.push(acceptance(candidate, {
      accountEquity: round(accountEquity, 2),
      projectedPositionCount,
      projectedGrossExposureFraction: round(projectedGrossNotional / accountEquity, 8),
      projectedAggregateRiskFraction: round(projectedRiskAmount / accountEquity, 8),
    }));
  }

  return {
    ok: true,
    status: "coordinated_fail_closed",
    reasons: [],
    constraints,
    selectedSymbolCount: unique(decisions.map((decision) => normalizeSymbol(decision?.symbol)).filter(Boolean)).length,
    candidateCount: candidates.length,
    accepted,
    rejected,
    passthroughExits,
    projected: {
      positionCount: projectedPositionCount,
      grossNotional: round(projectedGrossNotional, 2),
      grossExposureFraction: round(projectedGrossNotional / accountEquity, 8),
      aggregateRiskAmount: round(projectedRiskAmount, 2),
      aggregateRiskFraction: round(projectedRiskAmount / accountEquity, 8),
    },
    orderSubmissionAllowed: false,
    providerCallsAllowed: false,
  };
}
