import fs from 'fs';

const content = `'use client';

import React, { useState, useEffect } from 'react';
import styles from './staff.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getAllStaff, removeStaff } from '@/app/actions/data';

// Simple Icons
const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

export default function StaffAndPayrollPage() {
  const [activeTab, setActiveTab] = useState('staff');
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await getAllStaff();
      // Only show active staff by default for the list
      setStaffList(data.filter(s => s.is_active));
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRemove = async (staffId) => {
    if (confirm('Are you sure you want to remove this staff member?')) {
      const res = await removeStaff(staffId);
      if (res.success) {
        setStaffList(prev => prev.filter(s => s.id !== staffId));
      } else {
        alert('Failed to remove staff.');
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <h1 className={styles.topBarTitle}>Staff & Payroll</h1>
      </header>

      <main className={styles.content}>
        {/* Tab Switcher */}
        <div className={styles.tabToggle}>
          <button 
            className={\`\${styles.tabBtn} \${activeTab === 'staff' ? styles.active : ''}\`}
            onClick={() => setActiveTab('staff')}
          >
            Staff List
          </button>
          <button 
            className={\`\${styles.tabBtn} \${activeTab === 'payroll' ? styles.active : ''}\`}
            onClick={() => setActiveTab('payroll')}
          >
            Salary Calculator
          </button>
        </div>

        {/* Summary Card */}
        <div className={styles.summaryCard}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{staffList.length}</span>
            <span className={styles.summaryLabel}>Total Staff</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>{staffList.length}</span>
            <span className={styles.summaryLabel}>Active Today</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryValue}>--</span>
            <span className={styles.summaryLabel}>Payroll</span>
          </div>
        </div>

        {/* Content based on Tab */}
        {activeTab === 'staff' ? (
          <>
            <div className={styles.staffList}>
              {loading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading staff...</div>
              ) : staffList.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No staff found.</div>
              ) : (
                staffList.map((staff) => (
                  <div key={staff.id} className={styles.staffCard}>
                    <div className={styles.staffHeader}>
                      <div className={styles.avatarContainer}>
                        <span className={styles.avatarFallback}>{staff.name.charAt(0)}</span>
                        <div className={\`\${styles.statusDot} \${styles.statusOnline}\`} />
                      </div>
                      <div className={styles.staffInfo}>
                        <h3 className={styles.staffName}>{staff.name}</h3>
                        <p className={styles.staffRole}>{staff.speciality || 'Stylist'}</p>
                      </div>
                      <button 
                        onClick={() => handleRemove(staff.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--error)',
                          cursor: 'pointer',
                          padding: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 83, 80, 0.1)'
                        }}
                        title="Remove Staff"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                    <div className={styles.staffStats}>
                      <div className={styles.statItem}>
                        <span className={styles.statLabel}>Phone</span>
                        <span className={styles.statValue}>{staff.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className={styles.addButton}>
              <PlusIcon />
              Add Staff Member
            </button>
          </>
        ) : (
          <div className={styles.payrollList}>
             <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Salary Calculator is coming soon!</div>
          </div>
        )}
      </main>

      <BottomNav active="staff" variant="admin" />
    </div>
  );
}
`;

fs.writeFileSync('src/app/(admin)/staff/page.js', content);
