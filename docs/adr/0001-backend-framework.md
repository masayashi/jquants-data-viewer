# ADR-0001: バックエンドフレームワーク

**日付**: 2026-04-05
**ステータス**: Accepted

## コンテキスト

J-Quants Parquet データを API で提供するバックエンドフレームワークを選定する。
主な要件は以下の通り。

- Parquet クエリエンジン（DuckDB / Polars）との親和性
- 型安全な API 定義と自動 OpenAPI 生成
- 非同期 I/O 対応（複数銘柄の並列クエリ）
- Python エコシステムの活用（データ処理ライブラリ群）

## 決定

**FastAPI** を採用する。

- Pydantic v2 による型安全なリクエスト/レスポンス検証
- 自動 OpenAPI / JSON Schema 生成 → フロントの型定義生成に直結
- `fastapi[standard]` に uvicorn が同梱されており開発・本番ともシンプル
- DuckDB / Polars は Python ネイティブ。同言語での統合が最も自然
- `uv` による高速パッケージ管理と相性が良い

## 却下した代替案

| 案 | 却下理由 |
|----|---------|
| **Litestar** | FastAPI より新しく API が安定しているが、エコシステム（サンプル・ライブラリ）が小さい。本プロジェクトでの優位性が薄い |
| **Hono (TypeScript/Bun)** | エッジ向けで高速だが、Python の Parquet/DuckDB エコシステムを捨てることになる。データ処理層を別言語にする複雑性が増す |
| **Go + net/http** | 高スループットだが DuckDB の Go バインディングは Python より成熟度が低く、型付きレスポンスモデルの記述コストが高い |
| **Django REST Framework** | フルスタックだがオーバースペック。ORM が不要で、起動オーバーヘッドも大きい |
| **Flask** | 軽量だが型ヒント・バリデーション・OpenAPI 生成を手動で整備する必要があり、FastAPI に対する優位性がない |

## 結果と影響

- `backend/` は Python パッケージ。エントリポイントは `backend/app/main.py`
- 全エンドポイントは Pydantic モデルで型定義し、`/docs` で OpenAPI UI を提供
- クエリは同期的に DuckDB へ委譲（DuckDB のスレッド安全性の都合上、リクエストごとに接続を生成）
- 将来的に接続プールが必要になった場合は ADR-0002 と合わせて再評価する
