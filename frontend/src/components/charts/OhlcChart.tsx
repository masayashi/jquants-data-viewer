import ReactECharts from "echarts-for-react";
import type { OhlcBar } from "../../api/types";

interface Props {
  data: OhlcBar[];
  title?: string;
}

export default function OhlcChart({ data, title }: Props) {
  const dates = data.map((d) => d.date);
  const ohlc = data.map((d) => [d.adj_open, d.adj_close, d.adj_low, d.adj_high]);
  const volumes = data.map((d) => d.adj_volume);

  const option = {
    title: title ? { text: title, left: "center" } : undefined,
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { data: ["OHLC", "出来高"], top: 30 },
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
    ],
  };

  return <ReactECharts option={option} style={{ height: 520 }} notMerge />;
}
