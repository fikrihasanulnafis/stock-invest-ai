from fastapi import APIRouter, HTTPException
import yfinance as yf
import pandas as pd
import numpy as np
import traceback
import random
from datetime import datetime, timedelta
from data.user_selection import selected_stocks

router = APIRouter()

# ── Nama perusahaan lengkap ───────────────────────────────────────────────
STOCK_NAMES = {
    "BBCA": "PT Bank Central Asia Tbk.",
    "BBRI": "PT Bank Rakyat Indonesia Tbk.",
    "BMRI": "PT Bank Mandiri (Persero) Tbk.",
    "BBNI": "PT Bank Negara Indonesia Tbk.",
    "BBTN": "PT Bank Tabungan Negara Tbk.",
    "BRIS": "PT Bank Syariah Indonesia Tbk.",
    "BTPS": "PT Bank BTPN Syariah Tbk.",
    "TLKM": "PT Telkom Indonesia Tbk.",
    "EXCL": "PT XL Axiata Tbk.",
    "ISAT": "PT Indosat Ooredoo Hutchison Tbk.",
    "TOWR": "PT Sarana Menara Nusantara Tbk.",
    "ASII": "PT Astra International Tbk.",
    "UNTR": "PT United Tractors Tbk.",
    "JSMR": "PT Jasa Marga (Persero) Tbk.",
    "SMGR": "PT Semen Indonesia Tbk.",
    "INTP": "PT Indocement Tunggal Prakarsa Tbk.",
    "WSKT": "PT Waskita Karya Tbk.",
    "WIKA": "PT Wijaya Karya Tbk.",
    "PTPP": "PT PP (Persero) Tbk.",
    "ADRO": "PT Adaro Energy Indonesia Tbk.",
    "PTBA": "PT Bukit Asam Tbk.",
    "HRUM": "PT Harum Energy Tbk.",
    "ITMG": "PT Indo Tambangraya Megah Tbk.",
    "ANTM": "PT Aneka Tambang Tbk.",
    "MDKA": "PT Merdeka Copper Gold Tbk.",
    "BRMS": "PT Bumi Resources Minerals Tbk.",
    "BUMI": "PT Bumi Resources Tbk.",
    "MEDC": "PT Medco Energi Internasional Tbk.",
    "PGAS": "PT Perusahaan Gas Negara Tbk.",
    "ESSA": "PT Essa Industries Indonesia Tbk.",
    "AKRA": "PT AKR Corporindo Tbk.",
    "AALI": "PT Astra Agro Lestari Tbk.",
    "LSIP": "PT PP London Sumatra Indonesia Tbk.",
    "GOTO": "PT GoTo Gojek Tokopedia Tbk.",
    "MAPI": "PT Mitra Adiperkasa Tbk.",
    "ACES": "PT Ace Hardware Indonesia Tbk.",
    "ERAA": "PT Erajaya Swasembada Tbk.",
    "SCMA": "PT Surya Citra Media Tbk.",
    "MNCN": "PT Media Nusantara Citra Tbk.",
    "KLBF": "PT Kalbe Farma Tbk.",
    "MIKA": "PT Mitra Keluarga Karyasehat Tbk.",
    "HEAL": "PT Medikaloka Hermina Tbk.",
    "SIDO": "PT Industri Jamu Sido Muncul Tbk.",
    "ICBP": "PT Indofood CBP Sukses Makmur Tbk.",
    "INDF": "PT Indofood Sukses Makmur Tbk.",
    "MYOR": "PT Mayora Indah Tbk.",
    "CPIN": "PT Charoen Pokphand Indonesia Tbk.",
    "JPFA": "PT Japfa Comfeed Indonesia Tbk.",
    "CMRY": "PT Cisarua Mountain Dairy Tbk.",
    "CTRA": "PT Ciputra Development Tbk.",
    "BSDE": "PT Bumi Serpong Damai Tbk.",
    "PWON": "PT Pakuwon Jati Tbk.",
    "AMMN": "PT Amman Mineral Internasional Tbk.",
    "BREN": "PT Barito Renewables Energy Tbk.",
    "UNVR": "PT Unilever Indonesia Tbk.",
    "GGRM": "PT Gudang Garam Tbk.",
    "HMSP": "PT HM Sampoerna Tbk.",
    "INKP": "PT Indah Kiat Pulp & Paper Tbk.",
    "TKIM": "PT Pabrik Kertas Tjiwi Kimia Tbk.",
}

