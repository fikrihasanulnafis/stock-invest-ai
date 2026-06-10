import React, { useState, useEffect } from 'react';
import Marquee from "react-fast-marquee";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as LineTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ── DATA DUMMY fallback ──────────────────────────────────────────────────────
const DUMMY_GAINERS = [
  { code: 'BRMS', name: 'Bumi Resources Minerals', price: '238', change: '8.97%' },
  { code: 'BREN', name: 'Barito Renewables Energy', price: '9,900', change: '6.78%' },
  { code: 'AMMN', name: 'Amman Mineral Internasional', price: '10,075', change: '5.34%' },
  { code: 'MDKA', name: 'Merdeka Copper Gold', price: '2,610', change: '4.21%' },
  { code: 'CTRA', name: 'Ciputra Development', price: '1,150', change: '3.60%' },
];

const DUMMY_LOSERS = [
  { code: 'GOTO', name: 'GoTo Gojek Tokopedia', price: '52', change: '3.70%' },
  { code: 'MAPI', name: 'Mitra Adiperkasa', price: '1,435', change: '2.72%' },
  { code: 'PTRO', name: 'Petrosea', price: '3,610', change: '2.43%' },
  { code: 'TLKM', name: 'Telkom Indonesia', price: '2,780', change: '0.36%' },
  { code: 'EXCL', name: 'XL Axiata', price: '2,280', change: '0.22%' },
];

const DUMMY_LIVE_MARKET = [
  { code: 'IHSG', price: '7102', change: 0.68 },
  { code: 'BBCA', price: '9775', change: 1.02 },
  { code: 'BBRI', price: '4970', change: 0.81 },
  { code: 'BMRI', price: '6100', change: 1.16 },
  { code: 'TLKM', price: '2780', change: -0.36 },
  { code: 'ASII', price: '4760', change: 0.42 },
  { code: 'UNTR', price: '23500', change: 1.30 },
  { code: 'BRMS', price: '238', change: 8.97 },
  { code: 'BREN', price: '9900', change: 6.78 },
  { code: 'AMMN', price: '10075', change: 5.34 },
  { code: 'GOTO', price: '52', change: -3.70 },
  { code: 'MAPI', price: '1435', change: -2.72 },
];

const DUMMY_SECTORS = [
  { name: 'Basic Materials', value: 82 },
  { name: 'Energy', value: 74 },
  { name: 'Financials', value: 68 },
  { name: 'Industrials', value: 60 },
  { name: 'Consumer Cyclical', value: 45 },
  { name: 'Healthcare', value: 38 },
  { name: 'Telecommunication', value: 22 },
  { name: 'Property', value: 18 },
  { name: 'Consumer Non-Cyclical', value: 12 },
];

const DUMMY_AI_PICKS = [
  { rank: 1, code: 'BBCA', name: 'Bank Central Asia Tbk.', returnVal: '+3.21%', confidence: 82, color: '#3b82f6' },
  { rank: 2, code: 'BRMS', name: 'Bumi Resources Minerals Tbk.', returnVal: '+4.56%', confidence: 78, color: '#10b981' },
  { rank: 3, code: 'BBRI', name: 'Bank Rakyat Indonesia Tbk.', returnVal: '+2.87%', confidence: 75, color: '#3b82f6' },
];

