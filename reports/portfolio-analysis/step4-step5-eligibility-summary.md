# Step 4/5 Eligibility and Coverage Inventory

- Report as of: `2026-08-04`
- Input release timestamp: `2026-07-26T02:03:18Z` (source binding timestamp, not report generation time)
- Runtime catalog: `src/data/tickers/finple_app_candidates_v2.csv` — 6,029 identities, excluding `CASH:CASH`
- Monthly binding: `public/app-data/finple-universe-v2-2026-07-24/production-app-export-release.json`, `public/app-data/finple-universe-v2-2026-07-24/monthly-returns-index.json`, 64 shards
- Monthly contract: `legacy_v1`

An `expected_blocked` checker result is not numeric Step 4/5 availability.

## Reconciliation and numeric coverage

| Dimension | Count | Percent |
| --- | ---: | ---: |
| Runtime identities | 6029 | 100% |
| KR | 3000 | 49.7595% |
| US | 3029 | 50.2405% |
| Step 3 ready | 4712 | 78.1556% |
| Step 4 numeric ready | 1338 | 22.1927% |
| Step 5 numeric ready | 1338 | 22.1927% |
| Step 4 ready / Step 5 Beta blocked | 0 | 0% |

## Primary states

| State | Overall | Percent | KR | US |
| --- | ---: | ---: | ---: | ---: |
| ready | 1338 | 22.1927% | 280 | 1058 |
| missing_monthly_identity | 682 | 11.312% | 654 | 28 |
| short_history_lt_60 | 0 | 0% | 0 | 0 |
| proxy_marked | 0 | 0% | 0 | 0 |
| legacy_unproven | 0 | 0% | 0 | 0 |
| review_required | 4009 | 66.4953% | 2066 | 1943 |
| identity_mismatch | 0 | 0% | 0 | 0 |
| missing_or_invalid_beta | 0 | 0% | 0 | 0 |
| missing_or_invalid_metrics | 0 | 0% | 0 | 0 |
| other_policy_block | 0 | 0% | 0 | 0 |

Primary precedence: identity mismatch → missing monthly identity → proxy marked → current catalog review gate → denied legacy lineage → short history → invalid Step 3 metrics → invalid Beta → final policy fallback → ready. When review and legacy evidence coexist, the current catalog review gate is primary and legacy evidence stays in `secondaryFlags`.

## Official portfolio coverage

`CASH:CASH` is excluded from the 6,029-identity inventory and appears below only as `native_manual_reference`, ready for portfolio calculations but distinct from catalog ready.

| Portfolio | Step 3 | Step 4 | Step 5 moderate/severe | Step 4 blocked weight | Step 5 blocked weight | Blocked identities |
| --- | --- | --- | --- | ---: | ---: | --- |
| DEFAULT_ASSETS | ready | ready | ready | 0% | 0% | none |
| DIVIDEND_ASSETS | ready | ready | ready | 0% | 0% | none |
| STABLE_ASSETS | ready | ready | ready | 0% | 0% | none |
| GROWTH_ASSETS | ready | ready | ready | 0% | 0% | none |
| GOLD_DEFENSE_ASSETS | ready | ready | ready | 0% | 0% | none |
| REIT_INCOME_ASSETS | ready | expected_blocked | expected_blocked | 35% | 35% | US:VNQ |
| GROWTH_ZERO_ASSETS | ready | ready | ready | 0% | 0% | none |
| GROWTH_FOCUS_ASSETS | ready | ready | ready | 0% | 0% | none |
| ALL_WEATHER_ASSETS | ready | ready | ready | 0% | 0% | none |
| HIGH_CONVICTION_ASSETS | ready | expected_blocked | expected_blocked | 15% | 15% | US:BLOK |

## US Investment MBTI coverage (16)