def get_stock_name(code: str) -> str:
    return STOCK_NAMES.get(code.upper(), f"PT {code} Tbk.")

# ── Domain untuk Google Favicon ───────────────────────────────────────────
STOCK_DOMAINS = {
    "BBCA": "bca.co.id",
    "BBRI": "bri.co.id",
    "BMRI": "bankmandiri.co.id",
    "BBNI": "bni.co.id",
    "BBTN": "btn.co.id",
    "BRIS": "bankbsi.co.id",
    "BTPS": "bankbtpn.co.id",
    "TLKM": "telkom.co.id",
    "EXCL": "xl.co.id",
    "ISAT": "indosatooredoo.id",
    "TOWR": "towerbersama.com",
    "ASII": "astra.co.id",
    "UNTR": "unitedtractors.com",
    "JSMR": "jasamarga.com",
    "SMGR": "semenindonesia.com",
    "INTP": "indocement.co.id",
    "ADRO": "adaro.com",
    "PTBA": "ptba.co.id",
    "HRUM": "harum-energy.com",
    "ITMG": "itmg.co.id",
    "ANTM": "antam.com",
    "MDKA": "merdekacopper.com",
    "BRMS": "bumi-resources.com",
    "BUMI": "bumi-resources.com",
    "MEDC": "medcoenergi.com",
    "PGAS": "pgn.co.id",
    "AKRA": "akr.co.id",
    "AALI": "astra-agro.com",
    "GOTO": "gotogroup.com",
    "MAPI": "mapretail.com",
    "KLBF": "kalbe.co.id",
    "MIKA": "mitrakeluarga.com",
    "HEAL": "hermina.co.id",
    "SIDO": "sidomuncul.co.id",
    "ICBP": "indofood.com",
    "INDF": "indofood.com",
    "MYOR": "mayoraindah.co.id",
    "CPIN": "charoen-pokphand.co.id",
    "CTRA": "ciputra.com",
    "AMMN": "amman.co.id",
    "UNVR": "unilever.co.id",
    "GGRM": "gudanggaramtbk.co.id",
}

def get_logo_url(code: str) -> str:
    domain = STOCK_DOMAINS.get(code.upper(), "")
    if domain:
        return f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
    return ""

# ── Warna avatar fallback per huruf ──────────────────────────────────────
AVATAR_COLORS = [
    "#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444",
    "#14b8a6","#f97316","#06b6d4","#84cc16","#ec4899",
]

def get_avatar_color(code: str) -> str:
    idx = ord(code[0]) % len(AVATAR_COLORS)
    return AVATAR_COLORS[idx]

# ── Mapping sektor ────────────────────────────────────────────────────────
SECTOR_MAP = {
    "Basic Materials":       ["ANTM","TKIM","INKP","BRMS","BUMI","MDKA","ADRO","HRUM","ITMG","PTBA","MEDC"],
    "Energy":                ["PGAS","ESSA","AKRA","AALI","LSIP"],
    "Financials":            ["BBCA","BBRI","BMRI","BBNI","BBTN","BTPS","BRIS"],
    "Industrials":           ["ASII","UNTR","JSMR","WSKT","WIKA","PTPP","SMGR","INTP"],
    "Consumer Cyclical":     ["MAPI","ACES","ERAA","SCMA","MNCN","GOTO"],
    "Healthcare":            ["KLBF","MIKA","HEAL","SIDO"],
    "Telecommunication":     ["TLKM","EXCL","ISAT","TOWR"],
    "Property":              ["CTRA","BSDE","PWON"],
    "Consumer Non-Cyclical": ["ICBP","INDF","MYOR","CPIN","JPFA","CMRY"],
}

ALL_TICKERS = [
    "BBCA.JK","BBRI.JK","BMRI.JK","BBNI.JK","TLKM.JK","ASII.JK",
    "UNTR.JK","ADRO.JK","ANTM.JK","MDKA.JK","EXCL.JK","GOTO.JK",
    "MAPI.JK","BRMS.JK","BREN.JK","AMMN.JK","SMGR.JK","PTBA.JK",
    "HRUM.JK","ITMG.JK","CTRA.JK","KLBF.JK","ICBP.JK","INDF.JK",
    "AKRA.JK","ISAT.JK","PGAS.JK","HEAL.JK","MIKA.JK","BBTN.JK",
    "JSMR.JK","BRIS.JK","BTPS.JK","MYOR.JK","SIDO.JK","CPIN.JK",
    "WIKA.JK","WSKT.JK","PTPP.JK","INTP.JK","AALI.JK","LSIP.JK",
    "UNVR.JK","GGRM.JK","HMSP.JK",
]


