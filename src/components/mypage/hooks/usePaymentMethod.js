import { useCallback, useEffect, useState } from "react";
import {
  fetchBillingMethodStatus,
  getSafeBillingMethodDisplayLabel,
} from "../../paymentMethodClient";
import { getCurrentUserKey } from "../utils";

export function usePaymentMethod(user, enabled) {
  const [state, setState] = useState({
    payload: null,
    loading: false,
    refreshing: false,
    error: "",
    requested: false,
  });

  const userKey = getCurrentUserKey(user);

  const refresh = useCallback(async (options = {}) => {
    if (!enabled || !user?.id) return null;
    setState((previous) => ({
      ...previous,
      requested: true,
      loading: !previous.payload,
      refreshing: Boolean(previous.payload),
      error: "",
    }));

    try {
      const payload = await fetchBillingMethodStatus({ force: Boolean(options.force) });
      setState({ payload, loading: false, refreshing: false, error: "", requested: true });
      return payload;
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error: error?.message || "결제수단 상태를 불러오지 못했습니다.",
      }));
      return null;
    }
  }, [enabled, user?.id, userKey]);

  useEffect(() => {
    if (enabled && !state.requested) refresh();
  }, [enabled, refresh, state.requested]);

  const method = state.payload?.method || null;
  const registered = Boolean(state.payload?.registered && method);
  const displayLabel = registered ? getSafeBillingMethodDisplayLabel(method) : "등록된 결제수단 없음";

  return {
    ...state,
    method,
    registered,
    displayLabel,
    refresh,
  };
}
