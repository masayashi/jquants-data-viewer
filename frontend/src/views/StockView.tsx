import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactECharts from "echarts-for-react";
import { getFinancials, getStocks, getTimeseries } from "../api/client";
import type { FinancialRecord } from "../api/types";
import OhlcChart from "../components/charts/OhlcChart";
import StockPicker from "../components/StockPicker";
import { useAppStore } from "../store";

type Freq = "daily" | "weekly" | "monthly";
const FREQ_LABELS: Record<Freq, string> = { daily: "日足", weekly: "週足", monthly: "月足" };

const MA_OPTIONS = [5, 25, 75] as const;
const MA_COLORS: Record<number, string> = { 5: "#f0a500", 25: "#9b59b6", 75: "#2980b9" };

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
    grid: { top: 28, bottom: 48, left: 56, right: 8 },
    xAxis: {
      type: "category",
      data: filtered.map((r) => r.period_end),
      axisLabel: { rotate: 30, fontSize: 10 },
    },
    yAxis: { type: "value", name: METRIC_LABELS[metric], nameTextStyle: { fontSize: 10 }, scale: true },
    series: [
      {
        name: METRIC_LABELS[metric],
        type: "bar",
        data: filtered.map((r) => r[metric]),
        itemStyle: { color: "#4c9be8" },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 200 }} notMerge />;
}

export default function StockView() {
  const { selectedCode, setSelectedCode, startDate, endDate, setDateRange } = useAppStore();
  const [freq, setFreq] = useState<Freq>("daily");
  const [enabledMAs, setEnabledMAs] = useState<Set<number>>(new Set());
  const [docType, setDocType] = useState<string>("FY");

  const toggleMA = (w: number) => {
    setEnabledMAs((prev) => {
      const next = new Set(prev);
      if (next.has(w)) {
        next.delete(w);
      } else {
        next.add(w);
      }
      return next;
    });
  };

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
    staleTime: 5 * 60 * 1000,
  });

  const { data: timeseries, isLoading, isError, error } = useQuery({
    queryKey: ["timeseries", selectedCode, startDate, endDate, freq],
    queryFn: () => getTimeseries(selectedCode, startDate, endDate, freq),
    enabled: !!selectedCode,
  });

  const {
    data: financial,
    isLoading: finLoading,
    isError: finIsError,
    error: finError,
  } = useQuery({
    queryKey: ["financials", selectedCode, docType],
    queryFn: () => getFinancials(selectedCode, docType),
    enabled: !!selectedCode,
    retry: 0,
  });

  const selected = stocks.find((s) => s.code === selectedCode);
  const records = financial?.records ?? [];

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label>銘柄コード</label>
          <StockPicker stocks={stocks} value={selectedCode} onChange={setSelectedCode} />
        </div>

        <div>
          <label>開始日</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setDateRange(e.target.value, endDate)}
            style={{ marginLeft: 8 }}
          />
        </div>

        <div>
          <label>終了日</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setDateRange(startDate, e.target.value)}
            style={{ marginLeft: 8 }}
          />
        </div>

        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {(["daily", "weekly", "monthly"] as Freq[]).map((f) => (
            <button
              key={f}
              onClick={() => setFreq(f)}
              style={{
                padding: "2px 10px",
                borderRadius: 4,
                border: "1px solid #ccc",
                background: freq === f ? "#1a73e8" : "#fff",
                color: freq === f ? "#fff" : "#333",
                cursor: "pointer",
                fontWeight: freq === f ? 600 : 400,
              }}
            >
              {FREQ_LABELS[f]}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#555" }}>移動平均:</span>
          {MA_OPTIONS.map((w) => (
            <label
              key={w}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              <input type="checkbox" checked={enabledMAs.has(w)} onChange={() => toggleMA(w)} />
              <span style={{ color: MA_COLORS[w], fontWeight: 600 }}>MA{w}</span>
            </label>
          ))}
        </div>
      </div>

      {selected && (
        <p style={{ color: "#555", marginBottom: 8 }}>
          {selected.name} ／ {selected.sector17_name} ／ {selected.market_name}
        </p>
      )}

      {/* 株価チャート */}
      {isLoading && <p>読み込み中…</p>}
      {isError && (
        <div style={{ color: "red", padding: "16px", background: "#ffe0e0", borderRadius: 4 }}>
          エラーが発生しました: {(error as Error)?.message ?? "Unknown error"}
        </div>
      )}
      {!isLoading && !isError && timeseries && timeseries.bars.length > 0 && (
        <OhlcChart
          data={timeseries.bars}
          title={`${selectedCode} 修正後株価（${FREQ_LABELS[freq]}）`}
          maWindows={[...enabledMAs].sort((a, b) => a - b)}
        />
      )}
      {!isLoading && !isError && timeseries && timeseries.bars.length === 0 && (
        <p>指定期間にデータがありません。</p>
      )}

      {/* 財務セクション */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>財務情報</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 13, color: "#555" }}>開示区分</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              style={{ fontSize: 13 }}
            >
              <option value="FY">通期</option>
              <option value="">全期種</option>
              <option value="1Q">第１四半期</option>
              <option value="2Q">第２四半期</option>
              <option value="3Q">第３四半期</option>
            </select>
          </div>
        </div>

        {finLoading && <p>読み込み中…</p>}
        {finIsError && (
          <div style={{ color: "red", padding: "16px", background: "#ffe0e0", borderRadius: 4 }}>
            エラーが発生しました: {(finError as Error)?.message ?? "Unknown error"}
          </div>
        )}

        {!finLoading && !finIsError && records.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 12,
            }}
          >
            {ALL_METRICS.map((m) => (
              <div key={m} style={{ border: "1px solid #e0e0e0", borderRadius: 4, padding: "8px 8px 4px" }}>
                <h4 style={{ margin: "0 0 2px", fontSize: 13 }}>{METRIC_LABELS[m]}</h4>
                <FinancialBarChart records={records} metric={m} />
              </div>
            ))}
          </div>
        )}

        {!finIsError && financial && records.length === 0 && !finLoading && (
          <div
            style={{
              padding: "20px 32px",
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              textAlign: "center",
              color: "#6b7280",
            }}
          >
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
    </div>
  );
}
