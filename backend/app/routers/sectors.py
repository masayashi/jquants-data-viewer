import re
from typing import Annotated, Literal

import duckdb
from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.db.connection import get_db
from app.models.sector import SectorAggregateResponse, SectorBar, SectorInfo

router = APIRouter(prefix="/sectors", tags=["sectors"])

_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _validate_date(date: str, name: str) -> str:
    if not _DATE_RE.match(date):
        raise HTTPException(status_code=400, detail=f"Invalid date for {name}: {date!r}")
    return date


@router.get("", response_model=list[SectorInfo])
def list_sectors(
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)],
    classification: Literal["s17", "s33"] = Query("s17", description="業種分類"),
) -> list[SectorInfo]:
    """業種一覧（S17: 17業種 / S33: 33業種）。"""
    path = str(settings.data_root / "metadata" / "all_equities.parquet")
    code_col, name_col = ("S17", "S17Nm") if classification == "s17" else ("S33", "S33Nm")
    rows = db.execute(
        f"""
        SELECT DISTINCT {code_col}, {name_col}
        FROM read_parquet('{path}')
        WHERE {code_col} IS NOT NULL AND {code_col} != ''
        ORDER BY {code_col}
        """
    ).fetchall()
    return [
        SectorInfo(code=r[0], name=r[1] or "", classification=classification) for r in rows
    ]


@router.get("/{sector_code}/aggregate", response_model=SectorAggregateResponse)
def get_sector_aggregate(
    sector_code: str,
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)],
    start: str = Query("2023-01-01", description="開始日 YYYY-MM-DD"),
    end: str = Query("2099-12-31", description="終了日 YYYY-MM-DD"),
    classification: Literal["s17", "s33"] = Query("s17", description="業種分類"),
) -> SectorAggregateResponse:
    """業種単位の日次集計（売買代金合計・平均騰落率・構成銘柄数）。"""
    _validate_date(start, "start")
    _validate_date(end, "end")

    meta_path = str(settings.data_root / "metadata" / "all_equities.parquet")
    bars_glob = str(settings.data_root / "equity_bars" / "*" / "*.parquet")
    code_col = "S17" if classification == "s17" else "S33"
    name_col = "S17Nm" if classification == "s17" else "S33Nm"

    rows = db.execute(
        f"""
        WITH meta AS (
            SELECT DISTINCT Code, {code_col} AS sector_code, {name_col} AS sector_name
            FROM read_parquet('{meta_path}')
            WHERE {code_col} = ?
        )
        SELECT
            b.Date,
            SUM(b.Va)                                              AS total_value,
            AVG(CASE WHEN b.AdjO > 0 THEN b.AdjC / b.AdjO - 1 END) AS avg_return,
            COUNT(DISTINCT b.Code)                                 AS symbol_count
        FROM read_parquet('{bars_glob}') b
        JOIN meta ON b.Code = meta.Code
        WHERE b.Date >= ? AND b.Date <= ?
        GROUP BY b.Date
        ORDER BY b.Date
        """,
        [sector_code, start, end],
    ).fetchall()

    # Resolve sector name from metadata
    meta_row = db.execute(
        f"""
        SELECT DISTINCT {name_col}
        FROM read_parquet('{meta_path}')
        WHERE {code_col} = ?
        LIMIT 1
        """,
        [sector_code],
    ).fetchone()
    sector_name = meta_row[0] if meta_row else sector_code

    bars = [
        SectorBar(
            date=r[0],
            total_value=r[1] or 0.0,
            avg_return=r[2] or 0.0,
            symbol_count=r[3] or 0,
        )
        for r in rows
    ]
    return SectorAggregateResponse(
        sector_code=sector_code,
        sector_name=sector_name,
        classification=classification,
        bars=bars,
    )
