import { useCallback, useEffect, useState } from "react";
import { fetchMySupportInquiries } from "../../portfolio/services/serverPortfolioService";
import { getCurrentUserKey } from "../utils";

export function useMyInquiries(user, enabled) {
  const [state, setState] = useState({
    inquiries: [],
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
      loading: !previous.inquiries.length,
      refreshing: previous.inquiries.length > 0,
      error: "",
    }));

    try {
      const inquiries = await fetchMySupportInquiries();
      setState({ inquiries, loading: false, refreshing: false, error: "", requested: true });
      return inquiries;
    } catch (error) {
      setState((previous) => ({
        ...previous,
        loading: false,
        refreshing: false,
        error: error?.message || "문의내역을 불러오지 못했습니다.",
      }));
      return [];
    }
  }, [enabled, user?.id, userKey]);

  useEffect(() => {
    if (enabled && !state.requested) refresh();
  }, [enabled, refresh, state.requested]);

  return { ...state, refresh };
}
