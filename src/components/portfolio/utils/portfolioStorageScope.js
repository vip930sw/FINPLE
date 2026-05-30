import {
  ACTIVE_PORTFOLIO_STORAGE_KEY,
  GLOBAL_SETTINGS_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  PORTFOLIO_LIST_STORAGE_KEY,
} from "../constants";

const AUTH_USER_STORAGE_KEY = "finple-trial-auth-user";
const STORAGE_KEYS = [
  PORTFOLIO_LIST_STORAGE_KEY,
  ACTIVE_PORTFOLIO_STORAGE_KEY,
  GLOBAL_SETTINGS_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
];

function canUseLocalStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function sanitizeScopeId(value = "") {
  return String(value || "")
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 120);
}

export function getStoredFinpleAuthUserForPortfolioScope() {
  if (!canUseLocalStorage()) return null;

  try {
    const parsedUser = JSON.parse(window.localStorage.getItem(AUTH_USER_STORAGE_KEY) || "null");
    return parsedUser?.id ? parsedUser : null;
  } catch (error) {
    return null;
  }
}

export function getPortfolioStorageScope(user = getStoredFinpleAuthUserForPortfolioScope()) {
  if (user?.id) {
    return {
      type: "user",
      id: sanitizeScopeId(user.id),
      label: `user:${sanitizeScopeId(user.id)}`,
    };
  }

  return {
    type: "guest",
    id: "guest",
    label: "guest",
  };
}

export function getScopedPortfolioStorageKey(baseKey, scope = getPortfolioStorageScope()) {
  return `${baseKey}:${scope.label}`;
}

function readRawStorage(key) {
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem(key);
}

function writeRawStorage(key, value) {
  if (!canUseLocalStorage()) return;

  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, value);
}

export function readScopedPortfolioStorageItem(baseKey, fallback = null, scope = getPortfolioStorageScope()) {
  if (scope.type === "user") {
    // During an authenticated session, the visible key is the freshest working copy.
    const visibleValue = readRawStorage(baseKey);
    if (visibleValue !== null && visibleValue !== undefined) return visibleValue;

    const scopedValue = readRawStorage(getScopedPortfolioStorageKey(baseKey, scope));
    if (scopedValue !== null && scopedValue !== undefined) return scopedValue;

    return fallback;
  }

  // Logged-out / guest views must not read a previous user's visible working copy.
  const scopedGuestValue = readRawStorage(getScopedPortfolioStorageKey(baseKey, scope));
  if (scopedGuestValue !== null && scopedGuestValue !== undefined) return scopedGuestValue;

  return fallback;
}

export function writeScopedPortfolioStorageItem(baseKey, value, scope = getPortfolioStorageScope()) {
  writeRawStorage(getScopedPortfolioStorageKey(baseKey, scope), value);

  // Keep the legacy visible keys in sync for existing code paths and browser inspection.
  writeRawStorage(baseKey, value);
}

export function removeVisiblePortfolioStorage() {
  if (!canUseLocalStorage()) return;
  STORAGE_KEYS.forEach((key) => window.localStorage.removeItem(key));
}

export function archiveVisiblePortfolioStorageForUser(user) {
  if (!canUseLocalStorage() || !user?.id) return false;

  const scope = getPortfolioStorageScope(user);
  let archived = false;

  STORAGE_KEYS.forEach((key) => {
    const value = readRawStorage(key);
    if (value !== null && value !== undefined) {
      writeRawStorage(getScopedPortfolioStorageKey(key, scope), value);
      archived = true;
    }
  });

  return archived;
}

export function restoreVisiblePortfolioStorageForUser(user) {
  if (!canUseLocalStorage() || !user?.id) return false;

  const scope = getPortfolioStorageScope(user);
  let restored = false;

  STORAGE_KEYS.forEach((key) => {
    const value = readRawStorage(getScopedPortfolioStorageKey(key, scope));
    if (value !== null && value !== undefined) {
      writeRawStorage(key, value);
      restored = true;
    }
  });

  return restored;
}

export function resetVisiblePortfolioStorageToGuest() {
  removeVisiblePortfolioStorage();
}

export function dispatchPortfolioStorageUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("finple-local-storage-updated"));
}
