import { createHash } from "node:crypto";
import process from "node:process";

import { consumeAdminStartAuthorization } from "../middleware/adminGuard.js";
import { KIS_READ_ONLY_BASE_URLS } from "./tradingKisReadOnlyApproval.js";
import { TRADING_ENV_NAMES, isKisTradingAccountIdValid } from "./tradingEnvConfig.js";

export const KIS_ACCOUNT_LIVE_READ_APPROVAL_VERSION = "kis-account-live-read-approval-v1";
export const KIS_ACCOUNT_LIVE_READ_SCOPE = "trading_read_only_account_state_live";
export const KIS_ACCOUNT_LIVE_READ_ENVIRONMENT = "production_live";
export const KIS_ACCOUNT_LIVE_READ_PROVIDER_ENVIRONMENT = "live";
export const KIS_ACCOUNT_LIVE_READ_FEATURE_ENV = "FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENABLED";

export const REQUIRED_KIS_ACCOUNT_LIVE_READ_FORBIDDEN_ACTIONS = Object.freeze([
  "order_submission",
  "order_modification",
  "order_cancellation",
  "account_mutation",
  "position_mutation",
  "live_trading_activation",
  "raw_provider_response_persistence",
  "financial_snapshot_persistence",
]);

const approvalAssessments = new WeakMap();
const liveAccessDecisions = new WeakMap();

function clean(value) {
  return String(value ?? "").trim();
}

function list(value) {
  if (Array.isArray(value)) return [...new Set(value.map(clean).filter(Boolean))];
  return [...new Set(clean(value).split(",").map(clean).filter(Boolean))];
}

function epoch(value) {
  const parsed = Date.parse(clean(value));
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizedBaseUrl(value) {
  return clean(value).replace(/\/+$/, "");
}

function accountBinding(accountId) {
  const canonical = clean(accountId);
  return isKisTradingAccountIdValid(canonical)
    ? createHash("sha256").update(canonical, "utf8").digest("hex")
    : "";
}

function loadReceipt(env) {
  return {
    approvalId: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVAL_ID),
    approvedBy: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVED_BY),
    approvedAt: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_APPROVED_AT),
    expiresAt: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_EXPIRES_AT),
    scope: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_SCOPE),
    environment: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ENVIRONMENT),
    baseUrl: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_BASE_URL),
    accountIdHash: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_ACCOUNT_ID_HASH),
    forbiddenActions: list(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_FORBIDDEN_ACTIONS),
    evidenceTicket: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_EVIDENCE_TICKET),
    revocationPlan: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_REVOCATION_PLAN),
    redactionVersion: clean(env.FINPLE_TRADING_KIS_ACCOUNT_READ_LIVE_REDACTION_VERSION),
  };
}

export function projectKisAccountLiveReadApprovalPublic(approval = {}) {
  return {
    version: approval.version || KIS_ACCOUNT_LIVE_READ_APPROVAL_VERSION,
    ready: approval.ready === true,
    reasons: Array.isArray(approval.reasons) ? [...approval.reasons] : [],
    approvalIdPresent: approval.approvalIdPresent === true,
    approvedByPresent: approval.approvedByPresent === true,
    approvedAtValid: approval.approvedAtValid === true,
    expiresAtValid: approval.expiresAtValid === true,
    approvalActive: approval.approvalActive === true,
    approvalExpired: approval.approvalExpired === true,
    scopeMatch: approval.scopeMatch === true,
    environmentMatch: approval.environmentMatch === true,
    baseUrlMatch: approval.baseUrlMatch === true,
    accountBindingPresent: approval.accountBindingPresent === true,
    accountBindingMatch: approval.accountBindingMatch === true,
    requiredForbiddenActionsPresent: approval.requiredForbiddenActionsPresent === true,
    evidenceTicketPresent: approval.evidenceTicketPresent === true,
    revocationPlanPresent: approval.revocationPlanPresent === true,
    redactionVersionPresent: approval.redactionVersionPresent === true,
    rawReceiptStored: false,
    providerCallsAllowedWithoutExplicitStart: false,
    accountCallsAllowed: false,
    brokerOrderAdapterPresent: false,
    orderSubmissionAllowed: false,
    positionMutationAllowed: false,
    liveActivationAllowed: false,
    rawProviderPayloadStored: false,
    financialSnapshotPersisted: false,
  };
}

