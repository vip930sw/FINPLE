# FINPLE Step 114-2ZA protected Preview QA template

이 문서는 operator가 실제 protected Vercel Preview를 배포한 뒤 작성하는 기록 양식이다. 실제 확인 전 항목은 `[ ]`로 유지한다. token, cookie, 인증 header, `.vercel/project.json`, 로컬 절대경로는 기록하지 않는다.

## deployment evidence

- Preview URL:
- Vercel project:
- Preview deployment ID:
- deployed commit SHA:
- operator QA date/time:
- Deployment Protection/SSO enabled: `[ ]`
- Preview environment confirmed; production/alias/promote absent: `[ ]`
- source ZIP SHA-256 matches approved input: `[ ]`
- staged `targetBaseUrl`: `/app-preview-data/2026-07-22`
- `metricBaseDate`: `2026-07-22`
- `metricDataThroughMonth`: `2026-06`

## network and integrity

- [ ] `/` returns the app through protected Preview
- [ ] `/app-preview-data/2026-07-22/app-preview-manifest.json` returns 200
- [ ] `metrics-overlay.json` returns 200 and expected SHA-256/size
- [ ] `monthly-returns-index.json` returns 200 and expected SHA-256/size
- [ ] all 64 shard URLs are present in the index
- [ ] sampled shard SHA-256/size matches the manifest
- [ ] all app-preview requests are same-origin
- [ ] no public external data host was introduced
- [ ] initial page entry does not request the monthly-return index or all shards
- [ ] selecting one asset requests only its indexed shard
- [ ] concurrent consumers do not duplicate the same shard request
- [ ] no request for raw daily or normalized month-end source data
- [ ] no 2026-07 partial-month calculation data

Observed initial requests:

| Request | Status | Bytes | Expected behavior |
|---|---:|---:|---|
| `app-preview-manifest.json` |  |  | initial |
| `metrics-overlay.json` |  |  | initial |
| `monthly-returns-index.json` |  |  | lazy |
| selected monthly shard |  |  | lazy |

## catalog and identity

- [ ] search catalog contains exactly 6,000 assets
- [ ] US count is 3,000
- [ ] KR count is 3,000
- [ ] identity uses `market+ticker`
- [ ] `069500` keeps its leading zero
- [ ] `0086C0` keeps its uppercase alphanumeric identity
- [ ] missing values remain unavailable/null and are not converted to zero
- [ ] missing-price asset shows unavailable/review state
- [ ] review-only status is distinguishable within the existing UI status surface
- [ ] no `NaN`, `Infinity`, blank-number artifact, or infinite loading state

Representative missing-price identity tested:

## QQQ metric policy

- [ ] `rawPriceCagr10y` is approximately `21.21`
- [ ] `rollingCagr10yMedian` is approximately `17.11`
- [ ] `validRollingWindowCount10y` is `120`
- [ ] `selectedCagr` equals `rollingCagr10yMedian`
- [ ] `cagrPolicy` is `rolling_10y_median`
- [ ] legacy collector CAGR `20.1` is not reused as expected/selected CAGR
- [ ] `selectedMdd` is labeled/presented as full-period actual MDD
- [ ] `mddPolicy` is `full_period_actual`
- [ ] MDD is not labeled rolling median
- [ ] `selectedBeta` uses aligned monthly returns
- [ ] `betaPolicy` is `aligned_monthly_return_beta`
- [ ] Beta is not labeled rolling median
- [ ] dividend yield/status preserve zero versus missing semantics

Observed QQQ values:

| Field | Value |
|---|---:|
| `rawPriceCagr10y` |  |
| `rollingCagr10yMedian` |  |
| `validRollingWindowCount10y` |  |
| `selectedCagr` |  |
| `selectedMdd` |  |
| `selectedBeta` |  |
| `dividendYield` / `dividendStatus` |  |

## product flows

Test assets: `US:QQQ`, `US:SPY` or one representative US asset, `KR:069500`, `KR:0086C0`, one missing-price asset.

- [ ] asset search
- [ ] Step 2 comparison
- [ ] Step 3 detail metrics
- [ ] CAGR/MDD/Beta/dividend display
- [ ] growth chart renders without broken axes or empty/infinite state
- [ ] scenario analysis uses lazy monthly-return shards
- [ ] gaps remain gaps; no missing-month forward-fill
- [ ] portfolio comparison with 1 asset
- [ ] portfolio comparison with 2 assets
- [ ] portfolio comparison with 3 assets
- [ ] saved portfolio reload preserves market+ticker identities and existing wiring
- [ ] PDF/export completes and preserves missing-value semantics

Notes by flow:

## responsive QA

Desktop:

- Browser/viewport:
- [ ] search, Step 2, Step 3, chart, scenario, saved reload, PDF/export
- [ ] no clipped review status, broken chart, or infinite loading

Mobile:

- Browser/viewport: `375px`
- [ ] search, Step 2, Step 3, chart, scenario, saved reload, PDF/export
- [ ] no horizontal data corruption, clipped status, broken chart, or infinite loading

## regression and boundaries

- [ ] build without Preview variables keeps existing loader fallback
- [ ] production selector unchanged
- [ ] public production CSV unchanged
- [ ] production deployment and domain unchanged
- [ ] provider calls absent
- [ ] DB/KIS/order/trading changes absent
- [ ] generated review-only export absent from Git
- [ ] actual deployment remained Draft-PR/Preview-only

## result

- Overall: `PASS / FAIL / BLOCKED`
- Blocking observations:
- Browser screenshots retained operator-locally:
- Network capture retained operator-locally:
- Preview deployment removed after QA: `[ ]`
- External staging removed after QA: `[ ]`
