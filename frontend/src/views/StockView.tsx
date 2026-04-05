import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStocks, getTimeseries } from "../api/client";
import OhlcChart from "../components/charts/OhlcChart";
import { useAppStore } from "../store";

type Freq = "daily" | "weekly" | "monthly";
const FREQ_LABELS: Record<Freq, string> = { daily: "日足", weekly: "週足", monthly: "月足" };

const MA_OPTIONS = [5, 25, 75] as const;
const MA_COLORS: Record<number, string> = { 5: "#f0a500", 25: "#9b59b6", 75: "#2980b9" };

export default function StockView() {
  const { selectedCode, setSelectedCode, startDate, endDate, setDateRange } = useAppStore();
  const [freq, setFreq] = useState<Freq>("daily");
  const [enabledMAs, setEnabledMAs] = useState<Set<number>>(new Set());

  const toggleMA = (w: number) => {
    setEnabledMAs((prev) => {
      const next = new Set(prev);
      next.has(w) ? next.delete(w) : next.add(w);
      return next;
    });
  };

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
    staleTime: 5 * 60 * 1000,
  });

  const { data: timeseries, isLoading } = useQuery({
    queryKey: ["timeseries", selectedCode, startDate, endDate, freq],
    queryFn: () => getTimeseries(selectedCode, startDate, endDate, freq),
    enabled: !!selectedCode,
  });

  const selected = stocks.find((s) => s.code === selectedCode);

  return (
    <div style={{ padding: "16px" }}>
      <h2>銘柄ビュー</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label>銘柄コード</label>
          <select
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {stocks.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} {s.name}
              </option>
            ))}
          </select>
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

      {isLoading && <p>読み込み中…</p>}
      {timeseries && timeseries.bars.length > 0 && (
        <OhlcChart
          data={timeseries.bars}
          title={`${selectedCode} 修正後株価（${FREQ_LABELS[freq]}）`}
          maWindows={[...enabledMAs].sort((a, b) => a - b)}
        />
      )}
      {timeseries && timeseries.bars.length === 0 && <p>指定期間にデータがありません。</p>}
    </div>
  );
}