@router.get("/api/market-movers")
def get_market_movers():
    print("===== MARKET PY TERLOAD =====")

    stocks = list(selected_stocks)
    print("MARKET READ selected_stocks =", stocks)

    if len(stocks) == 0:
        stocks = ["BBCA.JK", "TLKM.JK", "BBRI.JK", "BMRI.JK", "ASII.JK"]

    # ── 1. Download 5d untuk gainers/losers ──────────────────────────
    try:
        raw      = yf.download(tickers=ALL_TICKERS, period="5d", progress=False, auto_adjust=True)
        close_5d = raw["Close"]
    except Exception as e:
        print("ERROR download 5d:", e)
        close_5d = pd.DataFrame()

    result = []
    for ticker in ALL_TICKERS:
        try:
            s = close_5d[ticker].dropna()
            if len(s) < 2:
                continue
            latest = float(s.iloc[-1])
            prev   = float(s.iloc[-2])
            change = round(np.log(latest / prev) * 100, 2)
            code   = ticker.replace(".JK", "")
            result.append({"code": code, "price": round(latest, 0), "change": change})
        except:
            continue

    sorted_desc = sorted(result, key=lambda x: x["change"], reverse=True)
    sorted_asc  = sorted(result, key=lambda x: x["change"])

    def fmt(item):
        return {
            "code":      item["code"],
            "name":      get_stock_name(item["code"]),
            "price":     f"Rp {int(item['price']):,}".replace(",", "."),
            "change":    f"+{item['change']}%" if item["change"] > 0 else f"{item['change']}%",
            "changeNum": item["change"],
        }

    top_gainers = [fmt(x) for x in sorted_desc if x["change"] > 0][:5]
    top_losers  = [fmt(x) for x in sorted_asc  if x["change"] < 0][:5]

    # ── 2. Sektor Rotation ────────────────────────────────────────────
    result_map      = {r["code"]: r["change"] for r in result}
    sector_rotation = []
    for sector, members in SECTOR_MAP.items():
        changes = [result_map[c] for c in members if c in result_map]
        score   = round(float(np.mean(changes)), 2) if changes else 0.0
        sector_rotation.append({"sector": sector, "score": score})

    # ── 3. AI Picks ───────────────────────────────────────────────────
    candidate_tickers = ALL_TICKERS if not stocks else [s for s in stocks if s.endswith(".JK")]

    picks_raw = []
    try:
        hist_picks = yf.download(
            tickers=candidate_tickers, period="3mo",
            progress=False, auto_adjust=True
        )
        if len(candidate_tickers) == 1:
            close_picks = hist_picks[["Close"]]
            close_picks.columns = candidate_tickers
        else:
            close_picks = hist_picks["Close"]

        for ticker in candidate_tickers:
            try:
                s = close_picks[ticker].dropna()
                if len(s) < 10:
                    continue
                log_ret = np.log(s / s.shift(1)).dropna()
                mu  = float(log_ret.mean())
                std = float(log_ret.std())
                exp_return_1m = round((np.exp(mu * 22) - 1) * 100, 2)
                sharpe_proxy  = round(mu / std if std > 0 else 0, 4)
                conf          = min(95, max(50, int(50 + sharpe_proxy * 300)))
                code          = ticker.replace(".JK", "")
                picks_raw.append({
                    "code":        code,
                    "name":        get_stock_name(code),
                    "logo":        get_logo_url(code),
                    "avatarColor": get_avatar_color(code),
                    "expReturn":   exp_return_1m,
                    "confidence":  conf,
                    "sharpe":      sharpe_proxy,
                })
            except:
                continue
    except Exception as e:
        print("ERROR picks:", e)

    ai_picks = sorted(
        [p for p in picks_raw if p["expReturn"] > 0],
        key=lambda x: x["sharpe"], reverse=True
    )[:3]

    # ── 4. Forecast ───────────────────────────────────────────────────
    forecast_tickers = []

    for s in stocks:
        if s.endswith(".JK"):
            forecast_tickers.append(s)
        else:
            forecast_tickers.append(f"{s}.JK")

    forecast_tickers = forecast_tickers[:6]

    forecast_data    = []
    forecast_future  = []
    forecast_summary = []

    try:
        hist_fc = yf.download(
            tickers=forecast_tickers, period="1y",
            progress=False, auto_adjust=True
        )
        if len(forecast_tickers) == 1:
            close_fc = hist_fc[["Close"]]
            close_fc.columns = forecast_tickers
        else:
            close_fc = hist_fc["Close"]

        weekly_fc = close_fc.resample("W-FRI").last().dropna(how="all")
        today     = pd.Timestamp(datetime.now().date())
        weekly_fc = weekly_fc[weekly_fc.index <= today]

        for dt, row in weekly_fc.iterrows():
            item = {"date": dt.strftime("%d %b")}
            for ticker in forecast_tickers:
                code = ticker.replace(".JK", "")
                val  = row.get(ticker, None)
                item[code] = round(float(val), 0) if (val is not None and not np.isnan(float(val))) else None
            forecast_data.append(item)

        last_date    = weekly_fc.index[-1]
        future_dates = [last_date + timedelta(weeks=i+1) for i in range(5)]
        future_rows  = [{"date": d.strftime("%d %b") + "*"} for d in future_dates]

        for ticker in forecast_tickers:
            code = ticker.replace(".JK", "")
            try:
                series = weekly_fc[ticker].dropna()
                if len(series) < 4:
                    continue
                alpha    = 0.3
                smoothed = [float(series.iloc[0])]
                for v in series.iloc[1:]:
                    smoothed.append(alpha * float(v) + (1 - alpha) * smoothed[-1])
                last_smooth   = smoothed[-1]
                recent        = [float(x) for x in series.iloc[-4:]]
                trend         = (recent[-1] - recent[0]) / 3.0
                current_price = float(series.iloc[-1])
                for i in range(5):
                    future_rows[i][code] = round(max(last_smooth + trend * (i + 1), 1), 0)
                target_5w = future_rows[4].get(code, current_price)
                exp_ret   = round(((target_5w - current_price) / current_price) * 100, 2)
                forecast_summary.append({
                    "code":         code,
                    "currentPrice": round(current_price, 0),
                    "targetPrice":  round(target_5w, 0),
                    "expReturn":    exp_ret,
                })
            except Exception as e:
                print(f"Forecast error {ticker}:", e)

        forecast_future = future_rows

    except Exception as e:
        print("FORECAST ERROR:", e)
        print(traceback.format_exc())

    return {
        "topGainers":      top_gainers,
        "topLosers":       top_losers,
        "sectorRotation":  sector_rotation,
        "aiPicks":         ai_picks,
        "forecastData":    forecast_data,
        "forecastFuture":  forecast_future,
        "forecastSummary": forecast_summary,
    }


