from datetime import date

from pydantic import BaseModel, ConfigDict


class TradeBase(BaseModel):
    ticker: str
    quantity: float
    buy_price: float
    buy_date: date


class TradeCreate(TradeBase):
    pass


class TradeResponse(TradeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class BondBase(BaseModel):
    name: str
    face: float
    coupon_rate: float
    coupon_freq: int
    price: float
    maturity_date: date


class BondCreate(BondBase):
    pass


class BondResponse(BondBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class WatchBase(BaseModel):
    ticker: str


class WatchCreate(WatchBase):
    pass


class WatchResponse(WatchBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
