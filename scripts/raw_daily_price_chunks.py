"""Shared raw-daily chunk helpers for the existing FINPLE yfinance collectors.

This module does not call a provider.  It only converts an already-downloaded
pandas DataFrame into the existing RAW_DAILY_PRICE_COLUMNS contract and
combines non-overlapping Colab chunk files deterministically.
"""

from __future__ import annotations

import csv
import glob
import math
from pathlib import Path
from typing import Iterable, Mapping

from scripts.metrics_pipeline.schemas import RAW_DAILY_PRICE_COLUMNS, is_valid_kr_candidate_ticker


def clean(value: object) -> str:
    return str(value or "").strip()


def finite_float(value: object) -> float | None:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if math.isfinite(number) else None


def format_number(value: object) -> str:
    number = finite_float(value)
    if number is None:
        return ""
    if number == 0:
        return "0"
    return format(number, ".12g")


def history_series(data, column: str):
    """Return one yfinance field as a Series across old/new column layouts."""
    if data is None or getattr(data, "empty", True):
        return None
    try:
        series = data.get(column)
    except AttributeError:
        return None
    if series is None:
        return None
    if hasattr(series, "columns"):
        if len(series.columns) == 0:
            return None
        series = series.iloc[:, 0]
    return series


def extract_raw_daily_rows(
    data,
    *,
    market: str,
    ticker: str,
    currency: str,
    retrieved_at: str,
    source_id: str = "yfinance",
    provider_or_institution: str = "Yahoo Finance via yfinance",
) -> list[dict[str, str]]:
    """Convert one downloaded yfinance history without inventing adjustments.

    With ``auto_adjust=False``, Yahoo ``Close`` is already split-adjusted.  It
    is therefore copied directly to ``splitAdjustedClose`` for every valid
    row. ``Stock Splits`` remains corporate-action evidence only and is never
    applied to ``Close`` again. ``Adj Close`` is copied as an auxiliary total-
    return reference only when the complete valid series is positive.  The
    source/license fields remain review-only.
    """
    normalized_market = clean(market).upper()
    normalized_ticker = clean(ticker)
    if normalized_market == "KR" and not is_valid_kr_candidate_ticker(normalized_ticker):
        raise ValueError(f"invalid KR ticker identity: {normalized_ticker}")

    close = history_series(data, "Close")
    if close is None:
        return []
    adj_close = history_series(data, "Adj Close")
    volume = history_series(data, "Volume")
    dividends = history_series(data, "Dividends")
    splits = history_series(data, "Stock Splits")

    valid_indices = []
    close_by_index: dict[object, float] = {}
    for index, raw_value in close.items():
        value = finite_float(raw_value)
        if value is None or value <= 0:
            continue
        valid_indices.append(index)
        close_by_index[index] = value
    valid_indices.sort()
    if not valid_indices:
        return []

    adjusted_by_index: dict[object, float] = {}
    if adj_close is not None:
        for index in valid_indices:
            value = finite_float(adj_close.get(index))
            if value is not None and value > 0:
                adjusted_by_index[index] = value
    has_complete_adjusted_series = len(adjusted_by_index) == len(valid_indices)

    rows: list[dict[str, str]] = []
    seen_dates: set[str] = set()
    for index in valid_indices:
        timestamp = index
        if hasattr(timestamp, "tz_localize") and getattr(timestamp, "tzinfo", None) is not None:
            timestamp = timestamp.tz_localize(None)
        if hasattr(timestamp, "date"):
            date_text = timestamp.date().isoformat()
        else:
            date_text = str(timestamp)[:10]
        if date_text in seen_dates:
            raise ValueError(f"duplicate market+ticker+date in downloaded history: {normalized_market}:{normalized_ticker}:{date_text}")
        seen_dates.add(date_text)

        raw_dividend = dividends.get(index) if dividends is not None else None
        dividend_value = finite_float(raw_dividend)
        raw_split = splits.get(index) if splits is not None else None
        split_value = finite_float(raw_split)
        if split_value is None or split_value <= 0:
            split_value = 1.0
        raw_volume = volume.get(index) if volume is not None else None
        volume_value = finite_float(raw_volume)

        rows.append(
            {
                "market": normalized_market,
                "ticker": normalized_ticker,
                "date": date_text,
                "currency": currency,
                "close": format_number(close_by_index[index]),
                "splitAdjustedClose": format_number(close_by_index[index]),
                "totalReturnAdjustedClose": format_number(adjusted_by_index.get(index)) if has_complete_adjusted_series else "",
                "volume": format_number(volume_value) if volume_value is not None and volume_value >= 0 else "",
                "splitFactor": format_number(split_value),
                "cashDividend": format_number(dividend_value) if dividend_value is not None and dividend_value >= 0 else "",
                "sourceId": source_id,
                "retrievedAt": retrieved_at,
                "priceAdjustmentBasis": "split_adjusted",
                "publicationEligibility": "review_required",
                "providerOrInstitution": provider_or_institution,
                "licenseStatus": "review_required",
                "internalUseAllowed": "review_required",
                "publicationAllowed": "false",
                "redistributionAllowed": "false",
            }
        )
    return rows