# @router.get("/api/live-market")
# def get_live_market():
#     try:
#         tickers = [
#             "^JKSE","BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK",
#             "ICBP.JK","INDF.JK","UNTR.JK","ADRO.JK","ANTM.JK","MDKA.JK",
#             "EXCL.JK","CPIN.JK","GOTO.JK","AMMN.JK","BRIS.JK","PGAS.JK",
#             "SMGR.JK","PTBA.JK","AKRA.JK","HRUM.JK","ITMG.JK","BBTN.JK",
#             "MAPI.JK","ACES.JK","KLBF.JK","MYOR.JK","SIDO.JK","TOWR.JK",
#             "ERAA.JK","MEDC.JK","JPFA.JK","SCMA.JK","MIKA.JK","HEAL.JK",
#             "ESSA.JK","LSIP.JK","AALI.JK","BBNI.JK","BTPS.JK","JSMR.JK",
#             "WSKT.JK","WIKA.JK","PTPP.JK","INTP.JK","CMRY.JK","BRMS.JK",
#             "ISAT.JK","MNCN.JK","TKIM.JK","UNVR.JK","GGRM.JK","HMSP.JK",
#         ]
#         data = yf.download(tickers=tickers, period="5d", progress=False, auto_adjust=True)
#         stocks = []
#         for ticker in tickers[1:]:
#             try:
#                 s = data["Close"][ticker].dropna()
#                 if len(s) < 2:
#                     continue
#                 latest   = float(s.iloc[-1])
#                 previous = float(s.iloc[-2])
#                 change   = round(np.log(latest / previous) * 100, 2)
#                 stocks.append({
#                     "code":   ticker.replace(".JK", ""),
#                     "price":  round(latest, 2),
#                     "change": change
#                 })
#             except:
#                 continue

#         ihsg_s    = data["Close"]["^JKSE"].dropna()
#         ihsg_lat  = float(ihsg_s.iloc[-1])
#         ihsg_prev = float(ihsg_s.iloc[-2])
#         ihsg_chg  = round(np.log(ihsg_lat / ihsg_prev) * 100, 2)

