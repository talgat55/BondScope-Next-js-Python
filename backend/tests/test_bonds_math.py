"""
Unit tests for bonds_math: cashflows, ytm, current_yield, duration.
"""
from datetime import date

import pytest
import bonds_math


def test_cashflows_empty_when_maturity_before_settlement() -> None:
    settlement = date(2025, 6, 1)
    maturity = date(2025, 1, 1)
    cf = bonds_math.cashflows(1000.0, 0.05, 2, maturity, settlement)
    assert cf == []


def test_cashflows_one_bullet() -> None:
    """Settlement just before maturity: at most a few cashflows; last is coupon + face."""
    settlement = date(2024, 1, 1)
    maturity = date(2024, 7, 1)
    cf = bonds_math.cashflows(1000.0, 0.05, 2, maturity, settlement)
    assert len(cf) >= 1
    assert cf[-1][0] == maturity
    assert cf[-1][1] == 1000.0 * 0.05 / 2 + 1000.0  # period coupon + face at maturity


def test_cashflows_semiannual() -> None:
    settlement = date(2024, 1, 1)
    maturity = date(2025, 12, 31)
    cf = bonds_math.cashflows(1000.0, 0.06, 2, maturity, settlement)
    assert len(cf) >= 2
    dates = [d for d, _ in cf]
    assert maturity in dates
    assert all(d >= settlement for d in dates)
    period_coupon = 1000.0 * 0.06 / 2
    for d, amount in cf:
        if d == maturity:
            assert amount == period_coupon + 1000.0
        else:
            assert amount == period_coupon


def test_ytm_zero_coupon() -> None:
    """Price below face -> positive ytm."""
    settlement = date(2024, 1, 1)
    maturity = date(2025, 1, 1)
    price = 950.0
    face = 1000.0
    ytm = bonds_math.ytm_from_price_bisection(
        price, face, 0.0, 1, maturity, settlement
    )
    assert ytm > 0
    # Rough: 950 * (1+y) = 1000 => y ~ 0.0526
    assert 0.04 < ytm < 0.07


def test_ytm_at_par() -> None:
    """Price = face, coupon = 0 -> ytm = 0."""
    settlement = date(2024, 1, 1)
    maturity = date(2025, 6, 1)
    ytm = bonds_math.ytm_from_price_bisection(
        1000.0, 1000.0, 0.0, 1, maturity, settlement
    )
    assert abs(ytm) < 1e-5


def test_current_yield() -> None:
    # 5% coupon on 1000 face, price 980 -> annual coupon 50, cy = 50/980
    cy = bonds_math.current_yield(1000.0, 0.05, 980.0)
    assert abs(cy - 50.0 / 980.0) < 1e-6


def test_current_yield_zero_price() -> None:
    assert bonds_math.current_yield(1000.0, 0.05, 0.0) == 0.0


def test_macaulay_duration_positive() -> None:
    settlement = date(2024, 1, 1)
    maturity = date(2026, 12, 31)
    ytm = 0.05
    mac = bonds_math.macaulay_duration(
        1000.0, 0.05, 2, maturity, settlement, ytm
    )
    assert mac > 0
    assert mac < 5.0  # less than 3 years to maturity in this example


def test_modified_duration() -> None:
    mod = bonds_math.modified_duration(2.5, 0.05)
    assert abs(mod - 2.5 / 1.05) < 1e-6
