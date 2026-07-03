import { useEffect, useMemo, useState } from "react";

import {
  fetchAdminTradingRiskKillSwitchReviewResultStatus,
  fetchAdminTradingRiskKillSwitchStatus,
  fetchAdminTradingShadowReviewStatus,
  fetchAdminTradingShadowStatus,
  fetchTradingReadinessStatus,
} from "./portfolio/services/serverPortfolioService";

const FALLBACK_READINESS = Object.freeze({
  ok: true,
  status: "fail_closed_local_fallback",
  tradingMode: "mock",
  flags: {
    providerCallsAllowed: false,
    orderSubmissionAllowed: false,
    runtimeRouteAllowed: false,
    publicUiAllowed: false,
    dbMigrationAllowed: false,
    readyForReadOnlyProviderCalls: false,
    readyForOrderSubmission: false,
    readyForLiveGuardedTrading: false,
  },
  killSwitch: {
    status: "blocked",
    enabled: true,
    reasons: ["api_unavailable_fail_closed"],
  },
  allowedSymbols: {
    status: "blocked_unknown",
    count: 0,
    wildcard: false,
    symbols: [],
  },
  lastAuditEvent: {
    status: "placeholder_only",
    message: "No live trading audit event has been emitted.",
  },
});

const FLAG_LABELS = [
  ["providerCallsAllowed", "Provider calls"],
  ["orderSubmissionAllowed", "Order submission"],
  ["runtimeRouteAllowed", "Runtime route"],
  ["publicUiAllowed", "Public UI"],
  ["dbMigrationAllowed", "DB migration"],
  ["readyForReadOnlyProviderCalls", "Read-only provider readiness"],
  ["readyForOrderSubmission", "Order readiness"],
  ["readyForLiveGuardedTrading", "Live guarded readiness"],
];

function boolStatus(value) {
  return value === true ? "OPEN" : "BLOCKED";
}

function statusClass(value) {
  return value === true ? "open" : "blocked";
}

export function TradingReadinessPanel() {
  const [readiness, setReadiness] = useState(FALLBACK_READINESS);
  const [shadowStatus, setShadowStatus] = useState(null);
  const [shadowReviewStatus, setShadowReviewStatus] = useState(null);
  const [riskKillSwitchStatus, setRiskKillSwitchStatus] = useState(null);
  const [riskKillSwitchReviewResultStatus, setRiskKillSwitchReviewResultStatus] = useState(null);
  const [loadState, setLoadState] = useState("loading");

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchTradingReadinessStatus(),
      fetchAdminTradingShadowStatus().catch(() => null),
      fetchAdminTradingShadowReviewStatus().catch(() => null),
      fetchAdminTradingRiskKillSwitchStatus().catch(() => null),
      fetchAdminTradingRiskKillSwitchReviewResultStatus().catch(() => null),
    ])
      .then((payload) => {
        if (cancelled) return;
        setReadiness(payload?.[0] || FALLBACK_READINESS);
        setShadowStatus(payload?.[1] || null);
        setShadowReviewStatus(payload?.[2] || null);
        setRiskKillSwitchStatus(payload?.[3] || null);
        setRiskKillSwitchReviewResultStatus(payload?.[4] || null);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setReadiness(FALLBACK_READINESS);
        setLoadState("fallback");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const flags = readiness?.flags || FALLBACK_READINESS.flags;
  const blockerCount = useMemo(() => {
    const envBlockers = Array.isArray(readiness?.environment?.blockers) ? readiness.environment.blockers.length : 0;
    const killSwitchReasons = Array.isArray(readiness?.killSwitch?.reasons) ? readiness.killSwitch.reasons.length : 0;
    return envBlockers + killSwitchReasons;
  }, [readiness]);

  return (
    <section className="accountCard tradingReadinessPanel" data-admin-panel-key="trading-readiness">
      <div className="serverStorageHeader">
        <div>
          <p className="accountMiniLabel">Trading Readiness</p>
          <h2>Read-only trading shell</h2>
          <p>
            Mock, dry-run, and shadow mode readiness only. Live provider calls and order submission stay blocked.
          </p>
        </div>
        <span className={`tradingReadinessBadge ${loadState}`}>{readiness?.status || loadState}</span>
      </div>

      <div className="accountStatusGrid tradingReadinessMetrics">
        <article>
          <span>Mode</span>
          <strong>{readiness?.tradingMode || "mock"}</strong>
          <p>mock / dry-run / shadow shell</p>
        </article>
        <article>
          <span>Kill switch</span>
          <strong>{readiness?.killSwitch?.status || "blocked"}</strong>
          <p>{readiness?.killSwitch?.enabled === false ? "not cleared" : "enabled or forced blocked"}</p>
        </article>
        <article>
          <span>Allowed symbols</span>
          <strong>{readiness?.allowedSymbols?.status || "blocked"}</strong>
          <p>{Number(readiness?.allowedSymbols?.count || 0)} configured</p>
        </article>
        <article>
          <span>Blockers</span>
          <strong>{blockerCount}</strong>
          <p>fail-closed checks active</p>
        </article>
      </div>

      <div className="tradingReadinessFlagGrid" aria-label="Trading readiness flags">
        {FLAG_LABELS.map(([key, label]) => (
          <div key={key} className="tradingReadinessFlag">
            <span>{label}</span>
            <strong className={statusClass(flags[key])}>{boolStatus(flags[key])}</strong>
          </div>
        ))}
      </div>

      <div className="tradingReadinessAudit">
        <span>Last audit event</span>
        <strong>{readiness?.lastAuditEvent?.status || "placeholder_only"}</strong>
        <p>{readiness?.lastAuditEvent?.message || FALLBACK_READINESS.lastAuditEvent.message}</p>
      </div>

      <div className="tradingReadinessAudit tradingShadowHistory">
        <span>Shadow status/history</span>
        <strong>{shadowStatus?.status || "read_only_shadow_history"}</strong>
        <p>
          Candidates {Number(shadowStatus?.candidateCount || 0)} / audit events {Number(shadowStatus?.auditEventCount || 0)}.
          Admin-only, read-only, in-memory boundary.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingShadowReview">
        <span>Review gate</span>
        <strong>{shadowReviewStatus?.status || "admin_only_shadow_review_gate_fail_closed"}</strong>
        <p>
          Results {Number(shadowReviewStatus?.reviewResults?.length || 0)} / blockers {Number(shadowReviewStatus?.blockers?.length || 0)}.
          Review is redacted and cannot promote live readiness.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingRiskKillSwitchReview">
        <span>Risk and kill-switch</span>
        <strong>{riskKillSwitchStatus?.status || "admin_only_risk_kill_switch_review_fail_closed"}</strong>
        <p>
          Risk gate {riskKillSwitchStatus?.riskGate?.status || "blocked"} / kill-switch {riskKillSwitchStatus?.killSwitch?.status || "active_blocking"}.
          Admin-only, redacted, and read-only; live readiness stays blocked.
        </p>
      </div>

      <div className="tradingReadinessAudit tradingRiskKillSwitchReviewResult">
        <span>Review result recording</span>
        <strong>{riskKillSwitchReviewResultStatus?.status || "admin_only_risk_kill_switch_review_result_gate_fail_closed"}</strong>
        <p>
          Receipts {Number(riskKillSwitchReviewResultStatus?.receiptCount || 0)}.
          Redacted in-memory status only; no DB write and no readiness promotion.
        </p>
      </div>
    </section>
  );
}
