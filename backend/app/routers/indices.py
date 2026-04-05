from typing import Annotated

import duckdb
from fastapi import APIRouter, Depends, HTTPException, Path, Query

from app.config import settings
from app.db.connection import get_db
from app.models.stock import OhlcBar, TimeseriesResponse

router = APIRouter(prefix="/indices", tags=["indices"])

_DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"
_INDEX_PATTERN = r"^[A-Z0-9_-]{1,20}$"


@router.get("/{index_code}", response_model=TimeseriesResponse)
def get_index(
    index_code: Annotated[str, Path(pattern=_INDEX_PATTERN, description="指数コード (例: TOPIX)")],
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)],
    start: Annotated[str, Query(pattern=_DATE_PATTERN, description="開始日 YYYY-MM-DD")] = "2020-01-01",
    end: Annotated[str, Query(pattern=_DATE_PATTERN, description="終了日 YYYY-MM-DD")] = "2099-12-31",
) -> TimeseriesResponse:
    """指数の OHLC 時系列（TOPIX 等）。"""
    parquet_path = settings.data_root / "indices" / f"{index_code}.parquet"
    if not parquet_path.exists():
        raise HTTPException(status_code=404, detail=f"No data available for index {index_code}")

    rows = db.execute(
        f"""
        SELECT Date, O, H, L, C
        FROM read_parquet('{parquet_path}')
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
            volume=0.0,
            value=0.0,
            adj_open=r[1] or 0.0,
            adj_high=r[2] or 0.0,
            adj_low=r[3] or 0.0,
            adj_close=r[4] or 0.0,
            adj_volume=0.0,
        )
        for r in rows
    ]
    return TimeseriesResponse(code=index_code, bars=bars)
