// Generated offline from server/src/services/scenario/externalShockEngine.js using
// data/fixtures/scenario-external-shock/kr_two_asset_external_shock_base.json.
// This browser fixture is precomputed view data; do not import the Node engine here.

export const STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH = "e1642c9a46d149770632dd0dc2508c82baa12fe62dbf3cff6ff69ce2528355bc";
export const STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH = "fb048e34a50566b6e737b343d7a4048b3fabb70ee6d15f8e8e23b1e01cf271fa";
export const STEP114_2H_FIXTURE_EXPECTED_BETA_INPUT_HASH = "dab804919b28c36c362a8dd7f674c2fe21f5fe486b2b03362f185c885dc0fbf1";
export const STEP114_2H_FIXTURE_EXPECTED_BETA_OUTPUT_HASH = "a7a9155f925e19262e34306adf3402b1ba515fb71c423290fbb50032b7e9bddd";
export const STEP114_2H_FIXTURE_DIRECT_PAYLOAD_SIGNATURE = "f8e05259";
export const STEP114_2H_FIXTURE_BETA_PAYLOAD_SIGNATURE = "776e346b";

export const STEP114_2H_FIXTURE_REVIEW_PORTFOLIO = Object.freeze({
  "id": "step114-2h-fixture-portfolio",
  "name": "Step 114-2H fixture review"
});

export const STEP114_2H_FIXTURE_REVIEW_SETTINGS = Object.freeze({
  "startValue": 12000000,
  "monthlyCashFlow": 500000,
  "years": 1,
  "investmentMonths": 12,
  "inflationRate": null,
  "dividendReinvest": false
});

export const STEP114_2H_FIXTURE_REVIEW_ASSETS = Object.freeze([
  {
    "market": "KR",
    "ticker": "005930",
    "targetWeight": 50
  },
  {
    "market": "KR",
    "ticker": "069500",
    "targetWeight": 50
  }
]);

export const STEP114_2H_PRECOMPUTED_BASELINE_FIXTURE = Object.freeze({
  "analysisIdentity": {
    "portfolioFingerprint": "{\"assets\":[{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"005930\"},{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"069500\"}],\"portfolioId\":\"step114-2h-fixture-portfolio\",\"settings\":{\"dividendReinvest\":false,\"inflationRate\":null,\"initialInvestment\":null,\"investmentMonths\":12,\"monthlyCashFlow\":500000,\"monthlyContribution\":null,\"startValue\":12000000,\"years\":1}}",
    "inputHash": "e1642c9a46d149770632dd0dc2508c82baa12fe62dbf3cff6ff69ce2528355bc",
    "outputHash": "fb048e34a50566b6e737b343d7a4048b3fabb70ee6d15f8e8e23b1e01cf271fa"
  },
  "monthlyBaselinePoints": [
    {
      "monthIndex": 0,
      "portfolioValueNominal": 12000000,
      "periodLabel": "0 months"
    },
    {
      "monthIndex": 1,
      "portfolioValueNominal": 12687500,
      "periodLabel": "1 months"
    },
    {
      "monthIndex": 2,
      "portfolioValueNominal": 13055312.5,
      "periodLabel": "2 months"
    },
    {
      "monthIndex": 3,
      "portfolioValueNominal": 13839937.5,
      "periodLabel": "3 months"
    },
    {
      "monthIndex": 4,
      "portfolioValueNominal": 13548294.6875,
      "periodLabel": "4 months"
    },
    {
      "monthIndex": 5,
      "portfolioValueNominal": 14452976.801375,
      "periodLabel": "5 months"
    },
    {
      "monthIndex": 6,
      "portfolioValueNominal": 15244011.13753425,
      "periodLabel": "6 months"
    },
    {
      "monthIndex": 7,
      "portfolioValueNominal": 15869924.287073456,
      "periodLabel": "7 months"
    },
    {
      "monthIndex": 8,
      "portfolioValueNominal": 16124316.110349871,
      "periodLabel": "8 months"
    },
    {
      "monthIndex": 9,
      "portfolioValueNominal": 16831944.649041265,
      "periodLabel": "9 months"
    },
    {
      "monthIndex": 10,
      "portfolioValueNominal": 17617759.588334493,
      "periodLabel": "10 months"
    },
    {
      "monthIndex": 11,
      "portfolioValueNominal": 17990739.19750125,
      "periodLabel": "11 months"
    },
    {
      "monthIndex": 12,
      "portfolioValueNominal": 18740411.638711415,
      "periodLabel": "12 months"
    }
  ]
});

