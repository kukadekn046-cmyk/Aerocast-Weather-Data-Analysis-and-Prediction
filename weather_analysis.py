"""
Weather Data Time-Series Analysis & Temperature Prediction Pipeline
-------------------------------------------------------------------
Demonstrates time-series processing, feature engineering, and statistical
regression techniques (Linear Regression & Polynomial Regression) using Python.
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

def main():
    print("=" * 65)
    print("🌤️ Weather Data Analysis & Temperature Trend Forecasting Pipeline")
    print("=" * 65)

    # 1. Generate Synthetic Weather Dataset (180 Days)
    np.random.seed(42)
    num_days = 180
    dates = pd.date_range(start="2024-01-01", periods=num_days, freq="D")
    
    time_index = np.arange(num_days).reshape(-1, 1)

    # Seasonality (Sine wave), Long-term Warming Trend, Gaussian Noise
    base_temp = 14.0
    seasonality = 9.0 * np.sin(2 * np.pi * time_index / 365)
    trend = 0.015 * time_index
    noise = np.random.normal(0, 1.4, size=(num_days, 1))

    temp_values = (base_temp + seasonality + trend + noise).flatten()

    df = pd.DataFrame({
        "date": dates,
        "day_index": time_index.flatten(),
        "temperature": temp_values
    })

    # 2. Moving Average Smoothing
    df["7d_moving_avg"] = df["temperature"].rolling(window=7).mean()

    print(f"\n[+] Generated Dataset of {len(df)} days.")
    print(df.head(10))

    # 3. Train Machine Learning Regression Models
    X = df[["day_index"]].values
    y = df["temperature"].values

    # Model A: Simple Linear Regression
    lin_model = LinearRegression()
    lin_model.fit(X, y)
    y_pred_lin = lin_model.predict(X)

    # Model B: Polynomial Regression (Degree 2)
    poly_transform = PolynomialFeatures(degree=2)
    X_poly = poly_transform.fit_transform(X)
    poly_model = LinearRegression()
    poly_model.fit(X_poly, y)
    y_pred_poly = poly_model.predict(X_poly)

    # 4. Evaluate Model Metrics
    def calc_metrics(y_true, y_pred, name):
        r2 = r2_score(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
        print(f"\n--- {name} Performance Metrics ---")
        print(f"R² Score (Goodness of Fit): {r2:.4f}")
        print(f"MAE  (Mean Absolute Error): {mae:.2f} °C")
        print(f"RMSE (Root Mean Sq Error) : {rmse:.2f} °C")
        print(f"MAPE (Mean Abs % Error)   : {mape:.2f}%")
        return r2, mae, rmse

    calc_metrics(y, y_pred_lin, "Linear Regression")
    calc_metrics(y, y_pred_poly, "Polynomial Regression (Deg 2)")

    # 5. Forecast Future Horizon (30 Days)
    future_days = 30
    future_indices = np.arange(num_days, num_days + future_days).reshape(-1, 1)
    X_future_poly = poly_transform.transform(future_indices)
    future_forecast = poly_model.predict(X_future_poly)

    print(f"\n[+] Forecasted 30-Day Mean Temperature: {future_forecast.mean():.2f} °C")

    # 6. Plot & Save Visualization Chart
    plt.figure(figsize=(12, 6))
    plt.style.use('dark_background')
    
    plt.plot(df["date"], df["temperature"], label="Observed Daily Temp (°C)", color="#38bdf8", alpha=0.6, linewidth=1.5)
    plt.plot(df["date"], df["7d_moving_avg"], label="7-Day Moving Average", color="#a855f7", linestyle="--", linewidth=1.8)
    plt.plot(df["date"], y_pred_poly, label="Polynomial Regression Fit", color="#f59e0b", linewidth=2.2)

    future_dates = pd.date_range(start=dates[-1] + pd.Timedelta(days=1), periods=future_days, freq="D")
    plt.plot(future_dates, future_forecast, label="30-Day Future Forecast", color="#10b981", linestyle=":", linewidth=2.5)

    plt.title("AeroCast — Historical Weather Data Analysis & Temperature Trend Prediction", fontsize=14, pad=15)
    plt.xlabel("Date", fontsize=11)
    plt.ylabel("Temperature (°C)", fontsize=11)
    plt.legend(loc="upper left")
    plt.grid(True, opacity=0.15)
    plt.tight_layout()

    chart_filename = "weather_forecast_chart.png"
    plt.savefig(chart_filename, dpi=150)
    print(f"\n[+] Saved forecast chart to {chart_filename}")

if __name__ == "__main__":
    main()
