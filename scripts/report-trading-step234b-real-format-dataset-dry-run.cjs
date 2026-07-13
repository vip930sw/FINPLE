const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const US_SAMPLE_PATH = "src/data/tickers/us_screener_candidates.sample.csv";
const KR_SAMPLE_PATH = "src/data/tickers/kr_screener_candidates.sample.csv";

async function buildCurrentStep234BDryRunReport() {
  const service = await import(pathToFileURL(`${process.cwd()}/server/src/services/tradingAiMlRealFormatDatasetAdapter.js`).href);
  const usCsv = fs.readFileSync(US_SAMPLE_PATH, "utf8");
  const krCsv = fs.readFileSync(KR_SAMPLE_PATH, "utf8");
  return service.buildStep234BRealFormatDatasetDryRunReport({ usCsv, krCsv });
}

async function main() {
  const report = await buildCurrentStep234BDryRunReport();
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  KR_SAMPLE_PATH,
  US_SAMPLE_PATH,
  buildCurrentStep234BDryRunReport,
};