| Portfolio | Step 3 | Step 4 | Step 5 moderate/severe | Step 4 blocked weight | Step 5 blocked weight | Blocked identities |
| --- | --- | --- | --- | ---: | ---: | --- |
| 안정-장기-자동-분산 (차분한 수호자형) | ready | expected_blocked | expected_blocked | 6% | 6% | US:VNQ |
| 안정-장기-자동-확신 (신중한 코어빌더형) | ready | ready | ready | 0% | 0% | none |
| 안정-장기-주도-분산 (용의주도한 설계자형) | ready | expected_blocked | expected_blocked | 7% | 7% | US:VNQ |
| 안정-장기-주도-확신 (철저한 전략가형) | ready | ready | ready | 0% | 0% | none |
| 안정-기회-자동-분산 (침착한 관찰자형) | ready | expected_blocked | expected_blocked | 5% | 5% | US:VNQ |
| 안정-기회-자동-확신 (현명한 선별가형) | ready | ready | ready | 0% | 0% | none |
| 안정-기회-주도-분산 (민첩한 리스크매니저형) | ready | expected_blocked | expected_blocked | 8% | 8% | US:VNQ |
| 안정-기회-주도-확신 (대담한 수비수형) | ready | expected_blocked | expected_blocked | 5% | 5% | US:BLOK |
| 성장-장기-자동-분산 (꾸준한 개척자형) | ready | expected_blocked | expected_blocked | 7% | 7% | US:VNQ |
| 성장-장기-자동-확신 (믿음직한 항해자형) | ready | ready | ready | 0% | 0% | none |
| 성장-장기-주도-분산 (균형 잡힌 건축가형) | ready | expected_blocked | expected_blocked | 7% | 7% | US:VNQ |
| 성장-장기-주도-확신 (장기 성장 전략가형) | ready | expected_blocked | expected_blocked | 5% | 5% | US:BLOK |
| 성장-기회-자동-분산 (열린 탐험가형) | ready | expected_blocked | expected_blocked | 10% | 10% | US:BLOK, US:VNQ |
| 성장-기회-자동-확신 (예리한 선구자형) | ready | expected_blocked | expected_blocked | 10% | 10% | US:BLOK |
| 성장-기회-주도-분산 (능동적인 지휘관형) | ready | expected_blocked | expected_blocked | 13% | 13% | US:BLOK, US:VNQ |
| 성장-기회-주도-확신 (용감한 승부사형) | ready | expected_blocked | expected_blocked | 15% | 15% | US:BLOK |

## KR Investment MBTI coverage (16)

| Portfolio | Step 3 | Step 4 | Step 5 moderate/severe | Step 4 blocked weight | Step 5 blocked weight | Blocked identities |
| --- | --- | --- | --- | ---: | ---: | --- |
| 안정-장기-자동-분산 (차분한 수호자형) | ready | expected_blocked | expected_blocked | 40% | 40% | KR:069500, KR:273130, KR:329200 |
| 안정-장기-자동-확신 (신중한 코어빌더형) | ready | expected_blocked | expected_blocked | 8% | 8% | KR:069500 |
| 안정-장기-주도-분산 (용의주도한 설계자형) | ready | expected_blocked | expected_blocked | 42% | 42% | KR:069500, KR:273130, KR:329200 |
| 안정-장기-주도-확신 (철저한 전략가형) | ready | expected_blocked | expected_blocked | 12% | 12% | KR:069500 |
| 안정-기회-자동-분산 (침착한 관찰자형) | ready | expected_blocked | expected_blocked | 33% | 33% | KR:069500, KR:273130, KR:329200 |
| 안정-기회-자동-확신 (현명한 선별가형) | ready | expected_blocked | expected_blocked | 5% | 5% | KR:069500 |
| 안정-기회-주도-분산 (민첩한 리스크매니저형) | ready | expected_blocked | expected_blocked | 37% | 37% | KR:069500, KR:273130, KR:329200 |
| 안정-기회-주도-확신 (대담한 수비수형) | ready | expected_blocked | expected_blocked | 17% | 17% | KR:069500, KR:305720 |
| 성장-장기-자동-분산 (꾸준한 개척자형) | ready | expected_blocked | expected_blocked | 52% | 52% | KR:069500, KR:273130, KR:329200 |
| 성장-장기-자동-확신 (믿음직한 항해자형) | ready | expected_blocked | expected_blocked | 58% | 58% | KR:069500, KR:273130 |
| 성장-장기-주도-분산 (균형 잡힌 건축가형) | ready | expected_blocked | expected_blocked | 60% | 60% | KR:069500, KR:273130, KR:329200 |
| 성장-장기-주도-확신 (장기 성장 전략가형) | ready | expected_blocked | expected_blocked | 65% | 65% | KR:069500, KR:305720 |
| 성장-기회-자동-분산 (열린 탐험가형) | ready | expected_blocked | expected_blocked | 51% | 51% | KR:069500, KR:273130, KR:305720, KR:329200 |
| 성장-기회-자동-확신 (예리한 선구자형) | ready | expected_blocked | expected_blocked | 55% | 55% | KR:069500, KR:305720 |
| 성장-기회-주도-분산 (능동적인 지휘관형) | ready | expected_blocked | expected_blocked | 62% | 62% | KR:069500, KR:273130, KR:305720, KR:329200 |
| 성장-기회-주도-확신 (용감한 승부사형) | ready | expected_blocked | expected_blocked | 85% | 85% | KR:069500, KR:305720 |

## High-use and saved-portfolio dimensions