export const STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT = Object.freeze({
  "status": "ready",
  "scenarioVersion": "external-shock-scenario-v1-step114-2h",
  "engineVersion": "external-shock-engine-v1-step114-2h",
  "method": "deterministic_external_shock",
  "shockMode": "direct_asset",
  "rebalanceFrequency": "none",
  "returnBasis": "price_return",
  "currencyMode": "KRW",
  "dataStartDate": "2024-01",
  "dataEndDate": "2024-12",
  "sourceHashes": [
    "fixture-external-shock-source-v1",
    "fixture-row-source-a",
    "fixture-row-source-b"
  ],
  "normalizationVersion": "normalization-v1-step114-2b",
  "calculationPolicyVersion": "metrics-policy-v3-step114",
  "pipelineVersion": "scenario-external-shock-fixture-v1",
  "inputHash": "e1642c9a46d149770632dd0dc2508c82baa12fe62dbf3cff6ff69ce2528355bc",
  "dataQuality": {
    "status": "ready",
    "blockReasons": []
  },
  "betaApplied": false,
  "cagrCalibrationApplied": false,
  "historicalMddApplied": false,
  "assets": [
    {
      "market": "KR",
      "ticker": "005930",
      "key": "KR:005930",
      "targetWeight": 0.5,
      "beta": 1.1
    },
    {
      "market": "KR",
      "ticker": "069500",
      "key": "KR:069500",
      "targetWeight": 0.5,
      "beta": 0.8
    }
  ],
  "shockEvents": [
    {
      "monthIndex": 4,
      "label": "Synthetic direct April drawdown",
      "shockMode": "direct_asset",
      "assetShockReturns": {
        "KR:005930": -0.2,
        "KR:069500": -0.1
      }
    },
    {
      "monthIndex": 5,
      "label": "Synthetic partial recovery",
      "shockMode": "direct_asset",
      "assetShockReturns": {
        "KR:005930": 0.08,
        "KR:069500": 0.04
      }
    }
  ],
  "baselinePath": [
    {
      "monthIndex": 0,
      "periodLabel": "0 months",
      "portfolioValue": 12000000,
      "riskNav": 100,
      "cumulativeContributions": 12000000
    },
    {
      "monthIndex": 1,
      "periodLabel": "1 months",
      "portfolioValue": 12687500,
      "riskNav": 101.5,
      "cumulativeContributions": 12500000
    },
    {
      "monthIndex": 2,
      "periodLabel": "2 months",
      "portfolioValue": 13055312.5,
      "riskNav": 100.4825,
      "cumulativeContributions": 13000000
    },
    {
      "monthIndex": 3,
      "periodLabel": "3 months",
      "portfolioValue": 13839937.5,
      "riskNav": 102.59252,
      "cumulativeContributions": 13500000
    },
    {
      "monthIndex": 4,
      "periodLabel": "4 months",
      "portfolioValue": 13548294.6875,
      "riskNav": 96.9276419,
      "cumulativeContributions": 14000000
    },
    {
      "monthIndex": 5,
      "periodLabel": "5 months",
      "portfolioValue": 14452976.801375,
      "riskNav": 99.7195985462,
      "cumulativeContributions": 14500000
    },
    {
      "monthIndex": 6,
      "periodLabel": "6 months",
      "portfolioValue": 15244011.13753425,
      "riskNav": 101.6602476537,
      "cumulativeContributions": 15000000
    },
    {
      "monthIndex": 7,
      "periodLabel": "7 months",
      "portfolioValue": 15869924.287073456,
      "riskNav": 102.4731869927,
      "cumulativeContributions": 15500000
    },
    {
      "monthIndex": 8,
      "periodLabel": "8 months",
      "portfolioValue": 16124316.110349871,
      "riskNav": 100.9359360437,
      "cumulativeContributions": 16000000
    },
    {
      "monthIndex": 9,
      "periodLabel": "9 months",
      "portfolioValue": 16831944.649041265,
      "riskNav": 102.1964297529,
      "cumulativeContributions": 16500000
    },
    {
      "monthIndex": 10,
      "periodLabel": "10 months",
      "portfolioValue": 17617759.588334493,
      "riskNav": 103.8813734809,
      "cumulativeContributions": 17000000
    },
    {
      "monthIndex": 11,
      "periodLabel": "11 months",
      "portfolioValue": 17990739.19750125,
      "riskNav": 103.1532369542,
      "cumulativeContributions": 17500000
    },
    {
      "monthIndex": 12,
      "periodLabel": "12 months",
      "portfolioValue": 18740411.638711415,
      "riskNav": 104.5458434705,
      "cumulativeContributions": 18000000
    }
  ],
  "stressedPath": [
    {
      "monthIndex": 0,
      "periodLabel": "0 months",
      "portfolioValue": 12000000,
      "riskNav": 100,
      "cumulativeContributions": 12000000
    },
    {
      "monthIndex": 1,
      "periodLabel": "1 months",
      "portfolioValue": 12687500,
      "riskNav": 101.5,
      "cumulativeContributions": 12500000
    },
    {
      "monthIndex": 2,
      "periodLabel": "2 months",
      "portfolioValue": 13055312.5,
      "riskNav": 100.4825,
      "cumulativeContributions": 13000000
    },
    {
      "monthIndex": 3,
      "periodLabel": "3 months",
      "portfolioValue": 13839937.5,
      "riskNav": 102.59252,
      "cumulativeContributions": 13500000
    },
    {
      "monthIndex": 4,
      "periodLabel": "4 months",
      "portfolioValue": 11528406.993749999,
      "riskNav": 82.47460911,
      "cumulativeContributions": 14000000
    },
    {
      "monthIndex": 5,
      "periodLabel": "5 months",
      "portfolioValue": 13093898.687206998,
      "riskNav": 89.7730551116,
      "cumulativeContributions": 14500000
    },
    {
      "monthIndex": 6,
      "periodLabel": "6 months",
      "portfolioValue": 13855787.487880057,
      "riskNav": 91.500390448,
      "cumulativeContributions": 15000000
    },
    {
      "monthIndex": 7,
      "periodLabel": "7 months",
      "portfolioValue": 14469599.876272233,
      "riskNav": 92.2247656557,
      "cumulativeContributions": 15500000
    },
    {
      "monthIndex": 8,
      "periodLabel": "8 months",
      "portfolioValue": 14747517.777260648,
      "riskNav": 90.8597015149,
      "cumulativeContributions": 16000000
    },
    {
      "monthIndex": 9,
      "periodLabel": "9 months",
      "portfolioValue": 15436712.144155197,
      "riskNav": 91.9852786073,
      "cumulativeContributions": 16500000
    },
    {
      "monthIndex": 10,
      "periodLabel": "10 months",
      "portfolioValue": 16196759.927050201,
      "riskNav": 93.4816331847,
      "cumulativeContributions": 17000000
    },
    {
      "monthIndex": 11,
      "periodLabel": "11 months",
      "portfolioValue": 16581231.987599762,
      "riskNav": 92.8376107196,
      "cumulativeContributions": 17500000
    },
    {
      "monthIndex": 12,
      "periodLabel": "12 months",
      "portfolioValue": 17309593.311605383,
      "riskNav": 94.0742416756,
      "cumulativeContributions": 18000000
    }
  ],
  "contributionSeries": [
    {
      "monthIndex": 0,
      "cumulativeContributions": 12000000
    },
    {
      "monthIndex": 1,
      "cumulativeContributions": 12500000
    },
    {
      "monthIndex": 2,
      "cumulativeContributions": 13000000
    },
    {
      "monthIndex": 3,
      "cumulativeContributions": 13500000
    },
    {
      "monthIndex": 4,
      "cumulativeContributions": 14000000
    },
    {
      "monthIndex": 5,
      "cumulativeContributions": 14500000
    },
    {
      "monthIndex": 6,
      "cumulativeContributions": 15000000
    },
    {
      "monthIndex": 7,
      "cumulativeContributions": 15500000
    },
    {
      "monthIndex": 8,
      "cumulativeContributions": 16000000
    },
    {
      "monthIndex": 9,
      "cumulativeContributions": 16500000
    },
    {
      "monthIndex": 10,
      "cumulativeContributions": 17000000
    },
    {
      "monthIndex": 11,
      "cumulativeContributions": 17500000
    },
    {
      "monthIndex": 12,
      "cumulativeContributions": 18000000
    }
  ],
  "summary": {
    "baselineTerminalValue": 18740411.638711415,
    "stressedTerminalValue": 17309593.311605383,
    "terminalDeltaValue": -1430818.3271060325,
    "terminalDeltaRate": -0.0763493543,
    "baselineMdd": -0.0552172624,
    "stressedMdd": -0.1960952991,
    "incrementalMdd": -0.1408780367,
    "recoveryMonths": null,
    "longestRecoveryMonths": 1,
    "unrecovered": true
  },
  "assetImpactSummary": [
    {
      "market": "KR",
      "ticker": "005930",
      "key": "KR:005930",
      "baselineTerminalValue": 9417154.73604934,
      "stressedTerminalValue": 8441508.929703653,
      "deltaValue": -975645.8063456863,
      "deltaRate": -0.1036030344
    },
    {
      "market": "KR",
      "ticker": "069500",
      "key": "KR:069500",
      "baselineTerminalValue": 9323256.902662076,
      "stressedTerminalValue": 8868084.38190173,
      "deltaValue": -455172.5207603462,
      "deltaRate": -0.0488211926
    }
  ],
  "trace": [
    {
      "monthIndex": 1,
      "month": "2024-01",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 2,
      "month": "2024-02",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "stressedReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 3,
      "month": "2024-03",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "stressedReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 4,
      "month": "2024-04",
      "shockApplied": true,
      "baselineReturns": {
        "KR:005930": -0.08,
        "KR:069500": -0.03
      },
      "stressedReturns": {
        "KR:005930": -0.264,
        "KR:069500": -0.127
      },
      "assetShockReturns": {
        "KR:005930": -0.2,
        "KR:069500": -0.1
      }
    },
    {
      "monthIndex": 5,
      "month": "2024-05",
      "shockApplied": true,
      "baselineReturns": {
        "KR:005930": 0.04,
        "KR:069500": 0.018
      },
      "stressedReturns": {
        "KR:005930": 0.1232,
        "KR:069500": 0.05872
      },
      "assetShockReturns": {
        "KR:005930": 0.08,
        "KR:069500": 0.04
      }
    },
    {
      "monthIndex": 6,
      "month": "2024-06",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "stressedReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 7,
      "month": "2024-07",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "stressedReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 8,
      "month": "2024-08",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "stressedReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 9,
      "month": "2024-09",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 10,
      "month": "2024-10",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "stressedReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 11,
      "month": "2024-11",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "stressedReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 12,
      "month": "2024-12",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "stressedReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "assetShockReturns": null
    }
  ],
  "outputHash": "fb048e34a50566b6e737b343d7a4048b3fabb70ee6d15f8e8e23b1e01cf271fa",
  "fixtureContext": {
    "fixtureOnly": true,
    "reviewOnly": true,
    "portfolioId": "step114-2h-fixture-portfolio",
    "portfolioName": "Step 114-2H fixture review",
    "portfolioFingerprint": "{\"assets\":[{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"005930\"},{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"069500\"}],\"portfolioId\":\"step114-2h-fixture-portfolio\",\"settings\":{\"dividendReinvest\":false,\"inflationRate\":null,\"initialInvestment\":null,\"investmentMonths\":12,\"monthlyCashFlow\":500000,\"monthlyContribution\":null,\"startValue\":12000000,\"years\":1}}",
    "inputHash": "e1642c9a46d149770632dd0dc2508c82baa12fe62dbf3cff6ff69ce2528355bc",
    "outputHash": "fb048e34a50566b6e737b343d7a4048b3fabb70ee6d15f8e8e23b1e01cf271fa",
    "payloadSignature": "f8e05259"
  }
});

