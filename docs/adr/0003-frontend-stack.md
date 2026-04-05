# ADR-0003: フロントエンドスタック

**日付**: 2026-04-05
**ステータス**: Accepted

## コンテキスト

銘柄ビュー・業種ビュー・比較ビュー・財務ビューの 4 画面を構築する。
必要なチャートタイプは以下の通り。

- ローソク足 + 出来高（銘柄ビュー）
- 時系列折れ線・棒グラフ（業種集計）
- 複数銘柄の正規化比較折れ線
- PL/BS/CF の棒グラフ・表

また、4,449 銘柄分の選択 UI が必要で、大量データの描画パフォーマンスが求められる。

## 決定

**React 19 + TypeScript + Vite + ECharts + TanStack Query + Zustand** を採用する。

### フレームワーク: React

- ローソク足・財務チャートを提供する日本語ドキュメント付きライブラリが最も充実
- TypeScript との型統合が成熟しており、複雑な API レスポンス型を安全に扱える
- `echarts-for-react` など多くのチャートラッパーが React を第一ターゲットとしている

### ビルドツール: Vite

- 現状の標準。HMR が高速で TypeScript を設定なしでサポート
- `/v1` への proxy 設定が 3 行で完結（開発時の CORS 回避）

### チャートライブラリ: ECharts (Apache)

- ローソク足・出来高・DataZoom（時間軸スクロール）をネイティブサポート
- 大量データ向けの Large Scale rendering オプションあり
- 業種比較の棒グラフ・散布図・財務棒グラフをすべて 1 ライブラリで賄える
- 日本の金融系ダッシュボードでの実績が豊富

### サーバ状態管理: TanStack Query v5

- API キャッシュ・バックグラウンド再取得・ローディング状態を宣言的に管理
- `staleTime` による不必要な再フェッチ防止（Parquet クエリのコスト削減）

### クライアント状態管理: Zustand

- 選択銘柄・日付範囲・比較銘柄リストなど UI 状態のみを管理
- Redux より圧倒的に少ないボイラープレート

## 却下した代替案

| 案 | 却下理由 |
|----|---------|
| **SvelteKit** | DX は優秀だが、金融チャート向けの SvelteKit ネイティブライブラリが少ない。ECharts の Svelte ラッパーは React 版より成熟度が低い |
| **Vue 3** | Composition API は React Hooks と同等だが、TypeScript の型統合と IDEサポートで React に劣る場面がある |
| **TradingView Lightweight Charts** | ローソク足特化で高性能だが、業種集計・財務棒グラフなど他のチャートタイプには別ライブラリが必要になる。ECharts 1 本で完結できる方が管理コスト低 |
| **Plotly / Recharts** | Plotly は科学分析向けで重い。Recharts は大量データのパフォーマンスに懸念がある |
| **D3.js** | 最も柔軟だが実装コストが高すぎる。ECharts で賄えないケースが出た場合に検討する |

## 結果と影響

- `frontend/src/views/` に 4 ビュー（StockView / SectorView / CompareView / FinancialView）
- `frontend/src/api/` に TanStack Query を使った API フック群
- `frontend/src/components/charts/` に ECharts ラッパーコンポーネント群
- Vite の proxy 設定で開発時は `localhost:8000` にリクエストを転送
- FastAPI の OpenAPI スキーマから型定義を生成するフローは今後整備する
