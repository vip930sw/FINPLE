import { applyPaperFill, createPaperLedger, simulatePaperFill } from "./tradingPaperLedger.js";

export const STEP118_SHADOW_FLAGS = Object.freeze({
  providerCallsAllowed: false,
  orderSubmissionAllowed: false,
  runtimeRouteAllowed: false,
  publicUiAllowed: false,
  dbMigrationAllowed: false,
  readyForReadOnlyProviderCalls: false,
  readyForOrderSubmission: false,
  readyForLiveGuardedTrading: false,
});

function clean(value) {
  return String(value ?? "").trim();
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizeCandidateId(value) {
  const cleaned = clean(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return cleaned || "shadow_candidate_unpersisted";
}

export function createShadowOrderCandidate(input = {}, options = {}) {
  const symbol = clean(input.symbol).toUpperCase();
  const side = clean(input.side).toLowerCase();
  const quantity = toPositiveNumber(input.quantity);
  const estimatedPrice = toPositiveNumber(input.estimatedPrice);
  const estimatedFxRate = toPositiveNumber(input.estimatedFxRate ?? 1);
  const candidateId = normalizeCandidateId(options.candidateId || input.candidateId);
  const reasons = unique([
    symbol ? null : "missing_symbol",
    ["buy", "sell"].includes(side) ? null : "invalid_side",
    quantity === null ? "invalid_quantity" : null,
    estimatedPrice === null ? "invalid_estimatedPrice" : null,
    estimatedFxRate === null ? "invalid_estimatedFxRate" : null,
  ]);
  const estimatedNotional =
    quantity !== null && estimatedPrice !== null && estimatedFxRate !== null
      ? roundMoney(quantity * estimatedPrice * estimatedFxRate)
      : null;

  return {
    candidateId,
    mode: "shadow",
    status: reasons.length === 0 ? "shadow_candidate_ready_for_dry_run" : "shadow_candidate_blocked",
    valid: reasons.length === 0,
    reasons,
    symbol,
    side,
    quantity,
    estimatedPrice,
    estimatedFxRate,
    estimatedNotional,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerOrderPayloadStored: false,
    persistentStorageUsed: false,
  };
}

export function createAuditEvent(event = {}, options = {}) {
  const candidate = event.candidate || {};
  const reasons = unique([...(Array.isArray(event.reasons) ? event.reasons : []), ...(Array.isArray(candidate.reasons) ? candidate.reasons : [])]);
  return {
    eventId: normalizeCandidateId(options.eventId || event.eventId || `${candidate.candidateId || "shadow"}_audit`),
    eventType: clean(event.eventType) || "step118_shadow_audit_event",
    mode: clean(event.mode) || "shadow",
    status: clean(event.status) || "recorded_in_memory_only",
    candidateId: candidate.candidateId || normalizeCandidateId(event.candidateId),
    symbol: candidate.symbol || clean(event.symbol).toUpperCase(),
    side: candidate.side || clean(event.side).toLowerCase(),
    decisionStatus: clean(event.decisionStatus) || "shadow_recorded",
    reasons,
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    containsCredential: false,
    containsAccountIdentifier: false,
    containsProviderPayload: false,
    containsOrderPayload: false,
    credentialStored: false,
    accountIdentifierStored: false,
    providerOrderPayloadStored: false,
    persistentStorageUsed: false,
    checkedAt: options.checkedAt || event.checkedAt || new Date().toISOString(),
  };
}

export function createInMemoryAuditLedger(seedEvents = []) {
  const events = seedEvents.map((event, index) => createAuditEvent(event, { eventId: event.eventId || `seed_${index}` }));

  return {
    storage: "memory",
    persistentStorageUsed: false,
    append(event = {}) {
      const nextEvent = createAuditEvent(event, { eventId: event.eventId || `audit_${events.length + 1}` });
      events.push(nextEvent);
      return nextEvent;
    },
    list({ limit = 25 } = {}) {
      return events.slice(Math.max(0, events.length - limit));
    },
    snapshot() {
      return {
        storage: "memory",
        persistentStorageUsed: false,
        eventCount: events.length,
        events: events.slice(),
      };
    },
  };
}

export function runDryRunReplay(input = {}, options = {}) {
  const candidates = Array.isArray(input.candidates) ? input.candidates : [];
  let paperLedger = createPaperLedger(input.initialCash ?? 0, input.positions ?? []);
  const auditLedger = options.auditLedger || createInMemoryAuditLedger();
  const replayEvents = [];

  for (const [index, rawCandidate] of candidates.entries()) {
    const candidate = createShadowOrderCandidate(rawCandidate, {
      candidateId: rawCandidate?.candidateId || `shadow_candidate_${index + 1}`,
    });

    if (!candidate.valid) {
      const blockedEvent = auditLedger.append({
        eventType: "step118_shadow_candidate_blocked",
        status: "blocked",
        decisionStatus: "blocked",
        candidate,
      });
      replayEvents.push({ candidate, applied: false, reasons: candidate.reasons, auditEvent: blockedEvent });
      continue;
    }

    const fillResult = simulatePaperFill(candidate, {
      fillPrice: rawCandidate?.fillPrice ?? candidate.estimatedPrice,
      fxRate: rawCandidate?.fxRate ?? candidate.estimatedFxRate,
      fee: rawCandidate?.fee ?? 0,
      tax: rawCandidate?.tax ?? 0,
    });
    const applyResult = fillResult.valid ? applyPaperFill(paperLedger, fillResult.fill) : { applied: false, reasons: fillResult.reasons, ledger: paperLedger };
    paperLedger = applyResult.ledger;
    const auditEvent = auditLedger.append({
      eventType: applyResult.applied ? "step118_dry_run_replay_applied" : "step118_dry_run_replay_blocked",
      status: applyResult.applied ? "dry_run_applied" : "blocked",
      decisionStatus: applyResult.applied ? "shadow_recorded" : "blocked",
      candidate,
      reasons: applyResult.reasons,
    });
    replayEvents.push({
      candidate,
      applied: applyResult.applied,
      reasons: applyResult.reasons,
      simulatedFill: fillResult.fill,
      auditEvent,
    });
  }

  const auditSnapshot = auditLedger.snapshot();
  const appliedCount = replayEvents.filter((event) => event.applied).length;

  return {
    ok: true,
    step: "Step 118: Add shadow trading ledger and dry-run replay core",
    status: "dry_run_replay_completed_without_provider_or_order_submission",
    mode: "dry_run",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    persistentStorageUsed: false,
    candidateCount: candidates.length,
    appliedCount,
    blockedCount: replayEvents.length - appliedCount,
    ledger: paperLedger,
    replayEvents,
    audit: auditSnapshot,
    flags: { ...STEP118_SHADOW_FLAGS },
  };
}

export function buildReadOnlyShadowStatusHistory(input = {}) {
  const auditEvents = Array.isArray(input.auditEvents) ? input.auditEvents.map((event, index) => createAuditEvent(event, { eventId: event.eventId || `history_${index}` })) : [];
  const candidates = Array.isArray(input.candidates) ? input.candidates.map((candidate, index) => createShadowOrderCandidate(candidate, { candidateId: candidate.candidateId || `history_candidate_${index + 1}` })) : [];

  return {
    ok: true,
    step: "Step 118: Add shadow trading ledger and dry-run replay core",
    status: "read_only_shadow_history",
    mode: "shadow",
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    networkCallAttempted: false,
    persistentStorageUsed: false,
    candidateCount: candidates.length,
    auditEventCount: auditEvents.length,
    candidates,
    history: auditEvents.slice(-25),
    flags: { ...STEP118_SHADOW_FLAGS },
    boundaries: {
      adminOnly: true,
      publicDashboardExposed: false,
      myPageDashboardExposed: false,
      homepageDashboardExposed: false,
      credentialStored: false,
      accountIdentifierStored: false,
      providerOrderPayloadStored: false,
      dbMigrationRequired: false,
      scenarioMonthlyReturnsTouched: false,
      scenarioRuntimeTouched: false,
    },
  };
}
