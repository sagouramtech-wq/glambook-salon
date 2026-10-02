import fs from 'fs';
import path from 'path';

const dir = 'src/app/staff-portal';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const pageContent = `'use client';

import React, { useState } from 'react';
import styles from './staff-portal.module.css';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Gift, Clock } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default function StaffPortalPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('schedule');

  const handleLogout = async () => {
    await logout();
    router.push('/login');
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
            <span className={styles.statValue}>4</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Est. Earnings</span>
            <span className={styles.statValue}>₹1,250</span>
          </div>
        </div>
      </header>

      <nav className={styles.navTabs}>
        <button 
          className={\`\${styles.tab} \${activeTab === 'schedule' ? styles.active : ''}\`}
          onClick={() => setActiveTab('schedule')}
        >
          <Calendar size={18} /> Schedule
        </button>
        <button 
          className={\`\${styles.tab} \${activeTab === 'leave' ? styles.active : ''}\`}
          onClick={() => setActiveTab('leave')}
        >
          <Clock size={18} /> Leave
        </button>
        <button 
          className={\`\${styles.tab} \${activeTab === 'refer' ? styles.active : ''}\`}
          onClick={() => setActiveTab('refer')}
        >
          <Gift size={18} /> Refer & Earn
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'schedule' && (
          <div className={styles.scheduleView}>
            <h2 className={styles.sectionTitle}>Today's Appointments</h2>
            <div className={styles.appointmentList}>
              <div className={styles.apptCard}>
                <div className={styles.apptTime}>10:00 AM</div>
                <div className={styles.apptDetails}>
                  <h4>Hair Spa Premium</h4>
                  <p>Client: Rahul M.</p>
                </div>
                <div className={styles.apptStatus}>Upcoming</div>
              </div>
              <div className={styles.apptCard}>
                <div className={styles.apptTime}>1:30 PM</div>
                <div className={styles.apptDetails}>
                  <h4>Classic Haircut</h4>
                  <p>Client: Aman K.</p>
                </div>
                <div className={styles.apptStatus}>Upcoming</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className={styles.leaveView}>
            <h2 className={styles.sectionTitle}>Request Time Off</h2>
            <form className={styles.leaveForm} onSubmit={(e) => { e.preventDefault(); alert('Leave request submitted to Admin!'); }}>
              <div className={styles.inputGroup}>
                <label>Start Date</label>
                <input type="date" required />
              </div>
              <div className={styles.inputGroup}>
                <label>End Date</label>
                <input type="date" required />
              </div>
              <div className={styles.inputGroup}>
                <label>Reason</label>
                <textarea rows="3" placeholder="I am feeling unwell..." required></textarea>
              </div>
              <button type="submit" className={styles.submitBtn}>Submit Request</button>
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
`;

const cssContent = `.container {
  min-height: 100vh;
  background-color: var(--bg);
  padding-bottom: 2rem;
}

.header {
  background: linear-gradient(135deg, var(--card) 0%, #1a1a2e 100%);
  padding: 1.5rem;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  border-bottom: 1px solid rgba(201, 168, 76, 0.2);
}

.headerTop {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.greeting {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  color: var(--primary);
  margin: 0;
}

.logoutBtn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.logoutBtn:hover {
  color: var(--error);
  background: rgba(239, 83, 80, 0.1);
}

.statsRow {
  display: flex;
  gap: 1rem;
}

.statCard {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.statLabel {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.statValue {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
}

.navTabs {
  display: flex;
  padding: 1rem;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.navTabs::-webkit-scrollbar {
  display: none;
}

.tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: var(--surface);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 100px;
  color: var(--text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  white-space: nowrap;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab.active {
  background: rgba(201, 168, 76, 0.1);
  color: var(--primary);
  border-color: var(--primary);
}

.content {
  padding: 1rem;
  animation: fadeIn 0.3s ease-out;
}

.sectionTitle {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text);
}

.appointmentList {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.apptCard {
  background: var(--surface);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.apptTime {
  font-weight: 600;
  color: var(--primary);
  font-size: 0.875rem;
  min-width: 70px;
}

.apptDetails h4 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  color: var(--text);
}

.apptDetails p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-muted);
}

.apptStatus {
  margin-left: auto;
  font-size: 0.75rem;
  background: rgba(76, 175, 80, 0.1);
  color: var(--success);
  padding: 4px 8px;
  border-radius: 100px;
  font-weight: 500;
}

.leaveForm {
  background: var(--surface);
  padding: 1.5rem;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.inputGroup {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.inputGroup label {
  font-size: 0.875rem;
  color: var(--text-muted);
}

.inputGroup input,
.inputGroup textarea {
  background: var(--bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.875rem;
  color: var(--text);
  font-family: inherit;
  font-size: 1rem;
}

.inputGroup input:focus,
.inputGroup textarea:focus {
  outline: none;
  border-color: var(--primary);
}

.submitBtn {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: var(--bg);
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: opacity 0.2s;
}

.submitBtn:active {
  opacity: 0.8;
}

.referralCard {
  background: var(--surface);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(201, 168, 76, 0.2);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.referralCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--primary-light), var(--primary), var(--primary-dark));
}

.referralIcon {
  margin-bottom: 1rem;
}

.referralCard p {
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.referralCard p strong {
  color: var(--primary);
  font-size: 1rem;
}

.codeBox {
  display: flex;
  align-items: center;
  background: var(--bg);
  border-radius: 12px;
  padding: 0.5rem;
  margin-bottom: 1.5rem;
  border: 1px dashed rgba(201, 168, 76, 0.4);
}

.code {
  flex: 1;
  font-family: monospace;
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text);
  letter-spacing: 1px;
}

.copyBtn {
  background: var(--primary);
  color: var(--bg);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.earningsSummary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  font-size: 0.875rem;
  color: var(--text-muted);
}

.earningsAmount {
  font-weight: 700;
  color: var(--success);
  font-size: 1.125rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
`;

fs.writeFileSync(path.join(dir, 'page.js'), pageContent);
fs.writeFileSync(path.join(dir, 'staff-portal.module.css'), cssContent);
