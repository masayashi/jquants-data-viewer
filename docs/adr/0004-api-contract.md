# ADR-0004: API 設計方針

**日付**: 2026-04-05
**ステータス**: Accepted

## コンテキスト

フロントエンド（React SPA）とバックエンド（FastAPI）間のインターフェースを定義する。
このアーキテクチャでは可視化側がデータ生成側（移行元リポジトリ）から分離されており、
バックエンドは読み取り専用で Parquet を参照する。

## 決定

**REST + JSON、`/v1/` プレフィックス、FastAPI による OpenAPI 自動生成** を採用する。

### エンドポイント一覧

```
GET /v1/stocks                                    # 銘柄一覧（マスタ）
GET /v1/stocks/{code}/timeseries                  # 時系列 OHLCV（?start=&end=）
GET /v1/stocks/{code}/financials                  # 財務データ（?doc_type=）
GET /v1/sectors                                   # 業種一覧（S17 / S33）
GET /v1/sectors/{sector_code}/aggregate           # 業種集計（?start=&end=&classification=s17|s33）
GET /v1/compare                                   # 複数銘柄比較（?symbols=&start=&end=&normalize=）
GET /v1/indices/{code}                            # 指数時系列（TOPIX等）
```

### レスポンス規約

- すべて JSON、キーは `snake_case`
- 数値は `float | null`（欠損は `null`）
- 日付は `"YYYY-MM-DD"` 文字列
- エラーは `{"detail": "..."}` 形式（FastAPI デフォルト）
- ページネーションは当面不要。時系列は `start`/`end` で絞り込む

## 却下した代替案

| 案 | 却下理由 |
|----|---------|
| **GraphQL** | フレキシブルだがクライアントのクエリ設計コストが高い。ユースケースが明確な 4 ビューに対してはオーバースペック |
| **tRPC** | TypeScript フルスタック前提。バックエンドを Python にする決定（ADR-0001）と相反する |
| **WebSocket / SSE** | リアルタイム更新は当面不要。Parquet はバッチ更新のため REST で十分 |
| **OData** | 汎用すぎて日本語ドキュメントが少なく、DuckDB との統合も手動になる |

## 結果と影響

- `GET /v1/` で FastAPI の自動生成 OpenAPI JSON を取得可能
- `/docs` で Swagger UI、`/redoc` で ReDoc が利用可能（開発環境）
- フロントエンドは `axios` でフェッチし、`/v1/` は Vite の proxy 経由
- 破壊的変更（レスポンスフィールドの削除・型変更）は `/v2/` へのバージョンアップを必須とする
- 追加フィールドは後方互換とみなし、バージョンアップ不要
