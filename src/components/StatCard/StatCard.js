'use client';

import styles from './StatCard.module.css';

export default function StatCard({ label, value, trend, trendValue }) {
  const isPositive = trend === 'up';
  const isNegative = trend === 'down';
  
  return (
    <div className={styles.card}>
      <h4 className={styles.label}>{label}</h4>
      <div className={styles.valueContainer}>
        <span className={styles.value}>{value}</span>
        {trend && (
          <div className={`${styles.trend} ${isPositive ? styles.positive : isNegative ? styles.negative : ''}`}>
            {isPositive && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            )}
            {isNegative && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            )}
            <span className={styles.trendValue}>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
}
