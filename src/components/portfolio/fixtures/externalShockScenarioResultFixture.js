// Generated offline from server/src/services/scenario/externalShockEngine.js using
// data/fixtures/scenario-external-shock/kr_two_asset_external_shock_base.json.
// This browser fixture is precomputed view data; do not import the Node engine here.

export const STEP114_2H_FIXTURE_EXPECTED_DIRECT_INPUT_HASH = "27accc219099d834d89bb34036b2e153ebf9d4142800f1951dc89784c65cd4db";
export const STEP114_2H_FIXTURE_EXPECTED_DIRECT_OUTPUT_HASH = "e6672dde1bda298bc1d466a8ed4551bb4e96b06f82a5ec3a72060d9def2f9d6b";
export const STEP114_2H_FIXTURE_EXPECTED_BETA_INPUT_HASH = "42a81b137afd38369d91182abfd32d8128bf09e66047ece7685444953ad21782";
export const STEP114_2H_FIXTURE_EXPECTED_BETA_OUTPUT_HASH = "c7d2950e2af527d71cc61fcf38eba01112a2c8b37a0f12378a253d9f4f3c9595";
export const STEP114_2H_FIXTURE_EXPECTED_BASELINE_IDENTITY_HASH = "06ee7cc6d0a41ae7b1d7991b07cee5649c0bf14f54447c08ca2ff744aaa4b7f7";
export const STEP114_2H_FIXTURE_EXPECTED_INPUT_HASHES = Object.freeze({
  "step114-2h-direct-asset-fixture": "27accc219099d834d89bb34036b2e153ebf9d4142800f1951dc89784c65cd4db",
  "step114-2h-market-beta-fixture": "42a81b137afd38369d91182abfd32d8128bf09e66047ece7685444953ad21782"
});
export const STEP114_2H_FIXTURE_EXPECTED_OUTPUT_HASHES = Object.freeze({
  "step114-2h-direct-asset-fixture": "e6672dde1bda298bc1d466a8ed4551bb4e96b06f82a5ec3a72060d9def2f9d6b",
  "step114-2h-market-beta-fixture": "c7d2950e2af527d71cc61fcf38eba01112a2c8b37a0f12378a253d9f4f3c9595"
});
export const STEP114_2H_FIXTURE_DIRECT_PAYLOAD_SIGNATURE = "6bc5f6ee";
export const STEP114_2H_FIXTURE_BETA_PAYLOAD_SIGNATURE = "bef0f12e";

export const STEP114_2H_FIXTURE_REVIEW_PORTFOLIO = Object.freeze({
  "id": "step114-2h-fixture-portfolio",
  "name": "Step 114-2H fixture review"
});

