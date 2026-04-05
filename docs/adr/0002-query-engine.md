# ADR-0002: クエリエンジン

**日付**: 2026-04-05
**ステータス**: Accepted

## コンテキスト

約 4,449 銘柄分の Parquet ファイル（equity_bars / financial / metadata）を効率よくクエリする必要がある。
データの特性は以下の通り。

- 銘柄 × 年で分割されたファイル群（`{code}/{year}.parquet`）
- 全銘柄集計（業種ビュー）では数千ファイルをまたぐクエリが発生
- financial の数値カラムはすべて文字列型（`TRY_CAST` が必要）
- read は多いが write は発生しない（読み取り専用）

## 決定

**DuckDB** を採用する。

- `read_parquet('path/*.parquet')` でファイルの glob 読み込みをネイティブサポート
- SQL インターフェースでフィルタ・集計・JOIN を一括処理できる
- 列指向エンジンのため、全銘柄集計クエリでもメモリ効率が高い
- `TRY_CAST` で文字列 → 数値への安全な変換が可能
- インメモリで動作し、外部サービス不要
- Python バインディングが最も成熟している

## 却下した代替案

| 案 | 却下理由 |
|----|---------|
| **Polars のみ** | DataFrame API は優秀だが、複数ファイルをまたぐ SQL 的な集計（GROUP BY / JOIN）はコードが冗長になる。DuckDB と比べてクロスファイルクエリの記述コストが高い |
| **pandas** | 列指向でなくメモリ効率が低い。全銘柄集計で OOM リスクがある。DuckDB の方がはるかに高速 |
| **ClickHouse (外部サーバ)** | OLAP に最適化されているが外部サービスの運用コストが発生する。このプロジェクトの規模ではオーバースペック |
| **SQLite + parquet 変換** | Parquet を SQLite にインポートする手順が必要で、データ更新サイクルが複雑になる |
| **ブラウザ内 DuckDB (WASM)** | 全銘柄要件では初回ロードデータ量が問題になる。AGENTS.md 禁止事項として明記 |

## 結果と影響

- `backend/app/db/connection.py` でリクエストごとにインメモリ接続を生成・破棄
- ファイルパスは `config.py` の `data_root` から構築。`../{year}.parquet` 形式の glob を使用
- コードパラメータは `Path(..., pattern=r'^[A-Z0-9]{4,5}$')` で FastAPI 側で検証し injection を防ぐ
- 日付パラメータは `^\d{4}-\d{2}-\d{2}$` パターンで検証してから SQL の WHERE 句に埋め込む
- 将来的に集計クエリが遅い場合は DuckDB の persistent database モードへの移行を検討する