#         return {
#             "ihsg":   {"close": round(ihsg_lat, 2), "change": ihsg_chg},
#             "stocks": stocks
#         }

#     except Exception as e:
#         print("LIVE MARKET ERROR")
#         print(traceback.format_exc())
#         raise HTTPException(status_code=500, detail=str(e))

LIVE_CACHE = {}

@router.get("/api/live-market")
def get_live_market():
    global LIVE_CACHE
    try:
        tickers = [
            "^JKSE","BBCA.JK","BBRI.JK","BMRI.JK","TLKM.JK","ASII.JK",
            "ICBP.JK","INDF.JK","UNTR.JK","ADRO.JK","ANTM.JK","MDKA.JK",
            "EXCL.JK","CPIN.JK","GOTO.JK","AMMN.JK","BRIS.JK","PGAS.JK",
            "SMGR.JK","PTBA.JK","AKRA.JK","HRUM.JK","ITMG.JK","BBTN.JK",
            "MAPI.JK","ACES.JK","KLBF.JK","MYOR.JK","SIDO.JK","TOWR.JK",
            "ERAA.JK","MEDC.JK","JPFA.JK","SCMA.JK","MIKA.JK","HEAL.JK",
            "ESSA.JK","LSIP.JK","AALI.JK","BBNI.JK","BTPS.JK","JSMR.JK",
            "WSKT.JK","WIKA.JK","PTPP.JK","INTP.JK","CMRY.JK","BRMS.JK",
            "ISAT.JK","MNCN.JK","TKIM.JK","UNVR.JK","GGRM.JK","HMSP.JK",
        ]
        
        # 1. JIKA CACHE KOSONG, DOWNLOAD DATA ASLI SEKALI SAJA SEBAGAI HARGA DASAR
        if not LIVE_CACHE:
            print("===== INITIALIZING LIVE MARKET CACHE FROM YFINANCE =====")
            data = yf.download(tickers=tickers, period="5d", progress=False, auto_adjust=True)
            
            for ticker in tickers:
                try:
                    s = data["Close"][ticker].dropna()
                    if len(s) >= 2:
                        LIVE_CACHE[ticker] = {
                            "price": float(s.iloc[-1]),
                            "base_prev": float(s.iloc[-2])
                        }
                except:
                    continue

        # 2. PROSES SIMULASI FLUKTUASI HARGA UNTUK SAHAM (5-10 DETIK SEKALI)
        stocks = []
        for ticker in tickers[1:]:  # Mulai dari indeks 1 (skip IHSG)
            try:
                if ticker not in LIVE_CACHE:
                    continue
                
                # Buat pergerakan acak naik/turun tipis (antara -0.2% sampai +0.2%)
                pct_move = random.uniform(-0.002, 0.002)
                current_price = LIVE_CACHE[ticker]["price"]
                new_price = current_price * (1 + pct_move)
                
                # Validasi agar harga saham tidak menyentuh angka <= 0 atau gocap (jika perlu)
                new_price = max(new_price, 1.0)
                
                # Simpan harga baru ke dalam cache global
                LIVE_CACHE[ticker]["price"] = new_price
                
                # Hitung ulang persentase perubahan log terhadap harga penutupan kemarin
                change = round(np.log(new_price / LIVE_CACHE[ticker]["base_prev"]) * 100, 2)
                
                stocks.append({
                    "code":   ticker.replace(".JK", ""),
                    "price":  round(new_price, 0),
                    "change": change
                })
            except:
                continue

        # 3. PROSES SIMULASI FLUKTUASI UNTUK IHSG
        if "^JKSE" in LIVE_CACHE:
            # IHSG bergerak lebih stabil (antara -0.05% sampai +0.05%)
            ihsg_move = random.uniform(-0.0005, 0.0005)
            current_ihsg = LIVE_CACHE["^JKSE"]["price"]
            new_ihsg = current_ihsg * (1 + ihsg_move)
            
            LIVE_CACHE["^JKSE"]["price"] = new_ihsg
            ihsg_chg = round(np.log(new_ihsg / LIVE_CACHE["^JKSE"]["base_prev"]) * 100, 2)
        else:
            new_ihsg, ihsg_chg = 7000.0, 0.0

        return {
            "ihsg":   {"close": round(new_ihsg, 2), "change": ihsg_chg},
            "stocks": stocks
        }

    except Exception as e:
        print("LIVE MARKET ERROR")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))