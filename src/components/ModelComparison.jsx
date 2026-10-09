import React from 'react';
import {
  evaluateMetrics,
  trainLinearRegression,
  trainPolynomialRegression,
  trainHoltLinearSmoothing
} from '../utils/mlEngine';
import { Award, Zap, AlertTriangle, TrendingUp } from 'lucide-react';

export default function ModelComparison({ historicalTemps }) {
  if (!historicalTemps || historicalTemps.length === 0) return null;

  // Train all three models for comparison
  const linModel = trainLinearRegression(historicalTemps);
  const polyModel = trainPolynomialRegression(historicalTemps);
  const holtModel = trainHoltLinearSmoothing(historicalTemps);

  const linMetrics = evaluateMetrics(historicalTemps, linModel.fitted);
  const polyMetrics = evaluateMetrics(historicalTemps, polyModel.fitted);
  const holtMetrics = evaluateMetrics(historicalTemps, holtModel.fitted);

  const models = [
    { name: 'Linear Regression', metrics: linMetrics, desc: 'Simple trend fitting using least squares method (y = mx + c)', color: '#38bdf8' },
    { name: 'Polynomial Regression (Deg 2)', metrics: polyMetrics, desc: 'Captures non-linear seasonal curvature and inflection points', color: '#f59e0b' },
    { name: 'Holt Exponential Smoothing', metrics: holtMetrics, desc: 'Adaptive level and trend smoothing weighted heavily on recent observations', color: '#10b981' }
  ];

  // Determine best model based on R2 and RMSE
  const sorted = [...models].sort((a, b) => b.metrics.r2 - a.metrics.r2 || a.metrics.rmse - b.metrics.rmse);
  const bestModel = sorted[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Best Model Banner */}
      <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-emerald)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <Award size={28} />
          </div>
          <div>
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Recommended Model: {bestModel.name}</h4>
            
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Highest Coefficient of Determination (R² = {bestModel.metrics.r2}) with Lowest Root Mean Square Error (RMSE = {bestModel.metrics.rmse} °C).
              </p>

          </div>
        </div>
        <div className="tag tag-emerald" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          R² = {(bestModel.metrics.r2 * 100).toFixed(1)}% Variance Explained
        </div>
      </div>

      {/* Model Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {models.map((m, idx) => (
          <div key={idx} className="glass-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '700', color: m.color }}>{m.name}</h4>
                {m.name === bestModel.name && (
                  <span className="tag tag-emerald" style={{ fontSize: '0.7rem' }}>Best Fit</span>
                )}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1.25rem' }}>{m.desc}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: 'rgba(10, 13, 20, 0.5)', padding: '0.75rem', borderRadius: '8px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>R² Score</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>{m.metrics.r2}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>RMSE</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>{m.metrics.rmse} °C</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>MAE</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>{m.metrics.mae} °C</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>MAPE</span>
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#f1f5f9' }}>{m.metrics.mape}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Metric Breakdown Table */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>Comparative Metrics Matrix</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem' }}>Model Algorithm</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>R² Score (Goodness of Fit)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>MAE (Mean Abs Error)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>RMSE (Root Mean Sq Error)</th>
                <th style={{ padding: '0.75rem 0.5rem' }}>MAPE (Mean Abs % Error)</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600', color: m.color }}>{m.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }} className="mono">{m.metrics.r2}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }} className="mono">{m.metrics.mae} °C</td>
                  <td style={{ padding: '0.75rem 0.5rem' }} className="mono">{m.metrics.rmse} °C</td>
                  <td style={{ padding: '0.75rem 0.5rem' }} className="mono">{m.metrics.mape}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
