import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CityComparison from './pages/CityComparison';
import CityExplorer from './pages/CityExplorer';
import Analytics from './pages/Analytics';
import Predictions from './pages/Predictions';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import GenericPage from './pages/GenericPage';

function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
        Loading Smart City Intelligence Platform...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-layout">
      <Sidebar />
      <div className="page-content">
        <Navbar />
        <main className="page-main">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cities" element={<CityExplorer />} />
            <Route path="/compare" element={<CityComparison />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<GenericPage title="Admin Dashboard" description="System overview and platform management." />} />
            <Route path="/admin/users" element={<GenericPage title="User Management" description="View and manage registered platform users." />} />
            <Route path="/admin/cities" element={<GenericPage title="City Management" description="Add, update, or deactivate monitored cities." />} />
            <Route path="/admin/monitor" element={<GenericPage title="Data Collection Monitor" description="Live status of API ingestion and scheduler logs." />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Landing initialAuth="login" />} />
          <Route path="/signup" element={<Landing initialAuth="signup" />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
