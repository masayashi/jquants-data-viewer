import re
from typing import Annotated

import duckdb
from fastapi import APIRouter, Depends, HTTPException, Path, Query

from app.config import settings
from app.db.connection import get_db
from app.models.financial import FinancialRecord, FinancialResponse

router = APIRouter(prefix="/stocks", tags=["financials"])

_CODE_RE = re.compile(r"^[A-Z0-9]{4,5}$")


def _validate_code(code: str) -> str:
    if not _CODE_RE.match(code):
        raise HTTPException(status_code=400, detail=f"Invalid code: {code!r}")
    return code


def _f(val: object) -> float | None:
    """文字列または数値を float に変換。変換不能な場合は None を返す。"""
    if val is None or val == "":
        return None
    try:
        return float(val)  # type: ignore[arg-type]
    except (ValueError, TypeError):
        return None


@router.get("/{code}/financials", response_model=FinancialResponse)
def get_financials(
    code: Annotated[str, Path(description="銘柄コード (例: 13010)")],
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)],
    doc_type: str | None = Query(None, description="開示区分でフィルタ (例: 1Q, 2Q, FY)"),
) -> FinancialResponse:
    """銘柄の財務データ（PL/BS/CF・配当・予想）。

    Financial Parquet の数値カラムはすべて文字列型のため、
    このレイヤーで float への変換を行う（ADR-0001 参照）。
    """
    _validate_code(code)

    glob = str(settings.data_root / "financial" / code / "*.parquet")
    where_extra = f"AND DocType = '{doc_type}'" if doc_type else ""

    rows = db.execute(
        f"""
        SELECT
            CAST(DiscDate AS VARCHAR) AS DiscDate,
            DocType, CurPerSt, CurPerEn,
            Sales, OP, OdP, NP, EPS,
            TA, Eq, BPS,
            CFO, CFI, CFF, CashEq,
            DivAnn,
            FSales, FOP, FNP, FEPS
        FROM read_parquet('{glob}')
        WHERE 1=1 {where_extra}
        ORDER BY DiscDate DESC
        """
    ).fetchall()

    records = [
        FinancialRecord(
            disc_date=r[0] or "",
            doc_type=r[1] or "",
            period_start=r[2] or "",
            period_end=r[3] or "",
            sales=_f(r[4]),
            operating_profit=_f(r[5]),
            ordinary_profit=_f(r[6]),
            net_profit=_f(r[7]),
            eps=_f(r[8]),
            total_assets=_f(r[9]),
            equity=_f(r[10]),
            bps=_f(r[11]),
            cfo=_f(r[12]),
            cfi=_f(r[13]),
            cff=_f(r[14]),
            cash_eq=_f(r[15]),
            div_annual=_f(r[16]),
            f_sales=_f(r[17]),
            f_operating_profit=_f(r[18]),
            f_net_profit=_f(r[19]),
            f_eps=_f(r[20]),
        )
        for r in rows
    ]
    return FinancialResponse(code=code, records=records)
