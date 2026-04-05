# J-Quants Data Viewer 改善提案

このドキュメントは、プロジェクト全体の品質向上のために確認した改善ポイントをまとめたものです。

## 1. 現在対応済みの改善

- `backend/app/routers/stocks.py`
  - `freq` の `date_trunc` パラメータを SQL の文字列補間からパラメータ化に改善
  - `equity_bars/{code}` データが存在しない場合に `404` を返すように修正
- `backend/app/routers/indices.py`
  - 指数 Parquet ファイル存在チェックを追加し、存在しない場合は `404` を返すように修正
- `frontend/src/views/SectorView.tsx`
  - `useQuery` の `isError` / `error` を追加し、エラー発生時に UI に通知するよう修正
- `frontend/src/views/CompareView.tsx`
  - 比較ビューでも `isError` / `error` を扱い、API エラーを可視化するよう修正
- `frontend/eslint.config.js`
  - `@typescript-eslint/no-unused-expressions` を明示的に無効化し、既存構成と整合させた

## 2. 追加で推奨する改善

### 2.1 バックエンド

- **リクエスト単位接続管理の評価**
  - 現状はリクエストごとに in-memory DuckDB 接続を生成・破棄している。
  - 将来的に同時リクエスト件数が増えた場合、DuckDB の persistent database モードや接続プール構成を検討する。

- **エラーハンドリングの統一**
  - すべての router で `duckdb.IOException` や `FileNotFoundError` などに対して一貫した HTTP エラー変換を実装する。
  - 例えば `app/db/connection.py` に共通の例外ラッパーを追加することを検討する。

- **バリデーションを API 層へ移行**
  - `Path`/`Query` パラメータの型とフォーマットは、FastAPI の `Annotated` や `pydantic` バリデータで可能な限り実装する。
  - 現在の `re` ベースバリデーションは保守性の観点から `pydantic` に移行すると良い。

### 2.2 フロントエンド

- **銘柄選択 UI の UX 改善**
  - 現在の `select` は 4,000 件超の銘柄を表示するため、検索機能付きコンボボックスや仮想スクロールを導入するのが望ましい。
  - `react-window` / `react-virtualized` などを使った最適化を検討する。

- **API エラー・Loading UI の統一**
  - `SectorView` / `CompareView` 以外にも `StockView` / `FinancialView` / `indices` 周りで同様のエラー表示統一を確認する。
  - `react-query` の `retry` / `staleTime` / `onError` を適切に設定し、UX を安定させる。

- **型生成の自動化**
  - バックエンドの OpenAPI から TypeScript 型を自動生成し、`frontend/src/api/types.ts` の手動定義を減らす。
  - これにより API 変更に伴う型ズレを防止できる。

### 2.3 テスト

- **カバレッジ拡張**
  - 現在はスモークテスト中心のため、ユースケース網羅を強化する。
  - 無効入力や例外ケース、404 / 400 レスポンスを明示的に追加する。

- **ユニットテストの追加**
  - バリデーション関数やデータ変換ロジックを対象にした単体テストを追加する。

### 2.4 ドキュメント

- **API 仕様の明確化**
  - `README.md` では機能概要が中心なので、エンドポイント一覧とリクエスト/レスポンス例を追加すると良い。
  - `docs/adr/0004-api-contract.md` を補完する形で `docs/API.md` のようなドキュメントを作成するのがおすすめ。

- **開発手順の明記**
  - `frontend` の `npm install` から `npm run dev` に至る手順を `README.md` に追記すると、初回セットアップの導線がより明確になる。

## 3. 今後の優先度提案

1. バックエンドの例外・データ不存在対応の完全実装
2. フロントエンド API エラー表示の統一
3. 銘柄選択 UI の検索/仮想化対応
4. OpenAPI からの型自動生成導入
5. テストカバレッジの拡張と CI への統合

---

このドキュメントは、現在の修正内容と追加改善のロードマップをまとめたものです。