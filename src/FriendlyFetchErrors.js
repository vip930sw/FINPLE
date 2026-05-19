function isNetworkFetchError(error) {
  const message = String(error?.message || error || "").toLowerCase();
  return message.includes("failed to fetch") || message.includes("networkerror") || message.includes("load failed");
}

if (typeof window !== "undefined" && typeof window.fetch === "function" && !window.__finpleFriendlyFetchErrorsApplied) {
  window.__finpleFriendlyFetchErrorsApplied = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args) => {
    try {
      return await originalFetch(...args);
    } catch (error) {
      if (isNetworkFetchError(error)) {
        throw new Error("서버 연결을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }

      throw error;
    }
  };
}
