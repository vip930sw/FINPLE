export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortFromExternalSignal = () => controller.abort(externalSignal?.reason);
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);

  if (externalSignal?.aborted) {
    abortFromExternalSignal();
  } else {
    externalSignal?.addEventListener("abort", abortFromExternalSignal, { once: true });
  }

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted && !externalSignal?.aborted) {
      const timeoutError = new Error("외부 서비스 응답 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.");
      timeoutError.code = "UPSTREAM_TIMEOUT";
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", abortFromExternalSignal);
  }
}
