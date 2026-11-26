import { useState, useEffect } from 'react';
import { cityService } from '../services/cityService';
import { Building2, Search, Wind, Car, Droplets, Zap, Trash2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CityExplorer() {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    cityService.listCities({ pageSize: 50, search })
      .then(res => setCities(res?.items || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)' }}>City Explorer</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>Browse and inspect monitored global smart cities</p>
        </div>

        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Search by city or country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 1rem 0.55rem 2.2rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              outline: 'none',
              fontSize: '0.875rem',
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>Loading cities…</div>
      ) : cities.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          No cities found matching "{search}".
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {cities.map(city => (
            <div key={city.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)' }}>{city.name}</h3>
                  <span style={{ fontSize: '0.825rem', color: 'var(--color-text-secondary)' }}>{city.country} • {city.state || 'Metropolitan'}</span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.85rem', fontWeight: 700, padding: '4px 10px' }}>
                  Score: {city.smart_city_score?.toFixed(1) || 'N/A'}
                </span>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {city.description || 'Monitored smart city profile.'}
              </p>

              {/* Indicator mini-bars */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--color-bg)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                    <Wind size={12} color="#0284c7" /> Air Quality: <strong>{city.air_quality_score?.toFixed(0) || '—'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                    <Car size={12} color="#7c3aed" /> Transit: <strong>{city.transportation_score?.toFixed(0) || '—'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                    <Droplets size={12} color="#0f766e" /> Water: <strong>{city.water_score?.toFixed(0) || '—'}</strong>
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                    <Zap size={12} color="#d97706" /> Energy: <strong>{city.energy_score?.toFixed(0) || '—'}</strong>
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border-light)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Pop: {city.population ? (city.population / 1000000).toFixed(1) + 'M' : 'N/A'}
                </span>
                <Link
                  to="/compare"
                  style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  Compare City →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
