import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Check } from 'lucide-react';
import { cityService } from '../../services/cityService';
import toast from 'react-hot-toast';

export default function CitySearchInput({
  label,
  selectedCityId,
  onSelectCity,
  cities,
  onCityAdded,
  placeholder = "Type city name (e.g. Indore, Jaipur)..."
}) {
  const selectedCity = cities.find(c => c.id === selectedCityId);
  const [query, setQuery] = useState(selectedCity ? `${selectedCity.name}, ${selectedCity.country}` : '');
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const containerRef = useRef(null);

  // Sync query when selectedCityId changes externally
  useEffect(() => {
    if (selectedCity) {
      setQuery(`${selectedCity.name}, ${selectedCity.country}`);
    }
  }, [selectedCityId, cities]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        // Reset query text to current selected city if closed without pick
        if (selectedCity) {
          setQuery(`${selectedCity.name}, ${selectedCity.country}`);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [selectedCity]);

  // Filter cities by typing query
  const filtered = query.trim()
    ? cities.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.country.toLowerCase().includes(query.toLowerCase()) ||
        (c.state && c.state.toLowerCase().includes(query.toLowerCase()))
      )
    : cities;

  const exactMatch = cities.some(c => c.name.toLowerCase() === query.trim().toLowerCase());

  const handlePick = (city) => {
    onSelectCity(city.id);
    setQuery(`${city.name}, ${city.country}`);
    setIsOpen(false);
  };

  const handleQuickAdd = async () => {
    const cleanName = query.trim().split(',')[0].trim();
    if (!cleanName) return;
    setIsAdding(true);
    try {
      const newCity = await cityService.quickAddCity(cleanName);
      toast.success(`Added ${newCity.name} with live indicators!`);
      if (onCityAdded) onCityAdded(newCity);
      onSelectCity(newCity.id);
      setQuery(`${newCity.name}, ${newCity.country}`);
      setIsOpen(false);
    } catch (err) {
      toast.error('Could not add city');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text)' }}>
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{
            width: '100%',
            padding: '0.625rem 1rem 0.625rem 2.25rem',
            border: '1.5px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9375rem',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          maxHeight: '260px',
          overflowY: 'auto',
          zIndex: 50,
        }}>
          {filtered.length > 0 ? (
            filtered.map((c) => {
              const isSelected = c.id === selectedCityId;
              return (
                <div
                  key={c.id}
                  onClick={() => handlePick(c)}
                  style={{
                    padding: '0.65rem 1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid var(--color-border-light)',
                    background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                    fontSize: '0.875rem',
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg)'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <strong style={{ color: 'var(--color-text)' }}>{c.name}</strong>
                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '6px' }}>
                      ({c.country}{c.state ? `, ${c.state}` : ''})
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      Score: {c.smart_city_score?.toFixed(1) || 'N/A'}
                    </span>
                    {isSelected && <Check size={16} color="var(--color-primary)" />}
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              No city matches "{query}"
            </div>
          )}

          {/* Quick Add Custom City Button */}
          {query.trim().length >= 2 && !exactMatch && (
            <div
              onClick={handleQuickAdd}
              style={{
                padding: '0.75rem 1rem',
                borderTop: '2px dashed var(--color-border)',
                background: '#f0fdf4',
                color: '#166534',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              <Plus size={16} />
              {isAdding ? 'Adding & Fetching Data…' : `+ Add "${query.trim()}" and Analyze`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
