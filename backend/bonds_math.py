"""
Bond metrics: cashflows, YTM (bisection), current yield, duration (ACT/365).
"""
from datetime import date, timedelta
from typing import TypedDict


def _last_day_of_month(y: int, m: int) -> date:
    if m == 12:
        return date(y, 12, 31)
    return date(y, m + 1, 1).replace(day=1) - timedelta(days=1)


def _add_months(d: date, delta_months: int) -> date:
    y, m, day = d.year, d.month, d.day
    m += delta_months
    while m > 12:
        m -= 12
        y += 1
    while m < 1:
        m += 12
        y -= 1
    last = _last_day_of_month(y, m).day
    return date(y, m, min(day, last))


def cashflows(
    face: float,
    coupon_rate: float,
    coupon_freq: int,
    maturity_date: date,
    settlement_date: date,
) -> list[tuple[date, float]]:
    """List of (date, amount) from settlement to maturity. ACT/365 used for time."""
    if maturity_date <= settlement_date:
        return []
    period_months = 12 // coupon_freq
    period_coupon = face * coupon_rate / coupon_freq
    # Coupon dates from maturity backwards until before settlement
    coupon_dates: list[date] = []
    d = maturity_date
    while d >= settlement_date:
        coupon_dates.append(d)
        d = _add_months(d, -period_months)
    coupon_dates.sort()
    result: list[tuple[date, float]] = []
    for d in coupon_dates:
        amount = period_coupon + (face if d == maturity_date else 0.0)
        result.append((d, amount))
    return result


def ytm_from_price_bisection(
    price: float,
    face: float,
    coupon_rate: float,
    coupon_freq: int,
    maturity_date: date,
    settlement_date: date,
    tol: float = 1e-8,
) -> float:
    """Annual YTM (decimal) by bisection; discounting with (1+y)^t, t = ACT/365 years."""
    cf = cashflows(face, coupon_rate, coupon_freq, maturity_date, settlement_date)
    if not cf:
        return 0.0

    def pv(y: float) -> float:
        return sum(
            amount / (1.0 + y) ** ((d - settlement_date).days / 365.0)
            for d, amount in cf
        )

    lo, hi = 0.0, 1.0
    while hi - lo > tol:
        mid = (lo + hi) / 2.0
        if pv(mid) > price:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2.0


def current_yield(face: float, coupon_rate: float, price: float) -> float:
    """Annual coupon / price (decimal)."""
    if price <= 0:
        return 0.0
    return (face * coupon_rate) / price


def _years_act365(d: date, settlement: date) -> float:
    return (d - settlement).days / 365.0


def macaulay_duration(
    face: float,
    coupon_rate: float,
    coupon_freq: int,
    maturity_date: date,
    settlement_date: date,
    ytm: float,
) -> float:
    """Macaulay duration in years (ACT/365), PV-weighted time to cashflows."""
    cf = cashflows(face, coupon_rate, coupon_freq, maturity_date, settlement_date)
    if not cf:
        return 0.0
    pvs = [
        (amount / (1.0 + ytm) ** _years_act365(d, settlement_date), _years_act365(d, settlement_date), amount)
        for d, amount in cf
    ]
    total_pv = sum(p for p, _, _ in pvs)
    if total_pv <= 0:
        return 0.0
    return sum(p * t for p, t, _ in pvs) / total_pv


def modified_duration(macaulay: float, ytm: float) -> float:
    """Modified duration = Macaulay / (1 + ytm)."""
    return macaulay / (1.0 + ytm) if (1.0 + ytm) != 0 else 0.0


# --- Response shape for /bonds/{id}/metrics ---


class BondMetricsResponse(TypedDict):
    ytm: float
    current_yield: float
    duration: float  # modified duration
    cashflows: list[dict]  # [{"date": "YYYY-MM-DD", "amount": float}, ...]
