# J-Quants Data Viewer

J-Quants 由来の Parquet データ（全銘柄）をブラウザで閲覧・分析できる可視化アプリ。

## 機能

| ビュー | 内容 |
|--------|------|
| **銘柄ビュー** | 銘柄切替・ローソク足チャート・修正後株価・出来高 |
| **業種ビュー** | 17/33業種単位の日次騰落率・売買代金集計 |
| **比較ビュー** | 複数銘柄の正規化パフォーマンス比較（最大10銘柄） |
| **財務ビュー** | PL/BS/CF・EPS・配当・業績予想（通期/四半期） |

## アーキテクチャ

```
frontend (React + ECharts)
    │  HTTP GET /v1/...
    ▼
backend (FastAPI + DuckDB)
    │  read_parquet(glob)
    ▼
data/ (読み取り専用 Parquet)
  ├─ metadata/all_equities.parquet   # 銘柄マスタ
  ├─ equity_bars/{code}/{year}.parquet
  ├─ financial/{code}/{year}.parquet
  ├─ indices/TOPIX.parquet
  └─ corporate_actions/{code}/splits.parquet
```

技術選定の詳細は [`docs/adr/`](docs/adr/) を参照。

## 前提条件

| ツール | バージョン |
|--------|-----------|
| Python | 3.11+ |
| [uv](https://docs.astral.sh/uv/) | 最新版 |
| Node.js | 18+ |
| npm | 8+ |

## セットアップ

```bash
# 1. Python 依存インストール
cd backend && uv sync

# 2. Node 依存インストール
cd frontend && npm install
```

## 起動（開発）

**ターミナル 1 — backend**
```bash
cd backend
uv run fastapi dev app/main.py
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

**ターミナル 2 — frontend**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

フロントエンドの `/v1/...` リクエストは Vite の proxy 設定により `localhost:8000` に自動転送されます。

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/v1/stocks` | 銘柄一覧（マスタ） |
| GET | `/v1/stocks/{code}/timeseries` | OHLCV 時系列（`?start=&end=`） |
| GET | `/v1/stocks/{code}/financials` | 財務データ（`?doc_type=FY`等） |
| GET | `/v1/sectors` | 業種一覧（`?classification=s17\|s33`） |
| GET | `/v1/sectors/{code}/aggregate` | 業種集計（`?start=&end=`） |
| GET | `/v1/compare` | 複数銘柄比較（`?symbols=13010,13050&normalize=true`） |
| GET | `/v1/indices/{code}` | 指数時系列（例: `TOPIX`） |

## データ設定

デフォルトではリポジトリ直下の `data/` を参照します。
別パスを使う場合は環境変数で上書きできます。

```bash
export JQUANTS_DATA_ROOT=/path/to/data
cd backend && uv run fastapi dev app/main.py
```

## 開発コマンド

```bash
# テスト（実 Parquet を使った統合テスト）
cd backend && uv run pytest -v

# lint / format / 型チェック（backend）
cd backend
uv run ruff check app/
uv run ruff format app/
uv run mypy app/

# lint / format（frontend）
cd frontend
npm run lint
npm run format
```

## ディレクトリ構成

```
jquants-data-viewer/
├─ backend/
│  ├─ app/
│  │  ├─ main.py          # FastAPI エントリポイント
│  │  ├─ config.py        # 設定（data_root 等）
│  │  ├─ db/connection.py # DuckDB 接続ファクトリ
│  │  ├─ models/          # Pydantic レスポンスモデル
│  │  └─ routers/         # stocks / sectors / compare / financials / indices
│  ├─ tests/
│  └─ pyproject.toml
├─ frontend/
│  ├─ src/
│  │  ├─ api/             # axios クライアント・型定義
│  │  ├─ components/charts/  # ECharts ラッパー
│  │  ├─ views/           # 4ビュー
│  │  ├─ store.ts         # Zustand（UI状態）
│  │  └─ App.tsx
│  ├─ index.html
│  └─ package.json
├─ data/                  # 読み取り専用 Parquet（.gitignore 対象）
├─ docs/adr/              # Architecture Decision Records
└─ AGENTS.md              # Coding Agent 向け指示
```

## ライセンス

[LICENSE](LICENSE) を参照。
