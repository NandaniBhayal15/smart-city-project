import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity, ArrowRight, Globe, Database, Cpu,
  Sun, Moon, Menu, X, CheckCircle2
} from 'lucide-react';
import styles from './About.module.css';

export default function About() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <div className={styles.page}>
      {/* Top Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navContainer}>
          <Link to="/" className={styles.brand} onClick={closeMenu}>
            <div className={styles.brandIcon}>
              <Activity size={18} color="#ffffff" />
            </div>
            <span className={styles.brandText}>SmartCity</span>
          </Link>

          <div className={styles.desktopNav}>
            <Link to="/" className={styles.navLink}>Home</Link>
            <Link to="/about" className={`${styles.navLink} ${styles.activeLink}`}>About</Link>
            <Link to="/#features" className={styles.navLink}>Features</Link>
            <Link to="/#domains" className={styles.navLink}>Domains</Link>
          </div>

          <div className={styles.desktopActions}>
            <button onClick={toggleTheme} className={styles.themeBtn}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#eab308" />}
            </button>
            {user ? (
              <Link to="/dashboard" className={styles.btnPrimary}>Dashboard →</Link>
            ) : (
              <>
                <Link to="/login" className={styles.btnOutline}>Login</Link>
                <Link to="/signup" className={styles.btnPrimary}>Get Started</Link>
              </>
            )}
          </div>

          <div className={styles.mobileRight}>
            <button onClick={toggleTheme} className={styles.themeBtnMobile}>
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#eab308" />}
            </button>
            <button className={styles.menuToggle} onClick={() => setMobileMenuOpen(prev => !prev)}>
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <Link to="/" onClick={closeMenu} className={styles.mobileLink}>Home</Link>
            <Link to="/about" onClick={closeMenu} className={`${styles.mobileLink} ${styles.mobileActive}`}>About</Link>
            <Link to="/#features" onClick={closeMenu} className={styles.mobileLink}>Features</Link>
            <Link to="/#domains" onClick={closeMenu} className={styles.mobileLink}>Domains</Link>
            <div className={styles.mobileActions}>
              {user ? (
                <Link to="/dashboard" onClick={closeMenu} className={styles.btnPrimaryBlock}>Enter Dashboard →</Link>
              ) : (
                <>
                  <Link to="/login" onClick={closeMenu} className={styles.btnOutlineBlock}>Login</Link>
                  <Link to="/signup" onClick={closeMenu} className={styles.btnPrimaryBlock}>Get Started Free</Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.badge}>ABOUT THE PLATFORM</span>
          <h1 className={styles.title}>Simple, Transparent City Analytics</h1>
          <p className={styles.subtitle}>
            SmartCity Platform connects real public sensor data with simple 0–100 scores
            to help citizens and city planners understand and compare city performance.
          </p>
        </div>
      </section>

      {/* 3 Simple Cards */}
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.iconWrap} style={{ background: '#2563eb15', color: '#2563eb' }}>
                <Globe size={22} />
              </div>
              <h3>1. Real Open Data</h3>
              <p>We fetch live data from trusted public APIs including OpenAQ and Open-Meteo across 14+ cities.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.iconWrap} style={{ background: '#0f766e15', color: '#0f766e' }}>
                <Database size={22} />
              </div>
              <h3>2. Simple 0–100 Scores</h3>
              <p>All metrics are normalized into an easy 0–100 score across 6 key categories like air, water, and transit.</p>
            </div>

            <div className={styles.card}>
              <div className={styles.iconWrap} style={{ background: '#7c3aed15', color: '#7c3aed' }}>
                <Cpu size={22} />
              </div>
              <h3>3. Fast Comparisons</h3>
              <p>Select any two cities and get a clear 4–5 line summary showing who leads and where improvements are needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaBox}>
          <h2>Ready to try it out?</h2>
          <p>Explore city data and run instant comparisons now.</p>
          <div className={styles.ctaBtns}>
            <Link to="/signup" className={styles.btnWhite}>Create Account</Link>
            <Link to="/compare" className={styles.btnGhost}>Compare Cities</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <p>© 2026 SmartCity Platform • Powered by Open Data</p>
          <div className={styles.footerLinks}>
            <Link to="/">Home</Link>
            <Link to="/about">About</Link>
            <Link to="/compare">Compare</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}