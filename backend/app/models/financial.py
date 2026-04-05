from pydantic import BaseModel


class FinancialRecord(BaseModel):
    disc_date: str
    doc_type: str
    period_start: str
    period_end: str
    # Income statement (actual)
    sales: float | None
    operating_profit: float | None
    ordinary_profit: float | None
    net_profit: float | None
    eps: float | None
    # Balance sheet
    total_assets: float | None
    equity: float | None
    bps: float | None
    # Cash flow
    cfo: float | None
    cfi: float | None
    cff: float | None
    cash_eq: float | None
    # Dividends
    div_annual: float | None
    # Forecasts (current FY)
    f_sales: float | None
    f_operating_profit: float | None
    f_net_profit: float | None
    f_eps: float | None


class FinancialResponse(BaseModel):
    code: str
    records: list[FinancialRecord]


class CompareBar(BaseModel):
    date: str
    values: dict[str, float | None]


class CompareResponse(BaseModel):
    codes: list[str]
    bars: list[CompareBar]
    normalized: bool
