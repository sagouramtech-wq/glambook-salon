import fs from 'fs';

const content = `'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getAdminDashboardStats, addOffer, addNotification } from '@/app/actions/data';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    appointmentsCount: 0,
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'offer', 'notification', 'qr'
  const [modalInput, setModalInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const data = await getAdminDashboardStats();
      setStats(data);
      setLoading(false);
    }
    loadStats();
  }, []);

  const handleAction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (activeModal === 'offer') {
      const res = await addOffer(modalInput);
      if (res.success) {
        alert('Offer published to Customer App!');
        setActiveModal(null);
      } else {
        alert(res.error || 'Failed to add offer');
      }
    } else if (activeModal === 'notification') {
      const res = await addNotification(modalInput);
      if (res.success) {
        alert('Notification blast sent to all users!');
        setActiveModal(null);
      } else {
        alert(res.error || 'Failed to send notification');
      }
    }
    
    setModalInput('');
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Dashboard</h1>
          <p className={styles.date}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className={styles.avatar}>Admin</div>
      </header>

      <main className={styles.content}>
        <div className={styles.statsGrid}>
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
            <button className={styles.actionButton} onClick={() => setActiveModal('qr')}>
              Show QR
            </button>
            <button className={styles.actionButton} onClick={() => setActiveModal('notification')}>
              Send Alert
            </button>
            <button className={styles.actionButton} onClick={() => setActiveModal('offer')}>
              Add Offer
            </button>
          </div>
        </section>
      </main>

      {/* Modals */}
      {activeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card)', width: '100%', maxWidth: '400px',
            borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>
              {activeModal === 'offer' && 'Create Live Offer'}
              {activeModal === 'notification' && 'Send Alert to All Users'}
              {activeModal === 'qr' && 'Walk-in QR Booking'}
            </h2>
            
            {activeModal === 'qr' ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  Have the customer scan this code to instantly open the booking screen on their phone.
                </p>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                  {/* CSS-based QR code placeholder since we don't have a library installed */}
                  <div style={{ width: '200px', height: '200px', background: 'repeating-conic-gradient(#000 0% 25%, #fff 0% 50%) 50% / 20px 20px' }}></div>
                </div>
                <button 
                  onClick={() => setActiveModal(null)} 
                  style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '12px', fontWeight: 'bold' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="text"
                  required
                  placeholder={activeModal === 'offer' ? "e.g., 50% Off Hair Spa Today!" : "e.g., Salon is closing early today."}
                  value={modalInput}
                  onChange={e => setModalInput(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => {setActiveModal(null); setModalInput('');}} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '12px' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', borderRadius: '12px', fontWeight: 'bold' }}>
                    {isSubmitting ? 'Sending...' : 'Publish'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <BottomNav active="dashboard" variant="admin" />
    </div>
  );
}

function StatCard({ title, value, trend }) {
  return (
    <div className={styles.statCard}>
      <h3 className={styles.statTitle}>{title}</h3>
      <div className={styles.statValue}>{value}</div>
    </div>
  );
}
`;

fs.writeFileSync('src/app/(admin)/dashboard/page.js', content);
