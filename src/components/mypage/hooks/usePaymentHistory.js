import { useCallback, useEffect, useState } from "react";
import { fetchFinplePaymentHistory } from "../../../PaymentHistoryClientPatch";
import { getCurrentUserKey } from "../utils";

export function usePaymentHistory(user, enabled) {
  const [state, setState] = useState({
    payments: [],
    loading: false,
    refreshing: false,
    error: "",
    requested: false,
  });

  const userKey = getCurrentUserKey(user);

  const refresh = useCallback(async () => {
    if (!enabled || !user?.id) return [];
    setState((previous) => ({
      ...previous,
      requested: true,
      loading: !previous.payments.length,
      refreshing: previous.payments.length > 0,
      error: "",
    }));

    try {
      const payments = await fetchFinplePaymentHistory();
      setState({ payments, loading: false, refreshing: false, error: "", requested: true });
      return payments;
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error: error?.message || "결제내역을 불러오지 못했습니다.",
      }));
      return [];
    }
  }, [enabled, user?.id, userKey]);

  useEffect(() => {
    if (enabled && !state.requested) refresh();
  }, [enabled, refresh, state.requested]);

  return { ...state, refresh };
}
