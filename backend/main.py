import csv
import time
from io import StringIO

import httpx
from fastapi import FastAPI, Query, HTTPException

app = FastAPI(title="BondScope API")

# In-memory cache: ticker -> (price, timestamp); TTL 60 seconds
_price_cache: dict[str, tuple[float, float]] = {}
CACHE_TTL_SEC = 60


def _stooq_url(ticker: str) -> str:
    return f"https://stooq.com/q/d/l/?s={ticker}&i=d"


def _fetch_price_from_stooq(ticker: str) -> float | None:
    url = _stooq_url(ticker)
    try:
        with httpx.Client(follow_redirects=True, timeout=10.0) as client:
            resp = client.get(url)
            resp.raise_for_status()
    except httpx.HTTPError:
        return None
    text = resp.text.strip()
    if not text:
        return None
    lines = text.splitlines()
    if len(lines) < 2:
        return None
    # First data line (after header) is most recent
    reader = csv.DictReader(StringIO(text))
    row = next(reader, None)
    if not row:
        return None
    close_str = row.get("Close") or row.get("close")
    if close_str is None:
        return None
    try:
        return float(close_str)
    except (ValueError, TypeError):
        return None


@app.get("/health")
def health():
    return {"ok": True}


@app.get("/prices")
def get_price(ticker: str = Query(..., min_length=1)):
    ticker = ticker.strip().upper()
    if not ticker:
        raise HTTPException(status_code=400, detail="Missing or empty ticker")
    now = time.monotonic()
    if ticker in _price_cache:
        price, cached_at = _price_cache[ticker]
        if now - cached_at < CACHE_TTL_SEC:
            return {"ticker": ticker, "price": price, "cached": True}
    price = _fetch_price_from_stooq(ticker)
    if price is None:
        raise HTTPException(
            status_code=404,
            detail=f"No price data for ticker '{ticker}'. Check symbol (e.g. AAPL.US, MSFT.US).",
        )
    _price_cache[ticker] = (price, now)
    return {"ticker": ticker, "price": price, "cached": False}
