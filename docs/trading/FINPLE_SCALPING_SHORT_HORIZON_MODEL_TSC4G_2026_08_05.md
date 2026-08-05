# FINPLE TSC-4G — Deterministic Short-Horizon Model Research Pipeline

Date: 2026-08-05  
Scope: representative-only private Trading Lab  
Status: research implementation only; no provider activation, runtime approval, or order capability

## 1. Purpose

TSC-4G adds the first reproducible short-horizon prediction baseline for the private leveraged/inverse ETF scalping path.

The objective is not to claim profitability. The objective is to make the following research steps executable and auditable:

```text
immutable one-minute input series
→ point-in-time feature extraction
→ forward label creation
→ chronological train / validation / test split
→ train-only normalization
→ deterministic classifier and expected-return regression
→ checksummed research artifact
→ immutable typed model-signal fixtures
→ walk-forward evaluation
```

The model is intentionally simple:

- logistic probability model for a positive forward return;
- linear regression for expected forward return in basis points;
- fixed initialization and fixed gradient-descent policy;
- no random split or stochastic training;
- no external package or hosted-model dependency.

This is a research baseline, not the final model-selection decision.

## 2. Relationship to the existing general AI/ML architecture

`tradingAiMlDatasetArchitecture.js` remains unchanged and design-only.

That existing contract describes general FINPLE AI/ML dataset families and keeps:

```text
modelTrainingAllowed = false
modelArtifactCreationAllowed = false
providerCallsAllowed = false
```

TSC-4G is narrower. It applies only to the representative's private Trading Lab and accepts explicitly supplied immutable research series. It does not activate the general AI/ML architecture or change its flags.

## 3. Input provenance

Dataset construction requires all fields:

```text
datasetId
sourceRevision
rawDataChecksum
calendarVersion
licensePolicyId
immutable=true
```

Missing or mutable provenance is rejected.

The repository does not download, persist, or license external one-minute data in this stage. A future actual-data run must supply a separately reviewed source revision, raw-data checksum, and license-policy identifier.

## 4. Point-in-time feature contract

Contract version:

```text
scalping-short-horizon-features-v1
```

Initial features:

| Feature | Definition |
|---|---|
| `return1Bps` | trailing one-minute return |
| `return3Bps` | trailing three-minute return |
| `return5Bps` | trailing five-minute return |
| `emaSpreadBps` | EMA 5 versus EMA 20 spread |
| `vwapDeviationBps` | current close versus trailing 20-minute VWAP |
| `realizedVolatilityBps` | trailing 20-minute return volatility |
| `rangeBps` | current completed-bar high-low range |
| `volumeZScore` | current volume versus trailing volume distribution |
| `spreadBps` | current bid/ask spread or explicit fixed research fallback |
| `orderBookImbalance` | bid-size versus ask-size imbalance |
| `minutesSinceOpenScaled` | regular-session progress |
| `minutesToCloseScaled` | regular-session time remaining |
| `isInverseEtf` | inverse ETF indicator |

Every feature uses only completed bars at or before the prediction minute.

Forbidden:

- future close, high, low, volume, or quote as a feature;
- forward return as a feature;
- normalization fit on validation or test rows;
- full-period statistics;
- random row shuffle.

## 5. Label contract

Default research label:

```text
horizon = 3 minutes
positive class = forward return > 8bp
```

The threshold and horizon are explicit artifact metadata and may be changed only through a new research configuration.

Each row records:

```text
timestamp
minuteEnd / dataCutoff
labelEnd
forwardReturnBps
positive class
```

Rows crossing a session boundary are excluded.

## 6. Split and leakage policy

The default split is chronological by trading session:

```text
train
→ embargo
→ validation
→ embargo
→ test
```

Rules:

- random split is prohibited;
- scaler means and deviations are fit on train only;
- validation and test sessions follow train sessions;
- walk-forward folds preserve an explicit embargo;
- training never includes a test session;
- every fold records train end and test start.

## 7. Model artifact

Artifact version:

```text
scalping-short-horizon-artifact-v1
```

The artifact contains:

- model ID and version;
- feature, dataset, training, and signal-schema versions;
- horizon and label threshold;
- train-only scaler;
- classifier weights and intercept;
- expected-return regressor weights and intercept;
- immutable dataset provenance;
- chronological split sessions;
- row counts;
- SHA-256 model checksum;
- train, validation, and test metrics.

Metrics include:

```text
sample count
accuracy
Brier score
log loss
expected-return MAE in bp
positive-class rate
```

Artifact status is always:

```text
research_candidate
runtimeApproved = false
```

It cannot automatically register itself with the TSC-4F2 runtime.

## 8. Typed signal and immutable replay fixture

The scorer emits the existing TSC-4F schema:

```text
scalping-model-signal-v1
```

Fields include:

- symbol and completed-minute timestamp;
- probabilityUp;
- expectedReturnBps;
- confidence;
- horizonMinutes;
- regime;
- model ID, version, and checksum;
- generatedAt;
- dataCutoff;
- dataset provenance ID.

Historical fixtures use:

```text
scalping-model-signal-replay-fixture-v1
```

Each fixture has immutable provenance and a fixture checksum. It can be validated by the already merged TSC-4F adapter.

## 9. Walk-forward contract

Walk-forward uses fixed session windows:

```text
prior train sessions
→ validation tail inside the training block
→ embargo
→ next test sessions
→ advance by fixed step
```

Each fold records:

- train, validation, and test sessions;
- train end and test start;
- embargo size;
- artifact checksum;
- train, validation, and test metrics;
- leakage-safety flags.

No fold automatically approves a model even when metrics are favorable.

## 10. Safety boundaries

Always false or prohibited:

```text
automaticApprovalAllowed
runtimeRegistrationAllowed
orderSubmissionAllowed
liveActivationAllowed
randomSplitUsed
futureLeakageAllowed
externalDataDownloadPerformed
datasetPersisted
```

Not performed:

- no KIS connection;
- no external model or OpenAI API call;
- no one-minute provider download;
- no environment or secret mutation;
- no DB migration or write;
- no model Runtime registration;
- no account or order call;
- no Production deployment or promotion.

## 11. Interpretation

Passing synthetic deterministic tests proves only that the research pipeline obeys its contracts.

It does not prove:

- predictive power on actual US market data;
- profitability after real costs;
- robustness across volatility regimes;
- stability of probability calibration;
- eligibility for Shadow or Live operation.

## 12. Next stage

After review and merge:

1. select and document an actual one-minute data source and license policy;
2. create an immutable raw-data revision and checksum outside runtime;
3. run the feature and dataset builder on actual data;
4. compare the linear baseline with tree-based candidates under the same split contract;
5. freeze the selected artifact and immutable signal fixtures;
6. replay the selected signals through TSC-3 execution simulation;
7. only then prepare a bounded no-order KIS Shadow pilot.
