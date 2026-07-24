#!/usr/bin/env python3
"""Build and validate the manifest-driven FINPLE canonical universe v2.

This module is intentionally provider-free.  It materializes a deterministic
canonical CSV from the immutable v1 snapshot plus officially reviewed
onboarding records.  Raw price collection is a separate operator-only step.
"""

from __future__ import annotations

import argparse
from collections import Counter
import csv
import hashlib
import json
from pathlib import Path
import re
from typing import Any, Iterable
from urllib.parse import urlsplit


TARGET_UNIVERSE_VERSION = "finple-universe-v2-2026-07-24"
SOURCE_UNIVERSE_VERSION = "finple-app-candidates-6000-balanced-v1-2026-07-22"
SOURCE_CHECKED_AT = "2026-07-22"
TARGET_CHECKED_AT = "2026-07-24"
GENERATED_AT = "2026-07-24T00:00:00Z"

BASE_FIELDS = [
    "market", "ticker", "providerSymbol", "nameKr", "assetType", "sourceUniverse",
    "tier", "strategy", "riskLevel", "goals", "beginnerFit", "tags", "dataStatus",
    "expectedCagr", "beta", "mdd", "dividendYield", "displayDividendYield",
    "dividendPolicy", "dividendSource", "metricsSource", "reviewTag", "reviewReason",
    "notes", "marketCap", "aum", "sizeSource",
]
V2_FIELDS = [
    "underlyingTicker", "exposureType", "leverageMultiple", "direction",
    "resetFrequency", "optionCoverageRatio", "distributionFrequency",
    "distributionType", "issuer", "inceptionDate", "listingStatus", "active",
    "firstListedDate", "lastTradingDate", "sourceCheckedAt", "officialSourceUrl",
    "sourceId", "cagrPolicy",
]
CANONICAL_FIELDS = [*BASE_FIELDS, *V2_FIELDS]
LISTING_STATUSES = {"active", "inactive", "delisted", "suspended", "pending_review"}
EXPOSURE_TYPES = {
    "single_stock_leveraged", "single_stock_inverse", "single_stock_option_income",
    "single_stock_weekly_income", "index_covered_call", "index_covered_call_growth",
    "thematic_equity_premium_income", "broad_equity_premium_income",
    "ordinary_equity", "ordinary_etf",
}
DIRECTIONS = {"long", "inverse", "neutral_income"}
RESET_FREQUENCIES = {"daily", "none", "not_applicable"}
DISTRIBUTION_TYPES = {
    "ordinary_cash_dividend", "option_premium_income",
    "covered_call_distribution", "return_of_capital_possible",
    "mixed_distribution", "none", "unknown",
}

