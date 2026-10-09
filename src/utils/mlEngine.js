/**
 * Time Series Machine Learning & Statistical Regression Engine
 * Implements Linear Regression, Polynomial Regression, Holt-Winters Exponential Smoothing,
 * and Model Evaluation Metrics (R², RMSE, MAE, MAPE).
 */

/**
 * 1. Simple Linear Regression
 * y = slope * x + intercept
 */
export function trainLinearRegression(dataPoints) {
  const n = dataPoints.length;
  if (n === 0) return { slope: 0, intercept: 0, predict: () => 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    const x = i;
    const y = dataPoints[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const fitted = dataPoints.map((_, i) => Number((slope * i + intercept).toFixed(2)));

  return {
    name: 'Linear Regression',
    slope,
    intercept,
    fitted,
    predict: (stepIndex) => slope * stepIndex + intercept
  };
}

/**
 * 2. Polynomial Regression (Degree 2)
 * y = a*x^2 + b*x + c
 */
export function trainPolynomialRegression(dataPoints, degree = 2) {
  const n = dataPoints.length;
  if (n < 3) return trainLinearRegression(dataPoints);

  let s0 = n;
  let s1 = 0, s2 = 0, s3 = 0, s4 = 0;
  let t0 = 0, t1 = 0, t2 = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = dataPoints[i];
    const x2 = x * x;
    s1 += x;
    s2 += x2;
    s3 += x2 * x;
    s4 += x2 * x2;
    t0 += y;
    t1 += x * y;
    t2 += x2 * y;
  }

  const det = (A) => 
    A[0][0]*(A[1][1]*A[2][2] - A[1][2]*A[2][1]) -
    A[0][1]*(A[1][0]*A[2][2] - A[1][2]*A[2][0]) +
    A[0][2]*(A[1][0]*A[2][1] - A[1][1]*A[2][0]);

  const M = [
    [s0, s1, s2],
    [s1, s2, s3],
    [s2, s3, s4]
  ];

  const D = det(M);

  if (Math.abs(D) < 1e-12) {
    return trainLinearRegression(dataPoints);
  }

  const Mc = [
    [t0, s1, s2],
    [t1, s2, s3],
    [t2, s3, s4]
  ];
  const Mb = [
    [s0, t0, s2],
    [s1, t1, s3],
    [s2, t2, s4]
  ];
  const Ma = [
    [s0, s1, t0],
    [s1, s2, t1],
    [s2, s3, t2]
  ];

  const c = det(Mc) / D;
  const b = det(Mb) / D;
  const a = det(Ma) / D;

  const fitted = dataPoints.map((_, i) => Number((a * i * i + b * i + c).toFixed(2)));

  return {
    name: 'Polynomial Regression (Deg 2)',
    a, b, c,
    fitted,
    predict: (stepIndex) => a * stepIndex * stepIndex + b * stepIndex + c
  };
}

/**
 * 3. Double Exponential Smoothing (Holt's Linear Trend)
 */
export function trainHoltLinearSmoothing(dataPoints, alpha = 0.35, beta = 0.15) {
  const n = dataPoints.length;
  if (n < 2) return trainLinearRegression(dataPoints);

  const level = new Array(n);
  const trend = new Array(n);
  const fitted = new Array(n);

  level[0] = dataPoints[0];
  trend[0] = dataPoints[1] - dataPoints[0];
  fitted[0] = Number(level[0].toFixed(2));

  for (let i = 1; i < n; i++) {
    level[i] = alpha * dataPoints[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
    trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
    fitted[i] = Number((level[i - 1] + trend[i - 1]).toFixed(2));
  }

  const lastLevel = level[n - 1];
  const lastTrend = trend[n - 1];

  return {
    name: 'Holt Exponential Smoothing',
    alpha,
    beta,
    fitted,
    predict: (h) => lastLevel + h * lastTrend
  };
}

/**
 * 4. Simple Moving Average
 */
export function calculateMovingAverage(dataPoints, windowSize = 7) {
  const result = [];
  for (let i = 0; i < dataPoints.length; i++) {
    if (i < windowSize - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        sum += dataPoints[i - j];
      }
      result.push(Number((sum / windowSize).toFixed(2)));
    }
  }
  return result;
}

/**
 * Evaluate Model Performance Metrics
 */
export function evaluateMetrics(actual, fitted) {
  const n = actual.length;
  if (n === 0) return { mae: 0, rmse: 0, r2: 0, mape: 0 };

  const meanActual = actual.reduce((a, b) => a + b, 0) / n;

  let ssTot = 0;
  let ssRes = 0;
  let absErrorSum = 0;
  let squaredErrorSum = 0;
  let percentageErrorSum = 0;

  for (let i = 0; i < n; i++) {
    const act = actual[i];
    const fit = fitted[i];
    if (fit === null || fit === undefined) continue;

    const err = act - fit;
    ssRes += err * err;
    ssTot += (act - meanActual) * (act - meanActual);

    absErrorSum += Math.abs(err);
    squaredErrorSum += err * err;
    if (act !== 0) {
      percentageErrorSum += Math.abs(err / act);
    }
  }

  const r2 = ssTot !== 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;
  const mae = absErrorSum / n;
  const rmse = Math.sqrt(squaredErrorSum / n);
  const mape = (percentageErrorSum / n) * 100;

  return {
    r2: Number(r2.toFixed(3)),
    mae: Number(mae.toFixed(2)),
    rmse: Number(rmse.toFixed(2)),
    mape: Number(mape.toFixed(2))
  };
}

/**
 * Generate Future Forecast Points with Confidence Intervals
 */
export function generateForecast(model, historicalLength, forecastDays = 14, stdDev = 1.5) {
  const forecast = [];
  const confidenceLower = [];
  const confidenceUpper = [];

  for (let step = 1; step <= forecastDays; step++) {
    let predVal = 0;
    if (model.name === 'Holt Exponential Smoothing') {
      predVal = model.predict(step);
    } else {
      predVal = model.predict(historicalLength - 1 + step);
    }

    predVal = Number(predVal.toFixed(1));
    
    const uncertaintyFactor = Math.sqrt(step) * 0.35 * stdDev;
    const lower = Number((predVal - uncertaintyFactor).toFixed(1));
    const upper = Number((predVal + uncertaintyFactor).toFixed(1));

    forecast.push(predVal);
    confidenceLower.push(lower);
    confidenceUpper.push(upper);
  }

  return { forecast, confidenceLower, confidenceUpper };
}