export function assessKisAccountLiveReadApproval(input = {}, options = {}) {
  const env = options.env ?? process.env;
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  const receipt = input.receipt ?? loadReceipt(env);
  const approvedAtMs = epoch(receipt.approvedAt);
  const expiresAtMs = epoch(receipt.expiresAt);
  const accountId = clean(options.accountId ?? env[TRADING_ENV_NAMES.accountId]);
  const configuredBinding = accountBinding(accountId);
  const approvalBinding = clean(receipt.accountIdHash);
  const forbiddenActions = list(receipt.forbiddenActions);
  const requiredForbiddenActionsPresent = REQUIRED_KIS_ACCOUNT_LIVE_READ_FORBIDDEN_ACTIONS
    .every((action) => forbiddenActions.includes(action));
  const scopeMatch = clean(receipt.scope) === KIS_ACCOUNT_LIVE_READ_SCOPE;
  const environmentMatch = clean(receipt.environment) === KIS_ACCOUNT_LIVE_READ_ENVIRONMENT
    && clean(env.FINPLE_TRADING_KIS_CREDENTIAL_ENVIRONMENT).toLowerCase()
      === KIS_ACCOUNT_LIVE_READ_PROVIDER_ENVIRONMENT;
  const baseUrlMatch = normalizedBaseUrl(receipt.baseUrl) === KIS_READ_ONLY_BASE_URLS.live
    && normalizedBaseUrl(env[TRADING_ENV_NAMES.baseUrl]) === KIS_READ_ONLY_BASE_URLS.live;
  const accountBindingPresent = Boolean(approvalBinding);
  const accountBindingMatch = Boolean(configuredBinding && approvalBinding === configuredBinding);
  const approvalActive = approvedAtMs !== null
    && expiresAtMs !== null
    && expiresAtMs > approvedAtMs
    && approvedAtMs <= nowMs
    && expiresAtMs > nowMs;

  const reasons = [
    clean(receipt.approvalId) ? null : "kis_account_read_live_approval_required",
    clean(receipt.approvedBy) ? null : "kis_account_read_live_approved_by_required",
    approvedAtMs !== null ? null : "kis_account_read_live_approved_at_invalid",
    expiresAtMs !== null && approvedAtMs !== null && expiresAtMs > approvedAtMs
      ? null
      : "kis_account_read_live_expires_at_invalid",
    approvedAtMs === null || approvedAtMs <= nowMs ? null : "kis_account_read_live_approval_inactive",
    expiresAtMs === null || expiresAtMs > nowMs ? null : "kis_account_read_live_approval_expired",
    scopeMatch ? null : "kis_account_read_live_scope_mismatch",
    environmentMatch ? null : "kis_account_read_live_environment_mismatch",
    baseUrlMatch ? null : "kis_account_read_live_base_url_mismatch",
    isKisTradingAccountIdValid(accountId) ? null : "kis_account_read_live_account_invalid",
    accountBindingPresent ? null : "kis_account_read_live_account_binding_required",
    accountBindingMatch ? null : "kis_account_read_live_account_binding_mismatch",
    requiredForbiddenActionsPresent ? null : "kis_account_read_live_forbidden_actions_incomplete",
    clean(receipt.evidenceTicket) ? null : "kis_account_read_live_evidence_ticket_required",
    clean(receipt.revocationPlan) ? null : "kis_account_read_live_revocation_plan_required",
    clean(receipt.redactionVersion) ? null : "kis_account_read_live_redaction_version_required",
  ].filter(Boolean);

  const result = projectKisAccountLiveReadApprovalPublic({
    version: KIS_ACCOUNT_LIVE_READ_APPROVAL_VERSION,
    ready: reasons.length === 0,
    reasons,
    approvalIdPresent: Boolean(clean(receipt.approvalId)),
    approvedByPresent: Boolean(clean(receipt.approvedBy)),
    approvedAtValid: approvedAtMs !== null,
    expiresAtValid: expiresAtMs !== null && approvedAtMs !== null && expiresAtMs > approvedAtMs,
    approvalActive,
    approvalExpired: expiresAtMs !== null && expiresAtMs <= nowMs,
    scopeMatch,
    environmentMatch,
    baseUrlMatch,
    accountBindingPresent,
    accountBindingMatch,
    requiredForbiddenActionsPresent,
    evidenceTicketPresent: Boolean(clean(receipt.evidenceTicket)),
    revocationPlanPresent: Boolean(clean(receipt.revocationPlan)),
    redactionVersionPresent: Boolean(clean(receipt.redactionVersion)),
  });
  approvalAssessments.set(result, Object.freeze({
    authorized: result.ready,
    reasons: Object.freeze([...result.reasons]),
    expiresAtMs,
    accountBinding: configuredBinding,
  }));
  return result;
}

export function createKisAccountLiveReadAccessDecision(approval, adminStartAuthorization) {
  if (!consumeAdminStartAuthorization(adminStartAuthorization)) return null;
  const assessment = approvalAssessments.get(approval);
  if (!assessment) return null;
  const decision = Object.freeze({});
  liveAccessDecisions.set(decision, assessment);
  return decision;
}

export function isKisAccountLiveReadAccessDecisionValid(decision, options = {}) {
  const value = liveAccessDecisions.get(decision);
  const nowMs = Number.isFinite(options.nowMs) ? options.nowMs : Date.now();
  return Boolean(
    value?.authorized
    && Number.isFinite(value.expiresAtMs)
    && value.expiresAtMs > nowMs
    && value.accountBinding
    && value.accountBinding === accountBinding(options.accountId),
  );
}
