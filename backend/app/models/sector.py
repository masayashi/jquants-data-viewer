from pydantic import BaseModel


class SectorInfo(BaseModel):
    code: str
    name: str
    classification: str  # "s17" | "s33"


class SectorBar(BaseModel):
    date: str
    total_value: float
    avg_return: float
    symbol_count: int


class SectorAggregateResponse(BaseModel):
    sector_code: str
    sector_name: str
    classification: str
    bars: list[SectorBar]
