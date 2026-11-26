import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './Auth.module.css';

export default function Signup() {
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 4) {
      toast.error('Password must be at least 4 characters');
      return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup({
        email: form.email.trim(),
        username: form.username.trim(),
        full_name: form.full_name.trim() || undefined,
        password: form.password,
      });
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMsg = 'Signup failed';
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        errorMsg = detail.map(d => d.msg || d.message).join(', ');
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMsg = 'Backend server connect nahi ho raha (Port 8000 check karein)';
      }
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const f = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}><Activity size={28} color="var(--color-primary)" /></div>
        <h1 className={styles.title}>Create an Account</h1>
        <p className={styles.subtitle}>Join the Smart City Intelligence Platform</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label>Full Name</label>
            <input type="text" placeholder="Your name (optional)" value={form.full_name} onChange={f('full_name')} />
          </div>
          <div className={styles.field}>
            <label>Username *</label>
            <input type="text" required placeholder="Choose a username" value={form.username} onChange={f('username')} />
          </div>
          <div className={styles.field}>
            <label>Email Address *</label>
            <input type="email" required placeholder="you@example.com" value={form.email} onChange={f('email')} />
          </div>
          <div className={styles.field}>
            <label>Password *</label>
            <div className={styles.passWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="At least 4 characters"
                value={form.password}
                onChange={f('password')}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className={styles.field}>
            <label>Confirm Password *</label>
            <input type="password" required placeholder="Confirm your password" value={form.confirm} onChange={f('confirm')} />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Creating account…' : 'Sign Up & Get Started'}
          </button>
        </form>

        <p className={styles.switchLink}>
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}
