import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as LineTooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import Marquee from "react-fast-marquee";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#14b8a6"];

function ForecastTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      backgroundColor: '#0f172a',
      border: '1px solid #334155',
      borderRadius: '4px',
      padding: '10px 14px',
      fontSize: 12,
    }}>
      <p style={{ color: '#94a3b8', marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 600, marginBottom: 2 }}>
          {p.name}: Rp {Number(p.value).toLocaleString('id-ID')}
        </div>
      ))}
    </div>
  );
}

export default function Market() {
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [liveMarket, setLiveMarket] = useState([]);
  const [ihsg, setIhsg]             = useState(null);
  const [forecastPeriod, setForecastPeriod] = useState('3b');

  useEffect(() => {
    const load = () => {
      fetch(`${API_URL}/api/live-market`)
        .then(r => r.json())
        .then(d => { setLiveMarket(d.stocks || []); setIhsg(d.ihsg || null); })
        .catch(() => {});
    };
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
   fetch(`${API_URL}/api/market-movers`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      setTimeStr(now.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }) + ' WIB');
    };
    fmt();
    const t = setInterval(fmt, 60000);
    return () => clearInterval(t);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-[#131b2f] rounded border border-slate-800">
        <div className="text-slate-400 text-sm flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          Memuat data pasar...
        </div>
      </div>
    );
  }

  const topGainers      = data?.topGainers      || [];
  const topLosers       = data?.topLosers        || [];
  const sectorRotation  = data?.sectorRotation   || [];
  const forecastData    = data?.forecastData     || [];
  const forecastFuture  = data?.forecastFuture   || [];
  const forecastSummary = data?.forecastSummary  || [];

  let histSlice = forecastData;
  if (forecastPeriod === '1m')      histSlice = forecastData.slice(-4);
  else if (forecastPeriod === '1b') histSlice = forecastData.slice(-13);

  const forecastCodes = forecastSummary.map(f => f.code);
  const sectorSorted  = [...sectorRotation].sort((a, b) => b.score - a.score);
  const maxAbsScore   = Math.max(...sectorSorted.map(s => Math.abs(s.score)), 1);

  const anchorPoint = histSlice.length > 0
    ? { date: histSlice[histSlice.length - 1]?.date, ...Object.fromEntries(forecastCodes.map(c => [c, histSlice[histSlice.length - 1]?.[c]])) }
    : null;

  const forecastChartData = anchorPoint ? [anchorPoint, ...forecastFuture] : forecastFuture;

  return (
    <div className="space-y-5">

      {/* ── HEADER ── */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-white">MARKET MOVERS</h2>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
          Live Market Data
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Terakhir diperbarui: {timeStr}
            </p>
        </div>
      </div>

      {/* ── TICKER MARQUEE ── */}
      <div className="bg-[#0b1121] border border-slate-800 rounded py-2">
        <Marquee speed={28} gradient={false} pauseOnHover>
          {ihsg && (
            <div className="mx-4 flex items-center gap-2 text-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
              <span className="font-bold text-white">IHSG</span>
              <span className="text-slate-300">{ihsg.close?.toLocaleString('id-ID')}</span>
              <span className={ihsg.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                {ihsg.change >= 0 ? "▲" : "▼"} {Math.abs(ihsg.change)}%
              </span>
              <span className="text-slate-700 mx-2">|</span>
            </div>
          )}

          {liveMarket.map((s, i) => (
            <div key={i} className="mx-4 flex items-center gap-2 text-sm">
              <span className="font-semibold text-white">{s.code}</span>
              <span className="text-slate-400">Rp {Number(s.price).toLocaleString('id-ID')}</span>
              <span className={s.change >= 0 ? "text-emerald-400" : "text-red-400"}>
                {s.change >= 0 ? "▲" : "▼"} {Math.abs(s.change)}%
              </span>
              <span className="text-slate-700 mx-2">|</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* ── BARIS 1: GAINERS (2/5) | LOSERS (2/5) | SEKTOR (1/5) ── */}
      <div className="grid grid-cols-5 gap-4 items-start">

        {/* TOP GAINERS — 2/5 */}
        <div className="col-span-2 bg-[#131b2f] border border-slate-700 rounded overflow-hidden">
          <div className="h-0.5 bg-emerald-500"></div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">Top Gainers</h3>
              
            </div>
            <table className="w-full text-sm">
              <tbody>
                {topGainers.map((s, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0">
                    <td className="py-2 text-slate-500 text-xs w-5">{i + 1}</td>
                    <td className="py-2 font-bold text-white">{s.code}</td>
                    <td className="py-2 text-slate-400 text-xs">{s.price}</td>
                    <td className="py-2 text-right font-bold text-emerald-400">
                      ▲ {Math.abs(s.changeNum ?? parseFloat(s.change)).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP LOSERS — 2/5 */}
        <div className="col-span-2 bg-[#131b2f] border border-slate-700 rounded overflow-hidden">
          <div className="h-0.5 bg-red-500"></div>
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest">Top Losers</h3>
            </div>
            <table className="w-full text-sm">
              <tbody>
                {topLosers.map((s, i) => (
                  <tr key={i} className="border-b border-slate-800/50 last:border-0">
                    <td className="py-2 text-slate-500 text-xs w-5">{i + 1}</td>
                    <td className="py-2 font-bold text-white">{s.code}</td>
                    <td className="py-2 text-slate-400 text-xs">{s.price}</td>
                    <td className="py-2 text-right font-bold text-red-400">
                      ▼ {Math.abs(s.changeNum ?? parseFloat(s.change)).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SEKTOR ROTATION — 1/5 */}
        <div className="col-span-1 bg-[#131b2f] border border-slate-700 rounded overflow-hidden">
          <div className="h-0.5 bg-blue-500"></div>
          <div className="p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-3 flex items-center gap-1.5">
               SECTOR PERFORMANCE
              <span className="text-slate-600 font-normal normal-case tracking-normal text-[10px]">(1D)</span>
            </h3>
            <div className="space-y-2">
              {sectorSorted.map((sec, i) => {
                const pct   = (Math.abs(sec.score) / maxAbsScore) * 100;
                const isPos = sec.score >= 0;
                return (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 w-24 flex-shrink-0 truncate">{sec.sector}</span>
                    <div className="flex-1 bg-slate-800 rounded-sm h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-sm ${isPos ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold w-8 text-right flex-shrink-0 ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sec.score > 0 ? '+' : ''}{sec.score}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* ── BARIS 2: FORECAST FULL WIDTH ── */}
      <div className="bg-[#131b2f] border border-slate-700 rounded overflow-hidden">
        <div className="h-0.5 bg-indigo-500"></div>
        <div className="p-5">

          {/* Header */}
          <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
            <div>
              <h3 className="text-xl font-bold text-white uppercase tracking-widest flex items-center gap-2">
                Forecast Portfolio
                <span className="text-slate-600 font-normal normal-case tracking-normal">(Exponential Smoothing)</span>
              </h3>
              <div className="flex items-center gap-4 mt-1.5">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="inline-block w-5 h-0.5 bg-slate-500 align-middle"></span>
                  Aktual (Historis)
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="inline-block w-5 border-t-2 border-dashed border-slate-500 align-middle"></span>
                  Forecast (5 Minggu)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {[['1m','1 Minggu'],['1b','1 Bulan'],['3b','3 Bulan']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setForecastPeriod(val)}
                  className={`text-xs px-3 py-1 rounded border transition-all ${
                    forecastPeriod === val
                      ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300 font-semibold'
                      : 'border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-2 py-1 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping inline-block"></span>
                Forecasting Active
              </span>
            </div>
          </div>

          {/* Legend saham */}
          {forecastCodes.length > 0 && (
            <div className="flex items-center gap-4 mb-3 flex-wrap">
              <span className="text-xs text-slate-600">Saham Portfolio:</span>
              {forecastCodes.map((code, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block flex-shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  {code}
                </span>
              ))}
            </div>
          )}

          {/* Chart */}
          <div className="h-72">
            {histSlice.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis
                    dataKey="date"
                    allowDuplicatedCategory={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#1e293b' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `Rp ${Number(v).toLocaleString('id-ID')}`}
                    width={100}
                  />
                  <LineTooltip content={<ForecastTooltip />} />
                  <ReferenceLine
                    x={histSlice[histSlice.length - 1]?.date}
                    stroke="#374151"
                    strokeDasharray="4 2"
                    label={{ value: 'FORECAST →', position: 'insideTopRight', fill: '#6b7280', fontSize: 10 }}
                    data={[...histSlice, ...forecastChartData]}
                  />
                  {forecastCodes.map((code, i) => (
                    <Line
                      key={`hist-${code}`}
                      data={histSlice}
                      type="monotone"
                      dataKey={code}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      name={code}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                  {forecastCodes.map((code, i) => (
                    <Line
                      key={`fc-${code}`}
                      data={forecastChartData}
                      type="monotone"
                      dataKey={code}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      strokeDasharray="5 3"
                      dot={{ r: 3, fill: COLORS[i % COLORS.length], strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                      name={`${code} (forecast)`}
                      connectNulls
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-600 text-sm text-center">
                  Jalankan simulasi di Dashboard untuk melihat forecast saham portofolio Anda
                </p>
              </div>
            )}
          </div>

          {/* Forecast Summary Cards */}
          {forecastSummary.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-800">
              {forecastSummary.map((fc, i) => (
                <div key={i} className="bg-[#0b1121] border border-slate-800 rounded p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    <span className="font-bold text-white text-sm">{fc.code}</span>
                    <span className={`ml-auto text-sm font-bold ${fc.expReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {fc.expReturn >= 0 ? '+' : ''}{fc.expReturn}%
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-600 mb-0.5 uppercase tracking-wider">Harga Sekarang</div>
                  <div className="text-sm text-slate-300 font-semibold mb-2">
                    Rp {Number(fc.currentPrice).toLocaleString('id-ID')}
                  </div>
                  <div className="text-[10px] text-slate-600 mb-0.5 uppercase tracking-wider">Target Forecast (5M)</div>
                  <div className={`text-sm font-bold ${fc.expReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    Rp {Number(fc.targetPrice).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-slate-700 mt-3">
            Titik putus-putus merupakan estimasi harga ke depan berdasarkan model Exponential Smoothing. Bukan saran investasi.
          </p>

        </div>
      </div>

    </div>
  );
}