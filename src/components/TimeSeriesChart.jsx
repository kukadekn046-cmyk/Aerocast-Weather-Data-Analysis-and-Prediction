import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TimeSeriesChart({
  historicalData,
  modelResult,
  movingAvgData,
  forecastData,
  forecastDays,
  selectedModel
}) {
  if (!historicalData || historicalData.length === 0) return null;

  const dates = historicalData.map(d => d.date);
  const actualTemps = historicalData.map(d => d.temp);

  // Generate future date strings
  const lastDate = new Date(dates[dates.length - 1]);
  const forecastDates = [];
  for (let i = 1; i <= forecastDays; i++) {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + i);
    forecastDates.push(nextDate.toISOString().split('T')[0]);
  }

  const allLabels = [...dates, ...forecastDates];

  // Align fitted data
  const fittedPadded = [...modelResult.fitted, ...new Array(forecastDays).fill(null)];

  // Align moving average data
  const movingAvgPadded = [...movingAvgData, ...new Array(forecastDays).fill(null)];

  // Align forecast series
  const forecastPadded = [
    ...new Array(historicalData.length - 1).fill(null),
    actualTemps[actualTemps.length - 1], // Bridge historical and forecast
    ...(forecastData ? forecastData.forecast : [])
  ];

  const lowerBoundPadded = [
    ...new Array(historicalData.length - 1).fill(null),
    actualTemps[actualTemps.length - 1],
    ...(forecastData ? forecastData.confidenceLower : [])
  ];

  const upperBoundPadded = [
    ...new Array(historicalData.length - 1).fill(null),
    actualTemps[actualTemps.length - 1],
    ...(forecastData ? forecastData.confidenceUpper : [])
  ];

  const chartData = {
    labels: allLabels,
    datasets: [
      {
        label: 'Observed Temp (°C)',
        data: [...actualTemps, ...new Array(forecastDays).fill(null)],
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 2,
        pointRadius: 2.5,
        pointHoverRadius: 6,
        tension: 0.2
      },
      {
        label: '7-Day Moving Avg',
        data: movingAvgPadded,
        borderColor: '#a855f7',
        borderWidth: 1.8,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0.3
      },
      {
        label: `${selectedModel} Fit`,
        data: fittedPadded,
        borderColor: '#f59e0b',
        borderWidth: 2.2,
        pointRadius: 0,
        tension: selectedModel.includes('Polynomial') ? 0.3 : 0
      },
      {
        label: `Predicted (${forecastDays} Days)`,
        data: forecastPadded,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderWidth: 3,
        borderDash: [6, 3],
        pointRadius: 3,
        pointHoverRadius: 7,
        tension: 0.1
      },
      {
        label: '95% Upper Bound',
        data: upperBoundPadded,
        borderColor: 'transparent',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        pointRadius: 0,
        fill: '+1', // Fill to lower bound dataset
        tension: 0.1
      },
      {
        label: '95% Lower Bound',
        data: lowerBoundPadded,
        borderColor: 'transparent',
        pointRadius: 0,
        fill: false,
        tension: 0.1
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          usePointStyle: true,
          boxWidth: 8
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            if (context.dataset.label.includes('Bound')) return null;
            let val = context.parsed.y;
            return `${context.dataset.label}: ${val !== null && val !== undefined ? val.toFixed(1) + ' °C' : 'N/A'}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          maxTicksLimit: 12,
          font: { family: 'Inter', size: 11 }
        }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 11 },
          callback: (value) => `${value}°C`
        }
      }
    }
  };

  return (
    <div className="chart-wrapper">
      <Line data={chartData} options={options} />
    </div>
  );
}