export const STEP114_2H_MARKET_BETA_FIXTURE_RESULT = Object.freeze({
  "status": "ready",
  "scenarioVersion": "external-shock-scenario-v1-step114-2h",
  "engineVersion": "external-shock-engine-v1-step114-2h",
  "method": "deterministic_external_shock",
  "shockMode": "market_beta",
  "rebalanceFrequency": "none",
  "returnBasis": "price_return",
  "currencyMode": "KRW",
  "dataStartDate": "2024-01",
  "dataEndDate": "2024-12",
  "sourceHashes": [
    "fixture-external-shock-source-v1",
    "fixture-row-source-a",
    "fixture-row-source-b"
  ],
  "normalizationVersion": "normalization-v1-step114-2b",
  "calculationPolicyVersion": "metrics-policy-v3-step114",
  "pipelineVersion": "scenario-external-shock-fixture-v1",
  "inputHash": "dab804919b28c36c362a8dd7f674c2fe21f5fe486b2b03362f185c885dc0fbf1",
  "dataQuality": {
    "status": "ready",
    "blockReasons": []
  },
  "betaApplied": true,
  "cagrCalibrationApplied": false,
  "historicalMddApplied": false,
  "assets": [
    {
      "market": "KR",
      "ticker": "005930",
      "key": "KR:005930",
      "targetWeight": 0.5,
      "beta": 1.1
    },
    {
      "market": "KR",
      "ticker": "069500",
      "key": "KR:069500",
      "targetWeight": 0.5,
      "beta": 0.8
    }
  ],
  "shockEvents": [
    {
      "monthIndex": 4,
      "label": "Synthetic market factor shock",
      "shockMode": "market_beta",
      "marketFactorShock": -0.12,
      "assetBetas": {
        "KR:005930": 1.1,
        "KR:069500": 0.8
      },
      "assetShockReturns": {
        "KR:005930": -0.132,
        "KR:069500": -0.096
      }
    }
  ],
  "baselinePath": [
    {
      "monthIndex": 0,
      "periodLabel": "0 months",
      "portfolioValue": 12000000,
      "riskNav": 100,
      "cumulativeContributions": 12000000
    },
    {
      "monthIndex": 1,
      "periodLabel": "1 months",
      "portfolioValue": 12687500,
      "riskNav": 101.5,
      "cumulativeContributions": 12500000
    },
    {
      "monthIndex": 2,
      "periodLabel": "2 months",
      "portfolioValue": 13055312.5,
      "riskNav": 100.4825,
      "cumulativeContributions": 13000000
    },
    {
      "monthIndex": 3,
      "periodLabel": "3 months",
      "portfolioValue": 13839937.5,
      "riskNav": 102.59252,
      "cumulativeContributions": 13500000
    },
    {
      "monthIndex": 4,
      "periodLabel": "4 months",
      "portfolioValue": 13548294.6875,
      "riskNav": 96.9276419,
      "cumulativeContributions": 14000000
    },
    {
      "monthIndex": 5,
      "periodLabel": "5 months",
      "portfolioValue": 14452976.801375,
      "riskNav": 99.7195985462,
      "cumulativeContributions": 14500000
    },
    {
      "monthIndex": 6,
      "periodLabel": "6 months",
      "portfolioValue": 15244011.13753425,
      "riskNav": 101.6602476537,
      "cumulativeContributions": 15000000
    },
    {
      "monthIndex": 7,
      "periodLabel": "7 months",
      "portfolioValue": 15869924.287073456,
      "riskNav": 102.4731869927,
      "cumulativeContributions": 15500000
    },
    {
      "monthIndex": 8,
      "periodLabel": "8 months",
      "portfolioValue": 16124316.110349871,
      "riskNav": 100.9359360437,
      "cumulativeContributions": 16000000
    },
    {
      "monthIndex": 9,
      "periodLabel": "9 months",
      "portfolioValue": 16831944.649041265,
      "riskNav": 102.1964297529,
      "cumulativeContributions": 16500000
    },
    {
      "monthIndex": 10,
      "periodLabel": "10 months",
      "portfolioValue": 17617759.588334493,
      "riskNav": 103.8813734809,
      "cumulativeContributions": 17000000
    },
    {
      "monthIndex": 11,
      "periodLabel": "11 months",
      "portfolioValue": 17990739.19750125,
      "riskNav": 103.1532369542,
      "cumulativeContributions": 17500000
    },
    {
      "monthIndex": 12,
      "periodLabel": "12 months",
      "portfolioValue": 18740411.638711415,
      "riskNav": 104.5458434705,
      "cumulativeContributions": 18000000
    }
  ],
  "stressedPath": [
    {
      "monthIndex": 0,
      "periodLabel": "0 months",
      "portfolioValue": 12000000,
      "riskNav": 100,
      "cumulativeContributions": 12000000
    },
    {
      "monthIndex": 1,
      "periodLabel": "1 months",
      "portfolioValue": 12687500,
      "riskNav": 101.5,
      "cumulativeContributions": 12500000
    },
    {
      "monthIndex": 2,
      "periodLabel": "2 months",
      "portfolioValue": 13055312.5,
      "riskNav": 100.4825,
      "cumulativeContributions": 13000000
    },
    {
      "monthIndex": 3,
      "periodLabel": "3 months",
      "portfolioValue": 13839937.5,
      "riskNav": 102.59252,
      "cumulativeContributions": 13500000
    },
    {
      "monthIndex": 4,
      "periodLabel": "4 months",
      "portfolioValue": 12008237.436499998,
      "riskNav": 85.9088915816,
      "cumulativeContributions": 14000000
    },
    {
      "monthIndex": 5,
      "periodLabel": "5 months",
      "portfolioValue": 12865885.229003,
      "riskNav": 88.3642725219,
      "cumulativeContributions": 14500000
    },
    {
      "monthIndex": 6,
      "periodLabel": "6 months",
      "portfolioValue": 13624657.371904962,
      "riskNav": 90.074063201,
      "cumulativeContributions": 15000000
    },
    {
      "monthIndex": 7,
      "periodLabel": "7 months",
      "portfolioValue": 14237111.131932143,
      "riskNav": 90.7906923567,
      "cumulativeContributions": 15500000
    },
    {
      "monthIndex": 8,
      "periodLabel": "8 months",
      "portfolioValue": 14517282.835728548,
      "riskNav": 89.4379188725,
      "cumulativeContributions": 16000000
    },
    {
      "monthIndex": 9,
      "periodLabel": "9 months",
      "portfolioValue": 15204209.684679126,
      "riskNav": 90.5502826759,
      "cumulativeContributions": 16500000
    },
    {
      "monthIndex": 10,
      "periodLabel": "10 months",
      "portfolioValue": 15961777.719195422,
      "riskNav": 92.03309543,
      "cumulativeContributions": 17000000
    },
    {
      "monthIndex": 11,
      "periodLabel": "11 months",
      "portfolioValue": 16347146.35050019,
      "riskNav": 91.3936166718,
      "cumulativeContributions": 17500000
    },
    {
      "monthIndex": 12,
      "periodLabel": "12 months",
      "portfolioValue": 17073465.29051509,
      "riskNav": 92.6191085909,
      "cumulativeContributions": 18000000
    }
  ],
  "contributionSeries": [
    {
      "monthIndex": 0,
      "cumulativeContributions": 12000000
    },
    {
      "monthIndex": 1,
      "cumulativeContributions": 12500000
    },
    {
      "monthIndex": 2,
      "cumulativeContributions": 13000000
    },
    {
      "monthIndex": 3,
      "cumulativeContributions": 13500000
    },
    {
      "monthIndex": 4,
      "cumulativeContributions": 14000000
    },
    {
      "monthIndex": 5,
      "cumulativeContributions": 14500000
    },
    {
      "monthIndex": 6,
      "cumulativeContributions": 15000000
    },
    {
      "monthIndex": 7,
      "cumulativeContributions": 15500000
    },
    {
      "monthIndex": 8,
      "cumulativeContributions": 16000000
    },
    {
      "monthIndex": 9,
      "cumulativeContributions": 16500000
    },
    {
      "monthIndex": 10,
      "cumulativeContributions": 17000000
    },
    {
      "monthIndex": 11,
      "cumulativeContributions": 17500000
    },
    {
      "monthIndex": 12,
      "cumulativeContributions": 18000000
    }
  ],
  "summary": {
    "baselineTerminalValue": 18740411.638711415,
    "stressedTerminalValue": 17073465.29051509,
    "terminalDeltaValue": -1666946.348196324,
    "terminalDeltaRate": -0.0889492921,
    "baselineMdd": -0.0552172624,
    "stressedMdd": -0.1626203199,
    "incrementalMdd": -0.1074030575,
    "recoveryMonths": null,
    "longestRecoveryMonths": 1,
    "unrecovered": true
  },
  "assetImpactSummary": [
    {
      "market": "KR",
      "ticker": "005930",
      "key": "KR:005930",
      "baselineTerminalValue": 9417154.73604934,
      "stressedTerminalValue": 8448791.785765078,
      "deltaValue": -968362.9502842613,
      "deltaRate": -0.1028296739
    },
    {
      "market": "KR",
      "ticker": "069500",
      "key": "KR:069500",
      "baselineTerminalValue": 9323256.902662076,
      "stressedTerminalValue": 8624673.504750013,
      "deltaValue": -698583.3979120627,
      "deltaRate": -0.074929116
    }
  ],
  "trace": [
    {
      "monthIndex": 1,
      "month": "2024-01",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 2,
      "month": "2024-02",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "stressedReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 3,
      "month": "2024-03",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "stressedReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 4,
      "month": "2024-04",
      "shockApplied": true,
      "baselineReturns": {
        "KR:005930": -0.08,
        "KR:069500": -0.03
      },
      "stressedReturns": {
        "KR:005930": -0.20144,
        "KR:069500": -0.12312
      },
      "assetShockReturns": {
        "KR:005930": -0.132,
        "KR:069500": -0.096
      }
    },
    {
      "monthIndex": 5,
      "month": "2024-05",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.04,
        "KR:069500": 0.018
      },
      "stressedReturns": {
        "KR:005930": 0.04,
        "KR:069500": 0.018
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 6,
      "month": "2024-06",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "stressedReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 7,
      "month": "2024-07",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "stressedReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 8,
      "month": "2024-08",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "stressedReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 9,
      "month": "2024-09",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 10,
      "month": "2024-10",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "stressedReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 11,
      "month": "2024-11",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "stressedReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "assetShockReturns": null
    },
    {
      "monthIndex": 12,
      "month": "2024-12",
      "shockApplied": false,
      "baselineReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "stressedReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "assetShockReturns": null
    }
  ],
  "outputHash": "a7a9155f925e19262e34306adf3402b1ba515fb71c423290fbb50032b7e9bddd",
  "fixtureContext": {
    "fixtureOnly": true,
    "reviewOnly": true,
    "portfolioId": "step114-2h-fixture-portfolio",
    "portfolioName": "Step 114-2H fixture review",
    "portfolioFingerprint": "{\"assets\":[{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"005930\"},{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"069500\"}],\"portfolioId\":\"step114-2h-fixture-portfolio\",\"settings\":{\"dividendReinvest\":false,\"inflationRate\":null,\"initialInvestment\":null,\"investmentMonths\":12,\"monthlyCashFlow\":500000,\"monthlyContribution\":null,\"startValue\":12000000,\"years\":1}}",
    "inputHash": "dab804919b28c36c362a8dd7f674c2fe21f5fe486b2b03362f185c885dc0fbf1",
    "outputHash": "a7a9155f925e19262e34306adf3402b1ba515fb71c423290fbb50032b7e9bddd",
    "payloadSignature": "776e346b"
  }
});
