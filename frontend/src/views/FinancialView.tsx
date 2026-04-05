import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { getFinancials, getStocks } from "../api/client";
import type { FinancialRecord } from "../api/types";
import StockPicker from "../components/StockPicker";
import { useAppStore } from "../store";

type Metric =
  | "sales"
  | "operating_profit"
  | "net_profit"
  | "eps"
  | "total_assets"
  | "equity"
  | "bps"
  | "cfo";

const METRIC_LABELS: Record<Metric, string> = {
  sales: "売上高",
  operating_profit: "営業利益",
  net_profit: "当期純利益",
  eps: "EPS",
  total_assets: "総資産",
  equity: "純資産",
  bps: "BPS",
  cfo: "営業CF",
};

const ALL_METRICS = Object.keys(METRIC_LABELS) as Metric[];

function FinancialBarChart({ records, metric }: { records: FinancialRecord[]; metric: Metric }) {
  const filtered = [...records]
    .filter((r) => r[metric] !== null)
    .sort((a, b) => a.period_end.localeCompare(b.period_end));

  const option = {
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: filtered.map((r) => r.period_end),
      axisLabel: { rotate: 30 },
    },
    yAxis: { type: "value", name: METRIC_LABELS[metric], scale: true },
    series: [
      {
        name: METRIC_LABELS[metric],
        type: "bar",
        data: filtered.map((r) => r[metric]),
        itemStyle: { color: "#4c9be8" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 280 }} notMerge />;
}

export default function FinancialView() {
  const { selectedCode, setSelectedCode } = useAppStore();
  // "FY" = 通期（デフォルト）、"" = 全期種
  const [docType, setDocType] = useState<string>("FY");

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: financial,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["financials", selectedCode, docType],
    queryFn: () => getFinancials(selectedCode, docType),
    enabled: !!selectedCode,
    retry: 0, // 財務データなし銘柄で無駄なリトライをしない
  });

  const selected = stocks.find((s) => s.code === selectedCode);
  const records = financial?.records ?? [];

  return (
    <div style={{ padding: "16px" }}>
      <h2>財務ビュー</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label>銘柄コード</label>
          <StockPicker stocks={stocks} value={selectedCode} onChange={setSelectedCode} />
        </div>

        <div>
          <label>開示区分</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            <option value="FY">通期</option>
            <option value="">全期種</option>
            <option value="1Q">第１四半期</option>
            <option value="2Q">第２四半期</option>
            <option value="3Q">第３四半期</option>
          </select>
        </div>
      </div>

      {selected && (
        <p style={{ color: "#555", marginBottom: 8 }}>
          {selected.name} ／ {selected.sector17_name}
        </p>
      )}

      {isLoading && <p>読み込み中…</p>}
      {isError && (
        <div style={{ color: "red", padding: "16px", background: "#ffe0e0", borderRadius: 4 }}>
          エラーが発生しました: {(error as Error)?.message ?? "Unknown error"}
        </div>
      )}

      {!isLoading && !isError && records.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
            gap: 16,
          }}
        >
          {ALL_METRICS.map((m) => (
            <div key={m} style={{ border: "1px solid #e0e0e0", borderRadius: 4, padding: 8 }}>
              <h4 style={{ margin: "0 0 4px" }}>{METRIC_LABELS[m]}</h4>
              <FinancialBarChart records={records} metric={m} />
            </div>
          ))}
        </div>
      )}

      {!isError && financial && records.length === 0 && !isLoading && (
        <div
          style={{
            marginTop: 32,
            padding: "24px 32px",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>財務データがありません</div>
          <div style={{ fontSize: 13 }}>
            {docType
              ? `この銘柄には「${
                  docType === "FY"
                    ? "通期"
                    : docType === "1Q"
                      ? "第１四半期"
                      : docType === "2Q"
                        ? "第２四半期"
                        : "第３四半期"
                }」の開示データが存在しません。`
              : "この銘柄には財務開示データが存在しません。"}
          </div>
        </div>
      )}
    </div>
  );
}