- Popularity/high-use coverage: `unavailable_no_canonical_source`. No cohort membership or weights were inferred.
- Saved-portfolio coverage: `not_available_no_privacy_safe_aggregate`. No user DB or holdings were queried.

## High-impact blocked identities

Score = official preset count × 100 + total MBTI type count × 10 + summed blocked target weight ÷ 100 + monthly-identity-present bonus 1 + direct-lineage-repair-feasible bonus 1 + contiguous history months ÷ 10,000. Popularity and saved-portfolio dimensions are excluded because their approved aggregate sources are unavailable.

1. `US:VNQ` — score 182.9239; review_required; official 1, US MBTI 8, KR MBTI 0, summed blocked weight 90%.
2. `KR:069500` — score 166.7206; review_required; official 0, US MBTI 0, KR MBTI 16, summed blocked weight 470%.
3. `US:BLOK` — score 162.5901; review_required; official 1, US MBTI 6, KR MBTI 0, summed blocked weight 58%.
4. `KR:273130` — score 93.1508; review_required; official 0, US MBTI 0, KR MBTI 9, summed blocked weight 114%.
5. `KR:329200` — score 82.5583; review_required; official 0, US MBTI 0, KR MBTI 8, summed blocked weight 55%.
6. `KR:305720` — score 62.4393; review_required; official 0, US MBTI 0, KR MBTI 6, summed blocked weight 43%.
7. `KR:000020` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
8. `KR:000050` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
9. `KR:000070` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
10. `KR:000120` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
11. `KR:000140` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
12. `KR:000150` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
13. `KR:000155` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
14. `KR:000157` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
15. `KR:000180` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
16. `KR:000210` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
17. `KR:000220` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
18. `KR:000230` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
19. `KR:000300` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.
20. `KR:000320` — score 2.0239; review_required; official 0, US MBTI 0, KR MBTI 0, summed blocked weight 0%.

## Direct-lineage recovery priorities

1. `US:VNQ` — review_required; `review_completion`; impact score 182.9239.
2. `KR:069500` — review_required; `review_completion`; impact score 166.7206.
3. `US:BLOK` — review_required; `review_completion`; impact score 162.5901.
4. `KR:273130` — review_required; `review_completion`; impact score 93.1508.
5. `KR:329200` — review_required; `review_completion`; impact score 82.5583.
6. `KR:305720` — review_required; `review_completion`; impact score 62.4393.
7. `KR:000020` — review_required; `review_completion`; impact score 2.0239.
8. `KR:000050` — review_required; `review_completion`; impact score 2.0239.
9. `KR:000070` — review_required; `review_completion`; impact score 2.0239.
10. `KR:000120` — review_required; `review_completion`; impact score 2.0239.
11. `KR:000140` — review_required; `review_completion`; impact score 2.0239.
12. `KR:000150` — review_required; `review_completion`; impact score 2.0239.
13. `KR:000155` — review_required; `review_completion`; impact score 2.0239.
14. `KR:000157` — review_required; `review_completion`; impact score 2.0239.
15. `KR:000180` — review_required; `review_completion`; impact score 2.0239.
16. `KR:000210` — review_required; `review_completion`; impact score 2.0239.
17. `KR:000220` — review_required; `review_completion`; impact score 2.0239.
18. `KR:000230` — review_required; `review_completion`; impact score 2.0239.
19. `KR:000300` — review_required; `review_completion`; impact score 2.0239.
20. `KR:000320` — review_required; `review_completion`; impact score 2.0239.

## Required individual audits

- `KR:069500`: **review_required**; 207 rows / 206 contiguous months; Step 4 expected_blocked, Step 5 expected_blocked; secondary flags: legacy_unproven; remediation: `review_completion`.
- `US:VNQ`: **review_required**; 239 rows / 239 contiguous months; Step 4 expected_blocked, Step 5 expected_blocked; secondary flags: legacy_unproven; remediation: `review_completion`.
- `US:BLOK`: **review_required**; 101 rows / 101 contiguous months; Step 4 expected_blocked, Step 5 expected_blocked; secondary flags: legacy_unproven; remediation: `review_completion`.

## Personal-plan implications

Step 1–3 availability does not imply numeric Step 4/5 availability. Product copy should continue to describe advanced analysis as available only for assets whose monthly identity, direct-lineage policy, contiguous history, required metrics, and Beta pass the current gates.

## Limitations and privacy

This is a deterministic, read-only inventory of checked-in runtime definitions and the pinned monthly release. It does not call providers, query databases or individual holdings, infer popularity, change runtime eligibility, or modify canonical/public data and pinned artifacts. Remediation scores prioritize review; they do not authorize data repair or Production changes.
