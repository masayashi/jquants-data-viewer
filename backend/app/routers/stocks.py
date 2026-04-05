import re
from typing import Annotated

import duckdb
from fastapi import APIRouter, Depends, HTTPException, Path, Query

from app.config import settings
from app.db.connection import get_db
from app.models.stock import OhlcBar, StockMaster, TimeseriesResponse

router = APIRouter(prefix="/stocks", tags=["stocks"])

_CODE_RE = re.compile(r"^[A-Z0-9]{4,5}$")
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _validate_code(code: str) -> str:
    if not _CODE_RE.match(code):
        raise HTTPException(status_code=400, detail=f"Invalid code: {code!r}")
    return code


def _validate_date(date: str, name: str) -> str:
    if not _DATE_RE.match(date):
        raise HTTPException(status_code=400, detail=f"Invalid date for {name}: {date!r}")
    return date


@router.get("", response_model=list[StockMaster])
def list_stocks(
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)],
) -> list[StockMaster]:
    """銘柄マスタ一覧（ETF等を除く）。"""
    path = str(settings.data_root / "metadata" / "all_equities.parquet")
    rows = db.execute(
        f"""
        SELECT DISTINCT Code, CoName, CoNameEn, S17, S17Nm, S33, S33Nm, Mkt, MktNm, ScaleCat
        FROM read_parquet('{path}')
        ORDER BY Code
        """
    ).fetchall()
    return [
        StockMaster(
            code=r[0],
            name=r[1] or "",
            name_en=r[2] or "",
            sector17_code=r[3] or "",
            sector17_name=r[4] or "",
            sector33_code=r[5] or "",
            sector33_name=r[6] or "",
            market_code=r[7] or "",
            market_name=r[8] or "",
            scale_cat=r[9] or "",
        )
        for r in rows
    ]


@router.get("/{code}/timeseries", response_model=TimeseriesResponse)
def get_timeseries(
    code: Annotated[str, Path(description="銘柄コード (例: 13010)")],
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)],
    start: str = Query("2020-01-01", description="開始日 YYYY-MM-DD"),
    end: str = Query("2099-12-31", description="終了日 YYYY-MM-DD"),
) -> TimeseriesResponse:
    """銘柄の OHLCV 時系列（修正後価格含む）。"""
    _validate_code(code)
    _validate_date(start, "start")
    _validate_date(end, "end")

    glob = str(settings.data_root / "equity_bars" / code / "*.parquet")
    rows = db.execute(
        f"""
        SELECT Date, O, H, L, C, Vo, Va, AdjO, AdjH, AdjL, AdjC, AdjVo
        FROM read_parquet('{glob}')
        WHERE Date >= ? AND Date <= ?
        ORDER BY Date
        """,
        [start, end],
    ).fetchall()

    bars = [
        OhlcBar(
            date=r[0],
            open=r[1] or 0.0,
            high=r[2] or 0.0,
            low=r[3] or 0.0,
            close=r[4] or 0.0,
            volume=r[5] or 0.0,
            value=r[6] or 0.0,
            adj_open=r[7] or 0.0,
            adj_high=r[8] or 0.0,
            adj_low=r[9] or 0.0,
            adj_close=r[10] or 0.0,
            adj_volume=r[11] or 0.0,
        )
        for r in rows
    ]
    return TimeseriesResponse(code=code, bars=bars)
