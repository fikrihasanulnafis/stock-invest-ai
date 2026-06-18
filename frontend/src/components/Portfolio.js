import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as PieTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import Marquee from "react-fast-marquee";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

const sparkData = [
  [{ v: 10 }, { v: 14 }, { v: 11 }, { v: 16 }, { v: 13 }, { v: 18 }, { v: 15 }],
  [{ v: 8 }, { v: 12 }, { v: 10 }, { v: 15 }, { v: 13 }, { v: 17 }, { v: 16 }],
  [{ v: 14 }, { v: 11 }, { v: 15 }, { v: 12 }, { v: 16 }, { v: 14 }, { v: 18 }],
  [{ v: 6 }, { v: 9 }, { v: 7 }, { v: 11 }, { v: 9 }, { v: 13 }, { v: 10 }],
];

function MiniSparkline({ data, color }) {
  const id = `grad-${color.replace("#", "")}`;
  return (
    <ResponsiveContainer width="100%" height={50}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ── localStorage keys ─────────────────────────────────────────────────────
const LS = {
  STOCKS: "si_stocks",
  BUDGET: "si_budget",
  PERIOD: "si_period",
  PORTFOLIO: "si_portfolio",
  ACTION: "si_action",
  METRICS: "si_metrics",
};

const DEFAULT_METRICS = {
  expectedReturn: 0,
  dailyReturn: 0,
  monthlyReturn: 0,
  annualReturn: 0,
  annualVolatility: 0,
  sharpeRatio: 0,
  varDaily: 0,
  varMonthly: 0,
  varAnnual: 0,
  varDailyRp: 0,
  varMonthlyRp: 0,
  varAnnualRp: 0,
  varValue: 0,
  varPercentage: 0,
  riskLevel: "-",
};

function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}
function lsSet(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {}
}

export default function Portfolio() {
  // ── State — baca dari localStorage ─────────────────────────────────
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [stockInput, setStockInput] = useState(
    () => localStorage.getItem(LS.STOCKS) || "",
  );
  const [budgetInput, setBudgetInput] = useState(
    () => localStorage.getItem(LS.BUDGET) || "",
  );
  const [period, setPeriod] = useState(
    () => localStorage.getItem(LS.PERIOD) || "1y",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [portfolioData, setPortfolioData] = useState(() =>
    lsGet(LS.PORTFOLIO, [{ name: "Belum ada data", value: 100 }]),
  );
  const [actionPlan, setActionPlan] = useState(() => lsGet(LS.ACTION, []));
  const [metrics, setMetrics] = useState(() =>
    lsGet(LS.METRICS, DEFAULT_METRICS),
  );
  const [liveMarket, setLiveMarket] = useState([]);
  const [ihsg, setIHSG] = useState(null);
  const [currentTime, setCurrentTime] = useState("");

  // ── Persist input ke localStorage ──────────────────────────────────
  useEffect(() => {
    localStorage.setItem(LS.STOCKS, stockInput);
  }, [stockInput]);
  useEffect(() => {
    localStorage.setItem(LS.BUDGET, budgetInput);
  }, [budgetInput]);
  useEffect(() => {
    localStorage.setItem(LS.PERIOD, period);
  }, [period]);

  // ── Waktu ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fmt = () =>
      setCurrentTime(
        new Date().toLocaleString("id-ID", {
          timeZone: "Asia/Jakarta",
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) + " WIB",
      );
    fmt();
    const t = setInterval(fmt, 60000);
    return () => clearInterval(t);
  }, []);

  // ── Live market ticker ──────────────────────────────────────────────
  useEffect(() => {
    const load = () => {
     fetch(`${API_URL}/api/live-market`)
        .then((r) => r.json())
        .then((d) => {
          setLiveMarket(d.stocks || []);
          setIHSG(d.ihsg || null);
        })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  // ── Simulasi ────────────────────────────────────────────────────────
  const handleSimulate = async () => {
    if (!stockInput || !budgetInput) {
      alert("Masukkan kode saham dan budget.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stocks: stockInput,
          budget: parseFloat(budgetInput),
          period,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setPortfolioData(data.chartData);
        setActionPlan(data.actionPlan || []);
        setMetrics(data.metrics);
        // ── Persist hasil analisis ──────────────────────────────────
        lsSet(LS.PORTFOLIO, data.chartData);
        lsSet(LS.ACTION, data.actionPlan || []);
        lsSet(LS.METRICS, data.metrics);
      } else {
        alert("Error dari server: " + data.detail);
      }
    } catch {
      alert("Gagal terhubung ke backend Python.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Clear semua ─────────────────────────────────────────────────────
  const handleClear = () => {
    setStockInput("");
    setBudgetInput("");
    setPeriod("1y");
    setPortfolioData([{ name: "Belum ada data", value: 100 }]);
    setActionPlan([]);
    setMetrics(DEFAULT_METRICS);
    Object.values(LS).forEach((k) => localStorage.removeItem(k));
  };

  const budgetNum = parseFloat(budgetInput) || 0;
  const hasResult = actionPlan.length > 0;

  return (
    <div className="space-y-5">
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">DASHBOARD PORTOFOLIO</h2>
        <span className="text-xs text-slate-500">{currentTime}</span>
      </div>

      {/* ── TICKER ─────────────────────────────────────────────────── */}
      <div className="bg-[#0b1121] border border-slate-800 rounded py-2">
        <Marquee speed={25} gradient={false} pauseOnHover>
          {ihsg && (
            <div className="mx-4 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span className="font-bold text-white">IHSG</span>
              <span className="text-slate-300">
                {ihsg.close?.toLocaleString("id-ID")}
              </span>
              <span
                className={
                  ihsg.change >= 0 ? "text-emerald-400" : "text-red-400"
                }>
                {ihsg.change >= 0 ? "▲" : "▼"} {Math.abs(ihsg.change)}%
              </span>
              <span className="text-slate-700 mx-2">|</span>
            </div>
          )}
          {liveMarket.map((s, i) => (
            <div key={i} className="mx-4 flex items-center gap-2 text-sm">
              <span className="font-semibold text-white">{s.code}</span>
              <span className="text-slate-400">
                Rp {Number(s.price).toLocaleString("id-ID")}
              </span>
              <span
                className={s.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                {s.change >= 0 ? "▲" : "▼"} {Math.abs(s.change)}%
              </span>
              <span className="text-slate-700 mx-2">|</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── 4 METRIC CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            title: "Total Nilai Simulasi",
            val: budgetInput
              ? `Rp ${Number(budgetInput).toLocaleString("id-ID")}`
              : "Rp 0",
            color: "#3b82f6",
            bg: "bg-blue-500",
            spark: 0,
          },
          {
            title: "Expected Annual Return",
            val: `${metrics.annualReturn ?? 0}%`,
            sub: "(1 Year)",
            color: "#10b981",
            bg: "bg-emerald-500",
            spark: 1,
          },
          {
            title: "Annual Volatility",
            val: `${metrics.annualVolatility ?? 0}%`,
            sub: "(1 Year)",
            color: "#8b5cf6",
            bg: "bg-purple-500",
            spark: 2,
          },
          {
            title: "Value at Risk (95%)",
            val: `${metrics.varPercentage ?? 0}%`,
            sub: `Rp ${metrics.varValue ? Number(metrics.varValue).toLocaleString("id-ID") : "0"}`,
            extra: "(1 Month)",
            subColor: "text-orange-400",
            color: "#f59e0b",
            bg: "bg-orange-500",
            spark: 3,
          },
        ].map((card, i) => (
          <div
            key={i}
            className="bg-[#131b2f] border border-slate-700 rounded overflow-hidden flex flex-col">
            <div className={`h-0.5 ${card.bg}`}></div>
            <div className="p-5 flex justify-between items-start">
              <div>
                <h3 className="text-slate-400 text-[15px] font-semibold uppercase tracking-wider mb-2">
                  {card.title}
                </h3>
                <p className="text-xl font-bold text-white">{card.val}</p>
                {card.sub && (
                  <p
                    className={`text-xs mt-1 ${card.subColor || "text-slate-600"}`}>
                    {card.sub}
                  </p>
                )}

                {card.extra && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    {card.extra}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-auto px-1 pb-1">
              <MiniSparkline data={sparkData[card.spark]} color={card.color} />
            </div>
          </div>
        ))}
      </div>

      {/* ── DONUT + ANALISIS RETURN ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Donut */}
        <div className="bg-[#131b2f] border border-slate-700 rounded p-5">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">
            Alokasi Optimal (Markowitz)
          </h3>
          <div className="flex items-center justify-center gap-8">
            <div className="relative w-72 h-72 flex-shrink-0 ml-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    innerRadius={85}
                    outerRadius={130}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none">
                    {portfolioData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip
                    contentStyle={{
                      backgroundColor: "#0b1121",
                      borderColor: "#334155",
                      borderRadius: "4px",
                      color: "#fff",
                    }}
                    formatter={(v) => [`${v}%`, ""]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-slate-500 text-[10px]">Jumlah Saham</span>
                <span className="text-3xl font-bold text-white">
                  {portfolioData.filter((d) => d.name !== "Belum ada data")
                    .length || portfolioData.length}
                </span>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {portfolioData.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between w-2/3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{
                        backgroundColor: COLORS[idx % COLORS.length],
                      }}></div>
                    <span className="text-white text-sm font-semibold">
                      {item.name}
                    </span>
                  </div>
                  <span className="text-slate-300 text-sm font-bold tabular-nums">
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analisis Return */}
        <div className="bg-[#131b2f] border border-slate-700 rounded p-5">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">
            Analisis Return Portfolio
          </h3>
          <div className="space-y-2.5">
            {[
              {
                label: "Return Harian (Expected)",
                val: metrics.dailyReturn,
                valColor: "text-emerald-400",
              },
              {
                label: "Return Bulanan (Expected)",
                val: metrics.monthlyReturn,
                valColor: "text-emerald-400",
              },
              {
                label: "Return Tahunan (Expected)",
                val: metrics.annualReturn,
                valColor: "text-emerald-400",
              },
              {
                label: "Annual Volatility (Risiko)",
                val: metrics.annualVolatility,
                valColor: "text-purple-400",
              },
            ].map((row, i) => (
              <div
                key={i}
                className="bg-[#0b1121] border border-slate-800 rounded p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded border border-slate-700 bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <rect x="2" y="12" width="3" height="10" fill="#64748b" />
                      <rect x="7" y="7" width="3" height="15" fill="#64748b" />
                      <rect x="12" y="4" width="3" height="18" fill="#64748b" />
                      <rect x="17" y="9" width="3" height="13" fill="#64748b" />
                      <polyline
                        points="3,18 8,13 13,15 21,7"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                      <polyline
                        points="18,7 21,7 21,10"
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    </svg>
                  </div>
                  <span className="text-slate-300 text-sm">{row.label}</span>
                </div>
                <span className={`font-bold text-base ${row.valColor}`}>
                  {row.val ?? 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── INPUT SIMULASI ─────────────────────────────────────────── */}
      <div className="bg-[#131b2f] border border-slate-700 rounded p-5">
        <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">
          Parameter Simulasi
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 block">
              Ticker Saham (.JK)
            </label>
            <input
              type="text"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              placeholder="Contoh: BBCA, TLKM, ADRO"
              className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 block">
              Total Budget (Rp)
            </label>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Contoh: 10000000"
              className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1.5 block">
              Periode Data
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all">
              <option value="6mo">6 Bulan</option>
              <option value="1y">1 Tahun</option>
              <option value="2y">2 Tahun</option>
              <option value="3y">3 Tahun</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSimulate}
              disabled={isLoading}
              className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 font-bold py-3 rounded hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 text-xs uppercase tracking-wider">
              {isLoading ? "Memproses..." : "Optimalisasi"}
            </button>
            <button
              onClick={handleClear}
              disabled={isLoading}
              className="px-4 bg-red-500/10 text-red-400 border border-red-500/40 font-semibold py-3 rounded hover:bg-red-500 hover:text-white transition-all disabled:opacity-50 text-xs"
              title="Hapus semua data">
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* ── RISK METRICS + METRIK TAMBAHAN ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-[#131b2f] border border-slate-700 rounded p-5">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">
            Risk Metrics (Value at Risk 95%)
          </h3>
          <table className="w-full text-sm table-fixed">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold text-left w-1/3">
                  Periode
                </th>
                <th className="text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold text-center w-1/3">
                  Persentase
                </th>
                <th className="text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold text-right w-1/3">
                  Estimasi Kerugian
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {[
                {
                  label: "Harian",
                  pct: metrics.varDaily ?? 0,
                  rp: metrics.varDailyRp ?? 0,
                },
                {
                  label: "Bulanan",
                  pct: metrics.varMonthly ?? 0,
                  rp: metrics.varMonthlyRp ?? metrics.varValue ?? 0,
                },
                {
                  label: "Tahunan",
                  pct: metrics.varAnnual ?? 0,
                  rp: metrics.varAnnualRp ?? 0,
                },
              ].map((row, i) => (
                <tr key={i}>
                  <td className="py-3 text-slate-300">{row.label}</td>
                  <td className="py-3 text-orange-400 font-bold text-center">
                    {row.pct}%
                  </td>
                  <td className="py-3 text-right text-slate-300">
                    Rp {Number(row.rp).toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#131b2f] border border-slate-700 rounded p-5 flex flex-col">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">
            Performance Metrics
          </h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-[#0b1121] border border-slate-800 rounded p-4 flex flex-col items-center justify-center text-center">
              <p className="text-slate-500 text-xs mb-3">
                Sharpe Ratio (1 Year)
              </p>
              <p className="text-3xl font-bold text-white mb-1">
                {metrics.sharpeRatio ?? "—"}
              </p>
              <p className="text-slate-600 text-xs">
                Semakin tinggi semakin baik
              </p>
            </div>
            <div className="bg-[#0b1121] border border-slate-800 rounded p-4 flex flex-col items-center justify-center text-center">
              <p className="text-slate-500 text-xs mb-3">Risk Level (AI)</p>
              <p
                className={`text-3xl font-bold mb-1 ${
                  metrics.riskLevel === "Low"
                    ? "text-emerald-400"
                    : metrics.riskLevel === "Moderate"
                      ? "text-yellow-400"
                      : metrics.riskLevel === "High"
                        ? "text-red-400"
                        : "text-slate-400"
                }`}>
                {metrics.riskLevel === "-"
                  ? "—"
                  : (metrics.riskLevel?.toUpperCase() ?? "—")}
              </p>
              <p className="text-slate-600 text-xs">Berdasarkan volatilitas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ANALISIS PER SAHAM ─────────────────────────────────────── */}
      {hasResult && (
        <div className="bg-[#131b2f] border border-slate-700 rounded p-5">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-4">
            PORTFOLIO STOCK ANALYSIS
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold w-[15%]">
                    Saham
                  </th>
                  <th className="text-center text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold w-[18%]">
                    Alokasi
                  </th>
                  <th className="text-center text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold w-[24%]">
                    Expected Return (1Y)
                  </th>
                  <th className="text-center text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold w-[25%]">
                    VaR 95% (1M)
                  </th>
                  <th className="text-center text-[10px] text-slate-500 uppercase tracking-wider pb-3 font-semibold w-[25%]">
                    Rekomendasi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {actionPlan.map((plan, i) => {
                  const pd = portfolioData.find((p) => p.name === plan.stock);
                  const alloc = pd ? pd.value : 0;
                  return (
                    <tr
                      key={i}
                      className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3">
                        <div className="flex items-center gap-4">
                          <div
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}></div>
                          <span className="text-white font-semibold text-center">
                            {plan.stock}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-300 font-semibold text-center">
                        {alloc}%
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`font-bold ${Number(plan.indReturn) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {Number(plan.indReturn) >= 0 ? "+" : ""}
                          {plan.indReturn}%
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 text-center">
                        {plan.indVar}%
                      </td>
                      <td className="py-3 text-center">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded border text-center ${
                            plan.color === "green"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : plan.color === "yellow"
                                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                                : "bg-red-500/10 text-red-400 border-red-500/30"
                          }`}>
                          {plan.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-700 text-center pb-2">
        Catatan: Semua perhitungan menggunakan data historis dan simulasi Monte
        Carlo.
      </p>
    </div>
  );
}
