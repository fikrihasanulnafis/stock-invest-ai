from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
import pandas as pd
from scipy.optimize import minimize
import yfinance as yf
from data.user_selection import selected_stocks

router = APIRouter()

class PortfolioRequest(BaseModel):
    stocks: str
    budget: float
    period: str = "1y"

@router.post("/api/simulate")
def simulate_portfolio(request: PortfolioRequest):

    raw_stocks = [
        s.strip().upper()
        for s in request.stocks.split(',')
        if s.strip()
    ]

    valid_stocks = [
        s if s.endswith('.JK')
        else f"{s}.JK"
        for s in raw_stocks
    ]

    selected_stocks.clear()
    selected_stocks.extend(valid_stocks)

    print("VALID STOCKS =", valid_stocks)
    print("SELECTED =", selected_stocks)

    try:
        price_data = yf.download(
            valid_stocks,
            period=request.period,
            auto_adjust=True,
            progress=False
        )

        if price_data.empty:
            raise HTTPException(
                status_code=404,
                detail="Data saham tidak ditemukan"
            )

        if len(valid_stocks) == 1:
            close_prices = price_data[['Close']]
            close_prices.columns = valid_stocks
        else:
            close_prices = price_data['Close']

        df_pivot = np.log(
            close_prices / close_prices.shift(1)
        ).dropna()

        mean_returns = df_pivot.mean().values
        cov_matrix = df_pivot.cov().values
        num_assets = len(mean_returns)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal mengambil data Yahoo Finance: {str(e)}"
        )

    # ======= Markowitz Optimization =======
    def negative_sharpe(weights, mean_returns, cov_matrix, risk_free_rate=0.0):
        p_ret = np.sum(mean_returns * weights)
        p_std = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
        if p_std == 0:
            return 999999
        return -(p_ret - risk_free_rate) / p_std

    constraints = ({'type': 'eq', 'fun': lambda x: np.sum(x) - 1},)
    bounds = tuple((0, 1) for _ in range(num_assets))

    optimized = minimize(
        negative_sharpe,
        num_assets * [1.0 / num_assets],
        args=(mean_returns, cov_matrix),
        method='SLSQP',
        bounds=bounds,
        constraints=constraints
    )

    optimal_weights = optimized.x

    # ======= Monte Carlo Simulation =======
    np.random.seed(42)
    simulated_returns = np.dot(
        np.random.multivariate_normal(mean_returns, cov_matrix, 10000),
        optimal_weights
    )

    # ======= VaR per Horizon =======
    # Daily VaR
    var_daily_pct = abs(round(np.percentile(simulated_returns, 5) * 100, 2))
    var_daily_rp = round(request.budget * (var_daily_pct / 100), 0)

    # Monthly VaR (22 hari trading)
    var_monthly_pct = abs(round(np.percentile(simulated_returns, 5) * np.sqrt(22) * 100, 2))
    var_monthly_rp = round(request.budget * (var_monthly_pct / 100), 0)

    # Annual VaR (252 hari trading)
    var_annual_pct = abs(round(np.percentile(simulated_returns, 5) * np.sqrt(252) * 100, 2))
    var_annual_rp = round(request.budget * (var_annual_pct / 100), 0)

    # ======= Portfolio Return & Volatility =======
    portfolio_daily_return = np.sum(mean_returns * optimal_weights)
    portfolio_daily_std = np.sqrt(np.dot(optimal_weights.T, np.dot(cov_matrix, optimal_weights)))

    # Log return projection
    daily_return_pct = round((np.exp(portfolio_daily_return) - 1) * 100, 2)
    monthly_return_pct = round((np.exp(portfolio_daily_return * 22) - 1) * 100, 2)
    annual_return_pct = round((np.exp(portfolio_daily_return * 252) - 1) * 100, 2)

    # Annual Volatility
    annual_vol_pct = round(portfolio_daily_std * np.sqrt(252) * 100, 2)

    # Sharpe Ratio (annualized, risk free = 0)
    annual_return_log = portfolio_daily_return * 252
    sharpe_ratio = round(
        annual_return_log / (portfolio_daily_std * np.sqrt(252))
        if portfolio_daily_std > 0 else 0,
        2
    )

    # Risk Level berdasarkan annual volatility
    if annual_vol_pct < 10:
        risk_level = "Low"
    elif annual_vol_pct < 20:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    # ======= Per-Stock Action Plan =======
    chart_data = []
    action_plan = []
    stock_names = df_pivot.columns.tolist()
    max_weight = max(optimal_weights)

    for i in range(num_assets):
        weight_percent = round(optimal_weights[i] * 100, 1)
        stock_code = stock_names[i].replace('.JK', '')

        # Individual return (monthly basis)
        ind_return = round((np.exp(mean_returns[i] * 22) - 1) * 100, 2)

        # Individual VaR monthly
        ind_var_pct = abs(
            round(np.percentile(df_pivot[stock_names[i]].dropna(), 5) * np.sqrt(22) * 100, 2)
        )

        ind_risk = (
            "Low" if ind_var_pct < 2
            else "Moderate" if ind_var_pct < 5
            else "High"
        )

        if weight_percent > 0:
            chart_data.append({"name": stock_code, "value": weight_percent})

        if optimal_weights[i] == max_weight:
            action_plan.append({
                "stock": stock_code,
                "status": "Fokus Utama",
                "color": "green",
                "desc": f"Alokasikan porsi besar ({weight_percent}%).",
                "indReturn": ind_return,
                "indVar": ind_var_pct,
                "indRisk": ind_risk
            })
        elif weight_percent > 0:
            action_plan.append({
                "stock": stock_code,
                "status": "Pelengkap",
                "color": "yellow",
                "desc": f"Beli secukupnya ({weight_percent}%).",
                "indReturn": ind_return,
                "indVar": ind_var_pct,
                "indRisk": ind_risk
            })
        else:
            action_plan.append({
                "stock": stock_code,
                "status": "Hindari / Jual",
                "color": "red",
                "desc": "AI merekomendasikan 0%.",
                "indReturn": ind_return,
                "indVar": ind_var_pct,
                "indRisk": ind_risk
            })

    print("================================")
    print("MEAN RETURNS =", mean_returns)
    print("WEIGHTS =", optimal_weights)
    print("PORTFOLIO DAILY RETURN =", portfolio_daily_return)
    print("ANNUAL VOLATILITY =", annual_vol_pct)
    print("SHARPE RATIO =", sharpe_ratio)
    print("================================")

    return {
        "chartData": chart_data,
        "actionPlan": action_plan,
        "metrics": {
            # Return
            "dailyReturn": daily_return_pct,
            "monthlyReturn": monthly_return_pct,
            "annualReturn": annual_return_pct,
            "expectedReturn": annual_return_pct,

            # Volatility & Sharpe
            "annualVolatility": annual_vol_pct,
            "sharpeRatio": sharpe_ratio,

            # Risk Level
            "riskLevel": risk_level,

            # VaR per horizon
            "varDaily": var_daily_pct,
            "varMonthly": var_monthly_pct,
            "varAnnual": var_annual_pct,
            "varDailyRp": int(var_daily_rp),
            "varMonthlyRp": int(var_monthly_rp),
            "varAnnualRp": int(var_annual_rp),

            # Legacy (untuk kompatibilitas)
            "varPercentage": var_monthly_pct,
            "varValue": int(var_monthly_rp),
        }
    }