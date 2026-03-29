"""
Static list of bonds available on the market (for analysis).
Each bond can have an optional Stooq ticker for current price; otherwise price is assumed 100 for metrics.
"""
from typing import Literal, TypedDict

MarketBondSource = Literal["rf", "intl"]


class MarketBondDef(TypedDict):
    name: str
    source: MarketBondSource  # rf = Russia-focused examples; intl = non-RU sovereigns / corps
    ticker: str | None  # Stooq symbol for price; None = use 100
    face: float
    coupon_rate: float
    coupon_freq: int
    maturity_date: str  # YYYY-MM-DD


# Example market bonds: government and corporate, various maturities.
# Tickers from Stooq where available (e.g. bond ETFs as proxy); else None → price 100.
MARKET_BONDS: list[MarketBondDef] = [
    {
        "name": "US Treasury 2Y",
        "source": "intl",
        "ticker": None,
        "face": 100.0,
        "coupon_rate": 0.045,
        "coupon_freq": 2,
        "maturity_date": "2027-03-15",
    },
    {
        "name": "US Treasury 5Y",
        "source": "intl",
        "ticker": None,
        "face": 100.0,
        "coupon_rate": 0.0425,
        "coupon_freq": 2,
        "maturity_date": "2030-02-15",
    },
    {
        "name": "US Treasury 10Y",
        "source": "intl",
        "ticker": None,
        "face": 100.0,
        "coupon_rate": 0.04,
        "coupon_freq": 2,
        "maturity_date": "2035-02-15",
    },
    {
        "name": "OFZ 26234",
        "source": "rf",
        "ticker": None,
        "face": 1000.0,
        "coupon_rate": 0.0825,
        "coupon_freq": 2,
        "maturity_date": "2031-02-03",
    },
    {
        "name": "OFZ 26235",
        "source": "rf",
        "ticker": None,
        "face": 1000.0,
        "coupon_rate": 0.085,
        "coupon_freq": 2,
        "maturity_date": "2032-05-19",
    },
    {
        "name": "OFZ 26236",
        "source": "rf",
        "ticker": None,
        "face": 1000.0,
        "coupon_rate": 0.0875,
        "coupon_freq": 2,
        "maturity_date": "2033-08-18",
    },
    {
        "name": "Germany Bund 10Y",
        "source": "intl",
        "ticker": None,
        "face": 100.0,
        "coupon_rate": 0.025,
        "coupon_freq": 1,
        "maturity_date": "2034-08-15",
    },
    {
        "name": "UK Gilt 10Y",
        "source": "intl",
        "ticker": None,
        "face": 100.0,
        "coupon_rate": 0.04,
        "coupon_freq": 2,
        "maturity_date": "2033-09-07",
    },
    {
        "name": "Corporate AAA 5Y",
        "source": "intl",
        "ticker": None,
        "face": 100.0,
        "coupon_rate": 0.0525,
        "coupon_freq": 2,
        "maturity_date": "2030-06-15",
    },
    {
        "name": "Corporate BBB 7Y",
        "source": "intl",
        "ticker": None,
        "face": 100.0,
        "coupon_rate": 0.065,
        "coupon_freq": 2,
        "maturity_date": "2032-12-01",
    },
]


def get_market_bonds_list(source: MarketBondSource) -> list[MarketBondDef]:
    return [b for b in MARKET_BONDS if b["source"] == source]
