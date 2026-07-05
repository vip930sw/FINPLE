import { useCallback, useEffect, useState } from "react";
import {
  fetchInvestmentMbtiProfile,
} from "../../portfolio/services/serverPortfolioService";
import {
  MBTI_PRESET_STORAGE_KEY,
  readStoredMbtiProfile,
} from "../../portfolio/utils/mbtiProfileStorage";
import { getCurrentUserKey } from "../utils";

const mbtiCache = new Map();

function writeProfileCache(profile) {
  if (!profile || typeof window === "undefined") return;
  window.localStorage.setItem(MBTI_PRESET_STORAGE_KEY, JSON.stringify({
    ...profile,
    restoredAt: new Date().toISOString(),
    source: profile.source || "server-investment-mbti",
  }));
  window.dispatchEvent(new Event("finple-mbti-profile-updated"));
  window.dispatchEvent(new Event("finple-local-storage-updated"));
}

export function useInvestmentMbti(user, enabled) {
  const [state, setState] = useState({
    profile: null,
    loading: false,
    error: "",
    requested: false,
    source: "none",
  });
  const userKey = getCurrentUserKey(user);

  const refresh = useCallback(async () => {
    if (!enabled || !user?.id) return null;
    const cached = mbtiCache.get(userKey);
    if (cached) {
      setState({ profile: cached, loading: false, error: "", requested: true, source: "server-cache" });
      return cached;
    }

    setState((previous) => ({
      ...previous,
      loading: !previous.profile,
      error: "",
      requested: true,
    }));

    try {
      const serverProfile = await fetchInvestmentMbtiProfile();
      if (serverProfile) {
        mbtiCache.set(userKey, serverProfile);
        writeProfileCache(serverProfile);
        setState({ profile: serverProfile, loading: false, error: "", requested: true, source: "server" });
        return serverProfile;
      }

      const localProfile = readStoredMbtiProfile();
      setState({
        profile: localProfile,
        loading: false,
        error: "",
        requested: true,
        source: localProfile ? "local-cache" : "none",
      });
      return localProfile;
    } catch (error) {
      const localProfile = readStoredMbtiProfile();
      setState({
        profile: localProfile,
        loading: false,
        error: error?.message || "투자성향 정보를 불러오지 못했습니다.",
        requested: true,
        source: localProfile ? "local-cache" : "none",
      });
      return localProfile;
    }
  }, [enabled, user?.id, userKey]);

  useEffect(() => {
    if (enabled && !state.requested) refresh();
  }, [enabled, refresh, state.requested]);

  return { ...state, refresh };
}
