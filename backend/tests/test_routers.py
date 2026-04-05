"""Basic smoke tests for each router.

Uses httpx.TestClient against the FastAPI app. DuckDB reads real Parquet files
from ../../data/ — no mocks. See ADR-0002: tests verify real behavior.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_list_stocks_returns_list() -> None:
    resp = client.get("/v1/stocks")
    assert resp.status_code == 200
    stocks = resp.json()
    assert isinstance(stocks, list)
    assert len(stocks) > 0
    assert "code" in stocks[0]
    assert "name" in stocks[0]


def test_timeseries_known_code() -> None:
    resp = client.get("/v1/stocks/13010/timeseries", params={"start": "2024-01-01", "end": "2024-03-31"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == "13010"
    assert isinstance(data["bars"], list)
    if data["bars"]:
        bar = data["bars"][0]
        assert "date" in bar
        assert "adj_close" in bar


def test_timeseries_invalid_code_rejected() -> None:
    resp = client.get("/v1/stocks/../../etc/timeseries")
    assert resp.status_code in (400, 404, 422)


def test_list_sectors_s17() -> None:
    resp = client.get("/v1/sectors", params={"classification": "s17"})
    assert resp.status_code == 200
    sectors = resp.json()
    assert isinstance(sectors, list)
    assert len(sectors) > 0


def test_compare_two_symbols() -> None:
    resp = client.get("/v1/compare", params={"symbols": "13010,13050", "start": "2024-01-01", "end": "2024-06-30"})
    assert resp.status_code == 200
    data = resp.json()
    assert set(data["codes"]) == {"13010", "13050"}
    assert data["normalized"] is True


def test_financials_known_code() -> None:
    resp = client.get("/v1/stocks/13010/financials")
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == "13010"
    assert isinstance(data["records"], list)
    # DocType フィルタなし → FinancialStatements 系レコードが返る
    assert len(data["records"]) > 0, "財務データが空（DocType フィルタの不一致を確認）"
    for rec in data["records"]:
        assert "FinancialStatements" in rec["doc_type"], (
            f"FinancialStatements 以外のレコードが含まれている: {rec['doc_type']}"
        )


def test_financials_with_fy_filter() -> None:
    resp = client.get("/v1/stocks/13010/financials", params={"doc_type": "FY"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["records"]) > 0, "FY フィルタで財務データが空"
    for rec in data["records"]:
        assert rec["doc_type"].startswith("FY"), (
            f"FY 以外のレコードが含まれている: {rec['doc_type']}"
        )


def test_financials_invalid_doc_type_rejected() -> None:
    # Literal 型バリデーションにより Pydantic が 422 を返す
    resp = client.get("/v1/stocks/13010/financials", params={"doc_type": "INVALID"})
    assert resp.status_code == 422


def test_index_topix() -> None:
    resp = client.get("/v1/indices/TOPIX", params={"start": "2024-01-01", "end": "2024-03-31"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["code"] == "TOPIX"
    assert isinstance(data["bars"], list)


# ---------------------------------------------------------------------------
# エラーケース: 404 / 422
# ---------------------------------------------------------------------------

def test_timeseries_nonexistent_code_returns_404() -> None:
    resp = client.get("/v1/stocks/99999/timeseries")
    assert resp.status_code == 404
    assert "99999" in resp.json()["detail"]


def test_timeseries_invalid_date_format_returns_422() -> None:
    resp = client.get("/v1/stocks/13010/timeseries", params={"start": "2024/01/01"})
    assert resp.status_code == 422


def test_timeseries_invalid_freq_returns_422() -> None:
    resp = client.get("/v1/stocks/13010/timeseries", params={"freq": "yearly"})
    assert resp.status_code == 422


def test_timeseries_weekly_aggregation() -> None:
    resp = client.get(
        "/v1/stocks/13010/timeseries",
        params={"start": "2024-01-01", "end": "2024-03-31", "freq": "weekly"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data["bars"], list)
    # 週足は日足より少ないバー数になるはず
    daily = client.get(
        "/v1/stocks/13010/timeseries",
        params={"start": "2024-01-01", "end": "2024-03-31", "freq": "daily"},
    ).json()
    assert len(data["bars"]) < len(daily["bars"])


def test_timeseries_monthly_aggregation() -> None:
    resp = client.get(
        "/v1/stocks/13010/timeseries",
        params={"start": "2024-01-01", "end": "2024-12-31", "freq": "monthly"},
    )
    assert resp.status_code == 200
    data = resp.json()
    # 12ヶ月分 = 最大 12 バー
    assert 1 <= len(data["bars"]) <= 12


def test_index_nonexistent_returns_404() -> None:
    resp = client.get("/v1/indices/NONEXISTENT")
    assert resp.status_code == 404
    assert "NONEXISTENT" in resp.json()["detail"]


def test_index_invalid_date_returns_422() -> None:
    resp = client.get("/v1/indices/TOPIX", params={"end": "not-a-date"})
    assert resp.status_code == 422


def test_compare_empty_symbols_returns_400() -> None:
    resp = client.get("/v1/compare", params={"symbols": ""})
    assert resp.status_code == 400


def test_compare_too_many_symbols_returns_400() -> None:
    codes = ",".join([f"{10000 + i}" for i in range(11)])
    resp = client.get("/v1/compare", params={"symbols": codes})
    assert resp.status_code == 400


def test_compare_invalid_code_in_symbols_returns_400() -> None:
    resp = client.get("/v1/compare", params={"symbols": "13010,INVALID!"})
    assert resp.status_code == 400


def test_sectors_invalid_classification_returns_422() -> None:
    resp = client.get("/v1/sectors", params={"classification": "s99"})
    assert resp.status_code == 422
