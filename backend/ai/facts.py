"""
RAG-lite: collect compact facts from DB for AI context (portfolio, bonds, watchlist).
"""
from datetime import date
from typing import Any

from sqlalchemy.orm import Session

import bonds_math
import models


def get_facts(db: Session) -> dict[str, Any]:
    """Build a compact facts dict for prompts. No large tables."""
    settlement = date.today()
    facts: dict[str, Any] = {
        "portfolio": {},
        "bonds": {},
        "watchlist": {},
    }

    # --- Portfolio: trades aggregation ---
    trades = db.query(models.Trade).all()
    by_ticker: dict[str, list[tuple[float, float]]] = {}
    for t in trades:
        if t.ticker not in by_ticker:
            by_ticker[t.ticker] = []
        by_ticker[t.ticker].append((t.quantity, t.buy_price))
    total_stocks_cost = 0.0
    top_stocks: list[dict[str, Any]] = []
    for ticker, pairs in by_ticker.items():
        total_qty = sum(q for q, _ in pairs)
        cost = sum(q * p for q, p in pairs)
        total_stocks_cost += cost
        top_stocks.append({"name": ticker, "value": cost})
    top_stocks.sort(key=lambda x: x["value"], reverse=True)
    facts["portfolio"] = {
        "total_value": total_stocks_cost,  # will add bonds below
        "allocation": {"stocks_cost": total_stocks_cost, "bonds_value": 0.0},
        "top_positions": [{"name": p["name"], "value": round(p["value"], 2)} for p in top_stocks[:5]],
        "trades_count": len(trades),
        "unique_tickers": len(by_ticker),
    }

    # --- Bonds ---
    bonds = db.query(models.Bond).all()
    bonds_value = sum(b.price for b in bonds)
    facts["portfolio"]["total_value"] = total_stocks_cost + bonds_value
    facts["portfolio"]["allocation"]["bonds_value"] = bonds_value

    ytms: list[float] = []
    durations: list[float] = []
    max_dur_name: str | None = None
    max_dur_val: float = 0.0
    for b in bonds:
        ytm = bonds_math.ytm_from_price_bisection(
            b.price, b.face, b.coupon_rate, b.coupon_freq,
            b.maturity_date, settlement,
        )
        mac = bonds_math.macaulay_duration(
            b.face, b.coupon_rate, b.coupon_freq,
            b.maturity_date, settlement, ytm,
        )
        mod_dur = bonds_math.modified_duration(mac, ytm)
        ytms.append(ytm)
        durations.append(mod_dur)
        if mod_dur > max_dur_val:
            max_dur_val = mod_dur
            max_dur_name = b.name
    avg_ytm = sum(ytms) / len(ytms) if ytms else None
    avg_duration = sum(durations) / len(durations) if durations else None
    facts["bonds"] = {
        "count": len(bonds),
        "avg_ytm": round(avg_ytm, 4) if avg_ytm is not None else None,
        "avg_duration": round(avg_duration, 4) if avg_duration is not None else None,
        "max_duration_bond": {"name": max_dur_name, "duration": round(max_dur_val, 4)} if max_dur_name is not None else None,
    }

    # --- Watchlist ---
    watch = db.query(models.Watch).all()
    tickers = [w.ticker for w in watch]
    facts["watchlist"] = {
        "count": len(watch),
        "sample_tickers": tickers[:10],
    }

    # Top positions: merge stocks (by cost) and bonds (by price), sort, take 5
    combined: list[dict[str, Any]] = []
    for p in top_stocks[:5]:
        combined.append({"name": p["name"], "value": round(p["value"], 2)})
    for b in bonds:
        combined.append({"name": b.name, "value": round(b.price, 2)})
    combined.sort(key=lambda x: x["value"], reverse=True)
    facts["portfolio"]["top_positions"] = combined[:5]

    return facts