DIREXION_URLS = {
    "TSLL": "https://www.direxion.com/product/daily-tsla-bull-and-bear-leveraged-single-stock-etfs",
    "TSLS": "https://www.direxion.com/product/daily-tsla-bull-and-bear-leveraged-single-stock-etfs",
    "AAPU": "https://www.direxion.com/product/daily-aapl-bull-and-bear-leveraged-single-stock-etfs",
    "AAPD": "https://www.direxion.com/product/daily-aapl-bull-and-bear-leveraged-single-stock-etfs",
    "MSFU": "https://www.direxion.com/product/daily-msft-bull-and-bear-leveraged-single-stock-etfs",
    "MSFD": "https://www.direxion.com/product/daily-msft-bull-and-bear-leveraged-single-stock-etfs",
    "GGLL": "https://www.direxion.com/product/daily-googl-bull-and-bear-leveraged-single-stock-etfs",
    "GGLS": "https://www.direxion.com/product/daily-googl-bull-and-bear-leveraged-single-stock-etfs",
    "METU": "https://www.direxion.com/product/daily-meta-bull-and-bear-leveraged-single-stock-etfs",
    "METD": "https://www.direxion.com/product/daily-meta-bull-and-bear-leveraged-single-stock-etfs",
    "NVDU": "https://www.direxion.com/product/daily-nvda-bull-and-bear-leveraged-single-stock-etfs",
    "NVDD": "https://www.direxion.com/product/daily-nvda-bull-and-bear-leveraged-single-stock-etfs",
    "AMZU": "https://www.direxion.com/product/daily-amzn-bull-and-bear-leveraged-single-stock-etfs",
    "AMZD": "https://www.direxion.com/product/daily-amzn-bull-and-bear-leveraged-single-stock-etfs",
}
TREX_URLS = {
    ticker: f"https://www.rexshares.com/{ticker.lower()}/"
    for ticker in ("TSLT", "TSLZ", "AAPX", "MSFX", "GOOX", "NVDX", "NVDQ")
}
KURV_URLS = {
    ticker: f"https://www.kurvinvest.com/etf/{ticker.lower()}"
    for ticker in ("AAPY", "AMZP", "GOOP", "MSFY", "TSLP", "NFLP")
}
GLOBAL_X_URLS = {
    ticker: f"https://www.globalxetfs.com/funds/{ticker.lower()}"
    for ticker in ("QYLD", "XYLD", "RYLD", "QYLG", "XYLG", "RYLG", "DJIA")
}


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_path(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def identity(row: dict[str, str]) -> str:
    market = str(row.get("market") or "").strip().upper()
    ticker = str(row.get("ticker") or "").strip().upper()
    if market not in {"US", "KR"} or not ticker:
        raise ValueError(f"invalid market+ticker identity: {market}:{ticker}")
    if market == "KR" and not re.fullmatch(r"[0-9A-Z]{6}", ticker):
        raise ValueError(f"invalid KR six-character ticker: {ticker}")
    return f"{market}:{ticker}"


def _legacy_defaults(row: dict[str, str]) -> dict[str, str]:
    asset_type = str(row.get("assetType") or "").lower()
    dividend_policy = str(row.get("dividendPolicy") or "")
    if dividend_policy == "dividend_confirmed":
        distribution_type = "ordinary_cash_dividend"
    elif dividend_policy == "no_dividend":
        distribution_type = "none"
    else:
        distribution_type = "unknown"
    return {
        "underlyingTicker": "",
        "exposureType": "ordinary_equity" if asset_type in {"stock", "single_stock"} else "ordinary_etf",
        "leverageMultiple": "",
        "direction": "long",
        "resetFrequency": "not_applicable",
        "optionCoverageRatio": "",
        "distributionFrequency": "unknown",
        "distributionType": distribution_type,
        "issuer": "",
        "inceptionDate": "",
        "listingStatus": "active",
        "active": "True",
        "firstListedDate": "",
        "lastTradingDate": "",
        "sourceCheckedAt": SOURCE_CHECKED_AT,
        "officialSourceUrl": "",
        "sourceId": str(row.get("sourceUniverse") or ""),
        "cagrPolicy": "legacy_v1_preserved",
    }


def _base_new_row(ticker: str, name: str, *, strategy: str, risk: str, tags: str) -> dict[str, str]:
    return {
        "market": "US", "ticker": ticker, "providerSymbol": ticker, "nameKr": name,
        "assetType": "ETF", "sourceUniverse": "official_issuer_verified_20260724",
        "tier": "standard", "strategy": strategy, "riskLevel": risk,
        "goals": "growth|aggressive" if strategy == "aggressive" else "dividend|income",
        "beginnerFit": "False", "tags": tags, "dataStatus": "limited_history",
        "expectedCagr": "", "beta": "", "mdd": "", "dividendYield": "",
        "displayDividendYield": "확인 필요",
        "dividendPolicy": "distribution_separate_from_dividend" if strategy == "dividend" else "pending",
        "dividendSource": "", "metricsSource": "", "reviewTag": "pending_review",
        "reviewReason": "delta_backfill_required",
        "notes": "Official product status verified; price and monthly-return delta remain operator work.",
        "marketCap": "", "aum": "", "sizeSource": "",
    }


def _leveraged(
    ticker: str, name: str, underlying: str, multiple: float, issuer: str,
    inception: str, url: str,
) -> dict[str, str]:
    direction = "inverse" if multiple < 0 else "long"
    row = _base_new_row(
        ticker, name, strategy="aggressive", risk="very-high",
        tags="레버리지|인버스|단일종목|daily-reset",
    )
    row.update({
        "underlyingTicker": underlying,
        "exposureType": "single_stock_inverse" if direction == "inverse" else "single_stock_leveraged",
        "leverageMultiple": f"{multiple:g}", "direction": direction,
        "resetFrequency": "daily", "optionCoverageRatio": "",
        "distributionFrequency": "variable", "distributionType": "mixed_distribution",
        "issuer": issuer, "inceptionDate": inception, "listingStatus": "active",
        "active": "True", "firstListedDate": inception, "lastTradingDate": "",
        "sourceCheckedAt": TARGET_CHECKED_AT, "officialSourceUrl": url,
        "sourceId": f"{re.sub(r'[^a-z0-9]+', '_', issuer.lower()).strip('_')}:{ticker}",
        "cagrPolicy": "blank_review_required",
    })
    return row


def _income(
    ticker: str, name: str, underlying: str, exposure: str, issuer: str,
    inception: str, url: str, *, coverage: str = "", frequency: str = "monthly",
) -> dict[str, str]:
    row = _base_new_row(
        ticker, name, strategy="dividend", risk="high",
        tags="옵션인컴|커버드콜|분배금|return-of-capital-possible",
    )
    row.update({
        "underlyingTicker": underlying, "exposureType": exposure,
        "leverageMultiple": "", "direction": "neutral_income",
        "resetFrequency": "none", "optionCoverageRatio": coverage,
        "distributionFrequency": frequency, "distributionType": "mixed_distribution",
        "issuer": issuer, "inceptionDate": inception, "listingStatus": "active",
        "active": "True", "firstListedDate": inception, "lastTradingDate": "",
        "sourceCheckedAt": TARGET_CHECKED_AT, "officialSourceUrl": url,
        "sourceId": f"{re.sub(r'[^a-z0-9]+', '_', issuer.lower()).strip('_')}:{ticker}",
        "cagrPolicy": "since_inception",
    })
    return row


def addition_rows() -> list[dict[str, str]]:
    rows = [
        _leveraged("TSLL", "Direxion Daily TSLA Bull 2X ETF", "TSLA", 2, "Direxion", "2022-08-09", DIREXION_URLS["TSLL"]),
        _leveraged("TSLS", "Direxion Daily TSLA Bear 1X ETF", "TSLA", -1, "Direxion", "2022-08-09", DIREXION_URLS["TSLS"]),
        _leveraged("TSLT", "T-REX 2X Long Tesla Daily Target ETF", "TSLA", 2, "REX Shares / Tuttle Capital", "2023-10-19", TREX_URLS["TSLT"]),
        _leveraged("TSLZ", "T-REX 2X Inverse Tesla Daily Target ETF", "TSLA", -2, "REX Shares / Tuttle Capital", "2023-10-19", TREX_URLS["TSLZ"]),
        _leveraged("AAPU", "Direxion Daily AAPL Bull 2X ETF", "AAPL", 2, "Direxion", "2022-08-09", DIREXION_URLS["AAPU"]),
        _leveraged("AAPD", "Direxion Daily AAPL Bear 1X ETF", "AAPL", -1, "Direxion", "2022-08-09", DIREXION_URLS["AAPD"]),
        _leveraged("AAPX", "T-REX 2X Long Apple Daily Target ETF", "AAPL", 2, "REX Shares / Tuttle Capital", "2024-01-11", TREX_URLS["AAPX"]),
        _leveraged("MSFU", "Direxion Daily MSFT Bull 2X ETF", "MSFT", 2, "Direxion", "2022-09-07", DIREXION_URLS["MSFU"]),
        _leveraged("MSFD", "Direxion Daily MSFT Bear 1X ETF", "MSFT", -1, "Direxion", "2022-09-07", DIREXION_URLS["MSFD"]),
        _leveraged("MSFX", "T-REX 2X Long Microsoft Daily Target ETF", "MSFT", 2, "REX Shares / Tuttle Capital", "2024-01-11", TREX_URLS["MSFX"]),
        _leveraged("GGLL", "Direxion Daily GOOGL Bull 2X ETF", "GOOGL", 2, "Direxion", "2022-09-07", DIREXION_URLS["GGLL"]),
        _leveraged("GGLS", "Direxion Daily GOOGL Bear 1X ETF", "GOOGL", -1, "Direxion", "2022-09-07", DIREXION_URLS["GGLS"]),
        _leveraged("GOOX", "T-REX 2X Long Alphabet Daily Target ETF", "GOOG", 2, "REX Shares / Tuttle Capital", "2024-01-11", TREX_URLS["GOOX"]),
        _leveraged("METU", "Direxion Daily META Bull 2X ETF", "META", 2, "Direxion", "2024-06-05", DIREXION_URLS["METU"]),
        _leveraged("METD", "Direxion Daily META Bear 1X ETF", "META", -1, "Direxion", "2024-06-05", DIREXION_URLS["METD"]),
        _leveraged("NVDU", "Direxion Daily NVDA Bull 2X ETF", "NVDA", 2, "Direxion", "2023-09-13", DIREXION_URLS["NVDU"]),
        _leveraged("NVDD", "Direxion Daily NVDA Bear 1X ETF", "NVDA", -1, "Direxion", "2023-09-13", DIREXION_URLS["NVDD"]),
        _leveraged("NVDQ", "T-REX 2X Inverse NVIDIA Daily Target ETF", "NVDA", -2, "REX Shares / Tuttle Capital", "2023-10-19", TREX_URLS["NVDQ"]),
        _income("AAPY", "Kurv Yield Premium Strategy Apple ETF", "AAPL", "single_stock_option_income", "Kurv Investment Management", "2023-10-26", KURV_URLS["AAPY"]),
        _income("AMZP", "Kurv Yield Premium Strategy Amazon ETF", "AMZN", "single_stock_option_income", "Kurv Investment Management", "2023-10-30", KURV_URLS["AMZP"]),
        _income("GOOP", "Kurv Yield Premium Strategy Google ETF", "GOOGL", "single_stock_option_income", "Kurv Investment Management", "2023-10-30", KURV_URLS["GOOP"]),
        _income("MSFY", "Kurv Yield Premium Strategy Microsoft ETF", "MSFT", "single_stock_option_income", "Kurv Investment Management", "2023-10-30", KURV_URLS["MSFY"]),
        _income("TSLP", "Kurv Yield Premium Strategy Tesla ETF", "TSLA", "single_stock_option_income", "Kurv Investment Management", "2023-10-26", KURV_URLS["TSLP"]),
        _income("NFLP", "Kurv Yield Premium Strategy Netflix ETF", "NFLX", "single_stock_option_income", "Kurv Investment Management", "2023-10-26", KURV_URLS["NFLP"]),
        _income("AIPI", "REX AI Equity Premium Income ETF", "BITA AI Leaders Select Index", "thematic_equity_premium_income", "REX Shares", "2024-06-04", "https://www.rexshares.com/aipi/", frequency="weekly"),
        _income("QYLG", "Global X Nasdaq 100 Covered Call & Growth ETF", "Nasdaq-100 Index", "index_covered_call_growth", "Global X", "2020-09-18", GLOBAL_X_URLS["QYLG"], coverage="0.5"),
        _income("XYLG", "Global X S&P 500 Covered Call & Growth ETF", "S&P 500 Index", "index_covered_call_growth", "Global X", "2020-09-18", GLOBAL_X_URLS["XYLG"], coverage="0.5"),
        _income("RYLG", "Global X Russell 2000 Covered Call & Growth ETF", "Russell 2000 Index", "index_covered_call_growth", "Global X", "2022-10-04", GLOBAL_X_URLS["RYLG"], coverage="0.5"),
        _income("DJIA", "Global X Dow 30 Covered Call ETF", "Dow Jones Industrial Average", "index_covered_call", "Global X", "2022-02-23", GLOBAL_X_URLS["DJIA"], coverage="1"),
    ]
    return sorted(rows, key=lambda row: identity(row))


def existing_overrides() -> dict[str, dict[str, str]]:
    rows: dict[str, dict[str, str]] = {}

    def add(row: dict[str, str]) -> None:
        rows[identity(row)] = {field: row[field] for field in V2_FIELDS}

    for args in (
        ("NVDL", "GraniteShares 2x Long NVDA Daily ETF", "NVDA", 2, "GraniteShares", "2022-12-13", "https://graniteshares.com/institutional/us/en-us/etfs/nvdl/"),
        ("NVDX", "T-REX 2X Long NVIDIA Daily Target ETF", "NVDA", 2, "REX Shares / Tuttle Capital", "2023-10-19", TREX_URLS["NVDX"]),
        ("AMZU", "Direxion Daily AMZN Bull 2X ETF", "AMZN", 2, "Direxion", "2022-09-07", DIREXION_URLS["AMZU"]),
        ("AMZD", "Direxion Daily AMZN Bear 1X ETF", "AMZN", -1, "Direxion", "2022-09-07", DIREXION_URLS["AMZD"]),
        ("AMZZ", "GraniteShares 2x Long AMZN Daily ETF", "AMZN", 2, "GraniteShares", "2022-08-22", "https://graniteshares.com/institutional/us/en-us/etfs/amzz/"),
        ("AMZO", "Tradr 2X Short AMZN Daily ETF", "AMZN", -2, "Tradr ETFs", "2024-07-15", "https://www.tradretfs.com/amzo"),
    ):
        add(_leveraged(*args))

    income_specs = [
        ("TSLY", "TSLA", "single_stock_weekly_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/tsly/", "weekly"),
        ("APLY", "AAPL", "single_stock_weekly_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/aply/", "weekly"),
        ("MSFO", "MSFT", "single_stock_weekly_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/msfo/", "weekly"),
        ("GOOY", "GOOGL", "single_stock_weekly_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/gooy/", "weekly"),
        ("FBY", "META", "single_stock_weekly_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/fby/", "weekly"),
        ("NVDY", "NVDA", "single_stock_weekly_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/nvdy/", "weekly"),
        ("AMZY", "AMZN", "single_stock_weekly_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/amzy/", "weekly"),
        ("JEPI", "S&P 500 equity portfolio", "broad_equity_premium_income", "J.P. Morgan Asset Management", "https://am.jpmorgan.com/us/en/asset-management/adv/products/jepi", "monthly"),
        ("JEPQ", "Nasdaq-100 equity portfolio", "broad_equity_premium_income", "J.P. Morgan Asset Management", "https://am.jpmorgan.com/us/en/asset-management/adv/products/jepq", "monthly"),
        ("QYLD", "Nasdaq-100 Index", "index_covered_call", "Global X", GLOBAL_X_URLS["QYLD"], "monthly"),
        ("XYLD", "S&P 500 Index", "index_covered_call", "Global X", GLOBAL_X_URLS["XYLD"], "monthly"),
        ("RYLD", "Russell 2000 Index", "index_covered_call", "Global X", GLOBAL_X_URLS["RYLD"], "monthly"),
        ("SPYI", "S&P 500 Index", "broad_equity_premium_income", "NEOS Investments", "https://neosfunds.com/spyi/", "monthly"),
        ("QQQI", "Nasdaq-100 Index", "broad_equity_premium_income", "NEOS Investments", "https://neosfunds.com/qqqi/", "monthly"),
        ("GPIQ", "Nasdaq-100 equity portfolio", "broad_equity_premium_income", "Goldman Sachs Asset Management", "https://am.gs.com/en-us/advisors/campaign/premium-income-etfs", "monthly"),
        ("GPIX", "S&P 500 equity portfolio", "broad_equity_premium_income", "Goldman Sachs Asset Management", "https://am.gs.com/en-us/advisors/campaign/premium-income-etfs", "monthly"),
        ("DIVO", "U.S. large-cap equity portfolio", "broad_equity_premium_income", "Amplify ETFs", "https://amplifyetfs.com/divo/", "monthly"),
        ("FEPI", "FANG & Innovation Index", "thematic_equity_premium_income", "REX Shares", "https://www.rexshares.com/fepi/", "weekly"),
        ("YMAG", "Magnificent 7 option-income ETF basket", "broad_equity_premium_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/ymag/", "weekly"),
        ("YMAX", "YieldMax option-income ETF universe", "broad_equity_premium_income", "YieldMax", "https://yieldmaxetfs.com/our-etfs/ymax/", "weekly"),
        ("CEPI", "crypto-related public equities", "thematic_equity_premium_income", "REX Shares", "https://www.rexshares.com/cepi/", "weekly"),
    ]
    for ticker, underlying, exposure, issuer, url, frequency in income_specs:
        add(_income(ticker, ticker, underlying, exposure, issuer, "", url, frequency=frequency))
    return rows


def validate_official_source(row: dict[str, str]) -> None:
    """Validate evidence fields and official-source URL syntax only.

    This deterministic build check performs no HTTP request and does not prove
    that a product is currently listed. The operator's separate manual
    official-page review is recorded in the delta source-evidence artifact.
    """
    url = str(row.get("officialSourceUrl") or "")
    split = urlsplit(url)
    if split.scheme != "https" or not split.netloc or split.username or split.password:
        raise ValueError(f"official source URL syntax must be credential-free HTTPS: {identity(row)}")
    if row.get("listingStatus") != "active" or row.get("active") != "True":
        raise ValueError(f"approved addition must be active: {identity(row)}")
    if not row.get("issuer") or not row.get("inceptionDate") or not row.get("sourceId"):
        raise ValueError(f"official source evidence is incomplete: {identity(row)}")


def validate_canonical(rows: Iterable[dict[str, str]]) -> list[dict[str, str]]:
    validated = list(rows)
    identities: set[str] = set()
    previous = ""
    for row in validated:
        key = identity(row)
        if key in identities:
            raise ValueError(f"duplicate market+ticker: {key}")
        if previous and key < previous:
            raise ValueError(f"canonical order is not deterministic: {previous} then {key}")
        previous = key
        identities.add(key)
        if row.get("listingStatus") not in LISTING_STATUSES:
            raise ValueError(f"invalid listingStatus for {key}")
        if row.get("exposureType") not in EXPOSURE_TYPES:
            raise ValueError(f"invalid exposureType for {key}")
        if row.get("direction") not in DIRECTIONS:
            raise ValueError(f"invalid direction for {key}")
        if row.get("resetFrequency") not in RESET_FREQUENCIES:
            raise ValueError(f"invalid resetFrequency for {key}")
        if row.get("distributionType") not in DISTRIBUTION_TYPES:
            raise ValueError(f"invalid distributionType for {key}")
    return validated


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=CANONICAL_FIELDS, lineterminator="\n")
        writer.writeheader()
        writer.writerows([{field: row.get(field, "") for field in CANONICAL_FIELDS} for row in rows])


