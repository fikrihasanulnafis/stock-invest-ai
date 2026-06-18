from fastapi import APIRouter, HTTPException
import yfinance as yf

router = APIRouter()

@router.get("/api/realtime-stock/{ticker}")
def get_stock(ticker: str):

    symbol = f"{ticker.upper()}.JK"
    try:
        stock = yf.Ticker(symbol)
        hist = stock.history(period="1d")

        if hist.empty:
            raise HTTPException(status_code=404, detail="Ticker tidak ditemukan")
        latest = hist.iloc[-1]
        return {
            "ticker": ticker.upper(),
            "open": float(latest["Open"]),
            "high": float(latest["High"]),
            "low": float(latest["Low"]),
            "close": float(latest["Close"]),
            "volume": int(latest["Volume"])
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))