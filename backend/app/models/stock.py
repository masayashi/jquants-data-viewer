from pydantic import BaseModel


class StockMaster(BaseModel):
    code: str
    name: str
    name_en: str
    sector17_code: str
    sector17_name: str
    sector33_code: str
    sector33_name: str
    market_code: str
    market_name: str
    scale_cat: str


class OhlcBar(BaseModel):
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: float
    value: float
    adj_open: float
    adj_high: float
    adj_low: float
    adj_close: float
    adj_volume: float


class TimeseriesResponse(BaseModel):
    code: str
    bars: list[OhlcBar]