def read_raw_daily_rows(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames != RAW_DAILY_PRICE_COLUMNS:
            raise ValueError(f"raw-daily header mismatch: {path}")
        return [dict(row) for row in reader]


def write_raw_daily_rows(path: Path, rows: Iterable[Mapping[str, object]]) -> dict[str, int]:
    path.parent.mkdir(parents=True, exist_ok=True)
    normalized: dict[tuple[str, str, str], dict[str, object]] = {}
    for row in rows:
        market = clean(row.get("market")).upper()
        ticker = clean(row.get("ticker"))
        if market == "KR" and not is_valid_kr_candidate_ticker(ticker):
            raise ValueError(f"invalid KR ticker identity: {ticker}")
        key = (market, ticker, clean(row.get("date")))
        if key in normalized:
            raise ValueError(f"duplicate raw-daily key: {key}")
        normalized[key] = {column: row.get(column, "") for column in RAW_DAILY_PRICE_COLUMNS}
    ordered = [normalized[key] for key in sorted(normalized)]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=RAW_DAILY_PRICE_COLUMNS)
        writer.writeheader()
        writer.writerows(ordered)
    return {
        "rowCount": len(ordered),
        "assetCount": len({(row["market"], row["ticker"]) for row in ordered}),
    }


def combine_raw_daily_chunks(pattern: str, output_path: Path, expected_market: str) -> dict[str, object]:
    """Stream non-overlapping asset chunks into one exact-schema CSV."""
    files = sorted(glob.glob(pattern))
    if not files:
        raise ValueError(f"No raw-daily chunk files found for pattern: {pattern}")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    seen_assets: set[tuple[str, str]] = set()
    row_count = 0
    first_date = ""
    last_date = ""
    with output_path.open("w", encoding="utf-8-sig", newline="") as output_handle:
        writer = csv.DictWriter(output_handle, fieldnames=RAW_DAILY_PRICE_COLUMNS)
        writer.writeheader()
        for file_name in files:
            file_assets: set[tuple[str, str]] = set()
            dates_by_asset: dict[tuple[str, str], set[str]] = {}
            buffered: list[dict[str, str]] = []
            with Path(file_name).open("r", encoding="utf-8-sig", newline="") as input_handle:
                reader = csv.DictReader(input_handle)
                if reader.fieldnames != RAW_DAILY_PRICE_COLUMNS:
                    raise ValueError(f"raw-daily header mismatch: {file_name}")
                for row in reader:
                    market = clean(row.get("market")).upper()
                    ticker = clean(row.get("ticker"))
                    if market != expected_market:
                        raise ValueError(f"unexpected market in {file_name}: {market}")
                    if market == "KR" and not is_valid_kr_candidate_ticker(ticker):
                        raise ValueError(f"KR ticker lost six-character alphanumeric identity: {ticker}")
                    identity = (market, ticker)
                    date_text = clean(row.get("date"))
                    dates = dates_by_asset.setdefault(identity, set())
                    if date_text in dates:
                        raise ValueError(f"duplicate market+ticker+date in {file_name}: {identity}:{date_text}")
                    dates.add(date_text)
                    file_assets.add(identity)
                    buffered.append({column: row.get(column, "") for column in RAW_DAILY_PRICE_COLUMNS})
            overlap = seen_assets.intersection(file_assets)
            if overlap:
                raise ValueError(f"asset appears in multiple raw chunks: {sorted(overlap)[:5]}")
            seen_assets.update(file_assets)
            for row in sorted(buffered, key=lambda item: (item["market"], item["ticker"], item["date"])):
                writer.writerow(row)
                row_count += 1
                date_text = row["date"]
                first_date = date_text if not first_date or date_text < first_date else first_date
                last_date = date_text if not last_date or date_text > last_date else last_date

    return {
        "rawChunkFiles": len(files),
        "rawDailyRowCount": row_count,
        "rawDailyAssetCount": len(seen_assets),
        "rawDailyFirstDate": first_date,
        "rawDailyLastDate": last_date,
        "rawDailyFile": str(output_path),
    }
