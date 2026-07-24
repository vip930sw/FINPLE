export function normalizeFinpleApiBaseUrl(value) {
  const baseUrl = String(value || "").replace(/\/+$/, "");
  if (!baseUrl) return "";
  return /(?:^|[-/])api$/.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
}
