import csv
import json
import os
import re
import time
from datetime import date
from io import StringIO
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy.orm import Session

import bonds_math
from ai import client as ai_client
from ai import facts as ai_facts
from ai import prompts as ai_prompts
from ai.schemas import ChatRequest, ChatResponse, ReportRequest, ReportResponse
from database import get_db, init_db
import models
from schemas import BondCreate, BondResponse, TradeCreate, TradeResponse, WatchCreate, WatchResponse

# Load .env from backend/ so it works when uvicorn is run from project root too
load_dotenv(Path(__file__).resolve().parent / ".env")
app = FastAPI(title="BondScope API")

# --- AI rate limit: 20 req/min per process (shared across /ai/report and /ai/chat) ---
_ai_request_times: list[float] = []
AI_RATE_LIMIT_PER_MIN = 20


def _ai_rate_limit_check() -> None:
    now = time.monotonic()
    cutoff = now - 60.0
    _ai_request_times[:] = [t for t in _ai_request_times if t > cutoff]
    if len(_ai_request_times) >= AI_RATE_LIMIT_PER_MIN:
        raise HTTPException(status_code=429, detail="Rate limited")
    _ai_request_times.append(now)


def _parse_ai_json(raw: str) -> dict:
    """Strip markdown code fence if present and parse JSON."""
    s = raw.strip()
    m = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", s)
    if m:
        s = m.group(1).strip()
    return json.loads(s)


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


@app.get("/bonds/{bond_id}/metrics")
def get_bond_metrics(bond_id: int, db: Session = Depends(get_db)):
    bond = db.get(models.Bond, bond_id)
    if not bond:
        raise HTTPException(status_code=404, detail="Bond not found")
    settlement = date.today()
    ytm = bonds_math.ytm_from_price_bisection(
        bond.price, bond.face, bond.coupon_rate, bond.coupon_freq,
        bond.maturity_date, settlement,
    )
    cy = bonds_math.current_yield(bond.face, bond.coupon_rate, bond.price)
    mac = bonds_math.macaulay_duration(
        bond.face, bond.coupon_rate, bond.coupon_freq,
        bond.maturity_date, settlement, ytm,
    )
    mod_dur = bonds_math.modified_duration(mac, ytm)
    cf = bonds_math.cashflows(
        bond.face, bond.coupon_rate, bond.coupon_freq,
        bond.maturity_date, settlement,
    )
    cashflows_list = [{"date": d.isoformat(), "amount": round(a, 2)} for d, a in cf]
    return {
        "ytm": round(ytm, 6),
        "current_yield": round(cy, 6),
        "duration": round(mod_dur, 6),
        "cashflows": cashflows_list,
    }


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


# --- AI (Mistral) ---


def _mistral_key() -> str | None:
    key = os.getenv("MISTRAL_API_KEY")
    return key.strip() if key else None


@app.post("/ai/report", response_model=ReportResponse)
def ai_report(body: ReportRequest, db: Session = Depends(get_db)):
    if not _mistral_key():
        raise HTTPException(status_code=501, detail="AI disabled: set MISTRAL_API_KEY")
    _ai_rate_limit_check()
    facts = ai_facts.get_facts(db)
    model = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
    user_content = (
        f"Facts (JSON):\n{json.dumps(facts, default=str)}\n\n"
        f"Disclaimer to include verbatim: {ai_prompts.DISCLAIMER}\n\n"
        f"Optional timeframe: {body.timeframe or 'none'}"
    )
    messages = [
        {"role": "system", "content": ai_prompts.SYSTEM_PROMPT + "\n\n" + ai_prompts.REPORT_INSTRUCTIONS},
        {"role": "user", "content": user_content},
    ]
    try:
        raw = ai_client.mistral_chat(messages, model, api_key=_mistral_key())
    except ValueError as e:
        msg = str(e)
        if "MISTRAL_API_KEY" in msg:
            raise HTTPException(status_code=401, detail=msg)
        if "Rate limited" in msg:
            raise HTTPException(status_code=429, detail=msg)
        raise HTTPException(status_code=503, detail=msg)
    try:
        data = _parse_ai_json(raw)
        return ReportResponse(
            summary_md=data.get("summary_md", "No data available for a report."),
            bullets=data.get("bullets", []) or [],
            risks=data.get("risks", []) or [],
            questions_to_check=data.get("questions_to_check", []) or [],
            disclaimer=data.get("disclaimer", ai_prompts.DISCLAIMER),
        )
    except (json.JSONDecodeError, KeyError, TypeError):
        raise HTTPException(status_code=502, detail="AI returned invalid format")


@app.post("/ai/chat", response_model=ChatResponse)
def ai_chat(body: ChatRequest, db: Session = Depends(get_db)):
    if not _mistral_key():
        raise HTTPException(status_code=501, detail="AI disabled: set MISTRAL_API_KEY")
    _ai_rate_limit_check()
    facts = ai_facts.get_facts(db)
    model = os.getenv("MISTRAL_MODEL", "mistral-large-latest")
    user_content = (
        f"Facts (JSON):\n{json.dumps(facts, default=str)}\n\n"
        f"Disclaimer to include verbatim: {ai_prompts.DISCLAIMER}\n\n"
        f"User question: {body.message}"
    )
    messages = [
        {"role": "system", "content": ai_prompts.SYSTEM_PROMPT + "\n\n" + ai_prompts.CHAT_INSTRUCTIONS},
        {"role": "user", "content": user_content},
    ]
    try:
        raw = ai_client.mistral_chat(messages, model, api_key=_mistral_key())
    except ValueError as e:
        msg = str(e)
        if "MISTRAL_API_KEY" in msg:
            raise HTTPException(status_code=401, detail=msg)
        if "Rate limited" in msg:
            raise HTTPException(status_code=429, detail=msg)
        raise HTTPException(status_code=503, detail=msg)
    try:
        data = _parse_ai_json(raw)
        return ChatResponse(
            answer_md=data.get("answer_md", "No data available."),
            disclaimer=data.get("disclaimer", ai_prompts.DISCLAIMER),
        )
    except (json.JSONDecodeError, KeyError, TypeError):
        raise HTTPException(status_code=502, detail="AI returned invalid format")
