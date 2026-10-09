import React, { useState, useEffect } from 'react';
import {
  CITIES,
  fetchHistoricalWeather,
  generateSyntheticWeather
} from '../services/weatherApi';
import {
  trainLinearRegression,
  trainPolynomialRegression,
  trainHoltLinearSmoothing,
  calculateMovingAverage,
  evaluateMetrics,
  generateForecast
} from '../utils/mlEngine';

import TimeSeriesChart from './TimeSeriesChart';
import ModelComparison from './ModelComparison';
import ExploratoryAnalysis from './ExploratoryAnalysis';

import {
  CloudSun,
  Activity,
  Sliders,
  TrendingUp,
  Calendar,
  Globe,
  RefreshCw,
  BarChart,
  Brain,
  Sparkles,
  Download,
  Info,
  Code
} from 'lucide-react';

export default function Dashboard() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0].id);
  const [daysBack, setDaysBack] = useState(180);
  const [selectedModelType, setSelectedModelType] = useState('Linear Regression');
  const [forecastDays, setForecastDays] = useState(14);
  const [useSynthetic, setUseSynthetic] = useState(false);

  const [loading, setLoading] = useState(true);
  const [historicalData, setHistoricalData] = useState([]);
  const [activeTab, setActiveTab] = useState('timeseries'); // timeseries, comparison, eda

  const [showCodeModal, setShowCodeModal] = useState(false);

  // Load Data on City / Parameters change
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (useSynthetic) {
        const cityObj = CITIES.find(c => c.id === selectedCity) || CITIES[0];
        const data = generateSyntheticWeather(cityObj, daysBack);
        setHistoricalData(data);
      } else {
        const data = await fetchHistoricalWeather(selectedCity, daysBack);
        setHistoricalData(data);
      }
      setLoading(false);
    }
    loadData();
  }, [selectedCity, daysBack, useSynthetic]);

  if (loading || historicalData.length === 0) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
        <RefreshCw className="spin" size={36} color="var(--accent-cyan)" />
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Fetching Weather Time-Series & Computing ML Regression Models...</p>
      </div>
    );
  }

  const temps = historicalData.map(d => d.temp);

  // Train selected model
  let modelResult;
  if (selectedModelType === 'Polynomial Regression') {
    modelResult = trainPolynomialRegression(temps, 2);
  } else if (selectedModelType === 'Holt Exponential Smoothing') {
    modelResult = trainHoltLinearSmoothing(temps);
  } else {
    modelResult = trainLinearRegression(temps);
  }

  const metrics = evaluateMetrics(temps, modelResult.fitted);
  const movingAvgData = calculateMovingAverage(temps, 7);
  const forecastData = generateForecast(modelResult, temps.length, forecastDays);

  const avgTemp = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  const forecastMean = forecastData.forecast.length > 0 
    ? (forecastData.forecast.reduce((a, b) => a + b, 0) / forecastData.forecast.length).toFixed(1)
    : avgTemp;

  // Trend slope per year estimate
  const trendVelocity = modelResult.slope ? (modelResult.slope * 365).toFixed(2) : '0.00';

  const currentCityObj = CITIES.find(c => c.id === selectedCity) || CITIES[0];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Bar */}
      <header className="navbar">
        <div className="logo-group">
          <div className="logo-icon">
            <CloudSun size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="logo-title">AeroCast</span>
              <span className="logo-badge">v1.0 ML Engine</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowCodeModal(true)}
            style={{ fontSize: '0.85rem' }}
          >
            <Code size={16} /> Python Script
          </button>
          <div className="tag tag-cyan">
            <Globe size={14} /> {historicalData[0]?.isReal ? 'Open-Meteo Live Archive' : 'Synthetic Simulator'}
          </div>
        </div>
      </header>

      {/* Main Layout Grid */}
      <main className="dashboard-layout grid-main">
        {/* Sidebar Controls */}
        <aside className="glass-panel" style={{ padding: '1.25rem', height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <Sliders size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Control Panel</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* City Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: '500' }}>
                Target Location
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
              >
                {CITIES.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range History */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: '500' }}>
                Historical Period
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={daysBack}
                onChange={e => setDaysBack(Number(e.target.value))}
              >
                <option value={60}>Last 60 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={180}>Last 180 Days (Half Year)</option>
                <option value={365}>Last 365 Days (Full Year)</option>
              </select>
            </div>

            {/* Regression Model Algorithm */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem', fontWeight: '500' }}>
                Predictive Algorithm
              </label>
              <select
                className="select-input"
                style={{ width: '100%' }}
                value={selectedModelType}
                onChange={e => setSelectedModelType(e.target.value)}
              >
                <option value="Linear Regression">Linear Regression (y = mx + c)</option>
                <option value="Polynomial Regression">Polynomial Regression (Deg 2)</option>
                <option value="Holt Exponential Smoothing">Holt Exponential Smoothing</option>
              </select>
            </div>

            {/* Forecast Horizon Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <span>Forecast Horizon</span>
                <span className="mono" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{forecastDays} Days</span>
              </div>
              <input
                type="range"
                min={7}
                max={60}
                value={forecastDays}
                onChange={e => setForecastDays(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>

            {/* Data Source Mode Toggle */}
            <div style={{ paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <input
                  type="checkbox"
                  checked={useSynthetic}
                  onChange={e => setUseSynthetic(e.target.checked)}
                  style={{ accentColor: 'var(--accent-cyan)' }}
                />
                Use Synthetic Noise Simulator
              </label>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section>
          {/* Top Metric Cards */}
          <div className="metrics-grid">
            <div className="glass-card metric-card temp">
              <div className="metric-header">
                <span>Historical Mean Temp</span>
                <CloudSun size={18} color="var(--accent-amber)" />
              </div>
              <div className="metric-value">{avgTemp} °C</div>
              <div className="metric-sub">{historicalData.length} daily readings analyzed</div>
            </div>

            <div className="glass-card metric-card accuracy">
              <div className="metric-header">
                <span>Model Fit (R² Score)</span>
                <Brain size={18} color="var(--accent-emerald)" />
              </div>
              <div className="metric-value">{metrics.r2}</div>
              <div className="metric-sub">RMSE: {metrics.rmse} °C | MAE: {metrics.mae} °C</div>
            </div>

            <div className="glass-card metric-card trend">
              <div className="metric-header">
                <span>Est. Trend Rate</span>
                <TrendingUp size={18} color="var(--accent-purple)" />
              </div>
              <div className="metric-value">{trendVelocity > 0 ? `+${trendVelocity}` : trendVelocity} °C/yr</div>
              <div className="metric-sub">Calculated via slope trajectory</div>
            </div>

            <div className="glass-card metric-card humidity">
              <div className="metric-header">
                <span>{forecastDays}-Day Forecast Mean</span>
                <Sparkles size={18} color="var(--accent-blue)" />
              </div>
              <div className="metric-value">{forecastMean} °C</div>
              <div className="metric-sub">Target: {currentCityObj.name}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'timeseries' ? 'active' : ''}`}
              onClick={() => setActiveTab('timeseries')}
            >
              <Activity size={16} /> Time Series & Forecast
            </button>
            <button
              className={`tab-btn ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              <BarChart size={16} /> Model Comparison
            </button>
            <button
              className={`tab-btn ${activeTab === 'eda' ? 'active' : ''}`}
              onClick={() => setActiveTab('eda')}
            >
              <Globe size={16} /> Exploratory Analysis (EDA)
            </button>
          </div>

          {/* Tab Views */}
          {activeTab === 'timeseries' && (
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    {currentCityObj.name} — Temperature Trend Analysis & Prediction
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Fitting {selectedModelType} over historical series + {forecastDays}-day forward confidence bounds.
                  </p>
                </div>
              </div>

              <TimeSeriesChart
                historicalData={historicalData}
                modelResult={modelResult}
                movingAvgData={movingAvgData}
                forecastData={forecastData}
                forecastDays={forecastDays}
                selectedModel={selectedModelType}
              />
            </div>
          )}

          {activeTab === 'comparison' && (
            <ModelComparison historicalTemps={temps} />
          )}

          {activeTab === 'eda' && (
            <ExploratoryAnalysis historicalData={historicalData} />
          )}
        </section>
      </main>

      {/* Code Modal */}
      {showCodeModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Standalone Python Machine Learning Script</h3>
              <button className="btn btn-secondary" onClick={() => setShowCodeModal(false)}>Close</button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              This script is also saved as <code className="mono">weather_analysis.py</code> in your project directory for offline terminal execution.
            </p>
            <pre style={{
              background: '#090d16',
              padding: '1rem',
              borderRadius: '10px',
              overflowY: 'auto',
              fontFamily: 'JetBrains Mono',
              fontSize: '0.8rem',
              color: '#38bdf8',
              border: '1px solid var(--border-color)'
            }}>
{`import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import PolynomialFeatures
from sklearn.metrics import mean_squared_error, r2_score

# 1. Load or Simulate Time Series Weather Data
np.random.seed(42)
days = 180
time_index = np.arange(days).reshape(-1, 1)

# Synthetic temperature signal: Base + Seasonality + Trend + Noise
base_temp = 15.0
seasonality = 8.0 * np.sin(2 * np.pi * time_index / 365)
trend = 0.02 * time_index
noise = np.random.normal(0, 1.5, size=(days, 1))

y_temp = base_temp + seasonality + trend + noise

# 2. Fit Linear Regression
lin_reg = LinearRegression()
lin_reg.fit(time_index, y_temp)
y_pred_lin = lin_reg.predict(time_index)

# 3. Fit Polynomial Regression (Deg 2)
poly_feat = PolynomialFeatures(degree=2)
X_poly = poly_feat.fit_transform(time_index)
poly_reg = LinearRegression()
poly_reg.fit(X_poly, y_temp)
y_pred_poly = poly_reg.predict(X_poly)

# 4. Evaluate Metrics
r2_lin = r2_score(y_temp, y_pred_lin)
rmse_lin = np.sqrt(mean_squared_error(y_temp, y_pred_lin))

r2_poly = r2_score(y_temp, y_pred_poly)
rmse_poly = np.sqrt(mean_squared_error(y_temp, y_pred_poly))

print(f"Linear Regression R2: {r2_lin:.3f} | RMSE: {rmse_lin:.2f} deg C")
print(f"Poly Regression R2: {r2_poly:.3f} | RMSE: {rmse_poly:.2f} deg C")`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
