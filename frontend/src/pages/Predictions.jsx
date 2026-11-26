import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { cityService } from '../services/cityService';
import CitySearchInput from '../components/city/CitySearchInput';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import {
  BrainCircuit, Wind, Zap, RefreshCw,
  Smile, AlertCircle, Sparkles, Check
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Predictions() {
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [forecastType, setForecastType] = useState('aqi'); // 'aqi' or 'energy'
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  // Load cities on mount
  useEffect(() => {
    cityService.listCities({ pageSize: 100 })
      .then(res => {
        const list = res?.items || [];
        setCities(list);
        if (list.length > 0) {
          const indore = list.find(c => c.name.toLowerCase() === 'indore');
          setSelectedCityId(indore ? indore.id : list[0].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch predictions on change
  useEffect(() => {
    if (!selectedCityId) return;
    loadForecast(selectedCityId, forecastType);
  }, [selectedCityId, forecastType]);

  const loadForecast = async (cityId, type) => {
    setLoading(true);
    try {
      const data = await analyticsService.getPredictions(cityId, type);
      setPredictions(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunForecast = async () => {
    if (!selectedCityId) return;
    setRunning(true);
    try {
      if (forecastType === 'aqi') {
        await analyticsService.runAqiPrediction(selectedCityId);
        toast.success('Future 7-day forecast updated!');
      } else {
        await analyticsService.runEnergyPrediction(selectedCityId);
        toast.success('Energy forecast updated!');
      }
      await loadForecast(selectedCityId, forecastType);
    } catch (err) {
      toast.error('Forecast failed. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const selectedCity = cities.find(c => c.id === selectedCityId);

  // Simplify chart data
  const chartData = predictions.map(p => {
    const d = new Date(p.prediction_date);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    return {
      day: dayLabel,
      date: p.prediction_date,
      value: Math.round(p.predicted_value),
    };
  });

  const avgValue = chartData.length > 0
    ? Math.round(chartData.reduce((acc, curr) => acc + curr.value, 0) / chartData.length)
    : 65;

  const getAqiSimpleInfo = (aqi) => {
    if (aqi <= 50) return { title: 'Clean & Healthy Air', color: '#16a34a', bg: '#dcfce7', advice: 'Great day for walking, cycling, and outdoor games!' };
    if (aqi <= 100) return { title: 'Moderate Air Quality', color: '#ca8a04', bg: '#fef9c3', advice: 'Generally good. Sensitive people can wear a mask during peak hours.' };
    if (aqi <= 150) return { title: 'Unhealthy for Sensitive Groups', color: '#ea580c', bg: '#ffedd5', advice: 'Children and seniors should reduce strenuous outdoor activity.' };
    return { title: 'Polluted Air Warning', color: '#dc2626', bg: '#fee2e2', advice: 'Wear N95 mask outside and keep indoor air purifiers running.' };
  };

  const getEnergySimpleInfo = (kwh) => {
    if (kwh <= 25) return { title: 'Normal Power Usage', color: '#16a34a', bg: '#dcfce7', advice: 'Grid load is stable. Normal electricity consumption.' };
    return { title: 'Peak Power Usage', color: '#d97706', bg: '#fef3c7', advice: 'High air conditioning / appliance demand expected on this day.' };
  };

  const overall = forecastType === 'aqi'
    ? getAqiSimpleInfo(avgValue)
    : getEnergySimpleInfo(avgValue);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={28} color="var(--color-primary)" />
          7-Day Future City Forecast
        </h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
          Simple and clear daily predictions for air quality and electricity consumption
        </p>
      </div>

      {/* Select City & Toggle Forecast Type */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <CitySearchInput
              label="Select City"
              selectedCityId={selectedCityId}
              onSelectCity={id => setSelectedCityId(id)}
              cities={cities}
              onCityAdded={newCity => setCities(prev => [...prev, newCity])}
              placeholder="Type city name (Indore, Bhopal, Jaipur, etc.)..."
            />
          </div>

          {/* Clean Type Selector */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setForecastType('aqi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: forecastType === 'aqi' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: forecastType === 'aqi' ? 'white' : 'var(--color-text)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Wind size={16} /> Air Quality (AQI)
            </button>

            <button
              onClick={() => setForecastType('energy')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: forecastType === 'energy' ? 'var(--color-primary)' : 'var(--color-bg)',
                color: forecastType === 'energy' ? 'white' : 'var(--color-text)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <Zap size={16} /> Power Demand (kWh)
            </button>

            <button
              onClick={handleRunForecast}
              disabled={running || !selectedCityId}
              style={{
                padding: '0.625rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'white',
                color: 'var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={15} style={{ animation: running ? 'spin 1s linear infinite' : 'none' }} />
              {running ? 'Updating…' : 'Refresh Forecast'}
            </button>
          </div>
        </div>
      </div>

      {/* Big User-Friendly Summary Card */}
      <div
        className="card"
        style={{
          background: overall.bg,
          border: `1.5px solid ${overall.color}`,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '1.5rem 2rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: overall.color, textTransform: 'uppercase' }}>
            Next 7 Days Average for {selectedCity ? selectedCity.name : 'City'}
          </span>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>
            {overall.title}
          </h2>
          <p style={{ margin: 0, fontSize: '0.925rem', color: '#334155' }}>
            💡 <strong>Helpful Tip:</strong> {overall.advice}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: overall.color, lineHeight: 1 }}>
            {avgValue}
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#475569' }}>
            {forecastType === 'aqi' ? 'Average AQI' : 'kWh per person'}
          </span>
        </div>
      </div>

      {/* 7 Daily Cards Grid */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
        Day-by-Day Forecast (Next 7 Days)
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {chartData.map((d, i) => {
          const info = forecastType === 'aqi'
            ? getAqiSimpleInfo(d.value)
            : getEnergySimpleInfo(d.value);

          return (
            <div
              key={i}
              className="card"
              style={{
                padding: '1rem',
                textAlign: 'center',
                borderTop: `4px solid ${info.color}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                {d.day}
              </span>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: info.color, margin: '4px 0' }}>
                {d.value}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: info.color }}>
                {info.title.split(' ')[0]}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', lineHeight: 1.3, marginTop: '4px' }}>
                {forecastType === 'aqi' ? (d.value <= 100 ? 'Clean Air' : 'Caution') : 'Daily Power'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Clean Interactive Trend Chart */}
      <div className="card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>
          Visual Trend Curve
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
          See how the {forecastType === 'aqi' ? 'air quality index' : 'power consumption'} will change over the coming week
        </p>

        {loading ? (
          <div style={{ height: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Loading trend…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={forecastType === 'aqi' ? '#2563eb' : '#d97706'} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={forecastType === 'aqi' ? '#2563eb' : '#d97706'} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val) => [`${val} ${forecastType === 'aqi' ? 'AQI' : 'kWh'}`, 'Predicted']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              />
              {forecastType === 'aqi' && (
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Moderate/Unhealthy threshold', fill: '#ef4444', fontSize: 10 }} />
              )}
              <Area
                type="monotone"
                dataKey="value"
                stroke={forecastType === 'aqi' ? '#2563eb' : '#d97706'}
                strokeWidth={3}
                fill="url(#forecastFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
