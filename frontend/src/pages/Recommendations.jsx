import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { cityService } from '../services/cityService';
import CitySearchInput from '../components/city/CitySearchInput';
import {
  Lightbulb, Wind, Droplets, Car, Zap, Trash2,
  AlertTriangle, CheckCircle, RefreshCw, Filter, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORY_MAP = {
  all: { label: 'All Domains', icon: Lightbulb },
  air_quality: { label: 'Air Quality', icon: Wind, color: '#0284c7' },
  water: { label: 'Water Management', icon: Droplets, color: '#0f766e' },
  transportation: { label: 'Transportation', icon: Car, color: '#7c3aed' },
  energy: { label: 'Clean Energy', icon: Zap, color: '#d97706' },
  waste: { label: 'Waste & Sanitation', icon: Trash2, color: '#16a34a' },
};

export default function Recommendations() {
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load cities on mount
  useEffect(() => {
    cityService.listCities({ pageSize: 100 })
      .then(res => {
        const list = res?.items || [];
        setCities(list);
        if (list.length > 0) {
          // Default to Indore or first city
          const defaultCity = list.find(c => c.name.toLowerCase() === 'indore') || list[0];
          setSelectedCityId(defaultCity.id);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch recommendations on city change
  useEffect(() => {
    if (!selectedCityId) return;
    loadRecs(selectedCityId);
  }, [selectedCityId]);

  const loadRecs = async (cityId) => {
    setLoading(true);
    try {
      const data = await analyticsService.getRecommendations(cityId);
      setRecommendations(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedCityId) return;
    setRefreshing(true);
    try {
      await analyticsService.generateRecommendations(selectedCityId);
      toast.success('Recommendations recomputed from latest sensor indicators!');
      await loadRecs(selectedCityId);
    } catch (err) {
      toast.error('Could not refresh recommendations');
    } finally {
      setRefreshing(false);
    }
  };

  const selectedCity = cities.find(c => c.id === selectedCityId);

  // Filter recommendations by selected category
  const filteredRecs = categoryFilter === 'all'
    ? recommendations
    : recommendations.filter(r => r.category === categoryFilter);

  const highPriorityCount = recommendations.filter(r => r.priority === 'high').length;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lightbulb size={28} color="#d97706" />
            Smart City Improvement Recommendations
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Actionable urban development strategies automatically formulated from real performance data
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={refreshing || !selectedCityId}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0.55rem 1.25rem',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-primary)',
            fontWeight: 600,
            fontSize: '0.875rem',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          Re-Analyze Indicators
        </button>
      </div>

      {/* City Selector */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <CitySearchInput
              label="Selected City For Policy Audit"
              selectedCityId={selectedCityId}
              onSelectCity={id => setSelectedCityId(id)}
              cities={cities}
              onCityAdded={newCity => setCities(prev => [...prev, newCity])}
              placeholder="Search city (e.g. Indore, Bhopal, Jaipur, Tokyo)..."
            />
          </div>

          {selectedCity && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>City Score</span>
                <strong style={{ fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                  {selectedCity.smart_city_score?.toFixed(1) || 'N/A'}/100
                </strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'block' }}>Urgent Actions</span>
                <strong style={{ fontSize: '1.25rem', color: highPriorityCount > 0 ? '#dc2626' : '#16a34a' }}>
                  {highPriorityCount} Issues
                </strong>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '1.5rem' }}>
        {Object.entries(CATEGORY_MAP).map(([key, info]) => {
          const Icon = info.icon;
          const isActive = categoryFilter === key;
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '0.5rem 1rem',
                borderRadius: '999px',
                border: isActive ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: isActive ? 'var(--color-primary-light)' : 'var(--color-surface)',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontWeight: 600,
                fontSize: '0.825rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={15} color={isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'} />
              {info.label}
            </button>
          );
        })}
      </div>

      {/* Recommendations Cards List */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Generating recommendations…
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <CheckCircle size={48} color="#16a34a" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text)', marginBottom: '6px' }}>
            All Indicators Within Optimal Thresholds!
          </h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            No critical issues identified for this domain under current municipal standards.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRecs.map((rec) => {
            const isHigh = rec.priority === 'high';
            return (
              <div
                key={rec.id}
                className="card"
                style={{
                  borderLeft: isHigh ? '5px solid #dc2626' : '5px solid #d97706',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-info" style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {rec.category.replace('_', ' ')}
                    </span>
                    <span className={`badge ${isHigh ? 'badge-danger' : 'badge-warning'}`} style={{ fontWeight: 700 }}>
                      {isHigh ? '🔥 High Priority' : '⚡ Medium Priority'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    City: <strong>{rec.city_name}</strong>
                  </span>
                </div>

                {/* Problem Identified */}
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '4px' }}>
                    {rec.issue}
                  </h3>
                  <p style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)' }}>
                    📊 <strong>Data Trigger:</strong> {rec.data_basis || 'Verified sensor metric anomaly'}
                  </p>
                </div>

                {/* Proposed Smart Solution */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                }}>
                  <ArrowRight size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong style={{ fontSize: '0.875rem', color: 'var(--color-primary-dark)', display: 'block', marginBottom: '2px' }}>
                      Recommended Policy & Engineering Solution:
                    </strong>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text)', lineHeight: 1.5, margin: 0 }}>
                      {rec.suggestion}
                    </p>
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
