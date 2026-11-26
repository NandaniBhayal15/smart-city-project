import { useState, useEffect } from 'react';
import { analyticsService } from '../services/analyticsService';
import { cityService } from '../services/cityService';
import { GitCompare, Trophy, Minus, RefreshCw, FileText } from 'lucide-react';
import CitySearchInput from '../components/city/CitySearchInput';
import styles from './CityComparison.module.css';
import toast from 'react-hot-toast';

function getAnalysisParagraphs(result) {
  if (!result || !result.city_a || !result.city_b) {
    return {
      overall_performance: '',
      key_strengths: '',
      areas_for_improvement: '',
      concise_summary: ''
    };
  }

  if (result?.analytical_analysis?.concise_summary && result.analytical_analysis.concise_summary.length < 500) {
    return result.analytical_analysis;
  }

  const cityA = result.city_a.name;
  const cityB = result.city_b.name;
  const scoreA = result.city_a.overall_score;
  const scoreB = result.city_b.overall_score;
  const winner = result.overall_winner;
  const scores = result.scores || {};

  const domainNames = {
    air_quality: 'Air Quality',
    transportation: 'Urban Mobility',
    water: 'Water Resilience',
    energy: 'Clean Energy',
    waste: 'Waste Management',
    weather: 'Climate Resilience',
  };

  const leadsA = [];
  const leadsB = [];
  const domainList = [];

  Object.entries(scores).forEach(([cat, data]) => {
    const dName = domainNames[cat] || cat;
    const sA = data.city_a_score;
    const sB = data.city_b_score;
    if (sA !== null && sA !== undefined && sB !== null && sB !== undefined) {
      domainList.push({ cat, name: dName, sA, sB, diff: Math.abs(sA - sB), winner: data.winner });
      if (data.winner === cityA) leadsA.push({ name: dName, sA, sB, diff: Math.round(Math.abs(sA - sB) * 10) / 10 });
      if (data.winner === cityB) leadsB.push({ name: dName, sB, sA, diff: Math.round(Math.abs(sA - sB) * 10) / 10 });
    }
  });

  // Line 1: Overall Performance
  let p1 = '';
  if (scoreA !== null && scoreB !== null) {
    const diff = Math.round(Math.abs(scoreA - scoreB) * 10) / 10;
    if (winner === 'tie' || diff < 2.0) {
      p1 = `${cityA} and ${cityB} show closely matched overall performance with composite scores of ${scoreA} and ${scoreB} out of 100 (${diff}-point variance).`;
    } else {
      const winCity = winner === cityA ? cityA : cityB;
      const winScore = winner === cityA ? scoreA : scoreB;
      const loseCity = winner === cityA ? cityB : cityA;
      const loseScore = winner === cityA ? scoreB : scoreA;
      p1 = `${winCity} outperforms ${loseCity} with a composite Smart City Index score of ${winScore} vs ${loseScore} out of 100 (${diff}-point lead).`;
    }
  } else {
    p1 = `Data coverage across evaluated indicators is currently insufficient to determine an overall winner between ${cityA} and ${cityB}.`;
  }

  // Lines 2-3: Key Strengths
  let p2 = '';
  const primaryLeader = (winner === cityA || leadsA.length >= leadsB.length) ? cityA : cityB;
  const primaryLeads = primaryLeader === cityA ? leadsA : leadsB;
  const secondaryLeader = primaryLeader === cityA ? cityB : cityA;
  const secondaryLeads = primaryLeader === cityA ? leadsB : leadsA;

  if (primaryLeads.length > 0) {
    const leadStrings = primaryLeads.slice(0, 2).map(l => `${l.name} (${l.sA} vs ${l.sB})`);
    p2 = `${primaryLeader} holds key advantages in ${leadStrings.join(' and ')}.`;
    if (secondaryLeads.length > 0) {
      const secStrings = secondaryLeads.slice(0, 2).map(l => `${l.name} (${l.sB} vs ${l.sA})`);
      p2 += ` Conversely, ${secondaryLeader} performs better in ${secStrings.join(' and ')}.`;
    }
  } else {
    p2 = `Both cities maintain balanced standards across evaluated environmental and utility domains.`;
  }

  // Lines 4-5: Areas for Improvement
  let p3 = '';
  const laggingCity = winner === cityA ? cityB : (winner === cityB ? cityA : null);
  if (laggingCity) {
    const deficits = domainList.filter(d => d.winner !== laggingCity && d.winner !== null);
    deficits.sort((a, b) => (laggingCity === cityA ? a.sA - b.sA : a.sB - b.sB));
    const targetNames = deficits.slice(0, 2).map(d => d.name);
    if (targetNames.length > 0) {
      p3 = `To close the performance gap, ${laggingCity} should prioritize infrastructure improvements in ${targetNames.join(' and ')}.`;
    } else {
      p3 = `To close the performance gap, ${laggingCity} should focus on targeted municipal service upgrades.`;
    }
  } else {
    const lowerDomains = domainList.filter(d => d.sA < 75 || d.sB < 75).map(d => d.name);
    if (lowerDomains.length > 0) {
      p3 = `Both cities should focus on modernizing ${lowerDomains.slice(0, 2).join(' and ')} to improve long-term livability.`;
    } else {
      p3 = `Both cities maintain strong operational standards across core urban benchmarks.`;
    }
  }

  const conciseSummary = `${p1} ${p2} ${p3}`;

  return {
    overall_performance: p1,
    key_strengths: p2,
    areas_for_improvement: p3,
    concise_summary: conciseSummary,
  };
}

