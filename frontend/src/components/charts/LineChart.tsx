import ReactECharts from "echarts-for-react";

interface Series {
  name: string;
  dates: string[];
  values: (number | null)[];
}

interface Props {
  series: Series[];
  title?: string;
  yAxisLabel?: string;
}

export default function LineChart({ series, title, yAxisLabel }: Props) {
  const allDates = series[0]?.dates ?? [];

  const option = {
    title: title ? { text: title, left: "center" } : undefined,
    tooltip: { trigger: "axis" },
    legend: { data: series.map((s) => s.name), top: 30 },
    grid: { left: "8%", right: "4%", top: 60, bottom: 60 },
    xAxis: {
      type: "category",
      data: allDates,
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      name: yAxisLabel,
      scale: true,
    },
    dataZoom: [
      { type: "inside", start: 0, end: 100 },
      { show: true, type: "slider", bottom: 4 },
    ],
    series: series.map((s) => ({
      name: s.name,
      type: "line",
      data: s.values,
      showSymbol: false,
      connectNulls: false,
    })),
  };

  return <ReactECharts option={option} style={{ height: 420 }} notMerge />;
}
