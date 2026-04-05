import ReactECharts from "echarts-for-react";
import type { OhlcBar } from "../../api/types";

const MA_COLORS: Record<number, string> = {
  5: "#f0a500",
  25: "#9b59b6",
  75: "#2980b9",
};

function calcMA(closes: number[], window: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < window - 1) return null;
    const sum = closes.slice(i - window + 1, i + 1).reduce((a, b) => a + b, 0);
    return Math.round((sum / window) * 100) / 100;
  });
}

interface Props {
  data: OhlcBar[];
  title?: string;
  maWindows?: number[];
}

export default function OhlcChart({ data, title, maWindows = [] }: Props) {
  const dates = data.map((d) => d.date);
  const ohlc = data.map((d) => [d.adj_open, d.adj_close, d.adj_low, d.adj_high]);
  const volumes = data.map((d) => d.adj_volume);
  const closes = data.map((d) => d.adj_close);

  const maSeries = maWindows.map((w) => ({
    name: `MA${w}`,
    type: "line",
    xAxisIndex: 0,
    yAxisIndex: 0,
    data: calcMA(closes, w),
    smooth: false,
    symbol: "none",
    lineStyle: { width: 1.5, color: MA_COLORS[w] ?? "#888" },
    itemStyle: { color: MA_COLORS[w] ?? "#888" },
  }));

  const option = {
    title: title ? { text: title, left: "center" } : undefined,
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["OHLC", "出来高", ...maWindows.map((w) => `MA${w}`)], top: 30 },
    grid: [
      { left: "8%", right: "4%", top: 60, height: "55%" },
      { left: "8%", right: "4%", top: "75%", height: "16%" },
    ],
    xAxis: [
      {
        type: "category",
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        gridIndex: 0,
      },
      {
        type: "category",
        data: dates,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { show: false },
        gridIndex: 1,
      },
    ],
    yAxis: [
      { scale: true, splitArea: { show: true }, gridIndex: 0 },
      { scale: true, gridIndex: 1, splitNumber: 2, axisLabel: { show: false } },
    ],
    dataZoom: [
      { type: "inside", xAxisIndex: [0, 1], start: 70, end: 100 },
      { show: true, xAxisIndex: [0, 1], type: "slider", bottom: 4, start: 70, end: 100 },
    ],
    series: [
      {
        name: "OHLC",
        type: "candlestick",
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: ohlc,
        itemStyle: {
          color: "#ec0000",
          color0: "#00da3c",
          borderColor: "#ec0000",
          borderColor0: "#00da3c",
        },
      },
      {
        name: "出来高",
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: volumes,
        itemStyle: { color: "#7fbe9e" },
      },
      ...maSeries,
    ],
  };

  return <ReactECharts option={option} style={{ height: 520 }} notMerge />;
}
