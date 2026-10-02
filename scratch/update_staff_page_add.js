import fs from 'fs';

const content = `'use client';

import React, { useState, useEffect } from 'react';
import styles from './staff.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getAllStaff, removeStaff, getStaffLeaves, updateLeaveStatus, addStaff } from '@/app/actions/data';

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
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', speciality: '' });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await getAllStaff();
      setStaffList(data.filter(s => s.is_active));
      
      const leaves = await getStaffLeaves();
      setLeaveRequests(leaves);
      
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

  const handleLeaveStatus = async (leaveId, status) => {
    const res = await updateLeaveStatus(leaveId, status);
    if (res.success) {
      setLeaveRequests(prev => prev.map(l => l.id === leaveId ? { ...l, status } : l));
    } else {
      alert('Failed to update status.');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    const res = await addStaff(newStaff.name, newStaff.speciality, newStaff.phone);
    if (res.success) {
      setStaffList(prev => [...prev, res.staff]);
      setShowAddForm(false);
      setNewStaff({ name: '', phone: '', speciality: '' });
    } else {
      alert(res.error || 'Failed to add staff');
    }
    setIsAdding(false);
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <h1 className={styles.topBarTitle}>Staff Management</h1>
      </header>

      <main className={styles.content}>
        {/* Tab Switcher */}
        <div className={styles.tabToggle} style={{ overflowX: 'auto', justifyContent: 'flex-start' }}>
          <button 
            className={\`\${styles.tabBtn} \${activeTab === 'staff' ? styles.active : ''}\`}
            onClick={() => setActiveTab('staff')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Staff List
          </button>
          <button 
            className={\`\${styles.tabBtn} \${activeTab === 'attendance' ? styles.active : ''}\`}
            onClick={() => setActiveTab('attendance')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Attendance
          </button>
          <button 
            className={\`\${styles.tabBtn} \${activeTab === 'leaves' ? styles.active : ''}\`}
            onClick={() => setActiveTab('leaves')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Leaves
          </button>
          <button 
            className={\`\${styles.tabBtn} \${activeTab === 'payroll' ? styles.active : ''}\`}
            onClick={() => setActiveTab('payroll')}
            style={{ whiteSpace: 'nowrap' }}
          >
            Payroll
          </button>
        </div>

        {/* Content based on Tab */}
        {activeTab === 'staff' && (
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
                          background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer',
                          padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          borderRadius: '8px', backgroundColor: 'rgba(239, 83, 80, 0.1)'
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

            {showAddForm ? (
              <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', background: 'var(--surface)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>New Staff Member</h3>
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required 
                  value={newStaff.name}
                  onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                  style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }}
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  required 
                  value={newStaff.phone}
                  onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                  style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }}
                />
                <input 
                  type="text" 
                  placeholder="Speciality (e.g. Senior Stylist)" 
                  required 
                  value={newStaff.speciality}
                  onChange={e => setNewStaff({...newStaff, speciality: e.target.value})}
                  style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', color: 'white' }}
                />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setShowAddForm(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '8px' }}>Cancel</button>
                  <button type="submit" disabled={isAdding} style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', borderRadius: '8px', fontWeight: 'bold' }}>
                    {isAdding ? 'Adding...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <button className={styles.addButton} onClick={() => setShowAddForm(true)}>
                <PlusIcon />
                Add Staff Member
              </button>
            )}
          </>
        )}

        {activeTab === 'attendance' && (
          <div className={styles.attendanceList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1rem', color: 'var(--text)' }}>Today's Attendance</h2>
            {staffList.map((staff) => (
              <div key={staff.id} className={styles.staffCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                <div className={styles.staffInfo}>
                  <h3 className={styles.staffName} style={{ margin: 0, fontSize: '1rem' }}>{staff.name}</h3>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--success)', background: 'rgba(76, 175, 80, 0.1)', color: 'var(--success)' }}>Present</button>
                  <button style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--error)', background: 'none', color: 'var(--error)' }}>Absent</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'leaves' && (
          <div className={styles.leaveList} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {leaveRequests.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No leave requests found.</div>
            ) : (
              leaveRequests.map((leave) => (
                <div key={leave.id} className={styles.staffCard} style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1rem' }}>{leave.staff?.name}</h3>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '4px 8px', borderRadius: '100px',
                      background: leave.status === 'pending' ? 'rgba(255, 152, 0, 0.1)' : leave.status === 'approved' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(239, 83, 80, 0.1)',
                      color: leave.status === 'pending' ? 'var(--warning)' : leave.status === 'approved' ? 'var(--success)' : 'var(--error)'
                    }}>
                      {leave.status.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0 0 0.5rem 0' }}>
                    {leave.start_date} to {leave.end_date}
                  </p>
                  <p style={{ color: 'var(--text)', fontSize: '0.875rem', margin: '0 0 1rem 0' }}>"{leave.reason}"</p>
                  
                  {leave.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleLeaveStatus(leave.id, 'approved')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: 'var(--success)', color: 'white', fontWeight: 'bold' }}>Approve</button>
                      <button onClick={() => handleLeaveStatus(leave.id, 'rejected')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid var(--error)', background: 'transparent', color: 'var(--error)', fontWeight: 'bold' }}>Reject</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'payroll' && (
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
