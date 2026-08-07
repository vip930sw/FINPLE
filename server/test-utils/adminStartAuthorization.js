import { requireAdminStartAccess } from "../src/middleware/adminGuard.js";

export function authenticatedAdminStartAuthorization() {
  const previousPreview = process.env.FINPLE_ADMIN_PREVIEW_ENABLED;
  const previousToken = process.env.FINPLE_ADMIN_TOKEN;
  process.env.FINPLE_ADMIN_PREVIEW_ENABLED = "true";
  process.env.FINPLE_ADMIN_TOKEN = "test-admin-token";
  let authorization;
  try {
    requireAdminStartAccess(
      { get: (name) => name === "x-finple-admin-token" ? "test-admin-token" : "" },
      { status() { return this; }, json(payload) { throw new Error(payload.code); } },
      (value) => { authorization = value; },
    );
  } finally {
    if (previousPreview === undefined) delete process.env.FINPLE_ADMIN_PREVIEW_ENABLED;
    else process.env.FINPLE_ADMIN_PREVIEW_ENABLED = previousPreview;
    if (previousToken === undefined) delete process.env.FINPLE_ADMIN_TOKEN;
    else process.env.FINPLE_ADMIN_TOKEN = previousToken;
  }
  return authorization;
}