def write_json(path: Path, value: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True, allow_nan=False) + "\n",
        encoding="utf-8",
    )


def materialize(
    source_csv: Path,
    output_csv: Path,
    manifest_path: Path,
    reconciliation_path: Path,
) -> dict[str, Any]:
    source_bytes = source_csv.read_bytes()
    with source_csv.open("r", encoding="utf-8-sig", newline="") as handle:
        source_rows = list(csv.DictReader(handle))
    if len(source_rows) != 6000:
        raise ValueError(f"immutable v1 source must contain 6000 identities, found {len(source_rows)}")
    source_ids = {identity(row) for row in source_rows}
    if len(source_ids) != len(source_rows):
        raise ValueError("immutable v1 source contains duplicate market+ticker identities")

    overrides = existing_overrides()
    rows: list[dict[str, str]] = []
    for source_row in source_rows:
        row = {field: str(source_row.get(field) or "") for field in BASE_FIELDS}
        row.update(_legacy_defaults(row))
        row.update(overrides.get(identity(row), {}))
        rows.append(row)

    additions = addition_rows()
    for row in additions:
        validate_official_source(row)
        if identity(row) in source_ids:
            raise ValueError(f"addition duplicates immutable v1 identity: {identity(row)}")
        rows.append(row)
    rows.sort(key=identity)
    rows = validate_canonical(rows)
    write_csv(output_csv, rows)

    target_ids = {identity(row) for row in rows}
    removed = sorted(source_ids - target_ids)
    new_ids = sorted(target_ids - source_ids)
    market_counts = Counter(row["market"] for row in rows)
    asset_type_counts = Counter(row["assetType"] for row in rows)
    exposure_counts = Counter(row["exposureType"] for row in rows)
    listing_counts = Counter(row["listingStatus"] for row in rows)
    active_count = sum(row["active"] == "True" for row in rows)
    identity_hash = sha256_bytes(("\n".join(sorted(target_ids)) + "\n").encode("utf-8"))
    target_sha = sha256_path(output_csv)
    source_sha = sha256_bytes(source_bytes)
    review_count = sum(row["reviewTag"] in {"review_required", "pending_review"} for row in rows)
    price_covered_count = sum(
        row["expectedCagr"] != "" and row["mdd"] != "" and row["beta"] != ""
        for row in rows
    )

    reconciliation = {
        "schemaVersion": "finple-universe-reconciliation-v2",
        "sourceUniverseVersion": SOURCE_UNIVERSE_VERSION,
        "targetUniverseVersion": TARGET_UNIVERSE_VERSION,
        "sourceAssetCount": len(source_rows),
        "additionCount": len(additions),
        "rejectedCount": 0,
        "duplicateCount": 0,
        "targetAssetCount": len(rows),
        "existingIdentityCount": len(source_ids),
        "removedExistingIdentityCount": len(removed),
        "newIdentityCount": len(new_ids),
        "duplicateIdentityCount": 0,
        "marketAssetCounts": dict(sorted(market_counts.items())),
        "assetTypeCounts": dict(sorted(asset_type_counts.items())),
        "exposureTypeCounts": dict(sorted(exposure_counts.items())),
        "sourceUniverseSha256": source_sha,
        "targetUniverseSha256": target_sha,
        "identityHash": identity_hash,
        "newIdentities": new_ids,
        "removedIdentities": removed,
    }
    manifest = {
        "schemaVersion": "finple-universe-manifest-v2",
        "universeVersion": TARGET_UNIVERSE_VERSION,
        "canonicalUniverseSha256": target_sha,
        "sourceUniverseVersion": SOURCE_UNIVERSE_VERSION,
        "sourceUniverseSha256": source_sha,
        "assetCount": len(rows),
        "activeAssetCount": active_count,
        "inactiveAssetCount": len(rows) - active_count,
        "marketAssetCounts": dict(sorted(market_counts.items())),
        "assetTypeCounts": dict(sorted(asset_type_counts.items())),
        "exposureTypeCounts": dict(sorted(exposure_counts.items())),
        "listingStatusCounts": dict(sorted(listing_counts.items())),
        "priceCoveredAssetCount": price_covered_count,
        "missingPriceAssetCount": len(rows) - price_covered_count,
        "reviewAssetCount": review_count,
        "monthlyReturnAssetCount": None,
        "monthlyReturnRowCount": None,
        "shardCount": None,
        "shardInventory": [],
        "monthlyReturnStatus": "operator_delta_pending",
        "identityHash": identity_hash,
        "generatedAt": GENERATED_AT,
        "sourceCheckedAt": TARGET_CHECKED_AT,
        "productionSelectorChanged": False,
        "publicCsvChanged": False,
        "gapsForwardFilled": False,
    }
    write_json(reconciliation_path, reconciliation)
    write_json(manifest_path, manifest)
    return {"manifest": manifest, "reconciliation": reconciliation}


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--manifest", type=Path, required=True)
    parser.add_argument("--reconciliation", type=Path, required=True)
    parser.add_argument("--check", action="store_true")
    return parser


def check_generated_files(
    source: Path,
    output: Path,
    manifest_path: Path,
    reconciliation_path: Path,
) -> bool:
    expected_csv = output.read_bytes()
    expected_manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    expected_reconciliation = json.loads(reconciliation_path.read_text(encoding="utf-8"))
    import tempfile
    with tempfile.TemporaryDirectory(prefix="finple-universe-v2-check-") as temporary:
        root = Path(temporary)
        result = materialize(
            source,
            root / output.name,
            root / manifest_path.name,
            root / reconciliation_path.name,
        )
        return (
            (root / output.name).read_bytes() == expected_csv
            and result["manifest"] == expected_manifest
            and result["reconciliation"] == expected_reconciliation
        )


def main() -> None:
    args = build_parser().parse_args()
    if args.check:
        if not check_generated_files(
            args.source, args.output, args.manifest, args.reconciliation
        ):
            raise SystemExit("canonical v2 generated artifacts are stale")
    else:
        result = materialize(args.source, args.output, args.manifest, args.reconciliation)
        print(json.dumps(result, ensure_ascii=False, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