// Forecast data dengan harga Rp per periode
const generateForecastData = (periode) => {
  const baseData = {
    '1W': {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'F1', 'F2', 'F3', 'F4', 'F5'],
      ASII:  [4760, 4790, 4820, 4800, 4850, null, null, null, null, null],
      UNTR:  [23500, 23650, 23400, 23700, 23800, null, null, null, null, null],
      TLKM:  [2780, 2760, 2790, 2750, 2770, null, null, null, null, null],
      BBCA:  [9775, 9800, 9850, 9820, 9900, null, null, null, null, null],
      ASII_f:  [null, null, null, null, 4850, 4880, 4910, 4940, 4900, 4930],
      UNTR_f:  [null, null, null, null, 23800, 23950, 24100, 24050, 24200, 24300],
      TLKM_f:  [null, null, null, null, 2770, 2755, 2740, 2760, 2745, 2730],
      BBCA_f:  [null, null, null, null, 9900, 9950, 9980, 10020, 10050, 10100],
    },
    '1M': {
      labels: ['1 Mei','5 Mei','9 Mei','13 Mei','17 Mei','21 Mei','25 Mei','F1','F2','F3'],
      ASII:  [4600, 4650, 4700, 4760, 4800, 4820, 4850, null, null, null],
      UNTR:  [22800, 22950, 23100, 23300, 23500, 23650, 23800, null, null, null],
      TLKM:  [2850, 2830, 2810, 2800, 2790, 2780, 2770, null, null, null],
      BBCA:  [9500, 9580, 9650, 9700, 9750, 9800, 9900, null, null, null],
      ASII_f:  [null, null, null, null, null, null, 4850, 4900, 4960, 5010],
      UNTR_f:  [null, null, null, null, null, null, 23800, 24000, 24200, 24400],
      TLKM_f:  [null, null, null, null, null, null, 2770, 2750, 2730, 2710],
      BBCA_f:  [null, null, null, null, null, null, 9900, 9980, 10050, 10120],
    },
    '3M': {
      labels: ['Mar','Apr 1','Apr 2','Mei 1','Mei 2','Jun 1','Jun 2','F1','F2','F3'],
      ASII:  [4200, 4300, 4450, 4600, 4700, 4760, 4850, null, null, null],
      UNTR:  [21000, 21500, 22000, 22500, 23000, 23500, 23800, null, null, null],
      TLKM:  [3100, 3050, 3000, 2950, 2900, 2850, 2780, null, null, null],
      BBCA:  [9000, 9100, 9250, 9400, 9600, 9750, 9900, null, null, null],
      ASII_f:  [null, null, null, null, null, null, 4850, 4950, 5050, 5150],
      UNTR_f:  [null, null, null, null, null, null, 23800, 24200, 24600, 25000],
      TLKM_f:  [null, null, null, null, null, null, 2780, 2750, 2720, 2700],
      BBCA_f:  [null, null, null, null, null, null, 9900, 10050, 10200, 10350],
    },
  };

  const d = baseData[periode] || baseData['1M'];
  return d.labels.map((label, i) => ({
    label,
    ASII: d.ASII[i],
    UNTR: d.UNTR[i],
    TLKM: d.TLKM[i],
    BBCA: d.BBCA[i],
    ASII_f: d.ASII_f[i],
    UNTR_f: d.UNTR_f[i],
    TLKM_f: d.TLKM_f[i],
    BBCA_f: d.BBCA_f[i],
    isForecast: label.startsWith('F'),
  }));
};

const FORECAST_SUMMARY_BY_PERIOD = {
  '1W': [
    { code: 'ASII', color: '#3b82f6', hargaSkrg: 4850, hargaForecast: 4930, positive: true },
    { code: 'UNTR', color: '#10b981', hargaSkrg: 23800, hargaForecast: 24300, positive: true },
    { code: 'TLKM', color: '#f59e0b', hargaSkrg: 2770, hargaForecast: 2730, positive: false },
    { code: 'BBCA', color: '#8b5cf6', hargaSkrg: 9900, hargaForecast: 10100, positive: true },
  ],
  '1M': [
    { code: 'ASII', color: '#3b82f6', hargaSkrg: 4850, hargaForecast: 5010, positive: true },
    { code: 'UNTR', color: '#10b981', hargaSkrg: 23800, hargaForecast: 24400, positive: true },
    { code: 'TLKM', color: '#f59e0b', hargaSkrg: 2770, hargaForecast: 2710, positive: false },
    { code: 'BBCA', color: '#8b5cf6', hargaSkrg: 9900, hargaForecast: 10120, positive: true },
  ],
  '3M': [
    { code: 'ASII', color: '#3b82f6', hargaSkrg: 4850, hargaForecast: 5150, positive: true },
    { code: 'UNTR', color: '#10b981', hargaSkrg: 23800, hargaForecast: 25000, positive: true },
    { code: 'TLKM', color: '#f59e0b', hargaSkrg: 2770, hargaForecast: 2700, positive: false },
    { code: 'BBCA', color: '#8b5cf6', hargaSkrg: 9900, hargaForecast: 10350, positive: true },
  ],
};

const LINE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const STOCK_KEYS = ['ASII', 'UNTR', 'TLKM', 'BBCA'];

function sectorColor(value) {
  if (value >= 60) return '#22c55e';
  if (value >= 40) return '#84cc16';
  if (value >= 25) return '#eab308';
  return '#ef4444';
}

// ── Custom Tooltip Forecast ──────────────────────────────────────────────────
const ForecastTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: '#0b1121', border: '1px solid #334155', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: '#94a3b8', marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((p, i) => (
        p.value != null && (
          <p key={i} style={{ color: p.color, fontWeight: 'bold', fontSize: 12, margin: '2px 0' }}>
            {p.name.replace('_f', ' (Forecast)')}: Rp {Number(p.value).toLocaleString('id-ID')}
          </p>
        )
      ))}
    </div>
  );
};

