import axios from "axios";
import type {
  CompareResponse,
  FinancialResponse,
  SectorAggregateResponse,
  SectorInfo,
  StockMaster,
  TimeseriesResponse,
} from "./types";

const api = axios.create({ baseURL: "/v1" });

// ---------------------------------------------------------------------------
// Stocks
// ---------------------------------------------------------------------------

export const getStocks = (): Promise<StockMaster[]> =>
  api.get<StockMaster[]>("/stocks").then((r) => r.data);

export const getTimeseries = (
  code: string,
  start: string,
  end: string
): Promise<TimeseriesResponse> =>
  api
    .get<TimeseriesResponse>(`/stocks/${code}/timeseries`, {
      params: { start, end },
    })
    .then((r) => r.data);

export const getFinancials = (
  code: string,
  docType?: string
): Promise<FinancialResponse> =>
  api
    .get<FinancialResponse>(`/stocks/${code}/financials`, {
      params: docType ? { doc_type: docType } : undefined,
    })
    .then((r) => r.data);

// ---------------------------------------------------------------------------
// Sectors
// ---------------------------------------------------------------------------

export const getSectors = (
  classification: "s17" | "s33" = "s17"
): Promise<SectorInfo[]> =>
  api
    .get<SectorInfo[]>("/sectors", { params: { classification } })
    .then((r) => r.data);

export const getSectorAggregate = (
  sectorCode: string,
  start: string,
  end: string,
  classification: "s17" | "s33" = "s17"
): Promise<SectorAggregateResponse> =>
  api
    .get<SectorAggregateResponse>(`/sectors/${sectorCode}/aggregate`, {
      params: { start, end, classification },
    })
    .then((r) => r.data);

// ---------------------------------------------------------------------------
// Compare
// ---------------------------------------------------------------------------

export const getCompare = (
  codes: string[],
  start: string,
  end: string,
  normalize = true
): Promise<CompareResponse> =>
  api
    .get<CompareResponse>("/compare", {
      params: { symbols: codes.join(","), start, end, normalize },
    })
    .then((r) => r.data);

// ---------------------------------------------------------------------------
// Indices
// ---------------------------------------------------------------------------

export const getIndex = (
  indexCode: string,
  start: string,
  end: string
): Promise<TimeseriesResponse> =>
  api
    .get<TimeseriesResponse>(`/indices/${indexCode}`, {
      params: { start, end },
    })
    .then((r) => r.data);
