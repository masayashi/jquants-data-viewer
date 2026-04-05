やりとりは日本語にすること。

## 初回セットアップ
```bash
cd backend  && uv sync          # Python 依存インストール
cd frontend && npm install      # Node 依存インストール
```

## 起動（開発）
```bash
# ターミナル1: backend — http://localhost:8000  /docs で Swagger UI
cd backend && uv run fastapi dev app/main.py

# ターミナル2: frontend — http://localhost:5173  (/v1 は backend に proxy)
cd frontend && npm run dev
```

## 品質チェック（backend）
```bash
cd backend
uv run pytest                                   # テスト
uv run ruff check app/ && uv run ruff format app/  # lint + format
uv run mypy app/                                # 型チェック
```

## 品質チェック（frontend）
```bash
cd frontend && npm run lint && npm run format
```

## ディレクトリ構成
- `backend/` — FastAPI + DuckDB API サーバ（Python 3.11+, uv管理）
- `frontend/` — React + ECharts SPA（Vite + TypeScript）
- `data/` — 読み取り専用 Parquet（変更・削除禁止）
- `docs/adr/` — Architecture Decision Records（技術変更前に必読）

## データパス規約
- `data/metadata/all_equities.parquet` — 銘柄マスタ（Code/CoName/S17/S33/Mkt）
- `data/equity_bars/{code}/{year}.parquet` — OHLCV + 修正後価格
- `data/financial/{code}/{year}.parquet` — PL/BS/CF・配当・予想
- `data/indices/TOPIX.parquet` — 指数 OHLC
- `data/corporate_actions/{code}/splits.parquet` — 分割履歴

## 禁止事項
- `data/` 配下のファイルを作成・変更・削除しない
- API は `/v1/` 以下でバージョン管理。破壊的変更には ADR 更新と新バージョンが必要
- Financial Parquet の数値カラムは文字列型。キャストは API 層で行いフロントに渡さない
- フロントエンドから Parquet を直接読まない（API 経由のみ）
- `docs/adr/` を参照せずにバックエンドFW・クエリエンジン・チャートライブラリを変更しない
