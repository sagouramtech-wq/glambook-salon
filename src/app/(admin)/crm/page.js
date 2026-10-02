'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import styles from './crm.module.css';
import { getCRMCustomers } from '@/app/actions/data';

const FILTERS = ['All', 'Subscribed', 'VIP', 'Inactive'];

export default function CRMPage() {
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCustomers() {
      const data = await getCRMCustomers();
      setCustomers(data);
      setLoading(false);
    }
    fetchCustomers();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          customer.phone_number?.includes(searchQuery);
    
    if (!matchesSearch) return false;

    if (activeFilter === 'All') return true;
    if (activeFilter === 'Subscribed') return customer.badges.includes('Subscribed');
    if (activeFilter === 'VIP') return customer.badges.includes('VIP');
    if (activeFilter === 'Inactive') return customer.lastVisit === 'Never';

    return true;
  });

  return (
    <div className={styles.container}>
      <TopBar title="Customer CRM" showBack={false} />
      
      <main className={styles.content}>
        <div className={styles.searchContainer}>
          <svg className={styles.searchIcon} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text" 
            placeholder="Search by name or phone..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.filtersContainer}>
          {FILTERS.map(filter => (
            <button
              key={filter}
              className={`${styles.filterChip} ${activeFilter === filter ? styles.active : ''}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>248</span>
            <span className={styles.statLabel}>Total<br/>Customers</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>32</span>
            <span className={styles.statLabel}>Active<br/>Subs</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>18</span>
            <span className={styles.statLabel}>New this<br/>month</span>
          </div>
        </div>

        <div className={styles.customerList}>
          {filteredCustomers.map(customer => (
            <div key={customer.id} className={styles.customerCard}>
              <div className={styles.customerHeader} onClick={() => toggleExpand(customer.id)}>
                <div className={styles.avatar}>
                  {customer.name.charAt(0)}
                </div>
                <div className={styles.customerInfo}>
                  <h3 className={styles.customerName}>{customer.name}</h3>
                  <div className={styles.customerMeta}>
                    <span className={styles.metaText}>{customer.phone_number || 'No phone'}</span>
                    <span className={styles.metaText}>Last visit: {customer.lastVisit}</span>
                  </div>
                  {customer.badges?.length > 0 && (
                    <div className={styles.badges}>
                      {customer.badges.map(badge => (
                        <span 
                          key={badge} 
                          className={`${styles.badge} ${badge === 'Subscribed' ? styles.badgeSubscribed : styles.badgeVIP}`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <svg 
                  className={`${styles.expandIcon} ${expandedId === customer.id ? styles.expanded : ''}`} 
                  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </div>
              
              <div className={`${styles.customerDetails} ${expandedId === customer.id ? styles.expanded : ''}`}>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total Spent</span>
                  <span className={styles.detailValue}>{customer.totalSpent}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Recent History</span>
                  <span className={styles.detailValue} style={{textAlign: 'right'}}>
                    {customer.history?.length > 0 ? customer.history.map((h, i) => <div key={i}>{h}</div>) : 'No history'}
                  </span>
                </div>
                <button className={styles.actionButton}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  Send Notification
                </button>
              </div>
            </div>
          ))}
          {filteredCustomers.length === 0 && (
            <div style={{color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0', fontFamily: "'DM Sans', sans-serif"}}>
              No customers found.
            </div>
          )}
        </div>
      </main>

      <BottomNav active="crm" variant="admin" />
    </div>
  );
}
