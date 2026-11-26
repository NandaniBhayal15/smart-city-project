import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Activity, ArrowRight, GitCompare, Wind, BrainCircuit,
  FileText, Droplets, Zap, Trash2, CloudSun, Sun, Moon,
  Menu, X, Car, Eye, EyeOff, Lock, User, Mail, Sparkles, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Landing.module.css';

const SIMPLE_FEATURES = [
  {
    icon: GitCompare,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    title: 'City Comparison Engine',
    desc: 'Compare any two cities side-by-side with verified 0–100 scores and a clear 4–5 line summary.'
  },
  {
    icon: Wind,
    color: '#0284c7',
    gradient: 'linear-gradient(135deg, #0284c7, #06b6d4)',
    title: 'Real-Time Open Data',
    desc: 'Live telemetry feeds for air quality (AQI, PM2.5, PM10), weather, and utilities from OpenAQ & Open-Meteo.'
  },
  {
    icon: BrainCircuit,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    title: 'AI Machine Learning',
    desc: 'Pre-trained regression models forecasting 7-day future trends for air quality and energy demand.'
  },
  {
    icon: FileText,
    color: '#0f766e',
    gradient: 'linear-gradient(135deg, #0f766e, #14b8a6)',
    title: 'Instant Audit Reports',
    desc: 'Download executive compliance summaries and complete raw CSV datasets with one click.'
  }
];

const SIMPLE_DOMAINS = [
  { icon: Wind,     color: '#0284c7', name: 'Air Quality',     metric: 'AQI, PM2.5 & NO2' },
  { icon: Car,      color: '#2563eb', name: 'Transportation',  metric: 'Mobility & Congestion' },
  { icon: Droplets, color: '#0f766e', name: 'Water Supply',    metric: 'Purity & Reliability' },
  { icon: Zap,      color: '#d97706', name: 'Clean Energy',    metric: 'Power Grid & Solar' },
  { icon: Trash2,   color: '#7c3aed', name: 'Waste Mgmt',      metric: 'Recycling & Diversion' },
  { icon: CloudSun, color: '#dc2626', name: 'Climate',         metric: 'Thermal & Weather Risk' }
];

