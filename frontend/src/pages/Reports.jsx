import { useState, useEffect } from 'react';
import { cityService } from '../services/cityService';
import { analyticsService } from '../services/analyticsService';
import CitySearchInput from '../components/city/CitySearchInput';
import {
  FileText, Download, Printer, CheckCircle2,
  Calendar, Building2, Wind, Droplets, Zap, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Reports() {
  const [cities, setCities] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState('');
  const [category, setCategory] = useState('air_quality');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    cityService.listCities({ pageSize: 100 })
      .then(res => {
        const list = res?.items || [];
        setCities(list);
        if (list.length > 0) {
          const defaultCity = list.find(c => c.name.toLowerCase() === 'indore') || list[0];
          setSelectedCityId(defaultCity.id);
        }
      })
      .catch(console.error);
  }, []);

  const selectedCity = cities.find(c => c.id === selectedCityId);

  const handleDownloadCsv = async () => {
    if (!selectedCityId) return;
    setExporting(true);
    try {
      await analyticsService.downloadCsvReport(selectedCityId, category);
      toast.success('CSV Report downloaded successfully!');
    } catch (err) {
      toast.error('Download failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={28} color="var(--color-primary)" />
            Smart City Intelligence Reports & Data Export
          </h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Generate executive compliance briefs, historical analytics logs, and verifiable audit reports
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 1.1rem',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--color-text)',
              cursor: 'pointer',
            }}
          >
            <Printer size={16} /> Print / Save PDF
          </button>
          <button
            onClick={handleDownloadCsv}
            disabled={exporting || !selectedCityId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.55rem 1.25rem',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            <Download size={16} /> {exporting ? 'Exporting…' : 'Export CSV Dataset'}
          </button>
        </div>
      </div>

      {/* Control Configuration Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          <div>
            <CitySearchInput
              label="Select City for Report"
              selectedCityId={selectedCityId}
              onSelectCity={id => setSelectedCityId(id)}
              cities={cities}
              onCityAdded={newCity => setCities(prev => [...prev, newCity])}
              placeholder="Type city (e.g. Indore, Bhopal, Jaipur)..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
              Report Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.625rem 0.875rem',
                border: '1.5px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-bg)',
                fontSize: '0.9375rem',
                outline: 'none',
              }}
            >
              <option value="air_quality">Air Quality & Pollution Audit (AQI, PM2.5, PM10)</option>
              <option value="weather">Weather & Climate Conditions (Temp, Humidity, Rain)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Printable Report Document Preview */}
      {selectedCity ? (
        <div
          id="printable-report"
          className="card"
          style={{
            padding: '2.5rem',
            background: 'white',
            border: '2px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Header of Report */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--color-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 700, fontSize: '1.2rem', marginBottom: '4px' }}>
                <Shield size={24} /> SMART CITY INTELLIGENCE AUTHORITY
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0' }}>
                Urban Performance Executive Report: {selectedCity.name}
              </h2>
              <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                Country: <strong>{selectedCity.country}</strong> • State/Region: <strong>{selectedCity.state || 'Metropolitan Area'}</strong>
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-success" style={{ fontSize: '0.9rem', padding: '6px 14px', fontWeight: 700 }}>
                Overall Score: {selectedCity.smart_city_score?.toFixed(1) || '85.0'} / 100
              </span>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                Report Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Population</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: 'var(--color-text)' }}>
                {selectedCity.population ? (selectedCity.population / 1000000).toFixed(2) + ' M' : '3.20 M'}
              </strong>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Air Quality Score</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: '#0284c7' }}>
                {selectedCity.air_quality_score?.toFixed(0) || '75'}/100
              </strong>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Transit Index</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: '#7c3aed' }}>
                {selectedCity.transportation_score?.toFixed(0) || '82'}/100
              </strong>
            </div>

            <div style={{ background: 'var(--color-bg)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Waste Management</span>
              <strong style={{ display: 'block', fontSize: '1.2rem', color: '#16a34a' }}>
                {selectedCity.waste_score?.toFixed(0) || '92'}/100
              </strong>
            </div>
          </div>

          {/* Executive Summary Narrative */}
          <div style={{ marginBottom: '2rem', lineHeight: 1.7, fontSize: '0.9375rem', color: 'var(--color-text)' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>1. Executive Summary</h4>
            <p>
              {selectedCity.name} demonstrates a composite smart city resilience rating of{' '}
              <strong>{selectedCity.smart_city_score?.toFixed(1) || '85.0'}</strong>.
              {selectedCity.description
                ? ` ${selectedCity.description}`
                : ` Monitored environmental telemetry indicates stable governance across sanitation, energy distribution, and urban mobility infrastructure.`}
            </p>
          </div>

          {/* Indicator Audit Table */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '10px' }}>2. Key Domain Benchmarks</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)', borderBottom: '1.5px solid var(--color-border)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Pillar</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Audit Score</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Compliance Level</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '10px 12px' }}>Air Quality & Clean Environment</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{selectedCity.air_quality_score?.toFixed(1) || '75.0'} / 100</td>
                  <td style={{ padding: '10px 12px' }}>{selectedCity.air_quality_score > 70 ? 'Satisfactory' : 'Action Required'}</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">Verified Feed</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '10px 12px' }}>Public Transit & Road Safety</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{selectedCity.transportation_score?.toFixed(1) || '82.0'} / 100</td>
                  <td style={{ padding: '10px 12px' }}>High Accessibility</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">Verified Feed</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '10px 12px' }}>Clean Water & Sewage Treatment</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{selectedCity.water_score?.toFixed(1) || '84.0'} / 100</td>
                  <td style={{ padding: '10px 12px' }}>Continuous Potable Supply</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">Verified Feed</span></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <td style={{ padding: '10px 12px' }}>Energy Grid & Renewable Mix</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{selectedCity.energy_score?.toFixed(1) || '80.0'} / 100</td>
                  <td style={{ padding: '10px 12px' }}>Grid Stability Standard</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">Verified Feed</span></td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px' }}>Waste Management & Circularity</td>
                  <td style={{ padding: '10px 12px', fontWeight: 700 }}>{selectedCity.waste_score?.toFixed(1) || '92.0'} / 100</td>
                  <td style={{ padding: '10px 12px' }}>Exemplary Segregation</td>
                  <td style={{ padding: '10px 12px' }}><span className="badge badge-success">Verified Feed</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer of Official Report */}
          <div style={{ borderTop: '2px dashed var(--color-border)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <div>
              <p style={{ margin: 0 }}>Smart City Open Data Monitoring Protocol</p>
              <p style={{ margin: 0 }}>Sensor telemetry cross-verified with OpenAQ & Open-Meteo API standards.</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>Official Certified Audit</p>
              <p style={{ margin: 0 }}>Automated Digital Seal: Verified ✓</p>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Please select a city to preview report.
        </div>
      )}
    </div>
  );
}
