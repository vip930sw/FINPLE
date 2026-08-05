import { createHash } from "node:crypto";

import {
  readKisHistoricalSessionRows,
  saveKisHistoricalMinuteRows,
  saveKisHistoricalRevision,
} from "../db/tradingKisHistoricalCaptureRepository.js";

export const KIS_HISTORICAL_CAPTURE_VERSION = "kis-historical-capture-v1";
export const KIS_HISTORICAL_REVISION_VERSION = "kis-historical-raw-revision-v1";
export const KIS_HISTORICAL_LICENSE_POLICY_ID = "kis-open-api-internal-read-only-market-data-v1";

export const KIS_HISTORICAL_CAPTURE_SYMBOLS = Object.freeze([
  "TQQQ", "SQQQ", "SOXL", "SOXS", "UPRO", "SPXU", "TNA", "TZA",
]);

function clean(value) {
  return String(value ?? "").trim();
}

function finite(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function checksum(value) {
  return createHash("sha256").update(JSON.stringify(stable(value))).digest("hex");
}

function symbols(value) {
  return [...new Set((Array.isArray(value) ? value : []).map((item) => clean(item).toUpperCase()).filter(Boolean))].sort();
}

function normalizeBar(bar = {}, index = 0) {
  const symbol = clean(bar.symbol).toUpperCase();
  const minuteStartMs = finite(bar.minuteStartMs ?? Date.parse(bar.minuteStart));
  const minuteEndMs = finite(bar.minuteEndMs) ?? (minuteStartMs === null ? null : minuteStartMs + 60_000);
  const sessionDate = clean(bar.sessionDate || bar.session?.sessionDate);
  const open = finite(bar.open);
  const high = finite(bar.high);
  const low = finite(bar.low);
  const close = finite(bar.close);
  const volume = finite(bar.volume);
  const tradeCount = finite(bar.tradeCount);
  const bid = finite(bar.quote?.bid);
  const ask = finite(bar.quote?.ask);
  const bidSize = finite(bar.quote?.bidSize);
  const askSize = finite(bar.quote?.askSize);
  const midpoint = bid !== null && ask !== null ? (bid + ask) / 2 : null;
  const spreadBps = midpoint && ask >= bid ? ((ask - bid) / midpoint) * 10_000 : null;
  const calendarVersion = clean(bar.calendarVersion || bar.session?.calendarVersion);
  const source = clean(bar.source) || "kis_realtime_completed_1m";

  const reasons = [
    KIS_HISTORICAL_CAPTURE_SYMBOLS.includes(symbol) ? null : `bar_${index}_symbol_not_allowed`,
    minuteStartMs !== null ? null : `bar_${index}_minute_start_invalid`,
    minuteEndMs !== null && minuteEndMs > minuteStartMs ? null : `bar_${index}_minute_end_invalid`,
    sessionDate ? null : `bar_${index}_session_date_missing`,
    clean(bar.session?.name || "REGULAR").toUpperCase() === "REGULAR" ? null : `bar_${index}_regular_session_required`,
    open !== null && open > 0 ? null : `bar_${index}_open_invalid`,
    high !== null && high > 0 ? null : `bar_${index}_high_invalid`,
    low !== null && low > 0 ? null : `bar_${index}_low_invalid`,
    close !== null && close > 0 ? null : `bar_${index}_close_invalid`,
    volume !== null && volume >= 0 ? null : `bar_${index}_volume_invalid`,
    tradeCount !== null && tradeCount > 0 ? null : `bar_${index}_trade_count_invalid`,
    high !== null && low !== null && high >= Math.max(low, open, close) ? null : `bar_${index}_ohlc_high_invalid`,
    low !== null && low <= Math.min(open, close) ? null : `bar_${index}_ohlc_low_invalid`,
    bid !== null && bid > 0 ? null : `bar_${index}_bid_invalid`,
    ask !== null && ask >= bid ? null : `bar_${index}_ask_invalid`,
    spreadBps !== null ? null : `bar_${index}_spread_invalid`,
    calendarVersion ? null : `bar_${index}_calendar_version_missing`,
  ].filter(Boolean);

  if (reasons.length > 0) return { valid: false, reasons, row: null };

  const core = {
    provider: "KIS",
    symbol,
    minuteStart: new Date(minuteStartMs).toISOString(),
    minuteEnd: new Date(minuteEndMs).toISOString(),
    sessionDate,
    open,
    high,
    low,
    close,
    volume,
    tradeCount,
    quote: { bid, ask, bidSize, askSize, spreadBps },
    source,
    calendarVersion,
  };
  return {
    valid: true,
    reasons: [],
    row: {
      ...core,
      rowChecksum: checksum(core),
      capturedAt: new Date().toISOString(),
      rawProviderPayloadStored: false,
    },
  };
}

export function normalizeKisHistoricalCompletedCycle(input = {}) {
  const selectedSymbols = symbols(input.selectedSymbols?.length ? input.selectedSymbols : KIS_HISTORICAL_CAPTURE_SYMBOLS);
  const bars = Array.isArray(input.bars) ? input.bars : [];
  const normalized = bars.map((bar, index) => normalizeBar(bar, index));
  const reasons = normalized.flatMap((item) => item.reasons);
  const rows = normalized.filter((item) => item.valid).map((item) => item.row);
  const actualSymbols = symbols(rows.map((row) => row.symbol));
  const missingSymbols = selectedSymbols.filter((symbol) => !actualSymbols.includes(symbol));
  const sessionDates = [...new Set(rows.map((row) => row.sessionDate))];
  const minutes = [...new Set(rows.map((row) => row.minuteStart))];
  const duplicateKeys = [];
  const seen = new Set();
  for (const row of rows) {
    const key = `${row.symbol}|${row.minuteStart}`;
    if (seen.has(key)) duplicateKeys.push(key);
    seen.add(key);
  }

  reasons.push(
    bars.length > 0 ? null : "completed_cycle_bars_required",
    rows.length === bars.length ? null : "completed_cycle_row_rejected",
    missingSymbols.length === 0 ? null : `completed_cycle_symbols_missing:${missingSymbols.join(",")}`,
    actualSymbols.length === selectedSymbols.length ? null : "completed_cycle_symbol_count_mismatch",
    sessionDates.length === 1 ? null : "completed_cycle_session_mismatch",
    minutes.length === 1 ? null : "completed_cycle_minute_mismatch",
    duplicateKeys.length === 0 ? null : `completed_cycle_duplicate:${duplicateKeys.join(",")}`,
  );

  const uniqueReasons = [...new Set(reasons.filter(Boolean))];
  return {
    valid: uniqueReasons.length === 0,
    reasons: uniqueReasons,
    rows: uniqueReasons.length === 0 ? rows.sort((a, b) => a.symbol.localeCompare(b.symbol)) : [],
    sessionDate: uniqueReasons.length === 0 ? sessionDates[0] : null,
    minuteStart: uniqueReasons.length === 0 ? minutes[0] : null,
    safety: {
      marketDataOnly: true,
      accountCallsAllowed: false,
      orderSubmissionAllowed: false,
      rawProviderPayloadStored: false,
      forwardFillUsed: false,
    },
  };
}

export function buildKisHistoricalSessionRevision(input = {}) {
  const rows = Array.isArray(input.rows) ? [...input.rows] : [];
  const selectedSymbols = symbols(input.selectedSymbols?.length ? input.selectedSymbols : KIS_HISTORICAL_CAPTURE_SYMBOLS);
  const sessionDate = clean(input.sessionDate);
  const expectedMinutes = Number.isFinite(Number(input.expectedMinutes)) ? Number(input.expectedMinutes) : 390;
  const minimumCoverageRatio = Number.isFinite(Number(input.minimumCoverageRatio))
    ? Number(input.minimumCoverageRatio)
    : 0.95;
  const persistenceDurable = input.persistenceDurable === true;
  const calendarVersions = [...new Set(rows.map((row) => clean(row.calendarVersion)).filter(Boolean))];
  const actualSymbols = symbols(rows.map((row) => row.symbol));
  const completeMinutes = new Map();
  for (const row of rows) {
    if (!completeMinutes.has(row.minuteStart)) completeMinutes.set(row.minuteStart, new Set());
    completeMinutes.get(row.minuteStart).add(row.symbol);
  }
  const completeMinuteCount = [...completeMinutes.values()]
    .filter((minuteSymbols) => selectedSymbols.every((symbol) => minuteSymbols.has(symbol))).length;
  const expectedRows = expectedMinutes * selectedSymbols.length;
  const coverageRatio = expectedRows > 0 ? rows.length / expectedRows : 0;
  const missingSymbols = selectedSymbols.filter((symbol) => !actualSymbols.includes(symbol));
  const reasons = [
    sessionDate ? null : "session_date_required",
    rows.length > 0 ? null : "captured_rows_required",
    expectedMinutes > 0 ? null : "expected_minutes_invalid",
    minimumCoverageRatio > 0 && minimumCoverageRatio <= 1 ? null : "minimum_coverage_ratio_invalid",
    calendarVersions.length === 1 ? null : "calendar_version_mismatch",
    missingSymbols.length === 0 ? null : `captured_symbols_missing:${missingSymbols.join(",")}`,
    completeMinuteCount === new Set(rows.map((row) => row.minuteStart).filter(Boolean)).size
      ? null
      : "incomplete_symbol_minutes_present",
    persistenceDurable ? null : "durable_persistence_required",
    coverageRatio >= minimumCoverageRatio ? null : "coverage_below_threshold",
  ].filter(Boolean);

  const sortedRows = rows
    .map((row) => ({
      symbol: row.symbol,
      minuteStart: row.minuteStart,
      minuteEnd: row.minuteEnd,
      sessionDate: row.sessionDate,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
      tradeCount: row.tradeCount,
      quote: row.quote,
      source: row.source,
      calendarVersion: row.calendarVersion,
      rowChecksum: row.rowChecksum,
    }))
    .sort((a, b) => a.minuteStart.localeCompare(b.minuteStart) || a.symbol.localeCompare(b.symbol));

  const coverage = {
    expectedMinutes,
    completeMinuteCount,
    selectedSymbolCount: selectedSymbols.length,
    rowCount: sortedRows.length,
    expectedRows,
    coverageRatio,
    minimumCoverageRatio,
    missingSymbols,
    durablePersistence: persistenceDurable,
  };
  const rawDataChecksum = checksum({
    version: KIS_HISTORICAL_REVISION_VERSION,
    sessionDate,
    selectedSymbols,
    calendarVersion: calendarVersions[0] || null,
    rows: sortedRows,
  });
  const readyForModelResearch = reasons.length === 0;

  return {
    valid: reasons.length === 0,
    reasons,
    revision: {
      revisionVersion: KIS_HISTORICAL_REVISION_VERSION,
      provider: "KIS",
      sessionDate,
      datasetId: `kis-us-equity-completed-1m-${sessionDate}`,
      sourceRevision: `kis:${sessionDate}:${rawDataChecksum.slice(0, 16)}`,
      rawDataChecksum,
      calendarVersion: calendarVersions[0] || null,
      licensePolicyId: KIS_HISTORICAL_LICENSE_POLICY_ID,
      selectedSymbols,
      rowCount: sortedRows.length,
      coverage,
      immutable: true,
      status: readyForModelResearch ? "immutable_capture_ready" : "immutable_capture_incomplete",
      readyForModelResearch,
      readyForRuntime: false,
      sealedAt: clean(input.sealedAt) || new Date().toISOString(),
      modelDatasetProvenance: {
        datasetId: `kis-us-equity-completed-1m-${sessionDate}`,
        sourceRevision: `kis:${sessionDate}:${rawDataChecksum.slice(0, 16)}`,
        rawDataChecksum,
        calendarVersion: calendarVersions[0] || null,
        licensePolicyId: KIS_HISTORICAL_LICENSE_POLICY_ID,
        immutable: true,
      },
      safety: {
        provider: "KIS",
        externalVendorRequired: false,
        accountCallsAllowed: false,
        orderSubmissionAllowed: false,
        rawProviderPayloadStored: false,
        automaticModelApprovalAllowed: false,
        runtimeRegistrationAllowed: false,
      },
    },
  };
}

export function createKisHistoricalCaptureAccumulator(options = {}, dependencies = {}) {
  const selectedSymbols = symbols(options.selectedSymbols?.length ? options.selectedSymbols : KIS_HISTORICAL_CAPTURE_SYMBOLS);
  const saveRows = dependencies.saveRows ?? saveKisHistoricalMinuteRows;
  const readRows = dependencies.readRows ?? readKisHistoricalSessionRows;
  const saveRevision = dependencies.saveRevision ?? saveKisHistoricalRevision;
  const env = options.env ?? dependencies.env ?? process.env;
  const actor = clean(options.actor) || "kis_capture_runtime";
  let acceptedCycles = 0;
  let rejectedCycles = 0;
  let persistedRows = 0;
  let duplicateRows = 0;
  let lastAcceptedMinute = null;
  let lastError = null;

  return {
    async ingestCycle(input = {}) {
      const normalized = normalizeKisHistoricalCompletedCycle({
        bars: input.bars,
        selectedSymbols,
      });
      if (!normalized.valid) {
        rejectedCycles += 1;
        lastError = { code: normalized.reasons[0], at: new Date().toISOString() };
        return { accepted: false, ...normalized };
      }
      const saved = await saveRows(normalized.rows, { env, actor }, dependencies);
      acceptedCycles += 1;
      persistedRows += saved.inserted;
      duplicateRows += saved.duplicates;
      lastAcceptedMinute = normalized.minuteStart;
      lastError = null;
      return {
        accepted: true,
        sessionDate: normalized.sessionDate,
        minuteStart: normalized.minuteStart,
        rows: normalized.rows.length,
        persistence: saved.persistence,
      };
    },

    async sealSession(input = {}) {
      const sessionDate = clean(input.sessionDate);
      const read = await readRows(sessionDate, { env }, dependencies);
      const built = buildKisHistoricalSessionRevision({
        rows: read.rows,
        selectedSymbols,
        sessionDate,
        expectedMinutes: input.expectedMinutes,
        minimumCoverageRatio: input.minimumCoverageRatio,
        persistenceDurable: read.persistence.durable === true,
        sealedAt: input.sealedAt,
      });
      if (!built.valid) return { sealed: false, ...built, persistence: read.persistence };
      const saved = await saveRevision(built.revision, { env, actor: clean(input.actor) || actor }, dependencies);
      return {
        sealed: true,
        revision: saved.revision,
        persistence: saved.persistence,
      };
    },

    status() {
      return {
        version: KIS_HISTORICAL_CAPTURE_VERSION,
        selectedSymbols: [...selectedSymbols],
        acceptedCycles,
        rejectedCycles,
        persistedRows,
        duplicateRows,
        lastAcceptedMinute,
        lastError,
        safety: {
          marketDataOnly: true,
          accountCallsAllowed: false,
          orderSubmissionAllowed: false,
          rawProviderPayloadStored: false,
          forwardFillUsed: false,
          automaticModelApprovalAllowed: false,
        },
      };
    },
  };
}
