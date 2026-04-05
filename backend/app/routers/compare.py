import re
from typing import Annotated

import duckdb
from fastapi import APIRouter, Depends, HTTPException, Query

from app.config import settings
from app.db.connection import get_db
from app.models.financial import CompareBar, CompareResponse

router = APIRouter(prefix="/compare", tags=["compare"])

_CODE_RE = re.compile(r"^[A-Z0-9]{4,5}$")
_DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"

MAX_SYMBOLS = 10


def _validate_codes(symbols_param: str) -> list[str]:
    codes = [c.strip() for c in symbols_param.split(",") if c.strip()]
    if not codes:
        raise HTTPException(status_code=400, detail="symbols is required")
    if len(codes) > MAX_SYMBOLS:
        raise HTTPException(status_code=400, detail=f"Maximum {MAX_SYMBOLS} symbols allowed")
    for c in codes:
        if not _CODE_RE.match(c):
            raise HTTPException(status_code=400, detail=f"Invalid code: {c!r}")
    return codes


@router.get("", response_model=CompareResponse)
def compare_symbols(
    db: Annotated[duckdb.DuckDBPyConnection, Depends(get_db)],
    symbols: str = Query(..., description="カンマ区切り銘柄コード (最大10件)"),
    start: Annotated[str, Query(pattern=_DATE_PATTERN, description="開始日 YYYY-MM-DD")] = "2020-01-01",
    end: Annotated[str, Query(pattern=_DATE_PATTERN, description="終了日 YYYY-MM-DD")] = "2099-12-31",
    normalize: bool = Query(True, description="始点を 1.0 に正規化して比較"),
) -> CompareResponse:
    """複数銘柄の修正後終値を時系列で比較する。normalize=true で始点を 1.0 に揃える。"""
    codes = _validate_codes(symbols)

    # Build per-symbol subqueries and pivot
    bars_glob = str(settings.data_root / "equity_bars" / "*" / "*.parquet")
    code_list = ", ".join(f"'{c}'" for c in codes)

    rows = db.execute(
        f"""
        SELECT Date, Code, AdjC
        FROM read_parquet('{bars_glob}')
        WHERE Code IN ({code_list})
          AND Date >= ? AND Date <= ?
        ORDER BY Date, Code
        """,
        [start, end],
    ).fetchall()

    # Assemble into date → {code: value} map
    date_map: dict[str, dict[str, float | None]] = {}
    for date, code, adj_c in rows:
        date_map.setdefault(date, {code: None for code in codes})[code] = adj_c

    if normalize and date_map:
        first_date = min(date_map)
        base = {code: date_map[first_date].get(code) for code in codes}
        normalized_map: dict[str, dict[str, float | None]] = {}
        for date, vals in date_map.items():
            row: dict[str, float | None] = {}
            for code, v in vals.items():
                b = base[code]
                row[code] = v / b if v is not None and b is not None and b != 0.0 else None
            normalized_map[date] = row
        date_map = normalized_map

    compare_bars = [CompareBar(date=date, values=vals) for date, vals in sorted(date_map.items())]
    return CompareResponse(codes=codes, bars=compare_bars, normalized=normalize)
