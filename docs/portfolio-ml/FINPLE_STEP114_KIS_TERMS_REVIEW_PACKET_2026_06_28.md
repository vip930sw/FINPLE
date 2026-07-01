# FINPLE Step 114 KIS Terms Review Packet

Date: 2026-06-28
Scope: Issue #221 Step 114 P0 KIS source-policy review

## Review Result

Korea Investment Open API remains blocked for FINPLE runtime provider calls, cache writes, and `scenario_monthly_returns.csv` generation.

The official KIS endpoint evidence is present, but the public terms evidence does not independently approve FINPLE's intended use case:

- collecting KIS overseas price and rights rows for FINPLE scenario data
- storing raw KIS API responses in an internal cache
- deriving monthly returns from those rows
- showing or redistributing derived scenario outputs to FINPLE users

This packet is not legal advice and is not an approval. It records the terms questions that must be answered by the source owner/legal reviewer or by written KIS confirmation.

## Official Sources Checked

| Source | URL | Evidence |
| --- | --- | --- |
| KIS Developers portal | `https://apiportal.koreainvestment.com/` | Footer exposes the KIS Developers customer terms and agency terms modals. |
| Customer terms API | `https://apiportal.koreainvestment.com/api/terms/public?termsType=MARKET` | Customer terms response: `termsType=MARKET`, `version=28`, `lastModifiedDate=2024-04-11T16:10:59+09:00`. |
| Agency terms API | `https://apiportal.koreainvestment.com/api/terms/public?termsType=AGENCY` | Agency terms response: `termsType=AGENCY`, `version=31`, `lastModifiedDate=2024-04-11T16:15:18+09:00`. |
| Service guide | `https://apiportal.koreainvestment.com/about-howto` | Official route for Open API service-use guidance and API application links. |
| Official sample repository | `https://github.com/koreainvestment/open-trading-api` | Sample code repository for endpoint capability evidence, not a redistribution approval. |

## Terms Signals

Customer terms:

- Article 5 requires customers to manage app keys and secrets and not disclose them to third parties.
- Article 5 states that market data supplied by KIS should be used only for the customer's personally developed program or personal work and should not be provided to third parties.
- Article 11 states that KIS may charge service fees, except when the fee is zero.
- Article 12 states that KIS may apply request-rate control policies.

Agency terms:

- Article 5 requires the agency to manage security codes and institution identifiers.
- Article 5 limits KIS market-data use to the company's trading customers through Open API service and prohibits other purposes.
- Article 12 states that agency service fees are determined by KIS and may be negotiated with the agency.
- Article 13 states that KIS may apply request-rate control policies.

## FINPLE Decision

The current FINPLE use case should be treated as unapproved until one of these is true:

1. KIS provides written confirmation that FINPLE may store raw API response rows internally and use them to derive monthly returns.
2. KIS provides written confirmation that FINPLE may show or redistribute derived monthly/scenario outputs to FINPLE users.
3. FINPLE legal/source owner records a narrower approved use that avoids raw-row retention and avoids redistribution.
4. FINPLE selects a different licensed source whose terms explicitly cover storage, derived metrics, and display.

Until then:

- `termsReviewed=no`
- `rawRedistributionReviewed=no`
- `capabilityReady=false`
- `responseReady=false`
- provider calls remain blocked
- provider adapter implementation remains blocked
- monthly cache writer remains blocked
- `scenario_monthly_returns.csv` must not be written

## Written Response Gate

The KIS confirmation email was sent to `openapi@koreainvestment.com` on 2026-06-28, but the committed state is still pending response and blocked:

```text
data/processed/scenario_p0_kis_written_response_intake.csv
data/processed/scenario_p0_kis_written_response_preflight.json

responseStatus=pending_response
responseReady=false
providerCallsAllowed=false
```

This gate must remain blocked unless KIS gives written confirmation and FINPLE records the response evidence, reviewer email, reviewed timestamp, approved use scope, agreement classification, `termsReviewed=yes`, and `rawRedistributionReviewed=yes`.

## Market-Data Reprocessing Follow-Up

The owner reported a KIS follow-up email sent on 2026-07-01. The follow-up narrowed the question to market-data use only:

- use overseas daily price and rights APIs as internal calculation inputs
- do not display raw market data, raw quote rows, raw charts, or downloadable API rows
- do not discuss mock trading, live trading, personal-account trading permission, or order submission permission
- ask whether derived monthly returns, benchmark returns, volatility, loss probability, and scenario analytics may be displayed after internal calculation
- ask what cache, log, retention, attribution, disclaimer, commercial-use, and information-use-agreement rules apply

This follow-up is recorded in:

```text
data/processed/scenario_p0_kis_market_data_reprocessing_follow_up.json
scripts/generate-scenario-p0-kis-market-data-reprocessing-follow-up.cjs
scripts/generate-scenario-p0-kis-market-data-reprocessing-follow-up.test.cjs
```

The follow-up sent record is not approval. It does not change `responseReady=false`, does not authorize provider calls, does not authorize raw-row storage, does not authorize monthly data writes, and does not create `scenario_monthly_returns.csv`.

## Questions To Send To KIS Or Legal

Ready-to-send Korean email draft:
`docs/portfolio-ml/FINPLE_STEP114_KIS_CONFIRMATION_EMAIL_DRAFT_2026_06_28.md`

```text
We are reviewing whether FINPLE may use Korea Investment Open API for portfolio scenario analytics.

Planned use:
- call overseas stock price endpoints for US ETF/stock historical price data
- call overseas rights endpoints for dividend/split/corporate-action review
- store raw API response rows internally for audit and recalculation
- derive monthly return series from the raw rows
- display derived risk/return scenario outputs to FINPLE users

Please confirm in writing:
1. Is this use allowed under the KIS Open API customer or agency terms?
2. May raw API response rows be stored in FINPLE's internal cache or database?
3. May derived monthly returns, benchmark returns, and scenario analytics be shown to FINPLE users?
4. Are there limits on redistribution, display labels, attribution, retention period, or commercial use?
5. Are additional fees, approvals, contracts, or agency onboarding required?
6. Are there request-rate or operational limits specific to historical overseas price and rights endpoints?
```

If KIS rejects the use case or does not clearly approve raw-row cache storage and derived user-facing analytics display, keep KIS blocked and evaluate a paid or licensed source under the same source-policy approval fields.

## Source-Policy Requirement Before Unlock

The KIS source-policy rows can move to approved only if the evidence record includes:

- reviewer name or owner email
- reviewed timestamp
- official KIS terms URL or written response URL
- approved storage policy for raw rows
- approved redistribution/display policy for derived outputs
- approved retention period
- approved endpoint list
- approved display label policy, including proxy labels where applicable

The committed repository state remains blocked by design.
