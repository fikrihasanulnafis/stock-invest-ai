from fastapi import APIRouter
import yfinance as yf
import pandas as pd
from data.user_selection import selected_stocks
import statsmodels.api as sm
from fastapi import APIRouter, HTTPException
import traceback
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing

router = APIRouter()

@router.get("/api/market-movers")
def get_market_movers():
    print("===== MARKET PY TERLOAD =====")

    stocks = selected_stocks
    print("MARKET READ =", selected_stocks)

    stocks = selected_stocks

    if len(stocks) == 0:

        stocks = [
            "BBCA.JK",
            "BBRI.JK",
            "BMRI.JK",
            "TLKM.JK"
        ]

    result = []

    for stock in stocks:

        try:

            data = yf.download(
                stock,
                period="1mo",
                progress=False,
                auto_adjust=True
            )
            print("STOCK =", stock)
            print(data.head())
            print(data.tail())

            if len(data) < 2:
                continue

            close_price = data["Close"].squeeze()

            last_price = float(
                close_price.iloc[-1]
            )

            log_return = np.log(
                close_price / close_price.shift(1)
            ).dropna()

            expected_monthly_return = (
                np.exp(
                    float(log_return.mean()) * 22
                ) - 1
            ) * 100

            change = round(
                expected_monthly_return,
                2
            )

            print(
                stock,
                "Expected Return =",
                expected_monthly_return
            )

            result.append({
                "stock": stock,
                "price": round(last_price, 0),
                "change": change
            })

            print("BERHASIL:", stock)

        except Exception as e:
            print("DOWNLOAD ERROR:", e)

    result = sorted(
        result,
        key=lambda x: x["change"],
        reverse=True
    )

    print("RESULT =", result)

    def format_card(item):

        code = item["stock"].replace(".JK", "")

        return {
            "code": code,
            "name": f"Saham {code}",
            "price": f"Rp {int(item['price']):,}".replace(",", "."),
            "change": (
                f"+{item['change']}%"
                if item["change"] > 0
                else f"{item['change']}%"
            )
        }

    top_gainers = [
        format_card(x)
        for x in result
        if x["change"] > 0
    ][:3]

    top_losers = [
        format_card(x)
        for x in sorted(
            result,
            key=lambda x: x["change"]
        )
        if x["change"] < 0
    ][:3]

    monthly_dict = {}

    for stock in stocks:

        try:

            hist = yf.download(
                stock,
                period="2y",
                progress=False,
                auto_adjust=True
            )

            print("HIST =", stock)
            print(hist.head())

            if hist.empty:
                continue

            monthly = (
                hist["Close"]
                .resample("M")
                .mean()
            )

            monthly_dict[
                stock.replace(".JK", "")
            ] = monthly

        except Exception as e:
            print("DOWNLOAD ERROR:", stock)
            print(e)

    trend_data = []

    if len(monthly_dict) > 0:

        combined = pd.DataFrame(monthly_dict)

        combined.index = combined.index.strftime("%Y-%m")

        for month, row in combined.iterrows():

            item = {
                "month": month
            }

            for col in combined.columns:

                item[col] = (
                    round(float(row[col]), 2)
                    if pd.notna(row[col])
                    else None
                )

            trend_data.append(item)
            print("MONTHLY_DICT =", monthly_dict.keys())
            print("TOP GAINERS =", top_gainers)
            print("TOP LOSERS =", top_losers)
            print("TREND DATA =", trend_data[:2] if trend_data else [])
                        
    return {
        "topGainers": top_gainers,
        "topLosers": top_losers,
        "trendData": trend_data
    }

