import csv
import time
from io import StringIO

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db, init_db
import models
from schemas import BondCreate, BondResponse, TradeCreate, TradeResponse, WatchCreate, WatchResponse

app = FastAPI(title="BondScope API")


@app.on_event("startup")
def startup():
    init_db()

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


# --- Trades ---


@app.get("/trades", response_model=list[TradeResponse])
def list_trades(db: Session = Depends(get_db)):
    return db.query(models.Trade).all()


@app.post("/trades", response_model=TradeResponse)
def create_trade(body: TradeCreate, db: Session = Depends(get_db)):
    trade = models.Trade(
        ticker=body.ticker,
        quantity=body.quantity,
        buy_price=body.buy_price,
        buy_date=body.buy_date,
    )
    db.add(trade)
    db.commit()
    db.refresh(trade)
    return trade


@app.delete("/trades/{trade_id}")
def delete_trade(trade_id: int, db: Session = Depends(get_db)):
    trade = db.get(models.Trade, trade_id)
    if not trade:
        raise HTTPException(status_code=404, detail="Trade not found")
    db.delete(trade)
    db.commit()
    return {"ok": True}


# --- Bonds ---


@app.get("/bonds", response_model=list[BondResponse])
def list_bonds(db: Session = Depends(get_db)):
    return db.query(models.Bond).all()


@app.post("/bonds", response_model=BondResponse)
def create_bond(body: BondCreate, db: Session = Depends(get_db)):
    bond = models.Bond(
        name=body.name,
        face=body.face,
        coupon_rate=body.coupon_rate,
        coupon_freq=body.coupon_freq,
        price=body.price,
        maturity_date=body.maturity_date,
    )
    db.add(bond)
    db.commit()
    db.refresh(bond)
    return bond


@app.delete("/bonds/{bond_id}")
def delete_bond(bond_id: int, db: Session = Depends(get_db)):
    bond = db.get(models.Bond, bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")
    db.delete(bond)
    db.commit()
    return {"ok": True}


# --- Watchlist ---


@app.get("/watchlist", response_model=list[WatchResponse])
def list_watchlist(db: Session = Depends(get_db)):
    return db.query(models.Watch).all()


@app.post("/watchlist", response_model=WatchResponse)
def create_watch(body: WatchCreate, db: Session = Depends(get_db)):
    watch = models.Watch(ticker=body.ticker)
    db.add(watch)
    db.commit()
    db.refresh(watch)
    return watch


@app.delete("/watchlist/{watch_id}")
def delete_watch(watch_id: int, db: Session = Depends(get_db)):
    watch = db.get(models.Watch, watch_id)
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not found")
    db.delete(watch)
    db.commit()
    return {"ok": True}
