from __future__ import annotations

import csv
import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from scripts.export_finple_app_preview import (
    METRIC_FIELDS,
    PreviewExportError,
    export_app_preview,
)


RAW_MISSING = [
    "KR:0021E0",
    "KR:0102A0",
    "KR:066410",
    "KR:099520",
    "KR:121800",
    "KR:140910",
    "KR:204210",
    "KR:301410",
    "KR:332190",
    "KR:451700",
    "KR:461270",
    "KR:475720",
    "KR:483240",
    "KR:495710",
    "KR:496320",
    "US:ICR^A",
]


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_json(path: Path, payload: dict) -> None:
    path.write_text(json.dumps(payload, ensure_ascii=False, sort_keys=True), encoding="utf-8")


def make_identities() -> list[tuple[str, str]]:
    kr_special = ["069500", "0086C0", *[identity.split(":", 1)[1] for identity in RAW_MISSING if identity.startswith("KR:")]]
    kr = []
    seen = set()
    for ticker in kr_special:
        if ticker not in seen:
            seen.add(ticker)
            kr.append(("KR", ticker))
    index = 0
    while len(kr) < 3000:
        ticker = f"{index:06d}"
        index += 1
        if ticker in seen:
            continue
        seen.add(ticker)
        kr.append(("KR", ticker))

    us_special = ["QQQ", "SPY", "ICR^A"]
    us = [("US", ticker) for ticker in us_special]
    us.extend(("US", f"U{index:04d}") for index in range(3000 - len(us)))
    return kr + us


def metric_row(market: str, ticker: str) -> dict[str, str]:
    row = {field: "" for field in METRIC_FIELDS}
    row.update(
        {
            "market": market,
            "ticker": ticker,
            "nameKr": f"{market}-{ticker}",
            "assetType": "ETF" if ticker in {"QQQ", "SPY", "069500"} else "stock",
            "benchmarkKey": "US_SPY" if market == "US" else "KR_KOSPI",
            "benchmarkTicker": "SPY" if market == "US" else "069500",
            "selectedCagr": "17.11" if ticker == "QQQ" else "",
            "rawPriceCagr10y": "21.21" if ticker == "QQQ" else "",
            "rollingCagr10yMedian": "17.11" if ticker == "QQQ" else "",
            "rollingCagr10yP25": "15.62" if ticker == "QQQ" else "",
            "rollingCagr10yP75": "18.59" if ticker == "QQQ" else "",
            "validRollingWindowCount10y": "120" if ticker == "QQQ" else "",
            "cagrPolicy": "rolling_10y_median" if ticker == "QQQ" else "insufficient",
            "selectedMdd": "-49.97" if ticker == "QQQ" else "",
            "mddPolicy": "full_period_actual",
            "selectedBeta": "1.1098" if ticker == "QQQ" else "",
            "betaPolicy": "aligned_monthly_return_beta",
            "dividendYield": "0.00" if ticker == "QQQ" else "",
            "dividendStatus": "confirmed_zero" if ticker == "QQQ" else "review_required",
            "dataStatus": "ready" if ticker in {"QQQ", "SPY", "069500"} else "review_required",
            "reviewFlag": "none" if ticker in {"QQQ", "SPY"} else "review_required",
            "reviewReason": "" if ticker in {"QQQ", "SPY"} else "normalized_source_missing",
            "metricBaseDate": "2026-07-22",
            "sourceHash": "a" * 64,
            "normalizationVersion": "normalization-v1",
            "rollingMetricVersion": "rolling-v1",
        }
    )
    return row


