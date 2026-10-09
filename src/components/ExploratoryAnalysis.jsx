import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Thermometer, Droplets, Wind, Gauge, BarChart2 } from 'lucide-react';

export default function ExploratoryAnalysis({ historicalData }) {
  if (!historicalData || historicalData.length === 0) return null;

  const temps = historicalData.map(d => d.temp);
  const humidities = historicalData.map(d => d.humidity ?? 60);
  const pressures = historicalData.map(d => d.pressure ?? 1013);
  const winds = historicalData.map(d => d.windSpeed ?? 10);

  // Helper for Pearson correlation coefficient r
  function calcCorrelation(x, y) {
    const n = x.length;
    if (n === 0) return 0;
    const meanX = x.reduce((a, b) => a + b, 0) / n;
    const meanY = y.reduce((a, b) => a + b, 0) / n;

    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    const den = Math.sqrt(denX * denY);
    return den === 0 ? 0 : Number((num / den).toFixed(2));
  }

  const corrMatrix = [
    { var1: 'Temperature', var2: 'Humidity', r: calcCorrelation(temps, humidities), icon: Droplets, color: '#38bdf8' },
    { var1: 'Temperature', var2: 'Pressure', r: calcCorrelation(temps, pressures), icon: Gauge, color: '#a855f7' },
    { var1: 'Temperature', var2: 'Wind Speed', r: calcCorrelation(temps, winds), icon: Wind, color: '#10b981' }
  ];

  // Frequency Distribution Histogram Bins
  const minTemp = Math.floor(Math.min(...temps));
  const maxTemp = Math.ceil(Math.max(...temps));
  const binSize = 3;
  const bins = {};

  for (let b = minTemp; b <= maxTemp; b += binSize) {
    const key = `${b}°C - ${b + binSize}°C`;
    bins[key] = 0;
  }

  temps.forEach(t => {
    const bIndex = Math.floor((t - minTemp) / binSize) * binSize + minTemp;
    const key = `${bIndex}°C - ${bIndex + binSize}°C`;
    if (bins[key] !== undefined) bins[key]++;
  });

  const histogramData = {
    labels: Object.keys(bins),
    datasets: [
      {
        label: 'Observation Frequency (Days)',
        data: Object.values(bins),
        backgroundColor: 'rgba(6, 182, 212, 0.6)',
        borderColor: '#06b6d4',
        borderWidth: 1.5,
        borderRadius: 6
      }
    ]
  };

  const histogramOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'Inter', size: 11 } }
      }
    }
  };

  // Calculate Summary Statistics
  const mean = (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1);
  const sortedTemps = [...temps].sort((a, b) => a - b);
  const median = sortedTemps[Math.floor(sortedTemps.length / 2)].toFixed(1);
  const stdDev = Math.sqrt(temps.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / temps.length).toFixed(1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Correlation Matrix Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        {corrMatrix.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div key={idx} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: item.color }}>
                <IconComp size={24} />
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Temp vs {item.var2}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700' }} className="mono">
                  r = {item.r}
                </div>
                <div style={{ fontSize: '0.75rem', color: item.r < 0 ? '#f43f5e' : '#10b981' }}>
                  {item.r < -0.3 ? 'Moderate Negative Corr' : item.r > 0.3 ? 'Moderate Positive Corr' : 'Weak Correlation'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
        {/* Temperature Frequency Distribution */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart2 size={20} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>Temperature Distribution Histogram</h4>
          </div>
          <div style={{ height: '280px' }}>
            <Bar data={histogramData} options={histogramOptions} />
          </div>
        </div>

        {/* Statistical Moments Summary */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
          <h4 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Statistical Moments
          </h4>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Mean Temperature</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-amber)' }}>{mean} °C</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Median Temperature</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>{median} °C</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Std Deviation ($\sigma$)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-purple)' }}>{stdDev} °C</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Min / Max Range</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-main)' }}>
              {minTemp}°C to {maxTemp}°C
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