export const STEP114_2H_FIXTURE_REVIEW_SETTINGS = Object.freeze({
  "startValue": 12000000,
  "monthlyCashFlow": 500000,
  "years": 1,
  "investmentMonths": 12,
  "inflationRate": 0.025,
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
    "portfolioFingerprint": "{\"assets\":[{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"005930\"},{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"069500\"}],\"portfolioId\":\"step114-2h-fixture-portfolio\",\"settings\":{\"dividendReinvest\":false,\"inflationRate\":0.025,\"initialInvestment\":null,\"investmentMonths\":12,\"monthlyCashFlow\":500000,\"monthlyContribution\":null,\"startValue\":12000000,\"years\":1}}",
    "baselineIdentityHash": "06ee7cc6d0a41ae7b1d7991b07cee5649c0bf14f54447c08ca2ff744aaa4b7f7",
    "inputHash": "27accc219099d834d89bb34036b2e153ebf9d4142800f1951dc89784c65cd4db",
    "outputHash": "e6672dde1bda298bc1d466a8ed4551bb4e96b06f82a5ec3a72060d9def2f9d6b"
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
  "scenarioId": "step114-2h-direct-asset-fixture",
  "scenarioLabel": "Direct asset shock fixture",
  "method": "deterministic_external_shock",
  "shockMode": "direct_asset",
  "rebalanceFrequency": "none",
  "inflationRate": 0.025,
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
  "inputHash": "27accc219099d834d89bb34036b2e153ebf9d4142800f1951dc89784c65cd4db",
  "baselineIdentityHash": "06ee7cc6d0a41ae7b1d7991b07cee5649c0bf14f54447c08ca2ff744aaa4b7f7",
  "dataQuality": {
    "status": "ready",
    "blockReasons": []
  },
  "betaApplied": false,
  "bootstrapApplied": false,
  "probabilityApplied": false,
  "cagrCalibrationApplied": false,
  "historicalMddApplied": false,
  "assets": [
    {
      "market": "KR",
      "ticker": "005930",
      "key": "KR:005930",
      "targetWeight": 0.5,
      "beta": null
    },
    {
      "market": "KR",
      "ticker": "069500",
      "key": "KR:069500",
      "targetWeight": 0.5,
      "beta": null
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
  "baselineTerminalValue": 18740411.638711415,
  "stressedTerminalValue": 17309593.311605383,
  "terminalDeltaValue": -1430818.3271060325,
  "terminalDeltaRate": -0.0763493543,
  "baselineMdd": -0.0552172624,
  "stressedMdd": -0.1960952991,
  "incrementalMdd": -0.1408780367,
  "recoveryMonths": null,
  "longestRecoveryMonths": 1,
  "unrecovered": true,
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
  "rowSourceLineage": [
    {
      "month": "2024-01",
      "monthIndex": 1,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-02",
      "monthIndex": 2,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-03",
      "monthIndex": 3,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-04",
      "monthIndex": 4,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-05",
      "monthIndex": 5,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-06",
      "monthIndex": 6,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-07",
      "monthIndex": 7,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-08",
      "monthIndex": 8,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-09",
      "monthIndex": 9,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-10",
      "monthIndex": 10,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-11",
      "monthIndex": 11,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-12",
      "monthIndex": 12,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    }
  ],
  "trace": [
    {
      "monthIndex": 1,
      "month": "2024-01",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 2,
      "month": "2024-02",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "stressedReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 3,
      "month": "2024-03",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "stressedReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 4,
      "month": "2024-04",
      "shockApplied": true,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
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
      },
      "betaProvenance": null,
      "shockAssumptions": {
        "shockMode": "direct_asset",
        "marketFactorShock": null,
        "assetShockReturns": {
          "KR:005930": -0.2,
          "KR:069500": -0.1
        },
        "assetBetas": null,
        "betaProvenance": null
      }
    },
    {
      "monthIndex": 5,
      "month": "2024-05",
      "shockApplied": true,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
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
      },
      "betaProvenance": null,
      "shockAssumptions": {
        "shockMode": "direct_asset",
        "marketFactorShock": null,
        "assetShockReturns": {
          "KR:005930": 0.08,
          "KR:069500": 0.04
        },
        "assetBetas": null,
        "betaProvenance": null
      }
    },
    {
      "monthIndex": 6,
      "month": "2024-06",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "stressedReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 7,
      "month": "2024-07",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "stressedReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 8,
      "month": "2024-08",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "stressedReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 9,
      "month": "2024-09",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 10,
      "month": "2024-10",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "stressedReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 11,
      "month": "2024-11",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "stressedReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 12,
      "month": "2024-12",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "stressedReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    }
  ],
  "outputHash": "e6672dde1bda298bc1d466a8ed4551bb4e96b06f82a5ec3a72060d9def2f9d6b",
  "fixtureContext": {
    "fixtureOnly": true,
    "reviewOnly": true,
    "portfolioId": "step114-2h-fixture-portfolio",
    "portfolioName": "Step 114-2H fixture review",
    "portfolioFingerprint": "{\"assets\":[{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"005930\"},{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"069500\"}],\"portfolioId\":\"step114-2h-fixture-portfolio\",\"settings\":{\"dividendReinvest\":false,\"inflationRate\":0.025,\"initialInvestment\":null,\"investmentMonths\":12,\"monthlyCashFlow\":500000,\"monthlyContribution\":null,\"startValue\":12000000,\"years\":1}}",
    "scenarioId": "step114-2h-direct-asset-fixture",
    "inputHash": "27accc219099d834d89bb34036b2e153ebf9d4142800f1951dc89784c65cd4db",
    "baselineIdentityHash": "06ee7cc6d0a41ae7b1d7991b07cee5649c0bf14f54447c08ca2ff744aaa4b7f7",
    "outputHash": "e6672dde1bda298bc1d466a8ed4551bb4e96b06f82a5ec3a72060d9def2f9d6b",
    "payloadSignature": "6bc5f6ee"
  }
});

export const STEP114_2H_MARKET_BETA_FIXTURE_RESULT = Object.freeze({
  "status": "ready",
  "scenarioVersion": "external-shock-scenario-v1-step114-2h",
  "engineVersion": "external-shock-engine-v1-step114-2h",
  "scenarioId": "step114-2h-market-beta-fixture",
  "scenarioLabel": "Market beta shock fixture",
  "method": "deterministic_external_shock",
  "shockMode": "market_beta",
  "rebalanceFrequency": "none",
  "inflationRate": 0.025,
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
  "inputHash": "42a81b137afd38369d91182abfd32d8128bf09e66047ece7685444953ad21782",
  "baselineIdentityHash": "06ee7cc6d0a41ae7b1d7991b07cee5649c0bf14f54447c08ca2ff744aaa4b7f7",
  "dataQuality": {
    "status": "ready",
    "blockReasons": []
  },
  "betaApplied": true,
  "bootstrapApplied": false,
  "probabilityApplied": false,
  "cagrCalibrationApplied": false,
  "historicalMddApplied": false,
  "assets": [
    {
      "market": "KR",
      "ticker": "005930",
      "key": "KR:005930",
      "targetWeight": 0.5,
      "beta": null
    },
    {
      "market": "KR",
      "ticker": "069500",
      "key": "KR:069500",
      "targetWeight": 0.5,
      "beta": null
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
      "betaProvenance": {
        "KR:005930": {
          "sourceHash": "fixture-beta-source-005930",
          "sourceName": "synthetic_beta_fixture",
          "asOfDate": "2024-12-31",
          "betaWindow": "36m-monthly",
          "methodVersion": "beta-fixture-v1"
        },
        "KR:069500": {
          "sourceHash": "fixture-beta-source-069500",
          "sourceName": "synthetic_beta_fixture",
          "asOfDate": "2024-12-31",
          "betaWindow": "36m-monthly",
          "methodVersion": "beta-fixture-v1"
        }
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
  "baselineTerminalValue": 18740411.638711415,
  "stressedTerminalValue": 17073465.29051509,
  "terminalDeltaValue": -1666946.348196324,
  "terminalDeltaRate": -0.0889492921,
  "baselineMdd": -0.0552172624,
  "stressedMdd": -0.1626203199,
  "incrementalMdd": -0.1074030575,
  "recoveryMonths": null,
  "longestRecoveryMonths": 1,
  "unrecovered": true,
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
  "rowSourceLineage": [
    {
      "month": "2024-01",
      "monthIndex": 1,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-02",
      "monthIndex": 2,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-03",
      "monthIndex": 3,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-04",
      "monthIndex": 4,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-05",
      "monthIndex": 5,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-06",
      "monthIndex": 6,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-07",
      "monthIndex": 7,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-08",
      "monthIndex": 8,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-09",
      "monthIndex": 9,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-10",
      "monthIndex": 10,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-11",
      "monthIndex": 11,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    },
    {
      "month": "2024-12",
      "monthIndex": 12,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      }
    }
  ],
  "trace": [
    {
      "monthIndex": 1,
      "month": "2024-01",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.02,
        "KR:069500": 0.01
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 2,
      "month": "2024-02",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "stressedReturns": {
        "KR:005930": -0.015,
        "KR:069500": -0.005
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 3,
      "month": "2024-03",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "stressedReturns": {
        "KR:005930": 0.03,
        "KR:069500": 0.012
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 4,
      "month": "2024-04",
      "shockApplied": true,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
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
      },
      "betaProvenance": {
        "KR:005930": {
          "sourceHash": "fixture-beta-source-005930",
          "sourceName": "synthetic_beta_fixture",
          "asOfDate": "2024-12-31",
          "betaWindow": "36m-monthly",
          "methodVersion": "beta-fixture-v1"
        },
        "KR:069500": {
          "sourceHash": "fixture-beta-source-069500",
          "sourceName": "synthetic_beta_fixture",
          "asOfDate": "2024-12-31",
          "betaWindow": "36m-monthly",
          "methodVersion": "beta-fixture-v1"
        }
      },
      "shockAssumptions": {
        "shockMode": "market_beta",
        "marketFactorShock": -0.12,
        "assetShockReturns": {
          "KR:005930": -0.132,
          "KR:069500": -0.096
        },
        "assetBetas": {
          "KR:005930": 1.1,
          "KR:069500": 0.8
        },
        "betaProvenance": {
          "KR:005930": {
            "sourceHash": "fixture-beta-source-005930",
            "sourceName": "synthetic_beta_fixture",
            "asOfDate": "2024-12-31",
            "betaWindow": "36m-monthly",
            "methodVersion": "beta-fixture-v1"
          },
          "KR:069500": {
            "sourceHash": "fixture-beta-source-069500",
            "sourceName": "synthetic_beta_fixture",
            "asOfDate": "2024-12-31",
            "betaWindow": "36m-monthly",
            "methodVersion": "beta-fixture-v1"
          }
        }
      }
    },
    {
      "monthIndex": 5,
      "month": "2024-05",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.04,
        "KR:069500": 0.018
      },
      "stressedReturns": {
        "KR:005930": 0.04,
        "KR:069500": 0.018
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 6,
      "month": "2024-06",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "stressedReturns": {
        "KR:005930": 0.025,
        "KR:069500": 0.014
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 7,
      "month": "2024-07",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "stressedReturns": {
        "KR:005930": 0.01,
        "KR:069500": 0.006
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 8,
      "month": "2024-08",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "stressedReturns": {
        "KR:005930": -0.02,
        "KR:069500": -0.01
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 9,
      "month": "2024-09",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "stressedReturns": {
        "KR:005930": 0.015,
        "KR:069500": 0.01
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 10,
      "month": "2024-10",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "stressedReturns": {
        "KR:005930": 0.022,
        "KR:069500": 0.011
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 11,
      "month": "2024-11",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "stressedReturns": {
        "KR:005930": -0.01,
        "KR:069500": -0.004
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    },
    {
      "monthIndex": 12,
      "month": "2024-12",
      "shockApplied": false,
      "rowSourceHashes": {
        "KR:005930": "fixture-row-source-a",
        "KR:069500": "fixture-row-source-b"
      },
      "baselineReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "stressedReturns": {
        "KR:005930": 0.018,
        "KR:069500": 0.009
      },
      "assetShockReturns": null,
      "betaProvenance": null,
      "shockAssumptions": null
    }
  ],
  "outputHash": "c7d2950e2af527d71cc61fcf38eba01112a2c8b37a0f12378a253d9f4f3c9595",
  "fixtureContext": {
    "fixtureOnly": true,
    "reviewOnly": true,
    "portfolioId": "step114-2h-fixture-portfolio",
    "portfolioName": "Step 114-2H fixture review",
    "portfolioFingerprint": "{\"assets\":[{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"005930\"},{\"market\":\"KR\",\"targetEvaluationAmount\":null,\"targetWeight\":50,\"ticker\":\"069500\"}],\"portfolioId\":\"step114-2h-fixture-portfolio\",\"settings\":{\"dividendReinvest\":false,\"inflationRate\":0.025,\"initialInvestment\":null,\"investmentMonths\":12,\"monthlyCashFlow\":500000,\"monthlyContribution\":null,\"startValue\":12000000,\"years\":1}}",
    "scenarioId": "step114-2h-market-beta-fixture",
    "inputHash": "42a81b137afd38369d91182abfd32d8128bf09e66047ece7685444953ad21782",
    "baselineIdentityHash": "06ee7cc6d0a41ae7b1d7991b07cee5649c0bf14f54447c08ca2ff744aaa4b7f7",
    "outputHash": "c7d2950e2af527d71cc61fcf38eba01112a2c8b37a0f12378a253d9f4f3c9595",
    "payloadSignature": "bef0f12e"
  }
});

export const STEP114_2H_SCENARIO_FIXTURE_RESULTS = Object.freeze([
  STEP114_2H_DIRECT_SHOCK_FIXTURE_RESULT,
  STEP114_2H_MARKET_BETA_FIXTURE_RESULT
]);
