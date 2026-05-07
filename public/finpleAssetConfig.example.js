// 선택사항입니다. index.html에서 앱 번들보다 먼저 불러오면 런타임 설정으로 적용됩니다.
// 보통은 .env.local의 VITE_FINPLE_API_BASE_URL 사용을 권장합니다.
// 예: <script src="/finpleAssetConfig.js"></script>

window.FINPLE_ASSET_DATA_CONFIG = {
  provider: "backend",
  apiBaseUrl: "http://localhost:5050/api",
  backendTimeoutMs: 12000,
  bulkLookupDelayMs: 1200,
};
