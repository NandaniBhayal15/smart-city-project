import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Search, User, LogOut, Activity,
  Globe, ShieldCheck, ChevronDown, Sun, Moon
} from 'lucide-react';
import { useState, useEffect } from 'react';

const PAGE_TITLES = {
  '/dashboard': 'Smart City Dashboard',
  '/cities': 'City Explorer',
  '/compare': 'City Comparison Engine',
  '/analytics': 'Analytics & Trends',
  '/predictions': 'AI City Forecasting',
  '/reports': 'Reports & Data Export',
  '/profile': 'User Profile & Settings',
  '/admin': 'Admin Control Center',
};

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const currentTitle = PAGE_TITLES[location.pathname] || 'Smart City Platform';

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 'var(--sidebar-width)',
      right: 0,
      height: 'var(--topbar-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      zIndex: 90,
      transition: 'background 0.2s, border-color 0.2s',
    }}>
      {/* Page Title & Live Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--color-text)', margin: 0 }}>
            {currentTitle}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} />
            <span>Real-Time Monitoring Active • 14 Cities Online</span>
          </div>
        </div>
      </div>

      {/* Right Controls: User Profile & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '999px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {theme === 'light' ? (
            <>
              <Moon size={15} color="#475569" />
              <span>Dark</span>
            </>
          ) : (
            <>
              <Sun size={15} color="#eab308" />
              <span>Light</span>
            </>
          )}
        </button>

        {/* Quick Role Badge */}
        <span className={`badge ${isAdmin ? 'badge-danger' : 'badge-info'}`} style={{ fontWeight: 600 }}>
          {isAdmin ? '🛡️ Admin' : '👤 Citizen'}
        </span>

        {/* User Card Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              padding: '6px 12px',
              borderRadius: '999px',
              cursor: 'pointer',
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #7c3aed 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}>
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              {user?.full_name || user?.username || 'User'}
            </span>
            <ChevronDown size={14} color="var(--color-text-muted)" />
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: '200px',
              background: 'white',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              zIndex: 100,
            }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-border-light)' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', margin: 0 }}>
                  {user?.full_name || user?.username}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>
                  {user?.email}
                </p>
              </div>

              <button
                onClick={() => { setShowDropdown(false); navigate('/profile'); }}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  background: 'transparent',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--color-text)',
                  cursor: 'pointer',
                }}
              >
                <User size={15} /> My Profile
              </button>

              <button
                onClick={() => { setShowDropdown(false); logout(); navigate('/'); }}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  borderTop: '1px solid var(--color-border-light)',
                  background: 'transparent',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  color: 'var(--color-danger)',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
