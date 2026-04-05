import { useState, useEffect, useRef } from "react";
import type { StockMaster } from "../api/types";

interface Props {
  stocks: StockMaster[];
  value: string;
  onChange: (code: string) => void;
  style?: React.CSSProperties;
}

export default function StockPicker({ stocks, value, onChange, style }: Props) {
  const selected = stocks.find((s) => s.code === value);
  const [query, setQuery] = useState(selected ? `${selected.code} ${selected.name}` : "");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 外部 value が変わったとき (例: 他ビューから戻ってきた) に表示を同期
  useEffect(() => {
    const s = stocks.find((s) => s.code === value);
    setQuery(s ? `${s.code} ${s.name}` : "");
  }, [value, stocks]);

  // リスト外クリックで閉じる
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        // 未確定のまま閉じた場合は元の値に戻す
        const s = stocks.find((s) => s.code === value);
        setQuery(s ? `${s.code} ${s.name}` : "");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [value, stocks]);

  const filtered = query
    ? stocks
        .filter(
          (s) =>
            s.code.includes(query.toUpperCase()) ||
            s.name.includes(query)
        )
        .slice(0, 50)
    : stocks;

  const handleSelect = (s: StockMaster) => {
    onChange(s.code);
    setQuery(`${s.code} ${s.name}`);
    setOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block", ...style }}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="コードまたは銘柄名で検索"
        style={{ width: 200, padding: "2px 6px" }}
      />
      {open && filtered.length > 0 && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            zIndex: 100,
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            maxHeight: 240,
            overflowY: "auto",
            margin: 0,
            padding: 0,
            listStyle: "none",
            minWidth: 260,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {filtered.map((s) => (
            <li
              key={s.code}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: "4px 10px",
                cursor: "pointer",
                background: s.code === value ? "#e8f0fe" : undefined,
                fontSize: 13,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLLIElement).style.background = "#f0f4ff")}
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLLIElement).style.background =
                  s.code === value ? "#e8f0fe" : "")
              }
            >
              <span style={{ fontWeight: 600, marginRight: 6 }}>{s.code}</span>
              {s.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