def build_fixture(root: Path, *, non_finite: bool = False) -> Path:
    package_dir = root / "package"
    package_dir.mkdir()
    manifest = {
        "candidatePackageReady": True,
        "packageGlobalBlockingIssueCount": 0,
        "metricsOutputRowCount": 6000,
        "selectedRowCount": 1354,
        "metricDataThroughMonth": "2026-06",
        "metricBaseDate": "2026-07-22",
        "requestedAsOfIncluded": "2026-07-22",
        "actualLastPriceDate": "2026-07-22",
        "partialFinalMonthDetected": True,
        "partialFinalMonthExcluded": True,
        "partialMonthPolicy": "exclude_from_metrics",
        "productionPublishReady": False,
        "appExportApproved": False,
        "internalPreviewReviewOnly": True,
        "candidatePackageId": "finple-candidate-unit-test",
        "candidatePackageHash": "b" * 64,
        "candidatePackageVersion": "unit",
        "inputRowReconciliation": {"monthlyReturnRows": 4},
    }
    write_json(package_dir / "finple_candidate_manifest_unit.json", manifest)
    write_json(package_dir / "finple_candidate_readiness_unit.json", manifest)

    metrics_path = package_dir / "finple_candidate_metrics_output_unit.csv"
    with metrics_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(METRIC_FIELDS))
        writer.writeheader()
        for market, ticker in make_identities():
            row = metric_row(market, ticker)
            if non_finite and ticker == "QQQ":
                row["selectedCagr"] = "NaN"
            writer.writerow(row)

    monthly_path = package_dir / "finple_candidate_monthly_returns_unit.csv"
    monthly_columns = [
        "market",
        "ticker",
        "month",
        "currency",
        "priceReturn",
        "totalReturn",
        "fxReturn",
        "benchmarkId",
        "isProxy",
        "proxyTicker",
        "dataStatus",
    ]
    with monthly_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=monthly_columns)
        writer.writeheader()
        for market, ticker, month, value in [
            ("KR", "069500", "2026-05-31", "0.010000"),
            ("KR", "069500", "2026-06-30", "-0.020000"),
            ("US", "QQQ", "2026-05-31", "0.030000"),
            ("US", "QQQ", "2026-06-30", "0.040000"),
        ]:
            writer.writerow(
                {
                    "market": market,
                    "ticker": ticker,
                    "month": month,
                    "currency": "KRW" if market == "KR" else "USD",
                    "priceReturn": value,
                    "totalReturn": value,
                    "fxReturn": "0.000000",
                    "benchmarkId": "KR_KOSPI" if market == "KR" else "US_SPY",
                    "isProxy": "false",
                    "proxyTicker": "",
                    "dataStatus": "candidate",
                }
            )

    source_audit_path = package_dir / "finple_candidate_source_audit_unit.csv"
    with source_audit_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=["issueType", "severity", "blocksCandidate", "logicalRole", "path", "reviewReason"],
        )
        writer.writeheader()
        for identity in RAW_MISSING:
            writer.writerow(
                {
                    "issueType": "candidate_raw_identity_missing",
                    "severity": "warning",
                    "blocksCandidate": "false",
                    "logicalRole": "raw_daily_price",
                    "path": "",
                    "reviewReason": f"No raw rows for candidate {identity}; asset remains review-required.",
                }
            )
    return package_dir


def zip_fixture(package_dir: Path, zip_path: Path) -> Path:
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(package_dir.iterdir()):
            archive.write(path, arcname=path.name)
    return zip_path


class AppPreviewExportTests(unittest.TestCase):
    def test_exports_exact_universe_identities_nulls_and_lazy_shards(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            package_dir = build_fixture(root)
            result = export_app_preview(package_dir, root / "out", shard_count=64)
            bundle = Path(result["bundleDirectory"])
            overlay = json.loads((bundle / "metrics-overlay.json").read_text(encoding="utf-8"))
            rows = overlay["rows"]
            self.assertEqual(len(rows), 6000)
            by_identity = {row["identity"]: row for row in rows}
            self.assertIn("KR:069500", by_identity)
            self.assertIn("KR:0086C0", by_identity)
            self.assertIsNone(by_identity["KR:0086C0"]["selectedCagr"])
            self.assertEqual(by_identity["KR:0021E0"]["rawPriceCoverageStatus"], "missing")

            qqq = by_identity["US:QQQ"]
            self.assertEqual(qqq["selectedCagr"], qqq["rollingCagr10yMedian"])
            self.assertEqual(qqq["validRollingWindowCount10y"], 120)
            self.assertEqual(qqq["cagrPolicy"], "rolling_10y_median")
            self.assertEqual(qqq["mddPolicy"], "full_period_actual")
            self.assertEqual(qqq["betaPolicy"], "aligned_monthly_return_beta")

            index = json.loads((bundle / "monthly-returns-index.json").read_text(encoding="utf-8"))
            self.assertEqual(index["rowCount"], 4)
            self.assertEqual(index["lastMonth"], "2026-06-30")
            self.assertEqual(len(index["shards"]), 64)
            for shard in index["shards"]:
                path = bundle / shard["path"]
                self.assertEqual(shard["sha256"], sha256(path))
            self.assertNotEqual(index["assets"]["US:QQQ"]["shard"], "")
            self.assertNotIn("raw_daily", "\n".join(path.as_posix() for path in bundle.rglob("*")))
            self.assertNotIn("normalized_month", "\n".join(path.as_posix() for path in bundle.rglob("*")))

    def test_zip_and_extracted_directory_exports_are_byte_deterministic(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            package_dir = build_fixture(root)
            package_zip = zip_fixture(package_dir, root / "candidate.zip")
            first = export_app_preview(package_dir, root / "out-a", shard_count=64)
            second = export_app_preview(package_zip, root / "out-b", shard_count=64)
            self.assertEqual(first["zipSha256"], second["zipSha256"])
            self.assertEqual(first["zipSizeBytes"], second["zipSizeBytes"])

    def test_non_finite_metric_is_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            package_dir = build_fixture(root, non_finite=True)
            with self.assertRaisesRegex(PreviewExportError, "non-finite"):
                export_app_preview(package_dir, root / "out", shard_count=64)


if __name__ == "__main__":
    unittest.main()
