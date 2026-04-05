// ---------------------------------------------------------------------------
// Stock / Timeseries
// ---------------------------------------------------------------------------

export interface StockMaster {
  code: string;
  name: string;
  name_en: string;
  sector17_code: string;
  sector17_name: string;
  sector33_code: string;
  sector33_name: string;
  market_code: string;
  market_name: string;
  scale_cat: string;
}

export interface OhlcBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
  adj_open: number;
  adj_high: number;
  adj_low: number;
  adj_close: number;
  adj_volume: number;
}

export interface TimeseriesResponse {
  code: string;
  bars: OhlcBar[];
}

// ---------------------------------------------------------------------------
// Sectors
// ---------------------------------------------------------------------------

export interface SectorInfo {
  code: string;
  name: string;
  classification: "s17" | "s33";
}

export interface SectorBar {
  date: string;
  total_value: number;
  avg_return: number;
  symbol_count: number;
}

export interface SectorAggregateResponse {
  sector_code: string;
  sector_name: string;
  classification: string;
  bars: SectorBar[];
}

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

export interface CompareBar {
  date: string;
  values: Record<string, number | null>;
}

export interface CompareResponse {
  codes: string[];
  bars: CompareBar[];
  normalized: boolean;
}

// ---------------------------------------------------------------------------
// Financials
// ---------------------------------------------------------------------------

export interface FinancialRecord {
  disc_date: string;
  doc_type: string;
  period_start: string;
  period_end: string;
  sales: number | null;
  operating_profit: number | null;
  ordinary_profit: number | null;
  net_profit: number | null;
  eps: number | null;
  total_assets: number | null;
  equity: number | null;
  bps: number | null;
  cfo: number | null;
  cfi: number | null;
  cff: number | null;
  cash_eq: number | null;
  div_annual: number | null;
  f_sales: number | null;
  f_operating_profit: number | null;
  f_net_profit: number | null;
  f_eps: number | null;
}

export interface FinancialResponse {
  code: string;
  records: FinancialRecord[];
}
