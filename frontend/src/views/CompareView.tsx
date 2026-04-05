import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCompare, getStocks } from "../api/client";
import LineChart from "../components/charts/LineChart";
import { useAppStore } from "../store";

export default function CompareView() {
  const { compareCodes, setCompareCodes, startDate, endDate, setDateRange } = useAppStore();
  const [normalize, setNormalize] = useState(true);
  const [inputCode, setInputCode] = useState("");

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
    staleTime: 5 * 60 * 1000,
  });

  const { data: compareData, isLoading, isError, error } = useQuery({
    queryKey: ["compare", compareCodes, startDate, endDate, normalize],
    queryFn: () => getCompare(compareCodes, startDate, endDate, normalize),
    enabled: compareCodes.length >= 2,
  });

  const addCode = () => {
    const code = inputCode.trim().toUpperCase();
    if (code && !compareCodes.includes(code) && compareCodes.length < 10) {
      setCompareCodes([...compareCodes, code]);
      setInputCode("");
    }
  };

  const removeCode = (code: string) => {
    setCompareCodes(compareCodes.filter((c) => c !== code));
  };

  const series =
    compareData?.bars && compareData.codes.length > 0
      ? compareData.codes.map((code) => {
          const stock = stocks.find((s) => s.code === code);
          return {
            name: stock ? `${code} ${stock.name}` : code,
            dates: compareData.bars.map((b) => b.date),
            values: compareData.bars.map((b) => b.values[code] ?? null),
          };
        })
      : [];

  return (
    <div style={{ padding: "16px" }}>
      <h2>比較ビュー</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
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
        <label>
          <input
            type="checkbox"
            checked={normalize}
            onChange={(e) => setNormalize(e.target.checked)}
            style={{ marginRight: 4 }}
          />
          始点を 1.0 に正規化
        </label>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {compareCodes.map((code) => {
          const stock = stocks.find((s) => s.code === code);
          return (
            <span
              key={code}
              style={{
                padding: "2px 8px",
                background: "#e8f0fe",
                borderRadius: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {code} {stock?.name ?? ""}
              <button
                onClick={() => removeCode(code)}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                ×
              </button>
            </span>
          );
        })}
        <input
          placeholder="コード追加 (例: 13010)"
          value={inputCode}
          onChange={(e) => setInputCode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCode()}
          style={{ width: 160 }}
        />
        <button onClick={addCode}>追加</button>
      </div>

      {compareCodes.length < 2 && <p>2銘柄以上を選択してください。</p>}
      {isLoading && <p>読み込み中…</p>}
      {isError && (
        <div style={{ color: "red", padding: "16px", background: "#ffe0e0" }}>
          エラーが発生しました: {error?.message || "Unknown error"}
        </div>
      )}
      {!isLoading && !isError && series.length > 0 && (
        <LineChart
          series={series}
          title={normalize ? "相対パフォーマンス比較（始点=1.0）" : "修正後終値比較"}
          yAxisLabel={normalize ? "倍率" : "円"}
        />
      )}
    </div>
  );
}