export default function Landing({ initialAuth }) {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModal, setAuthModal] = useState(initialAuth || null); // 'login' | 'signup' | null
  const [authMode, setAuthMode] = useState(initialAuth === 'signup' ? 'signup' : 'login');

  // Login form state
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup form state
  const [signupForm, setSignupForm] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirm: ''
  });
  const [showSignupPass, setShowSignupPass] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync with initialAuth prop if route changes
  useEffect(() => {
    if (initialAuth) {
      setAuthModal(initialAuth);
      setAuthMode(initialAuth);
    }
  }, [initialAuth]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const openAuth = (mode) => {
    setAuthMode(mode);
    setAuthModal(mode);
    setMobileMenuOpen(false);
  };

  const closeAuth = () => {
    setAuthModal(null);
    if (location.pathname === '/login' || location.pathname === '/signup') {
      navigate('/', { replace: true });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const u = await login(loginForm.identifier, loginForm.password);
      toast.success(`Welcome back, ${u.username || 'User'}!`);
      closeAuth();
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMsg = 'Login failed';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail.map(d => d.msg || d.message).join(', ');
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMsg = 'Backend server connect nahi ho raha (Port 8000)';
      }
      toast.error(errorMsg);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (signupForm.password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    if (signupForm.password !== signupForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSignupLoading(true);
    try {
      await signup({
        email: signupForm.email.trim(),
        username: signupForm.username.trim(),
        full_name: signupForm.full_name.trim() || undefined,
        password: signupForm.password,
      });
      toast.success('Account created successfully!');
      closeAuth();
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMsg = 'Signup failed';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail.map(d => d.msg || d.message).join(', ');
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMsg = 'Backend server connect nahi ho raha (Port 8000)';
      }
      toast.error(errorMsg);
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* ─────────────────────────────────────────────────────────────
          PAGE CONTENT WRAPPER (Blurs when Auth Modal is open!)
      ───────────────────────────────────────────────────────────── */}
      <div className={`${styles.mainContent} ${authModal ? styles.blurred : ''}`}>
        {/* Navbar */}
        <nav className={styles.nav}>
          <div className={styles.navContainer}>
            <Link to="/" className={styles.brand}>
              <div className={styles.brandIcon}>
                <Activity size={18} color="#ffffff" />
              </div>
              <span className={styles.brandText}>SmartCity</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className={styles.desktopNav}>
              <Link to="/" className={`${styles.navLink} ${styles.activeLink}`}>Home</Link>
              <Link to="/about" className={styles.navLink}>About</Link>
              <a href="#features" className={styles.navLink}>Features</a>
              <a href="#domains" className={styles.navLink}>Domains</a>
            </div>

            {/* Desktop Actions */}
            <div className={styles.desktopActions}>
              <button
                onClick={toggleTheme}
                className={styles.themeBtn}
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                aria-label="Toggle Theme"
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#eab308" />}
              </button>

              {user ? (
                <Link to="/dashboard" className={styles.btnPrimary}>
                  Dashboard →
                </Link>
              ) : (
                <>
                  <button onClick={() => openAuth('login')} className={styles.btnOutline}>
                    Sign In
                  </button>
                  <button onClick={() => openAuth('signup')} className={styles.btnPrimary}>
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Controls */}
            <div className={styles.mobileRight}>
              <button onClick={toggleTheme} className={styles.themeBtnMobile}>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} color="#eab308" />}
              </button>
              <button
                className={styles.menuToggle}
                onClick={() => setMobileMenuOpen(prev => !prev)}
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile Drawer */}
          {mobileMenuOpen && (
            <div className={styles.mobileMenu}>
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className={`${styles.mobileLink} ${styles.mobileActive}`}>
                Home
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)} className={styles.mobileLink}>
                About
              </Link>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className={styles.mobileLink}>
                Features
              </a>
              <a href="#domains" onClick={() => setMobileMenuOpen(false)} className={styles.mobileLink}>
                Domains
              </a>
              <div className={styles.mobileActions}>
                {user ? (
                  <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={styles.btnPrimaryBlock}>
                    Enter Dashboard →
                  </Link>
                ) : (
                  <>
                    <button onClick={() => openAuth('login')} className={styles.btnOutlineBlock}>
                      Sign In
                    </button>
                    <button onClick={() => openAuth('signup')} className={styles.btnPrimaryBlock}>
                      Get Started Free
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* Hero Section with Beautiful Gradient */}
        <section className={styles.hero}>
          <div className={styles.heroBackgroundGlow} />
          <div className={styles.heroContainer}>
            <div className={styles.badge}>
              <span className={styles.dot} />
              <span>Smart City Intelligence Platform</span>
            </div>

            <h1 className={styles.title}>
              Understand Cities.<br />
              <span className={styles.gradientHeading}>Compare. Analyse. Improve.</span>
            </h1>

            <p className={styles.subtitle}>
              A modern urban platform integrating live public sensor APIs,
              weighted multi-domain indices, and AI models to benchmark city livability.
            </p>

            <div className={styles.heroCtas}>
              {user ? (
                <Link to="/dashboard" className={styles.btnPrimaryLg}>
                  Open Dashboard <ArrowRight size={17} />
                </Link>
              ) : (
                <button onClick={() => openAuth('signup')} className={styles.btnPrimaryLg}>
                  Start Exploring Free <ArrowRight size={17} />
                </button>
              )}
              <Link to="/about" className={styles.btnOutlineLg}>
                About Platform →
              </Link>
            </div>

            {/* Stats Bar */}
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <strong className={styles.statNum}>6</strong>
                <span className={styles.statLabel}>Categories</span>
              </div>
              <div className={styles.statItem}>
                <strong className={styles.statNum}>14+</strong>
                <span className={styles.statLabel}>Global Cities</span>
              </div>
              <div className={styles.statItem}>
                <strong className={styles.statNum}>Real</strong>
                <span className={styles.statLabel}>Live APIs</span>
              </div>
              <div className={styles.statItem}>
                <strong className={styles.statNum}>ML</strong>
                <span className={styles.statLabel}>Predictions</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionSubBadge}>CORE CAPABILITIES</span>
              <h2>Platform Features</h2>
              <p>Everything you need for transparent urban analytics.</p>
            </div>

            <div className={styles.featureGrid}>
              {SIMPLE_FEATURES.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={styles.featureCard}>
                    <div className={styles.cardTopGlow} style={{ background: item.gradient }} />
                    <div className={styles.featureIcon} style={{ background: `${item.color}15`, color: item.color }}>
                      <Icon size={22} />
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Domains Section */}
        <section id="domains" className={styles.sectionLight}>
          <div className={styles.container}>
            <div className={styles.sectionHeading}>
              <span className={styles.sectionSubBadge}>DATA CATEGORIES</span>
              <h2>6 Monitored Pillars</h2>
              <p>Standardized indicators calculated for every monitored city.</p>
            </div>

            <div className={styles.domainsGrid}>
              {SIMPLE_DOMAINS.map((dom) => {
                const Icon = dom.icon;
                return (
                  <div key={dom.name} className={styles.domainCard}>
                    <div className={styles.domainIcon} style={{ background: `${dom.color}15`, color: dom.color }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4>{dom.name}</h4>
                      <span>{dom.metric}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Call to Action Banner with Radiant Gradient */}
        <section className={styles.ctaSection}>
          <div className={styles.container}>
            <div className={styles.ctaBox}>
              <h2>Ready to Analyze and Compare Your City?</h2>
              <p>Access real-time telemetry, run side-by-side comparisons, and explore AI forecasts today.</p>
              <div className={styles.ctaButtons}>
                {user ? (
                  <Link to="/dashboard" className={styles.btnWhite}>
                    Launch Dashboard →
                  </Link>
                ) : (
                  <>
                    <button onClick={() => openAuth('signup')} className={styles.btnWhite}>
                      Create Free Account
                    </button>
                    <button onClick={() => openAuth('login')} className={styles.btnGhost}>
                      Sign In to Platform
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <div className={styles.footerContainer}>
              <div className={styles.footerBrand}>
                <div className={styles.logoBadgeSmall}>
                  <Activity size={16} color="#ffffff" />
                </div>
                <span>SmartCity Platform</span>
              </div>
              <p>© 2026 Smart City Intelligence • Powered by Open Data</p>
              <div className={styles.footerLinks}>
                <Link to="/">Home</Link>
                <Link to="/about">About</Link>
                <Link to="/compare">Compare</Link>
                {user ? (
                  <Link to="/dashboard">Dashboard</Link>
                ) : (
                  <button onClick={() => openAuth('login')} className={styles.footerLoginBtn}>
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LOGIN / SIGNUP OVERLAY POPUP MODAL (Landing Page is Blurred Behind!)
      ───────────────────────────────────────────────────────────── */}
      {authModal && (
        <div className={styles.modalOverlay} onClick={closeAuth}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className={styles.modalCloseBtn} onClick={closeAuth} aria-label="Close">
              <X size={20} />
            </button>

            {/* Modal Brand Header */}
            <div className={styles.modalHeader}>
              <div className={styles.modalLogoWrap}>
                <Activity size={24} color="#ffffff" />
              </div>
              <h2 className={styles.modalTitle}>
                {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className={styles.modalSubtitle}>
                {authMode === 'login'
                  ? 'Sign in to access your smart city dashboard'
                  : 'Join the Smart City Intelligence Platform'}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className={styles.authTabs}>
              <button
                type="button"
                className={`${styles.authTabBtn} ${authMode === 'login' ? styles.authTabActive : ''}`}
                onClick={() => setAuthMode('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`${styles.authTabBtn} ${authMode === 'signup' ? styles.authTabActive : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                Create Account
              </button>
            </div>

            {/* 1. LOGIN FORM */}
            {authMode === 'login' && (
              <form onSubmit={handleLoginSubmit} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label>Username or Email</label>
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. tannu or you@example.com"
                      value={loginForm.identifier}
                      onChange={(e) => setLoginForm({ ...loginForm, identifier: e.target.value })}
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Password</label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      type={showLoginPass ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowLoginPass(!showLoginPass)}
                    >
                      {showLoginPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className={styles.modalSubmitBtn} disabled={loginLoading}>
                  {loginLoading ? 'Signing in…' : 'Sign In to Dashboard'}
                </button>

                <p className={styles.modalSwitchText}>
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setAuthMode('signup')} className={styles.switchActionBtn}>
                    Create one now
                  </button>
                </p>
              </form>
            )}

            {/* 2. SIGNUP FORM */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className={styles.modalForm}>
                <div className={styles.inputGroup}>
                  <label>Full Name</label>
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Your full name (optional)"
                      value={signupForm.full_name}
                      onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Username *</label>
                  <div className={styles.inputWrap}>
                    <User size={16} className={styles.inputIcon} />
                    <input
                      type="text"
                      required
                      placeholder="Choose a username"
                      value={signupForm.username}
                      onChange={(e) => setSignupForm({ ...signupForm, username: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Email Address *</label>
                  <div className={styles.inputWrap}>
                    <Mail size={16} className={styles.inputIcon} />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Password *</label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      type={showSignupPass ? 'text' : 'password'}
                      required
                      placeholder="At least 4 characters"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowSignupPass(!showSignupPass)}
                    >
                      {showSignupPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label>Confirm Password *</label>
                  <div className={styles.inputWrap}>
                    <Lock size={16} className={styles.inputIcon} />
                    <input
                      type="password"
                      required
                      placeholder="Repeat your password"
                      value={signupForm.confirm}
                      onChange={(e) => setSignupForm({ ...signupForm, confirm: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className={styles.modalSubmitBtn} disabled={signupLoading}>
                  {signupLoading ? 'Creating account…' : 'Create Free Account'}
                </button>

                <p className={styles.modalSwitchText}>
                  Already have an account?{' '}
                  <button type="button" onClick={() => setAuthMode('login')} className={styles.switchActionBtn}>
                    Sign in here
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}