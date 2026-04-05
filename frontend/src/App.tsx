import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavLink, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import CompareView from "./views/CompareView";
import FinancialView from "./views/FinancialView";
import SectorView from "./views/SectorView";
import StockView from "./views/StockView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
});

const NAV_ITEMS = [
  { to: "/", label: "銘柄" },
  { to: "/sectors", label: "業種" },
  { to: "/compare", label: "比較" },
  { to: "/financials", label: "財務" },
];

const navStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  textDecoration: "none",
  color: isActive ? "#1a56db" : "#374151",
  borderBottom: isActive ? "2px solid #1a56db" : "2px solid transparent",
  fontWeight: isActive ? 600 : 400,
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <header
          style={{
            borderBottom: "1px solid #e5e7eb",
            padding: "0 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontWeight: 700, marginRight: 16 }}>J-Quants Viewer</span>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              style={({ isActive }) => navStyle(isActive)}
            >
              {item.label}
            </NavLink>
          ))}
        </header>

        <main>
          <Routes>
            <Route path="/" element={<StockView />} />
            <Route path="/sectors" element={<SectorView />} />
            <Route path="/compare" element={<CompareView />} />
            <Route path="/financials" element={<FinancialView />} />
          </Routes>
        </main>
      </Router>
    </QueryClientProvider>
  );
}
