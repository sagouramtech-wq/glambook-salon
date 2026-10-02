'use client';

import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';
import TopBar from '@/components/TopBar/TopBar';
import StatCard from '@/components/StatCard/StatCard';
import { getDashboardStats, addOffer, addNotification, addExpense, getLowStockProducts, getAdvancedAnalytics } from '@/app/actions/data';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    revenue: 0,
    expenses: 0,
    netIncome: 0,
    appointmentsCount: 0,
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [advStats, setAdvStats] = useState(null);

  // Modal states
  const [activeModal, setActiveModal] = useState(null); // 'offer', 'notification', 'qr', 'expense'
  const [modalInput, setModalInput] = useState('');
  
  // Expense specific state
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Tea');
  const [expenseDescription, setExpenseDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadStats() {
      const data = await getDashboardStats();
      setStats(data);
      
      const lowStockData = await getLowStockProducts();
      setLowStockAlerts(lowStockData);
      
      const advancedData = await getAdvancedAnalytics();
      setAdvStats(advancedData);
      
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
    } else if (activeModal === 'expense') {
      const res = await addExpense(Number(expenseAmount), expenseCategory, expenseDescription);
      if (res.success) {
        alert('Expense logged successfully!');
        setActiveModal(null);
        // reload stats
        const data = await getDashboardStats();
        setStats(data);
      } else {
        alert(res.error || 'Failed to log expense');
      }
    }
    
    setModalInput('');
    setExpenseAmount('');
    setExpenseDescription('');
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <TopBar 
        greeting="Good Evening, Raj 👋" 
        showNotification={true} 
      />

      <main className={styles.content}>
        {lowStockAlerts.length > 0 && (
          <div style={{ background: 'rgba(239, 83, 80, 0.1)', border: '1px solid var(--error)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', color: 'white' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--error)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem' }}>
              ⚠️ Low Stock Alert
            </h3>
            <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem' }}>
              {lowStockAlerts.map(product => (
                <li key={product.id}>
                  {product.name} - Only {product.stock_quantity} left (Min: {product.min_stock_level})
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.statsGrid}>
          <StatCard 
            label="Revenue" 
            value={`₹${stats.revenue}`} 
            trend="up" 
          />
          <StatCard 
            label="Expenses" 
            value={`₹${stats.expenses}`} 
            trend="down" 
          />
          <StatCard 
            label="Net Income" 
            value={`₹${stats.netIncome}`} 
            trend={stats.netIncome >= 0 ? "up" : "down"} 
          />
        </div>

        {advStats && (
          <section style={{ marginTop: '2rem' }}>
            <h2 className={styles.sectionTitle}>Advanced Analytics</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Bookings</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>{advStats.totalBookings}</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Today's Bookings</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text)' }}>{advStats.dailyBookings}</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Busiest Day</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{advStats.busiestDay.date}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{advStats.busiestDay.count} bookings</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quietest Day</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>{advStats.quietestDay.date}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{advStats.quietestDay.count} bookings</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Busiest Month</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{advStats.busiestMonth.month}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{advStats.busiestMonth.count} bookings</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Quietest Month</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>{advStats.quietestMonth.month}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{advStats.quietestMonth.count} bookings</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Popular Time</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>{advStats.popularTime.time}</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Store Revenue</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--success)' }}>₹{advStats.storeSalesRevenue}</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Top Product</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>{advStats.topProduct.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{advStats.topProduct.qty} sold</div>
              </div>
              <div style={{ background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Lowest Sold Product</div>
                <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--error)' }}>{advStats.lowestProduct.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{advStats.lowestProduct.qty} sold</div>
              </div>
            </div>
          </section>
        )}

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
                    <span className={`${styles.status} ${apt.status === 'confirmed' ? styles.statusConfirmed : styles.statusPending}`}>
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
            <button className={styles.actionButton} onClick={() => window.location.href = '/sales'}>Sales History</button>
            <button className={styles.actionButton} onClick={() => window.location.href = '/services'}>
              Manage Menu
            </button>
            <button className={styles.actionButton} onClick={() => setActiveModal('expense')}>
              Add Expense
            </button>
            <button className={styles.actionButton} onClick={() => window.location.href = '/inventory'}>
              Manage Store
            </button>
            <button className={styles.actionButton} onClick={() => window.location.href = '/subscriptions'}>
              Subscriptions
            </button>
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
              {activeModal === 'expense' && 'Log Daily Expense'}
            </h2>
            
            {activeModal === 'qr' ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                  Have the customer scan this code to instantly open the booking screen on their phone.
                </p>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '16px', display: 'inline-block', marginBottom: '1.5rem' }}>
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=http://localhost:3000/login?source=walkin" 
                    alt="Scan to Walk-in Book"
                    style={{ width: '200px', height: '200px' }}
                  />
                </div>
                <button 
                  onClick={() => setActiveModal(null)} 
                  style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '12px', fontWeight: 'bold' }}
                >
                  Close
                </button>
              </div>
            ) : activeModal === 'expense' ? (
              <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="number"
                  required
                  placeholder="Amount (₹)"
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
                />
                <select
                  value={expenseCategory}
                  onChange={e => setExpenseCategory(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
                >
                  <option value="Tea">Tea</option>
                  <option value="Coffee">Coffee</option>
                  <option value="Juice">Juice</option>
                  <option value="Paper">Paper</option>
                  <option value="Materials">Materials</option>
                  <option value="Rent">Rent</option>
                  <option value="Salaries">Salaries</option>
                  <option value="Light Bill">Light Bill</option>
                  <option value="Advertisement">Advertisement</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Description (Optional)"
                  value={expenseDescription}
                  onChange={e => setExpenseDescription(e.target.value)}
                  style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => {setActiveModal(null); setExpenseAmount(''); setExpenseDescription('');}} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '12px' }}>Cancel</button>
                  <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', borderRadius: '12px', fontWeight: 'bold' }}>
                    {isSubmitting ? 'Saving...' : 'Save Expense'}
                  </button>
                </div>
              </form>
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
