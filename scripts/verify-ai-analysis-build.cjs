const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const BUILD_OUTPUT_DIR = process.env.FINPLE_BUILD_OUTPUT_DIR
  ? path.resolve(process.env.FINPLE_BUILD_OUTPUT_DIR)
  : path.join(ROOT, "dist");
const DIST_ASSETS_DIR = path.join(BUILD_OUTPUT_DIR, "assets");

const SOURCE_CHECKS = [
  {
    file: path.join(ROOT, "src", "components", "PortfolioSimulator.jsx"),
    token: "AiAnalysisPanel",
  },
  {
    file: path.join(ROOT, "src", "components", "portfolio", "components", "AiAnalysisPanel.jsx"),
    token: "분석 시작",
  },
  {
    file: path.join(ROOT, "src", "components", "portfolio", "services", "aiAnalysisService.js"),
    token: "/ai/portfolio-analysis",
  },
];

const BUNDLE_TOKENS = [
  "/ai/portfolio-analysis",
  "분석 시작",
  "입력값이 최근 분석 이후 변경",
];

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function verifySources() {
  const missing = [];

  for (const check of SOURCE_CHECKS) {
    const content = fs.existsSync(check.file) ? readText(check.file) : "";
    const ok = content.includes(check.token);
    console.log(`[verify-ai-analysis-build] source ${ok ? "ok" : "missing"}: ${path.relative(ROOT, check.file)} -> ${check.token}`);
    if (!ok) missing.push(`${path.relative(ROOT, check.file)} missing ${check.token}`);
  }

  if (missing.length > 0) {
    throw new Error(`AI analysis source check failed: ${missing.join("; ")}`);
  }
}

function findMainBundle() {
  if (!fs.existsSync(DIST_ASSETS_DIR)) return null;

  return fs
    .readdirSync(DIST_ASSETS_DIR)
    .filter((fileName) => /^index-.*\.js$/.test(fileName))
    .map((fileName) => path.join(DIST_ASSETS_DIR, fileName))
    .sort((left, right) => fs.statSync(right).mtimeMs - fs.statSync(left).mtimeMs)[0] || null;
}

function verifyBundle() {
  const bundlePath = findMainBundle();
  if (!bundlePath) {
    throw new Error(`AI analysis bundle check failed: ${path.join(BUILD_OUTPUT_DIR, "assets", "index-*.js")} was not found.`);
  }

  const bundle = readText(bundlePath);
  const missing = BUNDLE_TOKENS.filter((token) => !bundle.includes(token));

  console.log(`[verify-ai-analysis-build] bundle: ${path.relative(ROOT, bundlePath) || bundlePath}`);
  for (const token of BUNDLE_TOKENS) {
    console.log(`[verify-ai-analysis-build] bundle ${bundle.includes(token) ? "ok" : "missing"}: ${token}`);
  }

  if (missing.length > 0) {
    throw new Error(`AI analysis bundle check failed. Missing tokens: ${missing.join(", ")}`);
  }
}

function clearViteCache() {
  for (const cachePath of ["node_modules/.vite", ".vite"]) {
    fs.rmSync(path.join(ROOT, cachePath), { recursive: true, force: true });
    console.log(`[verify-ai-analysis-build] cleared cache: ${cachePath}`);
  }
}

const mode = process.argv[2] || "source";

if (mode === "prebuild") {
  clearViteCache();
  verifySources();
} else if (mode === "postbuild") {
  verifySources();
  verifyBundle();
} else {
  verifySources();
}