// ── KOMPONEN UTAMA ───────────────────────────────────────────────────────────
export default function Market() {
  const [marketData, setMarketData] = useState({
    topGainers: DUMMY_GAINERS,
    topLosers: DUMMY_LOSERS,
  });
  const [liveMarket, setLiveMarket] = useState(DUMMY_LIVE_MARKET);
  const [isMarketLoading, setIsMarketLoading] = useState(true);
  const [forecastPeriode, setForecastPeriode] = useState('1M');
  const forecastData = generateForecastData(forecastPeriode);
  const forecastSummary = FORECAST_SUMMARY_BY_PERIOD[forecastPeriode];

  // Cari titik pisah historis vs forecast untuk ReferenceLine
  const splitIndex = forecastData.findIndex(d => d.isForecast);
  const splitLabel = splitIndex > 0 ? forecastData[splitIndex].label : null;

  useEffect(() => {
    setIsMarketLoading(true);
    Promise.all([
      fetch('http://localhost:8000/api/market-movers').then(r => r.json()).catch(() => null),
      fetch('http://localhost:8000/api/live-market').then(r => r.json()).catch(() => null),
    ]).then(([movers, live]) => {
      if (movers?.topGainers?.length) {
        setMarketData({
          topGainers: movers.topGainers,
          topLosers: movers.topLosers,
        });
      }
      if (live?.stocks?.length) {
        const allStocks = live.ihsg
          ? [{ code: 'IHSG', price: live.ihsg.close, change: live.ihsg.change }, ...live.stocks]
          : live.stocks;
        setLiveMarket(allStocks);
      }
      setIsMarketLoading(false);
    });
  }, []);

  if (isMarketLoading) {
    return (
      <div className="flex justify-center items-center h-96 bg-[#131b2f] rounded-xl border border-slate-800">
        <div className="text-emerald-500 font-bold text-xl animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          Memuat Data Pasar...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Market Movers</h2>
          <p className="text-slate-500 text-xs mt-1">Terakhir diperbarui: {new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' })} WIB</p>
        </div>
        <span className="bg-emerald-500/10 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
          Live Market Data
        </span>
      </div>

      {/* ── TICKER MARQUEE ── */}
      <div className="bg-[#0b1121] border-y border-slate-800 py-2 rounded-lg overflow-hidden">
        <Marquee speed={30} gradient={false} pauseOnHover={true}>
          {liveMarket.map((stock, index) => (
            <div key={index} className="mx-5 flex items-center gap-2 text-sm">
              <span className="font-bold text-white">{stock.code}</span>
              <span className="text-slate-300">Rp {Number(stock.price).toLocaleString('id-ID')}</span>
              <span className={Number(stock.change) >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {Number(stock.change) >= 0 ? '▲' : '▼'} {Math.abs(Number(stock.change)).toFixed(2)}%
              </span>
              <span className="text-slate-700 ml-3">|</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── ROW 1: TOP GAINERS + TOP LOSERS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Top Gainers */}
        <div className="bg-[#131b2f] p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              TOP GAINERS
            </h3>
            <span className="text-emerald-500 text-xs bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">AI Detected</span>
          </div>
          <div className="space-y-2">
            {marketData.topGainers.map((stock, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-slate-800/40 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-4">{index + 1}</span>
                  <strong className="text-sm text-white">{stock.code}</strong>
                  <span className="text-slate-500 text-xs">Rp {stock.price}</span>
                </div>
                <span className="text-emerald-400 font-bold text-sm">▲ {stock.change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-[#131b2f] p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              TOP LOSERS
            </h3>
            <span className="text-red-500 text-xs bg-red-500/10 px-2 py-1 rounded border border-red-500/20">AI Detected</span>
          </div>
          <div className="space-y-2">
            {marketData.topLosers.map((stock, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-slate-800/40 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs w-4">{index + 1}</span>
                  <strong className="text-sm text-white">{stock.code}</strong>
                  <span className="text-slate-500 text-xs">Rp {stock.price}</span>
                </div>
                <span className="text-red-400 font-bold text-sm">▼ {stock.change}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── ROW 2: SEKTOR ROTATION + AI PICKS ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Sektor Rotation */}
        <div className="bg-[#131b2f] p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">SEKTOR ROTATION <span className="text-slate-500 text-xs font-normal">(1D)</span></h3>
          </div>
          <div className="space-y-3">
            {DUMMY_SECTORS.map((sector) => (
              <div key={sector.name} className="flex items-center gap-3">
                <span className="text-slate-400 text-xs w-40 shrink-0">{sector.name}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${sector.value}%`, backgroundColor: sectorColor(sector.value) }}
                  ></div>
                </div>
                <span className="text-slate-500 text-xs w-6 text-right">{sector.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Picks of the Day */}
        <div className="bg-[#131b2f] p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500"></div>
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">AI PICKS OF THE DAY</h3>
            <span className="text-slate-500 text-xs italic">*Bukan saran investasi</span>
          </div>
          <div className="space-y-3">
            {DUMMY_AI_PICKS.map((pick) => (
              <div key={pick.code} className="bg-[#0b1121] p-4 rounded-lg border border-slate-800 flex items-center gap-3 hover:border-yellow-500/30 transition-colors">
                <span className="text-yellow-400 font-bold text-lg w-5">{pick.rank}</span>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white text-sm shrink-0"
                  style={{ backgroundColor: pick.color + '33', border: `1px solid ${pick.color}55` }}
                >
                  {pick.code.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm">{pick.code}</div>
                  <div className="text-slate-500 text-xs truncate">{pick.name}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-emerald-400 font-bold text-sm">{pick.returnVal}</div>
                  <div className="text-slate-500 text-xs">Conf. <span className="text-yellow-400 font-bold">{pick.confidence}%</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── ROW 3: FORECAST PORTFOLIO FULL WIDTH ── */}
      <div className="bg-[#131b2f] p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500"></div>

        {/* Header + Kontrol Periode */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
          <div>
            <h3 className="font-bold text-white text-base">FORECAST PORTOFOLIO <span className="text-slate-500 text-xs font-normal">(Exponential Smoothing)</span></h3>
            <div className="flex gap-4 mt-2 flex-wrap">
              {STOCK_KEYS.map((k, i) => (
                <span key={k} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-4 h-0.5 inline-block rounded" style={{ backgroundColor: LINE_COLORS[i] }}></span>
                  {k}
                  <span className="text-slate-600 ml-0.5">- - - Forecast</span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Pilihan Periode */}
            <div className="flex gap-1 bg-[#0b1121] border border-slate-700 rounded-lg p-1">
              {['1W', '1M', '3M'].map(p => (
                <button
                  key={p}
                  onClick={() => setForecastPeriode(p)}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    forecastPeriode === p
                      ? 'bg-purple-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === '1W' ? '1 Minggu' : p === '1M' ? '1 Bulan' : '3 Bulan'}
                </button>
              ))}
            </div>
            <span className="bg-indigo-500/20 text-indigo-400 text-xs font-bold px-3 py-1.5 rounded border border-indigo-500/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping inline-block"></span>
              AI Forecasting Active
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={forecastData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: '#475569' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `Rp ${Number(v).toLocaleString('id-ID')}`}
                width={90}
              />
              <LineTooltip content={<ForecastTooltip />} />
              {splitLabel && (
                <ReferenceLine
                  x={splitLabel}
                  stroke="#475569"
                  strokeDasharray="4 3"
                  label={{ value: 'FORECAST →', fill: '#64748b', fontSize: 10, position: 'insideTopRight' }}
                />
              )}
              {/* Garis historis */}
              {STOCK_KEYS.map((k, i) => (
                <Line
                  key={k}
                  type="monotone"
                  dataKey={k}
                  stroke={LINE_COLORS[i]}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: LINE_COLORS[i] }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  name={k}
                />
              ))}
              {/* Garis forecast (putus-putus) */}
              {STOCK_KEYS.map((k, i) => (
                <Line
                  key={k + '_f'}
                  type="monotone"
                  dataKey={k + '_f'}
                  stroke={LINE_COLORS[i]}
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3, fill: LINE_COLORS[i] }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  name={k + '_f'}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Forecast Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-800">
          {forecastSummary.map((s) => {
            const selisih = s.hargaForecast - s.hargaSkrg;
            const pct = ((selisih / s.hargaSkrg) * 100).toFixed(2);
            return (
              <div key={s.code} className="bg-[#0b1121] p-4 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: s.color }}></span>
                    <span className="text-white font-bold text-sm">{s.code}</span>
                  </div>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {s.positive ? '+' : ''}{pct}%
                  </span>
                </div>
                <div className="text-slate-500 text-xs mb-1">Harga Sekarang</div>
                <div className="text-white font-semibold text-sm">Rp {s.hargaSkrg.toLocaleString('id-ID')}</div>
                <div className="text-slate-500 text-xs mt-2 mb-1">Target Forecast ({forecastPeriode})</div>
                <div className={`font-bold text-base ${s.positive ? 'text-emerald-400' : 'text-red-400'}`}>
                  Rp {s.hargaForecast.toLocaleString('id-ID')}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-start gap-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Titik putus-putus merupakan estimasi harga ke depan berdasarkan model Exponential Smoothing. Bukan merupakan saran investasi.
          </p>
        </div>
      </div>

    </div>
  );
}