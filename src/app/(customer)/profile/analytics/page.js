'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './analytics.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';

export default function AnalyticsPage() {
  const router = useRouter();

  const mockChartData = [
    { label: 'Apr', height: '40%', active: false },
    { label: 'May', height: '30%', active: false },
    { label: 'Jun', height: '60%', active: false },
    { label: 'Jul', height: '50%', active: false },
    { label: 'Aug', height: '80%', active: false },
    { label: 'Sep', height: '70%', active: false },
    { label: 'Oct', height: '100%', active: true },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Spending Analytics</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Spent (YTD)</span>
          <h2 className={styles.summaryValue}>₹18,500</h2>
          <span className={styles.summaryTrend}>↑ 12% vs last year</span>
        </div>

        <div className={styles.chartContainer}>
          <h3 className={styles.chartTitle}>Monthly Spending</h3>
          <div className={styles.chartBars}>
            {mockChartData.map((data, i) => (
              <div key={i} className={styles.barCol}>
                <div 
                  className={`${styles.bar} ${data.active ? styles.active : ''}`} 
                  style={{ height: data.height }}
                ></div>
                <span className={styles.barLabel}>{data.label}</span>
              </div>
            ))}
          </div>
        </div>

        <h3 className={styles.chartTitle} style={{ marginTop: '0.5rem' }}>Top Categories</h3>
        <div className={styles.breakdownList}>
          <div className={styles.breakdownItem}>
            <div className={styles.breakdownIcon}>💇</div>
            <div className={styles.breakdownInfo}>
              <h4 className={styles.breakdownName}>Hair Services</h4>
              <p className={styles.breakdownPercent}>60% of total</p>
            </div>
            <span className={styles.breakdownAmount}>₹11,100</span>
          </div>
          
          <div className={styles.breakdownItem}>
            <div className={styles.breakdownIcon}>💆</div>
            <div className={styles.breakdownInfo}>
              <h4 className={styles.breakdownName}>Spa Treatments</h4>
              <p className={styles.breakdownPercent}>30% of total</p>
            </div>
            <span className={styles.breakdownAmount}>₹5,550</span>
          </div>
          
          <div className={styles.breakdownItem}>
            <div className={styles.breakdownIcon}>🧴</div>
            <div className={styles.breakdownInfo}>
              <h4 className={styles.breakdownName}>Products</h4>
              <p className={styles.breakdownPercent}>10% of total</p>
            </div>
            <span className={styles.breakdownAmount}>₹1,850</span>
          </div>
        </div>
      </div>
      
      <BottomNav active="profile" variant="customer" />
    </div>
  );
}
