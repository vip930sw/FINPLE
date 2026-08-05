export const SCALPING_MODEL_SIGNAL_ADAPTER_VERSION = "scalping-model-signal-adapter-v1";
export const SCALPING_MODEL_SIGNAL_SCHEMA_VERSION = "scalping-model-signal-v1";
export const SCALPING_MODEL_SIGNAL_REPLAY_FIXTURE_VERSION = "scalping-model-signal-replay-fixture-v1";

export const DEFAULT_SCALPING_MODEL_SIGNAL_POLICY = Object.freeze({
  maximumSignalLatencyMs: 5_000,
  maximumSignalAgeMs: 20_000,
  maximumClockSkewMs: 1_000,
  maximumHorizonMinutes: 60,
  maximumConsecutiveFailures: 5,
});

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveInteger(value) {
  const number = finite(value);
  return number !== null && Number.isInteger(number) && number > 0 ? number : null;
}

function timestampMs(value) {
  const parsed = Date.parse(clean(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function iso(value) {
  const parsed = timestampMs(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function normalizedPolicy(input = {}) {
  return {
    maximumSignalLatencyMs: Math.max(0, finite(input.maximumSignalLatencyMs) ?? DEFAULT_SCALPING_MODEL_SIGNAL_POLICY.maximumSignalLatencyMs),
    maximumSignalAgeMs: Math.max(0, finite(input.maximumSignalAgeMs) ?? DEFAULT_SCALPING_MODEL_SIGNAL_POLICY.maximumSignalAgeMs),
    maximumClockSkewMs: Math.max(0, finite(input.maximumClockSkewMs) ?? DEFAULT_SCALPING_MODEL_SIGNAL_POLICY.maximumClockSkewMs),
    maximumHorizonMinutes: Math.max(1, positiveInteger(input.maximumHorizonMinutes) ?? DEFAULT_SCALPING_MODEL_SIGNAL_POLICY.maximumHorizonMinutes),
    maximumConsecutiveFailures: Math.max(1, positiveInteger(input.maximumConsecutiveFailures) ?? DEFAULT_SCALPING_MODEL_SIGNAL_POLICY.maximumConsecutiveFailures),
  };
}

function expectedRequest(input = {}) {
  const symbol = clean(input.symbol).toUpperCase();
  const timestamp = iso(input.timestamp);
  const minuteStartMs = finite(input.minuteStartMs) ?? timestampMs(timestamp);
  const minuteEndMs = finite(input.minuteEndMs) ?? (minuteStartMs === null ? null : minuteStartMs + 60_000);
  return {
    signalRequestVersion: "scalping-model-signal-request-v1",
    symbol,
    timestamp,
    minuteStartMs,
    minuteEndMs,
    dataCutoffMaximum: minuteEndMs === null ? null : new Date(minuteEndMs).toISOString(),
    open: finite(input.open),
    high: finite(input.high),
    low: finite(input.low),
    close: finite(input.close),
    volume: finite(input.volume),
    quote: input.quote && typeof input.quote === "object" ? {
      bid: finite(input.quote.bid),
      ask: finite(input.quote.ask),
      bidSize: finite(input.quote.bidSize),
      askSize: finite(input.quote.askSize),
    } : null,
    session: input.session && typeof input.session === "object" ? {
      name: clean(input.session.name),
      state: clean(input.session.state),
      sessionDate: clean(input.session.sessionDate),
      minutesSinceOpen: finite(input.session.minutesSinceOpen),
      minutesToClose: finite(input.session.minutesToClose),
    } : null,
  };
}

function identityReasons(signal = {}, options = {}) {
  return [
    clean(options.expectedModelId) && clean(signal.modelId) !== clean(options.expectedModelId)
      ? "model_id_mismatch"
      : null,
    clean(options.expectedModelVersion) && clean(signal.modelVersion) !== clean(options.expectedModelVersion)
      ? "model_version_mismatch"
      : null,
    clean(options.expectedModelChecksum) && clean(signal.modelChecksum) !== clean(options.expectedModelChecksum)
      ? "model_checksum_mismatch"
      : null,
  ].filter(Boolean);
}

export function validateScalpingModelSignalEnvelope(signal = {}, requestInput = {}, options = {}) {
  const request = expectedRequest(requestInput);
  const policy = normalizedPolicy(options.policy || options);
  const nowMs = finite(options.nowMs) ?? Date.now();
  const enforceWallClockFreshness = options.enforceWallClockFreshness !== false;

  const probabilityUp = finite(signal.probabilityUp);
  const expectedReturnBps = finite(signal.expectedReturnBps);
  const confidence = finite(signal.confidence);
  const horizonMinutes = positiveInteger(signal.horizonMinutes);
  const generatedAtMs = timestampMs(signal.generatedAt);
  const dataCutoffMs = timestampMs(signal.dataCutoff);
  const signalTimestamp = iso(signal.timestamp);
  const generatedAt = iso(signal.generatedAt);
  const dataCutoff = iso(signal.dataCutoff);

  const reasons = unique([
    clean(signal.signalVersion) === SCALPING_MODEL_SIGNAL_SCHEMA_VERSION ? null : "signal_version_invalid",
    request.symbol ? null : "request_symbol_missing",
    request.timestamp ? null : "request_timestamp_invalid",
    request.minuteEndMs === null ? "request_minute_end_invalid" : null,
    clean(signal.symbol).toUpperCase() === request.symbol ? null : "signal_symbol_mismatch",
    signalTimestamp === request.timestamp ? null : "signal_timestamp_mismatch",
    probabilityUp !== null && probabilityUp >= 0 && probabilityUp <= 1 ? null : "probability_up_invalid",
    expectedReturnBps !== null ? null : "expected_return_bps_invalid",
    confidence !== null && confidence >= 0 && confidence <= 1 ? null : "confidence_invalid",
    horizonMinutes !== null && horizonMinutes <= policy.maximumHorizonMinutes ? null : "horizon_minutes_invalid",
    clean(signal.regime) ? null : "regime_missing",
    clean(signal.modelId) ? null : "model_id_missing",
    clean(signal.modelVersion) ? null : "model_version_missing",
    clean(signal.modelChecksum) ? null : "model_checksum_missing",
    generatedAtMs === null ? "generated_at_invalid" : null,
    dataCutoffMs === null ? "data_cutoff_invalid" : null,
    ...identityReasons(signal, options),
  ]);

  if (request.minuteEndMs !== null && dataCutoffMs !== null && dataCutoffMs > request.minuteEndMs) {
    reasons.push("future_data_cutoff");
  }
  if (generatedAtMs !== null && dataCutoffMs !== null && generatedAtMs < dataCutoffMs) {
    reasons.push("generated_before_data_cutoff");
  }
  if (
    request.minuteEndMs !== null &&
    generatedAtMs !== null &&
    generatedAtMs < request.minuteEndMs - policy.maximumClockSkewMs
  ) {
    reasons.push("generated_before_completed_bar");
  }

  const signalLatencyMs = request.minuteEndMs === null || generatedAtMs === null
    ? null
    : generatedAtMs - request.minuteEndMs;
  if (signalLatencyMs !== null && signalLatencyMs > policy.maximumSignalLatencyMs) {
    reasons.push("signal_latency_exceeded");
  }

  const signalAgeMs = generatedAtMs === null ? null : nowMs - generatedAtMs;
  if (enforceWallClockFreshness && signalAgeMs !== null && signalAgeMs > policy.maximumSignalAgeMs) {
    reasons.push("signal_stale");
  }
  if (enforceWallClockFreshness && signalAgeMs !== null && signalAgeMs < -policy.maximumClockSkewMs) {
    reasons.push("generated_at_in_future");
  }

  const finalReasons = unique(reasons);
  const valid = finalReasons.length === 0;
  return {
    valid,
    reasons: finalReasons,
    signal: valid ? {
      signalVersion: SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
      symbol: request.symbol,
      timestamp: request.timestamp,
      probabilityUp,
      expectedReturnBps,
      confidence,
      horizonMinutes,
      regime: clean(signal.regime),
      modelId: clean(signal.modelId),
      modelVersion: clean(signal.modelVersion),
      modelChecksum: clean(signal.modelChecksum),
      generatedAt,
      dataCutoff,
      provenanceId: clean(signal.provenanceId) || null,
    } : null,
    diagnostics: {
      receivedAt: new Date(nowMs).toISOString(),
      signalLatencyMs,
      signalAgeMs,
      futureDataUsed: finalReasons.includes("future_data_cutoff"),
      rawPayloadStored: false,
    },
  };
}

function failureCategory(reasons = []) {
  if (reasons.some((reason) => reason.includes("symbol_mismatch"))) return "symbol_mismatch";
  if (reasons.some((reason) => reason.includes("timestamp_mismatch"))) return "timestamp_mismatch";
  if (reasons.some((reason) => reason.includes("model_") && reason.includes("mismatch"))) return "model_identity_mismatch";
  if (reasons.some((reason) => ["future_data_cutoff", "generated_before_data_cutoff", "generated_before_completed_bar"].includes(reason))) return "causal_violation";
  if (reasons.some((reason) => ["signal_stale", "signal_latency_exceeded", "generated_at_in_future"].includes(reason))) return "stale_or_latency";
  return "invalid_signal";
}

export function createScalpingModelSignalAdapter(options = {}, dependencies = {}) {
  const provider = dependencies.provider ?? options.provider;
  const now = dependencies.now ?? Date.now;
  const policy = normalizedPolicy(options.policy);
  const lastAcceptedTimestampBySymbol = new Map();

  let requests = 0;
  let accepted = 0;
  let missing = 0;
  let providerErrors = 0;
  let invalidSignals = 0;
  let staleOrLatency = 0;
  let causalViolations = 0;
  let symbolMismatches = 0;
  let timestampMismatches = 0;
  let modelIdentityMismatches = 0;
  let duplicateOrOutOfOrder = 0;
  let blockedByCircuitBreaker = 0;
  let consecutiveFailures = 0;
  let lastRequestAt = null;
  let lastAcceptedAt = null;
  let lastSignalLatencyMs = null;
  let lastFailure = null;
  let trip = null;

  const tripIfNeeded = () => {
    if (!trip && consecutiveFailures >= policy.maximumConsecutiveFailures) {
      trip = {
        code: "model_signal_failure_threshold_exceeded",
        at: new Date(now()).toISOString(),
        consecutiveFailures,
      };
    }
  };

  const recordFailure = (code, reasons = []) => {
    consecutiveFailures += 1;
    lastFailure = {
      code,
      reasons: unique(reasons).slice(0, 12),
      at: new Date(now()).toISOString(),
    };
    tripIfNeeded();
  };

  const state = () => {
    if (typeof provider !== "function") return "unavailable";
    if (trip) return "tripped";
    if (consecutiveFailures > 0) return "degraded";
    if (accepted > 0) return "healthy";
    return "standby";
  };

  const status = () => ({
    version: SCALPING_MODEL_SIGNAL_ADAPTER_VERSION,
    schemaVersion: SCALPING_MODEL_SIGNAL_SCHEMA_VERSION,
    state: state(),
    providerConfigured: typeof provider === "function",
    expectedModel: {
      modelId: clean(options.expectedModelId) || null,
      modelVersion: clean(options.expectedModelVersion) || null,
      modelChecksum: clean(options.expectedModelChecksum) || null,
    },
    policy: { ...policy },
    counters: {
      requests,
      accepted,
      missing,
      providerErrors,
      invalidSignals,
      staleOrLatency,
      causalViolations,
      symbolMismatches,
      timestampMismatches,
      modelIdentityMismatches,
      duplicateOrOutOfOrder,
      blockedByCircuitBreaker,
    },
    consecutiveFailures,
    lastRequestAt,
    lastAcceptedAt,
    lastSignalLatencyMs,
    lastFailure: clone(lastFailure),
    trip: clone(trip),
    safety: {
      entrySignalFailClosed: true,
      missingSignalSubstitutionAllowed: false,
      heuristicFallbackAllowed: false,
      automaticLiveActivationAllowed: false,
      orderSubmissionAllowed: false,
      credentialsPersisted: false,
      rawProviderPayloadStored: false,
    },
  });

  const getSignal = async (input = {}) => {
    requests += 1;
    lastRequestAt = new Date(now()).toISOString();
    const request = expectedRequest(input);

    if (trip) {
      blockedByCircuitBreaker += 1;
      return null;
    }
    if (typeof provider !== "function") {
      missing += 1;
      lastFailure = {
        code: "model_signal_provider_unavailable",
        reasons: ["model_signal_provider_unavailable"],
        at: lastRequestAt,
      };
      return null;
    }

    const requestTimestampMs = timestampMs(request.timestamp);
    const previousTimestampMs = lastAcceptedTimestampBySymbol.get(request.symbol);
    if (previousTimestampMs !== undefined && requestTimestampMs !== null && requestTimestampMs <= previousTimestampMs) {
      duplicateOrOutOfOrder += 1;
      const code = requestTimestampMs === previousTimestampMs
        ? "duplicate_model_signal_request"
        : "out_of_order_model_signal_request";
      recordFailure(code, [code]);
      return null;
    }

    let response;
    try {
      response = await provider(clone(request));
    } catch (error) {
      providerErrors += 1;
      recordFailure("model_signal_provider_error", [clean(error?.code || error?.name) || "provider_error"]);
      return null;
    }

    if (!response || typeof response !== "object") {
      missing += 1;
      recordFailure("model_signal_missing", ["model_signal_missing"]);
      return null;
    }

    const validation = validateScalpingModelSignalEnvelope(response, request, {
      nowMs: now(),
      policy,
      expectedModelId: options.expectedModelId,
      expectedModelVersion: options.expectedModelVersion,
      expectedModelChecksum: options.expectedModelChecksum,
    });
    if (!validation.valid) {
      invalidSignals += 1;
      const category = failureCategory(validation.reasons);
      if (category === "symbol_mismatch") symbolMismatches += 1;
      if (category === "timestamp_mismatch") timestampMismatches += 1;
      if (category === "model_identity_mismatch") modelIdentityMismatches += 1;
      if (category === "causal_violation") causalViolations += 1;
      if (category === "stale_or_latency") staleOrLatency += 1;
      recordFailure(category, validation.reasons);
      return null;
    }

    accepted += 1;
    consecutiveFailures = 0;
    lastFailure = null;
    lastAcceptedAt = validation.signal.generatedAt;
    lastSignalLatencyMs = validation.diagnostics.signalLatencyMs;
    if (requestTimestampMs !== null) lastAcceptedTimestampBySymbol.set(request.symbol, requestTimestampMs);
    return clone(validation.signal);
  };

  const acknowledgeAndReset = () => {
    trip = null;
    consecutiveFailures = 0;
    lastFailure = null;
    return status();
  };

  return { getSignal, status, acknowledgeAndReset };
}

export function validateReplayModelSignalFixture(fixture = {}, options = {}) {
  const provenance = fixture.provenance || {};
  const provenanceReasons = [
    clean(fixture.fixtureVersion) === SCALPING_MODEL_SIGNAL_REPLAY_FIXTURE_VERSION ? null : "replay_fixture_version_invalid",
    clean(provenance.datasetId) ? null : "replay_dataset_id_missing",
    clean(provenance.sourceRevision) ? null : "replay_source_revision_missing",
    clean(provenance.modelChecksum) ? null : "replay_model_checksum_missing",
    clean(provenance.fixtureChecksum) ? null : "replay_fixture_checksum_missing",
    provenance.immutable === true ? null : "replay_fixture_not_immutable",
  ].filter(Boolean);
  const validation = validateScalpingModelSignalEnvelope(
    fixture.signal,
    fixture.request,
    {
      ...options,
      enforceWallClockFreshness: false,
      expectedModelChecksum: options.expectedModelChecksum || provenance.modelChecksum,
    },
  );
  const reasons = unique([...provenanceReasons, ...validation.reasons]);
  return {
    valid: reasons.length === 0,
    reasons,
    signal: reasons.length === 0 ? validation.signal : null,
    provenance: reasons.length === 0 ? {
      datasetId: clean(provenance.datasetId),
      sourceRevision: clean(provenance.sourceRevision),
      modelChecksum: clean(provenance.modelChecksum),
      fixtureChecksum: clean(provenance.fixtureChecksum),
      immutable: true,
    } : null,
    safety: {
      futureLeakageAllowed: false,
      missingSignalSubstitutionAllowed: false,
      rawProviderPayloadStored: false,
    },
  };
}

export function createDeterministicModelSignalFixtureProvider(fixtures = []) {
  const byKey = new Map();
  for (const fixture of Array.isArray(fixtures) ? fixtures : []) {
    const validation = validateReplayModelSignalFixture(fixture, {
      nowMs: timestampMs(fixture?.signal?.generatedAt) ?? Date.now(),
    });
    if (!validation.valid) continue;
    const key = `${validation.signal.symbol}|${validation.signal.timestamp}`;
    byKey.set(key, clone(validation.signal));
  }
  return async (request = {}) => {
    const key = `${clean(request.symbol).toUpperCase()}|${iso(request.timestamp)}`;
    return clone(byKey.get(key) || null);
  };
}
