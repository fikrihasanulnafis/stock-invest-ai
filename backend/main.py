from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import portfolio, market, ihsg, chat
from routers.realtime_stock import router as realtime_router

app = FastAPI(title="StockInvest AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(portfolio.router)
app.include_router(market.router)
app.include_router(ihsg.router)
app.include_router(chat.router)
app.include_router(realtime_router)

@app.get("/")
def read_root():
    return {"message": "API Modular StockInvest Berjalan Lancar!"}