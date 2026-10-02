'use client';

import React from 'react';
import Link from 'next/link';
import styles from './profile.module.css';
import BottomNav from '@/components/BottomNav';
import { logout } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { startRegistration } from '@simplewebauthn/browser';

export default function ProfilePage() {
  const router = useRouter();

  const menuItems = [
    { id: 'bookings', title: 'My Bookings', icon: '📅', link: '/booking' },
    { id: 'orders', title: 'My Orders', icon: '📦', link: '/orders' },
    { id: 'rewards', title: 'Referral & Rewards', subtitle: 'Earn ₹200 per referral', icon: '🎁', link: '/rewards' },
    { id: 'subscriptions', title: 'Subscriptions', icon: '💳', link: '/profile/subscriptions' },
    { id: 'analytics', title: 'Spending Analytics', icon: '📊', link: '/profile/analytics' },
    { id: 'addresses', title: 'Saved Addresses', icon: '📍', link: '/profile/addresses' },
    { id: 'help', title: 'Help & Support', icon: '❓', link: '/profile/help' },
  ];

  const handleSetupBiometrics = async () => {
    try {
      // 1. Get options from server
      const resp = await fetch('/api/auth/webauthn/generate-registration-options');
      if (!resp.ok) throw new Error('Failed to generate options');
      const options = await resp.json();

      // 2. Pass options to browser authenticator
      const attResp = await startRegistration(options);

      // 3. Send response back to server for verification
      const verificationResp = await fetch('/api/auth/webauthn/verify-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });

      const verificationResult = await verificationResp.json();
      if (verificationResult.verified) {
        alert('Biometric Login setup successfully! You can now use it on the login screen.');
      } else {
        alert(verificationResult.error || 'Failed to verify registration.');
      }
    } catch (error) {
      console.error(error);
      alert('Could not setup biometric login. Does your device support it?');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>PS</div>
          <button className={styles.editButton} aria-label="Edit profile">
            ✏️
          </button>
        </div>
        <h1 className={styles.name}>Priya Sharma</h1>
        <p className={styles.phone}>+91 98765 43210</p>
        <p className={styles.memberSince}>Member since Jan 2025</p>
      </header>

      <div className={styles.subscriptionCard}>
        <div className={styles.subscriptionContent}>
          <div className={styles.subInfo}>
            <h3>Gold Member - Monthly Haircut Plan</h3>
            <p>Next: Oct 15 • Renewal: Nov 1</p>
          </div>
          <button className={styles.manageBtn}>Manage</button>
        </div>
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>24</div>
          <div className={styles.statLabel}>Total Visits</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>₹18.5k</div>
          <div className={styles.statLabel}>Total Spent</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>350</div>
          <div className={styles.statLabel}>Points</div>
        </div>
      </div>

      <nav className={styles.menuList}>
        {menuItems.map((item) => (
          <Link href={item.link} key={item.id} className={styles.menuItem}>
            <span className={styles.menuIcon}>{item.icon}</span>
            <div className={styles.menuText}>
              <h3 className={styles.menuTitle}>{item.title}</h3>
              {item.subtitle && <p className={styles.menuSubtitle}>{item.subtitle}</p>}
            </div>
            <span className={styles.menuChevron}>›</span>
          </Link>
        ))}
        <button className={styles.menuItem} onClick={handleSetupBiometrics}>
          <span className={styles.menuIcon}>🔒</span>
          <div className={styles.menuText}>
            <h3 className={styles.menuTitle}>Setup Biometric Login</h3>
            <p className={styles.menuSubtitle}>FaceID / Fingerprint</p>
          </div>
          <span className={styles.menuChevron}>›</span>
        </button>
        <button className={`${styles.menuItem} ${styles.logout}`} onClick={async () => { await logout(); router.push('/login'); }}>
          <span className={styles.menuIcon}>🚪</span>
          <div className={styles.menuText}>
            <h3 className={styles.menuTitle}>Logout</h3>
          </div>
        </button>
      </nav>

      <BottomNav active="profile" />
    </div>
  );
}
