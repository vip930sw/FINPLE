# Step 114-2X-M approval verification audit

## Baseline and history preservation

- Starting main: `0a828e44131e1651e3118a6318cf51a8ac11786e`
- Step L merge: `9c5421a90c83f53c970f7a4b9b7abd37c14eb7f7`
- Intermediate noop creation: `1fc24d7ad359a14e86e9c776dc8879e1c52eb34f`
- Current main noop deletion: `0a828e44131e1651e3118a6318cf51a8ac11786e`
- Step L merge tree to starting main changed files: zero

The two noop-history commits are preserved. No reset, rebase, squash, force-push, or history rewrite is part of Step M.

## Contract inventory

- `metrics-cutover-live-observation-approval-response-v1-step114-2x-m`
- `metrics-cutover-live-observation-approver-allowlist-v1-step114-2x-m`
- `metrics-cutover-live-observation-approval-verification-policy-v1-step114-2x-m`
- `metrics-cutover-live-observation-authority-package-v1-step114-2x-m`
- `metrics-cutover-live-observation-approval-verification-summary-v1-step114-2x-m`

## Tamper coverage

Focused tests cover exact response fields, direct Step L and Step H revalidation, Ed25519 signature drift, wrong signer key, revoked/wildcard/duplicate/invalid-time allowlist entries, scope and role drift, nonce equality/replay/duplicate/ordering, response lifetime and upstream expiry, denied decisions, attestation drift, policy drift, and fixed-false authority/summary tampering. The CLI default and the absence of external or execution capabilities are also checked.

## Validation record

- Step M focused: 42 tests, 42 passed, 0 failed.
- Standalone L/K/J/I/H/G/F/E/D/C/B/A/W: respectively 26/23/24/32/31/27/34/50/38/49/31/24/68 passed, 0 failed.
- Combined W through M: 499 passed, 0 failed.
- Combined Q through M: 878 passed, 0 failed.
- Combined N through M: 1,082 passed, 0 failed.
- Python candidate package: 16 passed.
- Python metrics discovery: 48 passed.
- Scenario metrics: 80 passed, 0 failed.
- Production build: passed; only the existing large-chunk advisory was emitted.
- AI production smoke: passed.
- `git diff --check` and `git diff --cached --check`: passed.
- Detached clean starting-head repository-wide spec reporter: stopped at the required 240-second bound; zero failing test names were emitted before timeout.
- Separate known-boundary Step228 standalone: 4 passed, 1 failed, `Step228 checker passes and leaves working tree unchanged`; root cause remains the pre-existing Windows `snapshot format is not canonical` newline portability failure.

No failure outside the known Step228 boundary was observed. The Step228 checker, test, snapshot, and `.gitattributes` are outside this change and were not modified.

## External-action attestation

This work does not send an approval request; record an approval; create or persist a signature, private key, seed, or real signer identity; observe DNS, TLS, a provider, or a database; connect to PostgreSQL; handle endpoint, credential, or certificate material; execute SQL, DDL, migration, scenarios, claims, locks, receipts, evidence collection, disposal, runtime, production, or deployment work; or rewrite Git history.
