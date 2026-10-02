'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import TopBar from '@/components/TopBar/TopBar';
import StatCard from '@/components/StatCard/StatCard';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getDashboardStats } from '@/app/actions/data';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    appointmentsCount: 0,
    upcomingAppointments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStats();
      if (!data.error) {
        setStats(data);
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  return (
    <div className={styles.container}>
      <TopBar 
        greeting="Admin Dashboard 👋" 
        showNotification={true} 
      />
      
      <main className={styles.content}>
        <div className={styles.metricsGrid}>
          <StatCard 
            title="Today's Revenue" 
            value={\`₹\${stats.revenue}\`} 
            trend="neutral" 
          />
          <StatCard 
            title="Appointments Today" 
            value={stats.appointmentsCount} 
            trend="neutral" 
          />
          <StatCard 
            title="Walk-ins" 
            value="--" 
            trend="neutral" 
          />
          <StatCard 
            title="Products Sold" 
            value="--" 
            trend="neutral" 
          />
        </div>

        <section>
          <h2 className={styles.sectionTitle}>Today's Appointments</h2>
          <div className={styles.appointmentsList}>
            {loading ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading appointments...</div>
            ) : stats.upcomingAppointments.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No appointments today.</div>
            ) : (
              stats.upcomingAppointments.map((apt) => (
                <div key={apt.id} className={styles.appointmentCard}>
                  <div className={styles.appointmentHeader}>
                    <span className={styles.time}>{apt.start_time}</span>
                    <span className={\`\${styles.status} \${apt.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending}\`}>
                      {apt.status}
                    </span>
                  </div>
                  <div className={styles.clientInfo}>{apt.users?.full_name || apt.users?.phone_number || 'Unknown Client'}</div>
                  <div className={styles.serviceInfo}>
                    <span>{apt.services?.name || 'Service'}</span>
                    <span className={styles.stylist}>Stylist: {apt.staff?.name || 'Any'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
          <div className={styles.quickActions}>
            <button className={styles.actionButton}>New Booking</button>
            <button className={styles.actionButton}>Send Notification</button>
            <button className={styles.actionButton}>Add Offer</button>
          </div>
        </section>
      </main>

      <BottomNav active="dashboard" variant="admin" />
    </div>
  );
}