@router.get("/api/live-market")
def get_live_market():

    try:

        tickers = [
            "^JKSE",
            "BBCA.JK",
            "BBRI.JK",
            "BMRI.JK",
            "TLKM.JK",
            "ASII.JK",
            "ICBP.JK",
            "INDF.JK",
            "UNTR.JK",
            "ADRO.JK",
            "ANTM.JK",
            "MDKA.JK",
            "EXCL.JK",
            "CPIN.JK",
            "GOTO.JK",
            "AMMN.JK",
            "BRIS.JK",
            "PGAS.JK",
            "SMGR.JK",
            "PTBA.JK",
            "AKRA.JK",
            "HRUM.JK",
            "ITMG.JK",
            "BBTN.JK",
            "MAPI.JK",
            "ACES.JK",
            "KLBF.JK",
            "MYOR.JK",
            "SIDO.JK",
            "TOWR.JK",
            "ERAA.JK",
            "MEDC.JK",
            "JPFA.JK",
            "SCMA.JK",
            "MIKA.JK",
            "HEAL.JK",
            "ESSA.JK",
            "LSIP.JK",
            "AALI.JK",
            "BBNI.JK",
            "BTPS.JK",
            "JSMR.JK",
            "WSKT.JK",
            "WIKA.JK",
            "PTPP.JK",
            "INTP.JK",
            "CMRY.JK",
            "BRMS.JK",
            "ISAT.JK",
            "MNCN.JK",
            "TKIM.JK"
        ]

        data = yf.download(
            tickers=tickers,
            period="5d",
            progress=False,
            auto_adjust=True
        )

        stocks = []

        for ticker in tickers[1:]:

            try:

                close_series = (
                    data["Close"][ticker]
                    .dropna()
                )

                if len(close_series) < 2:
                    continue

                latest = float(
                    close_series.iloc[-1]
                )

                previous = float(
                    close_series.iloc[-2]
                )

                change = round(
                    np.log(
                        latest / previous
                    ) * 100,
                    2
                )

                stocks.append({
                    "code": ticker.replace(".JK", ""),
                    "price": round(latest, 2),
                    "change": change
                })

            except:
                continue

        ihsg_close = (
            data["Close"]["^JKSE"]
            .dropna()
        )

        ihsg_latest = float(
            ihsg_close.iloc[-1]
        )

        ihsg_previous = float(
            ihsg_close.iloc[-2]
        )

        ihsg_change = round(
            np.log(
                ihsg_latest /
                ihsg_previous
            ) * 100,
            2
        )

        return {
            "ihsg": {
                "close": round(
                    ihsg_latest,
                    2
                ),
                "change": ihsg_change
            },
            "stocks": stocks
        }

    except Exception as e:

        print("LIVE MARKET ERROR")
        print(traceback.format_exc())

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    
@router.get("/api/forecast")
def get_forecast(period: str = "2y"):

    stocks = selected_stocks

    if len(stocks) == 0:
        stocks = [
            "BBCA.JK",
            "BBRI.JK",
            "BMRI.JK",
            "TLKM.JK"
        ]

    result = []

    for stock in stocks:

        try:

            hist = yf.download(
                stock,
                period=period,
                auto_adjust=True,
                progress=False
            )

            if hist.empty:
                continue

            close_price = (
                hist["Close"]
                .squeeze()
                .dropna()
            )

            model = ExponentialSmoothing(
                close_price,
                trend="add",
                seasonal=None,
                initialization_method="estimated"
            ).fit()

            forecast_days = 20

            forecast = model.forecast(
                forecast_days
            )
            
            actual_dates = (
                close_price.tail(30)
                .index
                .strftime("%Y-%m-%d")
                .tolist()
            )

            forecast_dates = (
                pd.date_range(
                    start=close_price.index[-1],
                    periods=forecast_days + 1,
                    freq="B"
                )[1:]
                .strftime("%Y-%m-%d")
                .tolist()
            )

            result.append({

                "stock": stock.replace(".JK", ""),

                "actual": [
                    {
                        "date": d,
                        "price": round(float(p), 2)
                    }
                    for d, p in zip(
                        actual_dates,
                        close_price.tail(30)
                    )
                ],

                "forecast": [
                    {
                        "date": d,
                        "price": round(float(p), 2)
                    }
                    for d, p in zip(
                        forecast_dates,
                        forecast
                    )
                ]
            })

        except Exception as e:

            print(stock)
            print(e)

    return {
        "period": period,
        "data": result
    }