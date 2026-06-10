import React, { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip as PieTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import Marquee from "react-fast-marquee";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];

// Mini sparkline dummy data untuk cards
const sparkData = [
  [{ v: 10 }, { v: 14 }, { v: 11 }, { v: 16 }, { v: 13 }, { v: 18 }, { v: 15 }],
  [{ v: 8 }, { v: 12 }, { v: 10 }, { v: 15 }, { v: 13 }, { v: 17 }, { v: 16 }],
  [{ v: 14 }, { v: 11 }, { v: 15 }, { v: 12 }, { v: 16 }, { v: 14 }, { v: 18 }],
  [{ v: 6 }, { v: 9 }, { v: 7 }, { v: 11 }, { v: 9 }, { v: 13 }, { v: 10 }],
];

function MiniSparkline({ data, color }) {
  return (
    <ResponsiveContainer width="100%" height={50}>
      <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill={`url(#grad-${color})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function Portfolio() {
  const [stockInput, setStockInput] = useState('');
  const [budgetInput, setBudgetInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [period, setPeriod] = useState("1y");

  const [portfolioData, setPortfolioData] = useState([
    { name: 'Belum ada data', value: 100 }
  ]);

  const [actionPlan, setActionPlan] = useState([]);

  const [metrics, setMetrics] = useState({
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
    riskLevel: '-'
  });

  const [liveMarket, setLiveMarket] = useState([]);
  const [ihsg, setIHSG] = useState(null);

  // Format tanggal & waktu WIB
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const opts = { timeZone: 'Asia/Jakarta', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
      setCurrentTime(now.toLocaleString('id-ID', opts) + ' WIB');
    };
    update();
    const t = setInterval(update, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const loadMarket = () => {
      fetch("http://localhost:8000/api/live-market")
        .then(res => res.json())
        .then(data => {
          setLiveMarket(data.stocks || []);
          setIHSG(data.ihsg || null);
        })
        .catch(err => console.log(err));
    };
    loadMarket();
    const interval = setInterval(loadMarket, 50000);
    return () => clearInterval(interval);
  }, []);

  const handleSimulate = async () => {
    if (!stockInput || !budgetInput) { alert("Masukkan kode saham dan budget."); return; }
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stocks: stockInput,
          budget: parseFloat(budgetInput),
          period: period
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPortfolioData(data.chartData);
        setActionPlan(data.actionPlan || []);
        setMetrics(data.metrics);
      } else {
        alert("Error dari server: " + data.detail);
      }
    } catch (error) {
      alert("Gagal terhubung ke backend Python.");
    } finally {
      setIsLoading(false);
    }
  };

  const budgetNum = parseFloat(budgetInput) || 0;

  return (
    <div className="space-y-6">

      {/* Header baris atas */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Dashboard Portfolio</h2>
        <span className="text-xs text-slate-400">{currentTime}</span>
      </div>

      {/* ===== TICKER MARQUEE ===== */}
      <div className="bg-[#0b1121] border-y border-slate-800 py-2">
        <Marquee speed={25} gradient={false} pauseOnHover={true}>
          {ihsg && (
            <div className="mx-4 flex items-center gap-2">
              <span className="font-bold text-white">IHSG</span>
              <span className="text-emerald-400">{ihsg.close}</span>
              <span className={ihsg.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                {ihsg.change >= 0 ? "▲" : "▼"} {Math.abs(ihsg.change)}%
              </span>
              <span className="text-slate-600">|</span>
            </div>
          )}
          {liveMarket.map((stock, index) => (
            <div key={index} className="mx-4 flex items-center gap-2">
              <span className="font-semibold text-white">{stock.code}</span>
              <span className="text-slate-300">Rp {Number(stock.price).toLocaleString("id-ID")}</span>
              <span className={stock.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                {stock.change >= 0 ? "▲" : "▼"} {Math.abs(stock.change)}%
              </span>
              <span className="text-slate-600">|</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ===== TOP METRICS CARDS (4 cards) ===== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        {/* Card 1: Total Nilai Simulasi */}
        <div className="bg-[#131b2f] rounded-xl border border-slate-700 shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="p-5 flex justify-between items-start">
            <div>
              <h3 className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Total Nilai Simulasi</h3>
              <p className="text-2xl font-bold text-white">
                Rp {budgetInput ? Number(budgetInput).toLocaleString('id-ID') : '0'}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center border border-blue-500/30 text-xl">💼</div>
          </div>
          <div className="mt-auto px-1 pb-1">
            <MiniSparkline data={sparkData[0]} color="#3b82f6" />
          </div>
        </div>

        {/* Card 2: Expected Annual Return */}
        <div className="bg-[#131b2f] rounded-xl border border-slate-700 shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="p-5 flex justify-between items-start">
            <div>
              <h3 className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Expected Annual Return</h3>
              <p className="text-3xl font-bold text-white">{metrics.annualReturn ?? 0}%</p>
              <p className="text-slate-500 text-xs mt-1">(1 Tahun)</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 text-xl">📈</div>
          </div>
          <div className="mt-auto px-1 pb-1">
            <MiniSparkline data={sparkData[1]} color="#10b981" />
          </div>
        </div>

        {/* Card 3: Annual Volatility */}
        <div className="bg-[#131b2f] rounded-xl border border-slate-700 shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>
          <div className="p-5 flex justify-between items-start">
            <div>
              <h3 className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Annual Volatility</h3>
              <p className="text-3xl font-bold text-white">{metrics.annualVolatility ?? 0}%</p>
              <p className="text-slate-500 text-xs mt-1">(1 Tahun)</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30 text-xl">🛡️</div>
          </div>
          <div className="mt-auto px-1 pb-1">
            <MiniSparkline data={sparkData[2]} color="#8b5cf6" />
          </div>
        </div>

        {/* Card 4: VaR 95% (1 Month) */}
        <div className="bg-[#131b2f] rounded-xl border border-slate-700 shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500"></div>
          <div className="p-5 flex justify-between items-start">
            <div>
              <h3 className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">VaR 95% (1 Month)</h3>
              <p className="text-3xl font-bold text-white">{metrics.varPercentage ?? 0}%</p>
              <p className="text-orange-400 font-semibold text-sm mt-1">
                Rp {metrics.varValue ? Number(metrics.varValue).toLocaleString('id-ID') : '0'}
              </p>
            </div>
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30 text-xl">⚠️</div>
          </div>
          <div className="mt-auto px-1 pb-1">
            <MiniSparkline data={sparkData[3]} color="#f59e0b" />
          </div>
        </div>

      </div>

      {/* ===== TENGAH: DONUT CHART + ANALISIS RETURN ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Kiri: Alokasi Optimal + Input */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Alokasi Optimal (AI Markowitz)</h3>
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-48 h-48 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={portfolioData}
                    innerRadius={60}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {portfolioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <PieTooltip
                    contentStyle={{ backgroundColor: '#0b1121', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value) => [`${value}%`, '']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-slate-400 text-xs">Jumlah Saham</span>
                <span className="text-3xl font-bold text-white">{portfolioData.filter(d => d.name !== 'Belum ada data').length || portfolioData.length}</span>
              </div>
            </div>

            {/* Legend Saham */}
            <div className="flex-1 space-y-2">
              {portfolioData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-white font-semibold text-sm">{item.name}</span>
                  </div>
                  <span className="text-slate-300 text-sm font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanan: Analisis Return Portfolio */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Analisis Return Portfolio</h3>
          <div className="space-y-3">

            <div className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-base">📅</div>
                <span className="text-slate-300 text-sm">Return Harian (Expected)</span>
              </div>
              <span className="text-emerald-400 font-bold text-lg">{metrics.dailyReturn ?? 0}%</span>
            </div>

            <div className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-emerald-500/20 border border-emerald-500/30 rounded-lg flex items-center justify-center text-base">📅</div>
                <span className="text-slate-300 text-sm">Return Bulanan (Expected)</span>
              </div>
              <span className="text-emerald-400 font-bold text-lg">{metrics.monthlyReturn ?? 0}%</span>
            </div>

            <div className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-cyan-500/20 border border-cyan-500/30 rounded-lg flex items-center justify-center text-base">📅</div>
                <span className="text-slate-300 text-sm">Return Tahunan (Expected)</span>
              </div>
              <span className="text-emerald-400 font-bold text-lg">{metrics.annualReturn ?? 0}%</span>
            </div>

            <div className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center text-base">🔄</div>
                <span className="text-slate-300 text-sm">Annual Volatility (Risiko)</span>
              </div>
              <span className="text-purple-400 font-bold text-lg">{metrics.annualVolatility ?? 0}%</span>
            </div>

          </div>
        </div>
      </div>

      {/* ===== INPUT PARAMETER AI ===== */}
      <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
          <span className="text-emerald-500">⚙️</span> Parameter Simulasi AI
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Ticker Saham (.JK)</label>
            <input
              type="text"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              placeholder="Contoh: BBCA, TLKM, ADRO"
              className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Total Budget (Rp)</label>
            <input
              type="number"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              placeholder="Contoh: 10000000"
              className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2 block">Periode Data</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full p-3 bg-[#0b1121] border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm"
            >
              <option value="6mo">6 Bulan</option>
              <option value="1y">1 Tahun</option>
              <option value="2y">2 Tahun</option>
              <option value="3y">3 Tahun</option>
            </select>
          </div>
          <button
            onClick={handleSimulate}
            disabled={isLoading}
            className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 font-bold py-3 rounded-lg hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 text-sm uppercase tracking-wider"
          >
            {isLoading ? "⏳ Memproses..." : "Optimalisasi (Markowitz)"}
          </button>
        </div>
      </div>

      {/* ===== RISK METRICS TABLE + METRIK TAMBAHAN ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Risk Metrics Table */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Risk Metrics (Value at Risk 95%)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">Horizon</th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">Persentase</th>
                  <th className="text-right text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">Estimasi Kerugian (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                <tr>
                  <td className="py-3 text-slate-300">Harian</td>
                  <td className="py-3 text-orange-400 font-bold">{metrics.varDaily ?? metrics.varPercentage ?? 0}%</td>
                  <td className="py-3 text-right text-slate-300">
                    Rp {metrics.varDailyRp ? Number(metrics.varDailyRp).toLocaleString('id-ID') : (budgetNum * ((metrics.varDaily ?? metrics.varPercentage ?? 0) / 100)).toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300">Bulanan</td>
                  <td className="py-3 text-orange-400 font-bold">{metrics.varMonthly ?? metrics.varPercentage ?? 0}%</td>
                  <td className="py-3 text-right text-slate-300">
                    Rp {metrics.varMonthlyRp ? Number(metrics.varMonthlyRp).toLocaleString('id-ID') : Number(metrics.varValue ?? 0).toLocaleString('id-ID')}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-slate-300">Tahunan</td>
                  <td className="py-3 text-orange-400 font-bold">{metrics.varAnnual ?? metrics.varPercentage ?? 0}%</td>
                  <td className="py-3 text-right text-slate-300">
                    Rp {metrics.varAnnualRp ? Number(metrics.varAnnualRp).toLocaleString('id-ID') : (budgetNum * ((metrics.varAnnual ?? metrics.varPercentage ?? 0) / 100)).toLocaleString('id-ID')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Metrik Tambahan */}
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Metrik Tambahan</h3>
          <div className="grid grid-cols-2 gap-4">

            <div className="bg-[#0b1121] p-5 rounded-xl border border-slate-800 text-center">
              <p className="text-slate-400 text-xs mb-3">Sharpe Ratio (1 Tahun)</p>
              <p className="text-4xl font-bold text-white mb-1">{metrics.sharpeRatio ?? '—'}</p>
              <p className="text-slate-500 text-xs">Semakin tinggi semakin baik</p>
            </div>

            <div className="bg-[#0b1121] p-5 rounded-xl border border-slate-800 text-center">
              <p className="text-slate-400 text-xs mb-3">Risk Level (AI)</p>
              <p className={`text-4xl font-bold mb-1 ${
                metrics.riskLevel === 'Low' ? 'text-emerald-400' :
                metrics.riskLevel === 'Moderate' ? 'text-yellow-400' :
                metrics.riskLevel === 'High' ? 'text-red-400' : 'text-slate-400'
              }`}>
                {metrics.riskLevel === '-' ? '—' : metrics.riskLevel?.toUpperCase()}
              </p>
              <p className="text-slate-500 text-xs">Berdasarkan volatilitas</p>
            </div>

          </div>
        </div>

      </div>

      {/* ===== ANALISIS & REKOMENDASI PER SAHAM (TABLE) ===== */}
      {actionPlan.length > 0 && (
        <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">Analisis & Rekomendasi Per Saham</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">Saham</th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">Alokasi</th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">Expected Return (1Y)</th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">VaR 95% (1M)</th>
                  <th className="text-left text-slate-400 text-xs uppercase tracking-wider pb-3 font-semibold">Rekomendasi AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {actionPlan.map((plan, index) => {
                  // Cari alokasi dari portfolioData
                  const pd = portfolioData.find(p => p.name === plan.stock);
                  const allocation = pd ? pd.value : 0;
                  return (
                    <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-white font-semibold">{plan.stock}</span>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300 font-semibold">{allocation}%</td>
                      <td className="py-4">
                        <span className={`font-bold ${Number(plan.indReturn) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {Number(plan.indReturn) >= 0 ? '' : ''}{plan.indReturn}%
                        </span>
                      </td>
                      <td className="py-4 text-slate-300">{plan.indVar}%</td>
                      <td className="py-4">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded border ${
                          plan.color === 'green' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          plan.color === 'yellow' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/10 text-red-400 border-red-500/30'
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

      {/* Catatan bawah */}
      <p className="text-xs text-slate-600 text-center pb-2">
        Catatan: Semua perhitungan menggunakan data historis dan simulasi Monte Carlo.
      </p>

    </div>
  );
}