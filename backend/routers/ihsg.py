from fastapi import APIRouter
import yfinance as yf

router = APIRouter()

@router.get("/api/ihsg")
def get_ihsg():
    data = yf.download(
        "^JKSE",
        period="1y",
        progress=False
    )

    close = data["Close"].squeeze()
    last_price = float(close.iloc[-1])
    prev_price = float(close.iloc[-2])
    change = round(
        ((last_price - prev_price) / prev_price) * 100,
        2
    )

    return {
        "index": round(last_price, 2),
        "change": round(change, 2),
        "changePercent": round(
            ((last_price - prev_price) / prev_price) * 100,
            2
        ),
        "chart": [
            round(float(x), 2)
            for x in close.tail(252)
        ]
    }