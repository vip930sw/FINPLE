let lease = null;

function clean(value) {
  return String(value ?? "").trim();
}

function snapshot() {
  return lease ? { ...lease } : null;
}

export function acquireKisConnectionLease(owner, metadata = {}) {
  const normalizedOwner = clean(owner);
  if (!normalizedOwner) {
    const error = new Error("KIS connection lease owner is required.");
    error.code = "KIS_CONNECTION_LEASE_OWNER_REQUIRED";
    throw error;
  }
  if (lease && lease.owner !== normalizedOwner) {
    const error = new Error("Another KIS market-data runtime already owns the provider connection.");
    error.code = "KIS_CONNECTION_LEASE_CONFLICT";
    error.statusCode = 409;
    error.details = [`active_owner:${lease.owner}`];
    throw error;
  }
  if (!lease) {
    lease = {
      owner: normalizedOwner,
      acquiredAt: new Date().toISOString(),
      metadata: {
        mode: clean(metadata.mode) || null,
        selectedSymbols: Array.isArray(metadata.selectedSymbols)
          ? [...new Set(metadata.selectedSymbols.map((symbol) => clean(symbol).toUpperCase()).filter(Boolean))]
          : [],
      },
    };
  }
  return snapshot();
}

export function releaseKisConnectionLease(owner) {
  const normalizedOwner = clean(owner);
  if (!lease) return null;
  if (lease.owner !== normalizedOwner) {
    const error = new Error("Only the active KIS connection owner may release the lease.");
    error.code = "KIS_CONNECTION_LEASE_RELEASE_DENIED";
    error.statusCode = 409;
    error.details = [`active_owner:${lease.owner}`];
    throw error;
  }
  const released = snapshot();
  lease = null;
  return released;
}

export function readKisConnectionLease() {
  return snapshot();
}

export function resetKisConnectionLeaseForTest() {
  lease = null;
}
