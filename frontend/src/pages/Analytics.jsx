import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { cityService } from '../services/cityService';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  TrendingUp, Wind, Thermometer,
  Calendar, Building2, CheckCircle2, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

const METRICS = [
  { id: 'aqi', label: 'Air Quality (AQI)', icon: Wind, unit: 'AQI', color: '#2563eb', desc: 'Lower AQI means cleaner, healthier air' },
  { id: 'temperature_c', label: 'Temperature (°C)', icon: Thermometer, unit: '°C', color: '#ea580c', desc: 'Daily recorded temperature trend' },
];

const COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed'];

export default function Analytics() {
  const [cities, setCities] = useState([]);
  const [cityA, setCityA] = useState('');
  const [cityB, setCityB] = useState('');
  const [metric, setMetric] = useState('aqi');
  const [days, setDays] = useState(15);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load cities list
  useEffect(() => {
    cityService.listCities({ pageSize: 100 })
      .then(res => {
        const list = res?.items || [];
        setCities(list);
        if (list.length >= 2) {
          const indore = list.find(c => c.name.toLowerCase() === 'indore');
          const bhopal = list.find(c => c.name.toLowerCase() === 'bhopal');
          setCityA(indore ? indore.id : list[0].id);
          setCityB(bhopal ? bhopal.id : list[1].id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch trend data
  useEffect(() => {
    if (!cityA && !cityB) return;
    const selectedIds = [cityA, cityB].filter(Boolean);
    if (selectedIds.length === 0) return;

    setLoading(true);
    const fetchTrends = metric === 'aqi'
      ? analyticsService.getAqiTrends(selectedIds, days)
      : analyticsService.getWeatherTrends(selectedIds, metric, days);

    fetchTrends
      .then(data => setTrends(data || []))
      .catch(err => {
        console.error(err);
        toast.error('Could not load city trend data');
      })
      .finally(() => setLoading(false));
  }, [cityA, cityB, metric, days]);

  // Transform data for Recharts
  const dateMap = {};
  trends.forEach(cityTrend => {
    (cityTrend.data || []).forEach(point => {
      const d = point.date;
      if (!dateMap[d]) {
        const dObj = new Date(d);
        dateMap[d] = {
          date: dObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawDate: d,
        };
      }
      dateMap[d][cityTrend.city_name] = point.value;
    });
  });

  const chartData = Object.values(dateMap).sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));
  const activeMetricInfo = METRICS.find(m => m.id === metric) || METRICS[0];

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', paddingBottom: '2rem' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.75rem 2rem',
        color: '#ffffff',
        marginBottom: '1.75rem',
        boxShadow: '0 8px 20px rgba(37, 99, 235, 0.18)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <TrendingUp size={28} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            City Trends & Analytics
          </h1>
        </div>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem', maxWidth: '650px' }}>
          Pichhle dino ka historical record dekhein aur 2 cities ke beech simple trend comparison karein.
        </p>
      </div>

      {/* Clean Control Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* City Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              CITY 1
            </label>
            <select
              value={cityA}
              onChange={e => setCityA(e.target.value)}
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-primary)',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                minWidth: '150px'
              }}
            >
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <span style={{ fontWeight: 800, color: 'var(--color-text-muted)', marginTop: '16px' }}>VS</span>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '4px' }}>
              CITY 2 (Optional)
            </label>
            <select
              value={cityB}
              onChange={e => setCityB(e.target.value)}
              style={{
                padding: '0.55rem 0.9rem',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--color-border)',
                fontWeight: 600,
                fontSize: '0.9rem',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                minWidth: '150px'
              }}
            >
              <option value="">None (Single City)</option>
              {cities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric & Time Range Switchers */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Metric Selector */}
          <div style={{ display: 'flex', background: 'var(--color-bg)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            {METRICS.map(m => {
              const Icon = m.icon;
              const active = metric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setMetric(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '0.45rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: active ? 'var(--color-primary)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.825rem',
                    cursor: 'pointer',
                  }}
                >
                  <Icon size={15} />
                  {m.label.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Days Filter */}
          <div style={{ display: 'flex', background: 'var(--color-bg)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            {[7, 15].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: days === d ? 'var(--color-surface)' : 'transparent',
                  color: days === d ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  boxShadow: days === d ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {d} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
              {activeMetricInfo.label} Trend ({days} Days)
            </h3>
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '3px 0 0 0' }}>
              {activeMetricInfo.desc}
            </p>
          </div>
          <span className="badge badge-primary" style={{ fontWeight: 700, padding: '4px 10px' }}>
            Unit: {activeMetricInfo.unit}
          </span>
        </div>

        {loading ? (
          <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            Loading trend data…
          </div>
        ) : chartData.length === 0 ? (
          <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
            No recorded data points for this selection.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.08)' }}
                formatter={(val, name) => [`${val} ${activeMetricInfo.unit}`, name]}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              {trends.map((t, idx) => (
                <Line
                  key={t.city_id}
                  type="monotone"
                  dataKey={t.city_name}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 7 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Clear Summary Cards */}
      {trends.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {trends.map((t, idx) => {
            const vals = (t.data || []).map(d => d.value).filter(v => v !== null && !isNaN(v));
            const avg = vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
            const max = vals.length > 0 ? Math.max(...vals).toFixed(1) : '—';
            const min = vals.length > 0 ? Math.min(...vals).toFixed(1) : '—';
            const color = COLORS[idx % COLORS.length];

            return (
              <div key={t.city_id} className="card" style={{ padding: '1.25rem', borderTop: `4px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                    {t.city_name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                    Last {days} Days
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'var(--color-bg)', padding: '10px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>Average</span>
                    <strong style={{ fontSize: '1.15rem', color: color }}>{avg}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>Lowest</span>
                    <strong style={{ fontSize: '1.15rem', color: '#16a34a' }}>{min}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600 }}>Highest</span>
                    <strong style={{ fontSize: '1.15rem', color: '#dc2626' }}>{max}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
