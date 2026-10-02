'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import styles from './addresses.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';

export default function AddressesPage() {
  const router = useRouter();

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Saved Addresses</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.addressList}>
          <div className={styles.addressCard}>
            <div className={styles.iconWrapper}>🏠</div>
            <div className={styles.addressDetails}>
              <h3 className={styles.addressType}>Home</h3>
              <p className={styles.addressText}>
                Flat 402, Sunshine Apartments, 
                <br />Sector 45, DLF Phase 3,
                <br />Gurugram, Haryana 122002
              </p>
              <div className={styles.cardActions}>
                <button className={styles.actionBtn}>Edit</button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>Delete</button>
              </div>
            </div>
          </div>

          <div className={styles.addressCard}>
            <div className={styles.iconWrapper}>💼</div>
            <div className={styles.addressDetails}>
              <h3 className={styles.addressType}>Work</h3>
              <p className={styles.addressText}>
                Cyber City, Building 10,
                <br />Tower B, 5th Floor,
                <br />Gurugram, Haryana 122002
              </p>
              <div className={styles.cardActions}>
                <button className={styles.actionBtn}>Edit</button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button className={styles.fab} aria-label="Add new address">
        +
      </button>
      
      <BottomNav active="profile" variant="customer" />
    </div>
  );
}
