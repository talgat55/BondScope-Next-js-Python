from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TradeBase(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=32)
    quantity: float = Field(..., gt=0)
    buy_price: float = Field(..., gt=0)
    buy_date: date


class TradeCreate(TradeBase):
    pass


class TradeResponse(TradeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class BondBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=256)
    face: float = Field(..., gt=0)
    coupon_rate: float = Field(..., ge=0, le=1)
    coupon_freq: int = Field(..., ge=1, le=12)
    price: float = Field(..., gt=0)
    maturity_date: date

    @field_validator("coupon_freq")
    @classmethod
    def coupon_freq_allowed(cls, v: int) -> int:
        if v not in (1, 2, 4, 12):
            raise ValueError("coupon_freq must be 1, 2, 4, or 12")
        return v


class BondCreate(BondBase):
    pass


class BondResponse(BondBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class WatchBase(BaseModel):
    ticker: str = Field(..., min_length=1, max_length=32)


class WatchCreate(WatchBase):
    pass


class WatchResponse(WatchBase):
    id: int
    model_config = ConfigDict(from_attributes=True)
