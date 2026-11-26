import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './StatCard.module.css';

export default function StatCard({ title, value, unit, subtitle, trend, trendValue, icon: Icon, color = 'primary' }) {
  return (
    <div className={`${styles.card} ${styles[color]}`}>
      <div className={styles.header}>
        <div className={styles.iconWrap}>
          {Icon && <Icon size={20} />}
        </div>
        {trendValue !== undefined && (
          <span className={`${styles.trend} ${trendValue > 0 ? styles.up : trendValue < 0 ? styles.down : styles.neutral}`}>
            {trendValue > 0 ? <TrendingUp size={14} /> : trendValue < 0 ? <TrendingDown size={14} /> : <Minus size={14} />}
            {Math.abs(trendValue)}%
          </span>
        )}
      </div>
      <div className={styles.value}>
        {value !== null && value !== undefined ? value : '—'}
        {unit && <span className={styles.unit}>{unit}</span>}
      </div>
      <div className={styles.title}>{title}</div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </div>
  );
}
