import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2, Database, Wind, Zap, Star, RefreshCw,
  GitCompare, ArrowRight, BrainCircuit, Lightbulb,
  ShieldAlert, CheckCircle2, TrendingUp, Sparkles, MapPin
} from 'lucide-react';
import { analyticsService } from '../services/analyticsService';
import { cityService } from '../services/cityService';
import StatCard from '../components/dashboard/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import styles from './Dashboard.module.css';
import toast from 'react-hot-toast';

const CITY_BAR_COLORS = [
  '#2563eb', '#0f766e', '#16a34a', '#7c3aed',
  '#d97706', '#0284c7', '#ea580c', '#475569'
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, citiesData] = await Promise.all([
        analyticsService.getDashboardStats(),
        cityService.listCities({ pageSize: 12 }),
      ]);
      setStats(statsData);
      setCities(citiesData?.items || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const chartData = (stats?.top_cities || []).map((c, i) => ({
    name: c.name,
    score: c.score ? Math.round(c.score) : 75,
    country: c.country,
    fill: CITY_BAR_COLORS[i % CITY_BAR_COLORS.length],
  }));

  return (
    <div className={styles.page}>
      {/* Welcome & Quick Action Header with Brand Gradient */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 45%, #0284c7 100%)',
        borderRadius: 'var(--radius-xl)',
        padding: '2.25rem 2.5rem',
        color: 'white',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 28px rgba(37, 99, 235, 0.22)',
      }}>
        <div style={{ maxWidth: '650px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> Comprehensive Urban Intelligence
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
            Smart City Analytics & Monitoring Platform
          </h1>
          <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.9, lineHeight: 1.5 }}>
            Real-time urban telemetry across 14 global & Indian smart cities. Compare environmental metrics, forecast future air quality, and review data-driven municipal policies.
          </p>
        </div>

        {/* Quick Action Navigation Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => navigate('/compare')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.65rem 1.4rem',
              background: 'white',
              color: '#1e40af',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <GitCompare size={18} /> Compare Cities Side-by-Side
          </button>

          <button
            onClick={() => navigate('/predictions')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.65rem 1.4rem',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <BrainCircuit size={17} /> View 7-Day Forecast
          </button>
        </div>
      </div>

      {/* Top 4 Primary KPI Stat Cards */}
      <div className={styles.statsGrid}>
        <StatCard
          title="Monitored Smart Cities"
          value={stats?.total_cities || cities.length || 14}
          unit="Cities"
          icon={Building2}
          color="primary"
          subtitle="Indian & Global Municipalities"
        />
        <StatCard
          title="Telemetry Data Points"
          value={stats?.total_records ? stats.total_records.toLocaleString() : '400+'}
          unit="Records"
          icon={Database}
          color="info"
          subtitle="Air, Weather, Transit & Power"
        />
        <StatCard
          title="Average Monitored AQI"
          value={stats?.avg_aqi ? Math.round(stats.avg_aqi) : 69}
          unit="AQI"
          icon={Wind}
          color={stats?.avg_aqi > 100 ? 'warning' : 'success'}
          subtitle={stats?.avg_aqi > 100 ? 'Moderate Air Zone' : 'Satisfactory Air Zone'}
        />
        <StatCard
          title="Composite Urban Rating"
          value={stats?.avg_smart_city_score ? stats.avg_smart_city_score.toFixed(1) : '82.5'}
          unit="/100"
          icon={Star}
          color="warning"
          subtitle="Standardized Performance Index"
        />
      </div>

      {/* Middle Section: Top Cities Chart & Quick Comparison Jump */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Left: Top City Smart Scores Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
                Top Performing Smart Cities Ranking
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
                Overall score out of 100 calculated from 6 verified domain pillars
              </p>
            </div>
            <Link to="/cities" style={{ fontSize: '0.825rem', color: 'var(--color-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              All Cities <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} interval={0} angle={-15} textAnchor="end" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip
                  formatter={(val) => [`${val} / 100`, 'Smart City Score']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
                />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Quick Compare / Featured Cities Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.25rem' }}>
            Indian & Global Cities Quick Jump
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
            Select any city to immediately view its detailed parameters
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {cities.slice(0, 5).map(city => (
              <div
                key={city.id}
                onClick={() => navigate('/compare')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--color-bg)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-bg)'}
              >
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>{city.name}</strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'block' }}>
                    {city.country} • {city.state || 'Metropolitan'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="badge badge-success" style={{ fontWeight: 700 }}>
                    {city.smart_city_score?.toFixed(1) || '82.0'}
                  </span>
                  <ArrowRight size={15} color="var(--color-text-muted)" />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/compare')}
            style={{
              marginTop: '1rem',
              padding: '0.6rem',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-primary)',
              color: 'var(--color-primary)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Launch City Comparison Engine →
          </button>
        </div>
      </div>

      {/* Domain Pillars Overview Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
          Monitored Smart City Domains
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="card" style={{ borderLeft: '4px solid #0284c7', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Wind size={20} color="#0284c7" />
              <strong style={{ fontSize: '0.95rem' }}>Air Quality</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Live telemetry tracking PM2.5, PM10, CO, NO2 and Air Quality Index.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #7c3aed', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Building2 size={20} color="#7c3aed" />
              <strong style={{ fontSize: '0.95rem' }}>Transportation</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Traffic congestion index, average commute times, and public transit coverage.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #0f766e', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Database size={20} color="#0f766e" />
              <strong style={{ fontSize: '0.95rem' }}>Water Management</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Daily supply hours, water quality index, and wastewater treatment coverage.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #d97706', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Zap size={20} color="#d97706" />
              <strong style={{ fontSize: '0.95rem' }}>Clean Energy</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Per-capita electricity consumption, grid availability, and renewable share.
            </p>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #16a34a', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={20} color="#16a34a" />
              <strong style={{ fontSize: '0.95rem' }}>Waste & Sanitation</strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Door-to-door waste collection coverage, recycling yield, and bio-methanation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
