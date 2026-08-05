# FINPLE TSC-4H — Historical One-Minute Data Source and Immutable Intake

Date: 2026-08-05  
Scope: representative-only private Trading Lab  
Status: provider selection and intake contract only; no purchase, download, KIS activation, model approval, or order capability

## 1. Purpose

TSC-4G created a deterministic short-horizon research model that requires explicitly supplied immutable one-minute market data.

TSC-4H defines:

- a reviewed initial historical-data provider order;
- a license and use-case receipt;
- an acquisition-plan checksum;
- normalized one-minute OHLCV and BBO intake;
- duplicate, quote, session, symbol, and provenance checks;
- an immutable raw-data revision and SHA-256 checksum;
- a bounded secondary-source cross-check.

This stage does not make a provider call or authorize a purchase.

## 2. Provider decision

### Primary candidate — Databento US Equities Mini

```text
providerId = databento
datasetId = EQUS.MINI
required schemas = ohlcv-1m + bbo-1m
```

Official references reviewed on 2026-08-05:

- https://databento.com/docs/venues-and-datasets/equs-mini
- https://databento.com/docs/schemas-and-data-formats/ohlcv
- https://databento.com/pricing
- https://databento.com/docs/faqs/usage-pricing-and-data-credits
- https://databento.com/equities

Reasons:

1. the dataset exposes one-minute OHLCV and aggregated top-of-book schemas;
2. historical requests are usage-based rather than requiring a standing monthly subscription;
3. a bounded eight-symbol request can be quoted before purchase;
4. licensing is handled through a self-service workflow;
5. the same normalized provider supports higher-granularity research later without changing the dataset identity.

Important limitation:

Databento US Equities Mini is a derived composite top-of-book product, not the full SIP NBBO. Its official materials state that Nasdaq TotalView history is more complete for intraday simulation. The Mini dataset is therefore an initial cost-controlled research source, not a claim of full-market microstructure equivalence.

### Secondary candidate — Massive Stocks

Official references:

- https://massive.com/pricing?product=stocks
- https://massive.com/docs/rest/stocks/aggregates/custom-bars
- https://massive.com/docs/flat-files/stocks/minute-aggregates

Snapshot reviewed on 2026-08-05:

- Basic: free, two years, minute aggregates, end-of-day;
- Starter: USD 29/month, five years, minute aggregates and flat files;
- Developer: USD 79/month, ten years and trades;
- Advanced: USD 199/month, 20+ years, trades and quotes.

Massive is retained as a consolidated-market OHLCV cross-check candidate. Historical quote-dependent execution research may require the Advanced plan. Prices and terms must be revalidated before purchase.

### Secondary candidate — Alpaca SIP

Official references:

- https://alpaca.markets/data
- https://docs.alpaca.markets/us/docs/market-data-faq
- https://docs.alpaca.markets/us/v1.4.2/docs/about-market-data-api
- https://docs.alpaca.markets/us/reference/stockbars

Snapshot reviewed on 2026-08-05:

- Basic: free, IEX real-time coverage, historical access since 2016 with stated limitations;
- Algo Trader Plus: USD 99/month, all-US-exchange SIP coverage and higher request limits.

Alpaca is a simple subscription fallback. IEX-only data must not be treated as equivalent to SIP or the production KIS quote stream.

## 3. Required schemas

The initial model feature contract requires both price/volume and historical quote context.

Required:

```text
ohlcv-1m
bbo-1m or an equivalent historical quote schema
```

Optional future research:

```text
trades
mbp-1
definition
```

If only OHLCV is purchased, the intake must mark:

```text
quote_absent_requires_separate_execution_calibration
```

Such data may be used for price-only model research but must not be used to claim historical spread, imbalance, or execution-quality evidence.

## 4. Purchase boundary

Before any purchase or API call, the operator must preserve:

- provider and dataset ID;
- portal estimate, quote, or invoice ID;
- exact symbols, schemas, and date range;
- estimated cost and budget approval outside code;
- provider classification of the user and use case;
- retention and redistribution terms;
- entitlement range;
- terms-review timestamp;
- reviewer identity.

The acquisition plan always returns:

```text
purchaseAuthorized = false
providerCallsAllowed = false
apiKeyAccepted = false
```

A later explicit operator approval is required to perform a download.

## 5. License receipt

Contract:

```text
scalping-historical-license-receipt-v1
```

Approved use case:

```text
useCase = internal_non_display_research
displayUse = private_admin_only
redistributionPolicy = no_external_redistribution
```

The receipt contains no API key, password, account number, or payment card data.

Required fields:

- provider and dataset ID;
- license policy ID;
- quote or invoice ID;
- acquired and terms-checked timestamps;
- optional validity end;
- retention policy;
- provider user classification;
- reviewer;
- immutable flag;
- deterministic receipt checksum.

## 6. Raw row contract

Each merged one-minute row must include:

```text
symbol
timestamp
sessionDate
OHLCV
bid / ask
optional bidSize / askSize
regular-session state
source schema
source sequence
```

Rules:

- only TQQQ, SQQQ, SOXL, SOXS, UPRO, SPXU, TNA, and TZA;
- valid positive OHLC and non-negative volume;
- ask greater than or equal to bid;
- regular US session only;
- exact symbol plus timestamp uniqueness;
- no forward-filled bars;
- no fabricated quote;
- every planned symbol represented;
- provider export sequence retained for audit.

## 7. Immutable raw revision

Contract:

```text
scalping-historical-raw-revision-v1
```

Required metadata:

- source revision;
- provider export job ID;
- provider file checksum;
- acquisition-plan checksum;
- license-receipt checksum;
- calendar version;
- symbols and schemas;
- row and coverage summary;
- immutable flag.

Output:

```text
status = immutable_intake_candidate
readyForModelResearch = true
readyForRuntime = false
```

The function computes a deterministic `rawDataChecksum` but does not persist the rows or register the dataset with Runtime.

## 8. Cross-source check

A bounded sample may be compared with Massive or Alpaca.

Default comparison dimensions:

- close-price difference in basis points;
- spread difference in basis points;
- exact symbol and minute match.

A successful comparison does not replace the primary source automatically and does not approve the model.

## 9. Initial proposed acquisition window

This PR does not authorize the request, but the recommended first quote is:

```text
symbols: TQQQ, SQQQ, SOXL, SOXS, UPRO, SPXU, TNA, TZA
period: most recent complete 24 months
schemas: ohlcv-1m + bbo-1m
session: US regular session only
delivery: historical batch
use: internal non-display research
```

Rationale:

- enough sessions for initial walk-forward folds;
- bounded cost before longer-history purchase;
- includes multiple market regimes;
- limits data volume while model and execution contracts are still being calibrated.

After the first quote, compare the estimated cost of 24 months with 5 years before approval.

## 10. Safety invariants

Always false:

```text
purchaseAuthorized
providerCallsAllowed
externalDownloadPerformed
apiKeyAccepted
credentialsPersisted
rawPayloadPersisted
automaticModelApprovalAllowed
runtimeRegistrationAllowed
orderSubmissionAllowed
liveActivationAllowed
```

## 11. Next stage

After review and merge:

1. create a provider account outside the repository;
2. obtain and preserve an exact quote and license classification;
3. explicitly approve a bounded purchase;
4. download the batch outside Production;
5. compute the provider file checksum;
6. pass normalized rows through this intake contract;
7. run TSC-4G on the immutable revision;
8. replay typed model signals through TSC-3 execution simulation;
9. compare a bounded sample against a secondary source;
10. only then consider model approval for a no-order Shadow pilot.
