import { useQuery } from "@tanstack/react-query";
import { getStocks, getTimeseries } from "../api/client";
import OhlcChart from "../components/charts/OhlcChart";
import { useAppStore } from "../store";

export default function StockView() {
  const { selectedCode, setSelectedCode, startDate, endDate, setDateRange } = useAppStore();

  const { data: stocks = [] } = useQuery({
    queryKey: ["stocks"],
    queryFn: getStocks,
    staleTime: 5 * 60 * 1000,
  });

  const { data: timeseries, isLoading } = useQuery({
    queryKey: ["timeseries", selectedCode, startDate, endDate],
    queryFn: () => getTimeseries(selectedCode, startDate, endDate),
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
                {s.code} {s.name_en || s.name}
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
      </div>

      {selected && (
        <p style={{ color: "#555", marginBottom: 8 }}>
          {selected.name_en || selected.name} ／ {selected.sector17_name} ／ {selected.market_name}
        </p>
      )}

      {isLoading && <p>読み込み中…</p>}
      {timeseries && timeseries.bars.length > 0 && (
        <OhlcChart
          data={timeseries.bars}
          title={`${selectedCode} 修正後株価`}
        />
      )}
      {timeseries && timeseries.bars.length === 0 && (
        <p>指定期間にデータがありません。</p>
      )}
    </div>
  );
}
