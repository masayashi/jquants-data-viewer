import { create } from "zustand";

interface AppState {
  // 銘柄ビュー
  selectedCode: string;
  setSelectedCode: (code: string) => void;

  // 日付範囲（全ビュー共通）
  startDate: string;
  endDate: string;
  setDateRange: (start: string, end: string) => void;

  // 業種ビュー
  selectedSector: string;
  sectorClassification: "s17" | "s33";
  setSelectedSector: (code: string) => void;
  setSectorClassification: (c: "s17" | "s33") => void;

  // 比較ビュー
  compareCodes: string[];
  setCompareCodes: (codes: string[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedCode: "13010",
  setSelectedCode: (code) => set({ selectedCode: code }),

  startDate: "2022-01-01",
  endDate: "2024-12-31",
  setDateRange: (startDate, endDate) => set({ startDate, endDate }),

  selectedSector: "1",
  sectorClassification: "s17",
  setSelectedSector: (selectedSector) => set({ selectedSector }),
  setSectorClassification: (sectorClassification) => set({ sectorClassification }),

  compareCodes: ["13010", "13050"],
  setCompareCodes: (compareCodes) => set({ compareCodes }),
}));
