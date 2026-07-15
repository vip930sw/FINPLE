# FINPLE Step 114-2I AI Step 6 Navigation Audit

Date: 2026-07-15

Scope: simulator navigation only. This step moves the existing portfolio AI analysis surface to the final Step 6 label while preserving the existing AI request, provider, quota, billing, auth, storage, and API behavior.

## Final Navigation Contract

| Order | Internal key | Visible label | Anchor |
| --- | --- | --- | --- |
| 1 | `settings` | `STEP 1` / `설정` | `settings` |
| 2 | `compare` | `STEP 2` / `비교` | `compare` |
| 3 | `detail` | `STEP 3` / `상세분석·기준전망` | `detail` |
| 4 | `probability` | `STEP 4` / `확률분석` | `probability-analysis` |
| 5 | `shock` | `STEP 5` / `외부충격분석` | `external-shock-analysis` |
| 6 | `ai` | `STEP 6` / `AI 분석` | `ai-analysis` |

The canonical contract is exported from `src/components/portfolio/utils/simulatorNavigation.js` so tab rendering, fallback behavior, direct-link aliases, and tests use the same source of truth.

## Direct Link And Refresh

The simulator still accepts the existing `ai` key and `ai-analysis` anchor. Hash navigation resolves:

- `#probability-analysis` to `probability`
- `#external-shock-analysis` to `shock`
- `#ai-analysis` to `ai`

Unknown or malformed tab values normalize to `settings`. The imperative `changeTab(nextTab)` path and `onActiveTabChange` callback use the same normalized key.

Hash navigation is treated as an event input, not as continuously pinned state. The initial URL hash is consumed once on mount. Later URL changes are handled through the browser `hashchange` event. Ordinary button tab selection does not re-apply an old unchanged hash, so a user who entered through `#ai-analysis` can still select `settings`, `probability`, or `shock` without being forced back to the AI tab.

## AI Behavior Preservation

`AiAnalysisPanel` keeps the existing prop contract:

```jsx
<AiAnalysisPanel
  activePortfolio={activePortfolio}
  assets={assets}
  result={result}
  settings={settings}
  formatNumber={formatNumber}
  formatPercent={formatPercent}
  isEmptyAssetRow={isEmptyAssetRow}
/>
```

The AI request payload builder was not changed. Probability and external shock outputs are not passed into the AI panel or AI payload. The existing service routes remain `/ai/portfolio-analysis` and `/ai/portfolio-analysis/status`.

## Accessibility

The six-step navigation uses the simpler native step-navigation pattern:

- a labelled `nav` container
- native `button` controls
- `aria-current="step"` on the active step
- no partial `tablist` / `tab` / `aria-selected` / dangling `aria-controls` pattern
- existing keyboard activation through native buttons
- visible `:focus-visible` outline

The AI panel header now displays `STEP 6. AI Analysis` and `AI 분석`, matching the final navigation label.

## Mobile Containment

The six-tab navigation is constrained to the simulator width with `max-width: 100%`, `min-width: 0`, wrapped text, and a deliberate layout contract: six columns with fixed minimum tab widths on wider screens, then two-column wrapping below the mobile breakpoint. Existing Step 4 probability and Step 5 external-shock panels are not recalculated or rewired.

## Out Of Scope And Protected Boundaries

This step does not implement Step 114-2J AI result integration. It does not send probability or external-shock data to AI. It does not change production scenario API/cache/plan gates, Colab output, CSV data, production loader/review overlay wiring, external providers, KRX/KIS/data.go.kr, DB/auth/payment/subscription/MY PAGE, trading readiness, order authority, kill switch, or Step 4/5 calculation logic.

## Regression Coverage

`src/components/portfolio/utils/simulatorNavigation.test.js` verifies:

- exact six-step order and Korean labels
- `ai` key and `ai-analysis` anchor preservation
- Step 4 and Step 5 order and anchors
- unknown tab fallback to `settings`
- direct hash mapping for refresh/deep-link compatibility
- initial `#ai-analysis` selection, stale-hash non-pinning after ordinary tab selection, real `hashchange` handling, and unknown-hash fail-safe behavior
- unchanged `AiAnalysisPanel` prop contract
- AI payload exclusion of probability, external shock, and stress results
- unchanged AI service endpoint strings
- native step-navigation accessibility without partial ARIA tabs
- mobile two-column containment CSS
- no new `MutationObserver` or global DOM patching in Step 114-2I simulator sources

Existing Step 4 probability and Step 5 external shock adapter tests now read the shared navigation metadata to guard their relative order.

## Step 114-2J Handoff

Step 114-2J may decide how, whether, and under which gates Step 4 probability and Step 5 external-shock outputs become AI context. Until then, the AI panel remains a Step 6 surface with the old AI request contract and without scenario result payloads.
