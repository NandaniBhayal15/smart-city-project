import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Building2, GitCompare, BarChart3,
  BrainCircuit, Lightbulb, FileText, User, Settings,
  Shield, LogOut, Activity
} from 'lucide-react';
import styles from './Sidebar.module.css';

const NAV_ITEMS = [
  { label: 'Dashboard',    path: '/dashboard',    icon: LayoutDashboard },
  { label: 'City Explorer', path: '/cities',       icon: Building2 },
  { label: 'Compare Cities', path: '/compare',    icon: GitCompare },
  { label: 'Predictions',  path: '/predictions',  icon: BrainCircuit },
  { label: 'Reports',      path: '/reports',      icon: FileText },
];

const ADMIN_ITEMS = [
  { label: 'Admin Dashboard', path: '/admin',        icon: Shield },
  { label: 'User Management', path: '/admin/users',  icon: User },
  { label: 'City Management', path: '/admin/cities', icon: Building2 },
  { label: 'Data Monitor',    path: '/admin/monitor',icon: Activity },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <Activity size={22} className={styles.logoIcon} />
        <span className={styles.logoText}>SmartCity</span>
      </div>

      {/* User info */}
      <div className={styles.userCard}>
        <div className={styles.avatar}>{user?.username?.[0]?.toUpperCase()}</div>
        <div>
          <p className={styles.userName}>{user?.full_name || user?.username}</p>
          <p className={styles.userRole}>{user?.role}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <p className={styles.navSection}>Main Menu</p>
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className={styles.navSection}>Administration</p>
            {ADMIN_ITEMS.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className={styles.sidebarFooter}>
        <NavLink to="/profile" className={styles.navItem}>
          <Settings size={18} />
          <span>Profile & Settings</span>
        </NavLink>
        <button onClick={handleLogout} className={`${styles.navItem} ${styles.logoutBtn}`}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
