"""
Tests for ai.facts.get_facts: structure and content.
"""
from datetime import date

import pytest
from ai import facts as ai_facts
from sqlalchemy.orm import Session

import models


def test_facts_empty(db_session: Session) -> None:
    result = ai_facts.get_facts(db_session)
    assert "portfolio" in result
    assert "bonds" in result
    assert "watchlist" in result
    assert result["portfolio"]["trades_count"] == 0
    assert result["portfolio"]["unique_tickers"] == 0
    assert result["portfolio"]["total_value"] == 0
    assert result["bonds"]["count"] == 0
    assert result["watchlist"]["count"] == 0
    assert result["portfolio"]["top_positions"] == []


def test_facts_with_trades(db_session: Session) -> None:
    db_session.add(
        models.Trade(ticker="AAPL.US", quantity=10, buy_price=150.0, buy_date=date(2024, 1, 1))
    )
    db_session.add(
        models.Trade(ticker="AAPL.US", quantity=5, buy_price=160.0, buy_date=date(2024, 2, 1))
    )
    db_session.commit()
    result = ai_facts.get_facts(db_session)
    assert result["portfolio"]["trades_count"] == 2
    assert result["portfolio"]["unique_tickers"] == 1
    assert result["portfolio"]["total_value"] == 10 * 150 + 5 * 160
    assert len(result["portfolio"]["top_positions"]) == 1
    assert result["portfolio"]["top_positions"][0]["name"] == "AAPL.US"


def test_facts_with_bonds(db_session: Session) -> None:
    db_session.add(
        models.Bond(
            name="B1",
            face=1000,
            coupon_rate=0.05,
            coupon_freq=2,
            price=98,
            maturity_date=date(2029, 12, 31),
        )
    )
    db_session.commit()
    result = ai_facts.get_facts(db_session)
    assert result["bonds"]["count"] == 1
    assert result["portfolio"]["allocation"]["bonds_value"] == 98
    assert result["bonds"]["avg_ytm"] is not None
    assert result["bonds"]["avg_duration"] is not None
    assert result["bonds"]["max_duration_bond"] is not None
    assert result["bonds"]["max_duration_bond"]["name"] == "B1"


def test_facts_with_watchlist(db_session: Session) -> None:
    for t in ["A.US", "B.US", "C.US"]:
        db_session.add(models.Watch(ticker=t))
    db_session.commit()
    result = ai_facts.get_facts(db_session)
    assert result["watchlist"]["count"] == 3
    assert set(result["watchlist"]["sample_tickers"]) == {"A.US", "B.US", "C.US"}
