'use client';

import React, { useState } from 'react';
import styles from './staff-portal.module.css';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Gift, Clock } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { getStaffAppointments, submitLeaveRequest } from '@/app/actions/data';

export default function StaffPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('schedule');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Leave Form State
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);

  useEffect(() => {
    async function fetchAppts() {
      const data = await getStaffAppointments();
      setAppointments(data);
      setLoading(false);
    }
    fetchAppts();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveSubmitting(true);
    const res = await submitLeaveRequest(leaveStart, leaveEnd, leaveReason);
    if (res.success) {
      alert('Leave request submitted to Admin!');
      setLeaveStart('');
      setLeaveEnd('');
      setLeaveReason('');
    } else {
      alert(res.error || 'Failed to submit leave request');
    }
    setLeaveSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.greeting}>Hello, Stylist 👋</h1>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
          </button>
        </div>
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Today's Appts</span>
            <span className={styles.statValue}>{appointments.length}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Est. Earnings</span>
            <span className={styles.statValue}>₹{appointments.reduce((sum, a) => sum + (Number(a.total_amount) || 0), 0)}</span>
          </div>
        </div>
      </header>

      <nav className={styles.navTabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'schedule' ? styles.active : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={18} /> Schedule
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'leave' ? styles.active : ''}`}
          onClick={() => setActiveTab('leave')}
        >
          <Clock size={18} /> Leave
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'refer' ? styles.active : ''}`}
          onClick={() => setActiveTab('refer')}
        >
          <Gift size={18} /> Refer & Earn
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'schedule' && (
          <div className={styles.scheduleView}>
            <h2 className={styles.sectionTitle}>Recent Appointments</h2>
            <div className={styles.appointmentList}>
              {loading ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading schedule...</div>
              ) : appointments.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No appointments found.</div>
              ) : (
                appointments.map(app => {
                  let [hours, minutes] = app.time.split(':');
                  hours = parseInt(hours, 10);
                  const ampm = hours >= 12 ? 'PM' : 'AM';
                  hours = hours % 12;
                  hours = hours ? hours : 12;
                  const displayTime = `${hours}:${minutes} ${ampm}`;

                  return (
                    <div key={app.id} className={styles.apptCard}>
                      <div className={styles.apptTime}>
                        {new Date(app.date).toLocaleDateString()}<br/>
                        {displayTime}
                      </div>
                      <div className={styles.apptDetails}>
                        <h4>{app.service?.name || 'Service'}</h4>
                        <p>Client: {app.user?.name || 'Customer'}</p>
                      </div>
                      <div className={styles.apptStatus}>{app.status || 'Upcoming'}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className={styles.leaveView}>
            <h2 className={styles.sectionTitle}>Request Time Off</h2>
            <form className={styles.leaveForm} onSubmit={handleLeaveSubmit}>
              <div className={styles.inputGroup}>
                <label>Start Date</label>
                <input type="date" required value={leaveStart} onChange={e => setLeaveStart(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>End Date</label>
                <input type="date" required value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} />
              </div>
              <div className={styles.inputGroup}>
                <label>Reason</label>
                <textarea rows="3" placeholder="I am feeling unwell..." required value={leaveReason} onChange={e => setLeaveReason(e.target.value)}></textarea>
              </div>
              <button className={styles.submitLeaveBtn} disabled={leaveSubmitting}>
                {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'refer' && (
          <div className={styles.referView}>
            <h2 className={styles.sectionTitle}>Refer & Earn Bonus</h2>
            <div className={styles.referralCard}>
              <div className={styles.referralIcon}>
                <Gift size={32} color="var(--primary)" />
              </div>
              <p>Share your unique code with friends and clients. You earn <strong>₹100</strong> for every new booking made with your code!</p>
              
              <div className={styles.codeBox}>
                <span className={styles.code}>GLAM-STYLIST-24</span>
                <button className={styles.copyBtn} onClick={() => alert('Code Copied!')}>Copy</button>
              </div>
              
              <div className={styles.earningsSummary}>
                <span>Total Referral Earnings:</span>
                <span className={styles.earningsAmount}>₹400</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
