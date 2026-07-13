const { pathToFileURL } = require("node:url");

async function loadReporter() {
  return import(pathToFileURL(`${process.cwd()}/server/src/services/tradingAiMlTradingFeatureCoverageReport.js`).href);
}

async function buildCurrentStep235BOfflineFeatureCoverageReport() {
  const reporter = await loadReporter();
  return reporter.buildStep235BOfflineFeatureCoverageReport();
}

async function formatCurrentStep235BOfflineFeatureCoverageReport() {
  const reporter = await loadReporter();
  const report = reporter.buildStep235BOfflineFeatureCoverageReport();
  return reporter.formatStep235BOfflineFeatureCoverageReport(report);
}

async function main() {
  const text = await formatCurrentStep235BOfflineFeatureCoverageReport();
  process.stdout.write(text);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  buildCurrentStep235BOfflineFeatureCoverageReport,
  formatCurrentStep235BOfflineFeatureCoverageReport,
};
