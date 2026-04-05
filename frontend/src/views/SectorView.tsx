import { useQuery } from "@tanstack/react-query";
import { getSectorAggregate, getSectors } from "../api/client";
import LineChart from "../components/charts/LineChart";
import { useAppStore } from "../store";

export default function SectorView() {
  const {
    selectedSector,
    setSelectedSector,
    sectorClassification,
    setSectorClassification,
    startDate,
    endDate,
    setDateRange,
  } = useAppStore();

  const { data: sectors = [] } = useQuery({
    queryKey: ["sectors", sectorClassification],
    queryFn: () => getSectors(sectorClassification),
    staleTime: 5 * 60 * 1000,
  });

  const { data: aggregate, isLoading } = useQuery({
    queryKey: ["sector-aggregate", selectedSector, startDate, endDate, sectorClassification],
    queryFn: () => getSectorAggregate(selectedSector, startDate, endDate, sectorClassification),
    enabled: !!selectedSector,
  });

  const returnSeries = aggregate
    ? [
        {
          name: `${aggregate.sector_name} 平均騰落率`,
          dates: aggregate.bars.map((b) => b.date),
          values: aggregate.bars.map((b) => Number((b.avg_return * 100).toFixed(4))),
        },
      ]
    : [];

  const valueSeries = aggregate
    ? [
        {
          name: `${aggregate.sector_name} 売買代金合計`,
          dates: aggregate.bars.map((b) => b.date),
          values: aggregate.bars.map((b) => b.total_value),
        },
      ]
    : [];

  return (
    <div style={{ padding: "16px" }}>
      <h2>業種ビュー</h2>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label>分類</label>
          <select
            value={sectorClassification}
            onChange={(e) => setSectorClassification(e.target.value as "s17" | "s33")}
            style={{ marginLeft: 8 }}
          >
            <option value="s17">17業種</option>
            <option value="s33">33業種</option>
          </select>
        </div>

        <div>
          <label>業種</label>
          <select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            style={{ marginLeft: 8 }}
          >
            {sectors.map((s) => (
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
      </div>

      {isLoading && <p>読み込み中…</p>}
      {returnSeries.length > 0 && (
        <LineChart series={returnSeries} title="日次平均騰落率 (%)" yAxisLabel="%" />
      )}
      {valueSeries.length > 0 && (
        <LineChart series={valueSeries} title="日次売買代金合計" yAxisLabel="円" />
      )}
      {aggregate && aggregate.bars.length === 0 && <p>指定期間にデータがありません。</p>}
    </div>
  );
}
