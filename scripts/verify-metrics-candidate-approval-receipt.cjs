#!/usr/bin/env node

const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

function parseArgs(argv) {
  const args = {};
  for (let index = 2; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith("--")) continue;
    const name = key.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      args[name] = "true";
    } else {
      args[name] = value;
      index += 1;
    }
  }
  return args;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function usage() {
  return [
    "Usage:",
    "  node scripts/verify-metrics-candidate-approval-receipt.cjs \\",
    "    --candidate-manifest path/to/manifest.json \\",
    "    --approval-receipt path/to/approval-receipt.json \\",
    "    (--zip-sha sha256 | --zip-path path/to/package.zip) \\",
    "    (--allowlist-env FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON | --allowlist-file local-allowlist.json)",
  ].join("\n");
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help || !args["candidate-manifest"] || !args["approval-receipt"]) {
    console.error(usage());
    process.exit(args.help ? 0 : 2);
  }

  const servicePath = path.resolve(__dirname, "../server/src/services/metricsCandidateApprovalReceipt.js");
  const { verifyMetricsCandidateApprovalReceipt } = await import(`file://${servicePath.replace(/\\/g, "/")}`);

  let zipPackageSha256 = args["zip-sha"] || "";
  if (!zipPackageSha256 && args["zip-path"]) zipPackageSha256 = sha256File(args["zip-path"]);

  let allowlistJson = "";
  if (args["allowlist-file"]) allowlistJson = fs.readFileSync(args["allowlist-file"], "utf8");
  else if (args["allowlist-env"]) allowlistJson = process.env[args["allowlist-env"]] || "";
  else allowlistJson = process.env.FINPLE_METRICS_APPROVAL_PUBLIC_KEYS_JSON || "";

  const result = verifyMetricsCandidateApprovalReceipt({
    candidateManifest: readJsonFile(args["candidate-manifest"]),
    approvalReceipt: readJsonFile(args["approval-receipt"]),
    zipPackageSha256,
    allowlistJson,
  });

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exit(result.ok ? 0 : 1);
}

main().catch((error) => {
  process.stderr.write(`${JSON.stringify({ ok: false, status: "blocked", blockingIssues: ["approval_receipt_cli_error"] })}\n`);
  if (process.env.FINPLE_DEBUG_CLI === "true") process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