export default function CityComparison() {
  const [cities, setCities] = useState([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [cityA, setCityA] = useState('');
  const [cityB, setCityB] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load cities on mount
  useEffect(() => {
    let mounted = true;
    setLoadingCities(true);
    cityService.listCities({ pageSize: 100 })
      .then(res => {
        if (!mounted) return;
        const list = res?.items || [];
        setCities(list);
        if (list.length >= 2) {
          setCityA(list[0].id);
          setCityB(list[1].id);
          // Auto run comparison on load
          fetchComparison(list[0].id, list[1].id);
        }
      })
      .catch(err => {
        console.error('Failed to load cities:', err);
        toast.error('Could not load cities. Please refresh.');
      })
      .finally(() => {
        if (mounted) setLoadingCities(false);
      });

    return () => { mounted = false; };
  }, []);

  const fetchComparison = async (idA, idB) => {
    if (!idA || !idB) return;
    setLoading(true);
    try {
      const data = await analyticsService.compareCities(idA, idB);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Comparison failed';
      toast.error(typeof msg === 'string' ? msg : 'Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = (e) => {
    if (e) e.preventDefault();
    if (!cityA || !cityB) {
      toast.error('Please select both cities');
      return;
    }
    if (cityA === cityB) {
      toast.error('Please select two different cities to compare');
      return;
    }
    fetchComparison(cityA, cityB);
  };

  // Prepare radar data
  const radarData = result?.scores
    ? Object.entries(result.scores).map(([cat, s]) => ({
        category: cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        [result.city_a.name]: s.city_a_score ?? 0,
        [result.city_b.name]: s.city_b_score ?? 0,
      }))
    : [];

  // Bar chart data
  const barData = result?.scores
    ? Object.entries(result.scores).map(([cat, s]) => ({
        name: cat.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()),
        [result.city_a.name]: s.city_a_score ?? 0,
        [result.city_b.name]: s.city_b_score ?? 0,
      }))
    : [];

  const CATEGORY_LABELS = {
    air_quality: 'Air Quality',
    transportation: 'Transportation',
    water: 'Water Management',
    energy: 'Energy & Power',
    waste: 'Waste Management',
    weather: 'Weather & Climate',
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <GitCompare size={28} color="var(--color-primary)" />
        <div>
          <h1>City Intelligence Comparison</h1>
          <p>Side-by-side performance evaluation across 6 smart city domains</p>
        </div>
      </div>

      {/* Selectors Card */}
      <div className={styles.selectorCard}>
        <div className={styles.selectorGrid}>
          <div className={styles.field}>
            <CitySearchInput
              label="City A"
              selectedCityId={cityA}
              onSelectCity={id => setCityA(id)}
              cities={cities}
              onCityAdded={newCity => setCities(prev => [...prev, newCity])}
              placeholder="Type city (e.g. Indore, Bhopal, Tokyo)..."
            />
          </div>

          <div className={styles.vsLabel}>VS</div>

          <div className={styles.field}>
            <CitySearchInput
              label="City B"
              selectedCityId={cityB}
              onSelectCity={id => setCityB(id)}
              cities={cities}
              onCityAdded={newCity => setCities(prev => [...prev, newCity])}
              placeholder="Type city (e.g. Jaipur, Ahmedabad, London)..."
            />
          </div>
        </div>

        <button
          className={styles.compareBtn}
          onClick={handleCompare}
          disabled={loading || loadingCities}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RefreshCw size={16} className={styles.spin} /> Calculating Comparison…
            </span>
          ) : (
            'Compare Cities'
          )}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <>
          {/* Winner Banner */}
          <div className={result.overall_winner ? styles.winnerCard : styles.noWinnerCard}>
            {result.overall_winner && result.overall_winner !== 'tie' ? (
              <>
                <Trophy size={36} color="#d97706" />
                <div>
                  <h2 style={{ color: '#92400e', marginBottom: '4px' }}>
                    🏆 Better Performing City: {result.overall_winner}
                  </h2>
                  <p>
                    Outperformed in weighted indicators across environmental, infrastructure, and livability metrics.
                  </p>
                </div>
                <div className={styles.scores}>
                  <strong>{result.city_a.name}: {result.city_a.overall_score ?? '—'} / 100</strong>
                  <strong>{result.city_b.name}: {result.city_b.overall_score ?? '—'} / 100</strong>
                </div>
              </>
            ) : result.overall_winner === 'tie' ? (
              <>
                <Minus size={32} />
                <div>
                  <h2>Equal Performance (Tie)</h2>
                  <p>Both cities demonstrate comparable overall scores across verified categories.</p>
                </div>
              </>
            ) : (
              <p>⚠ Insufficient data to determine an overall winner.</p>
            )}
          </div>

          {/* Comparative City Analysis Section */}
          {(() => {
            const analysis = getAnalysisParagraphs(result);
            const summaryText = analysis.concise_summary || `${analysis.overall_performance || ''} ${analysis.key_strengths || ''} ${analysis.areas_for_improvement || ''}`.trim();
            return (
              <div style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderLeft: '4px solid var(--color-primary)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem 1.5rem',
                marginBottom: '1.75rem',
                boxShadow: 'var(--shadow-sm)',
              }}>
                {/* Section Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.85rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '1px solid var(--color-border-light)',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText size={18} color="var(--color-primary)" />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0, color: 'var(--color-text)' }}>
                        Comparative City Analysis
                      </h3>
                    </div>
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: 'var(--color-text-secondary)',
                    background: 'var(--color-bg)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    Analytical Summary
                  </span>
                </div>

                {/* Concise 4-5 Lines Analysis */}
                <p style={{
                  fontSize: '0.925rem',
                  lineHeight: '1.7',
                  color: 'var(--color-text)',
                  margin: 0,
                }}>
                  {summaryText}
                </p>
              </div>
            );
          })()}

          {/* Notes / Warnings */}
          {result.notes?.length > 0 && (
            <div className={styles.warnings}>
              {result.notes.map((n, i) => <p key={i}>ℹ {n}</p>)}
            </div>
          )}

          {/* Category Breakdown Table */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Category-by-Category Score Breakdown</h2>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Domain</th>
                    <th>{result.city_a.name}</th>
                    <th>{result.city_b.name}</th>
                    <th>Better Performer</th>
                    <th>Domain Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(result.scores).map(([cat, s]) => (
                    <tr key={cat}>
                      <td><strong>{CATEGORY_LABELS[cat] || cat}</strong></td>
                      <td>
                        {s.city_a_score !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{s.city_a_score}</span>
                            <span className="badge badge-info">{s.city_a_label}</span>
                          </div>
                        ) : (
                          <span className={styles.noData}>No data</span>
                        )}
                      </td>
                      <td>
                        {s.city_b_score !== null ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>{s.city_b_score}</span>
                            <span className="badge badge-info">{s.city_b_label}</span>
                          </div>
                        ) : (
                          <span className={styles.noData}>No data</span>
                        )}
                      </td>
                      <td>
                        {s.winner ? (
                          <span className={`badge ${s.winner === 'tie' ? 'badge-muted' : 'badge-success'}`}>
                            {s.winner === 'tie' ? 'Tie' : `★ ${s.winner}`}
                          </span>
                        ) : (
                          <span className="badge badge-muted">Insufficient Data</span>
                        )}
                      </td>
                      <td><span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{s.weight_pct}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Scoring Methodology */}
          <div className={styles.scoringInfo}>
            <h3>How the Smart City Score is Computed</h3>
            <p>
              Each city receives category scores (0–100) normalized against global urban health benchmarks.
              Weights: <strong>Air Quality (20%)</strong>, <strong>Transportation (20%)</strong>, <strong>Water (20%)</strong>, <strong>Energy (15%)</strong>, <strong>Waste (15%)</strong>, and <strong>Weather (10%)</strong>.
              Categories with insufficient data points are transparently excluded to ensure fair comparison.
            </p>
          </div>
        </>
      )}

      {!result && !loading && !loadingCities && (
        <div className={styles.placeholder}>
          <GitCompare size={56} color="var(--color-text-muted)" />
          <p>Select two cities from the dropdown above and click "Compare Cities"</p>
        </div>
      )}
    </div>
  );
}
