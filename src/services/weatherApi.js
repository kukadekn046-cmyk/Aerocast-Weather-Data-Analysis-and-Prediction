/**
 * Weather API & Data Generation Service
 * Fetches real historical weather data from Open-Meteo API or generates realistic synthetic data.
 */

export const CITIES = [
  { id: 'london', name: 'London, UK', lat: 51.5074, lon: -0.1278, baseTemp: 11.5, amplitude: 7 },
  { id: 'newyork', name: 'New York, USA', lat: 40.7128, lon: -74.0060, baseTemp: 13.0, amplitude: 12 },
  { id: 'tokyo', name: 'Tokyo, Japan', lat: 35.6762, lon: 139.6503, baseTemp: 15.5, amplitude: 10 },
  { id: 'mumbai', name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, baseTemp: 27.5, amplitude: 3 },
  { id: 'paris', name: 'Paris, France', lat: 48.8566, lon: 2.3522, baseTemp: 12.5, amplitude: 8 },
  { id: 'sydney', name: 'Sydney, Australia', lat: -33.8688, lon: 151.2093, baseTemp: 18.5, amplitude: 6 },
  { id: 'cairo', name: 'Cairo, Egypt', lat: 30.0444, lon: 31.2357, baseTemp: 22.0, amplitude: 9 },
  { id: 'toronto', name: 'Toronto, Canada', lat: 43.6532, lon: -79.3832, baseTemp: 9.0, amplitude: 14 }
];

/**
 * Fetch historical data from Open-Meteo API
 */
export async function fetchHistoricalWeather(cityId, daysBack = 180) {
  const city = CITIES.find(c => c.id === cityId) || CITIES[0];
  
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - daysBack);

  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${city.lat}&longitude=${city.lon}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,surface_pressure_mean&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Open-Meteo API response not ok');
    const json = await res.json();
    
    if (json.daily && json.daily.time) {
      return json.daily.time.map((t, idx) => {
        const meanTemp = json.daily.temperature_2m_mean[idx] ?? (json.daily.temperature_2m_max[idx] + json.daily.temperature_2m_min[idx]) / 2;
        return {
          date: t,
          temp: Number(meanTemp.toFixed(1)),
          tempMax: Number((json.daily.temperature_2m_max[idx] ?? meanTemp + 3).toFixed(1)),
          tempMin: Number((json.daily.temperature_2m_min[idx] ?? meanTemp - 3).toFixed(1)),
          precipitation: Number((json.daily.precipitation_sum[idx] ?? 0).toFixed(1)),
          windSpeed: Number((json.daily.windspeed_10m_max[idx] ?? 12).toFixed(1)),
          pressure: Number((json.daily.surface_pressure_mean[idx] ?? 1013).toFixed(1)),
          isReal: true
        };
      });
    }
  } catch (err) {
    console.warn('Falling back to synthetic data due to API error:', err.message);
  }

  // Fallback to realistic synthetic generation if network API is unreachable
  return generateSyntheticWeather(city, daysBack);
}

/**
 * Generate synthetic realistic temperature time series data
 */
export function generateSyntheticWeather(city, numDays = 180, trendFactor = 0.005, noiseLevel = 1.2) {
  const data = [];
  const today = new Date();

  for (let i = numDays; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);

    // Day of year for sinusoidal seasonal variation
    const startOfYear = new Date(d.getFullYear(), 0, 0);
    const diff = d - startOfYear;
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    // Seasonal sine wave (peaks around July in N. Hemisphere, Jan in S. Hemisphere)
    const hemisphereFactor = city.lat < 0 ? -1 : 1;
    const seasonalComp = hemisphereFactor * city.amplitude * Math.sin(((dayOfYear - 100) / 365) * 2 * Math.PI);
    
    // Long term trend
    const trendComp = (numDays - i) * trendFactor;
    
    // Random gaussian-like noise
    const noise = (Math.random() - 0.5) * 2 * noiseLevel;
    
    const temp = Number((city.baseTemp + seasonalComp + trendComp + noise).toFixed(1));
    const tempMax = Number((temp + 3 + Math.random() * 2).toFixed(1));
    const tempMin = Number((temp - 3 - Math.random() * 2).toFixed(1));
    
    const humidity = Math.min(100, Math.max(30, Number((65 - seasonalComp * 1.5 + (Math.random() - 0.5) * 15).toFixed(1))));
    const windSpeed = Number((10 + Math.random() * 15).toFixed(1));
    const precipitation = Math.random() > 0.75 ? Number((Math.random() * 12).toFixed(1)) : 0;
    const pressure = Number((1013 + (Math.random() - 0.5) * 18).toFixed(1));

    data.push({
      date: d.toISOString().split('T')[0],
      temp,
      tempMax,
      tempMin,
      humidity,
      windSpeed,
      precipitation,
      pressure,
      isReal: false
    });
  }

  return data;
}
