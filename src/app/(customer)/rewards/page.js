'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './rewards.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getRewardPoints } from '@/app/actions/data';

export default function RewardsPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const referralCode = 'RISHI25'; // This could be generated dynamically per user

  useEffect(() => {
    async function fetchPoints() {
      const data = await getRewardPoints();
      setPoints(data.total);
      setHistory(data.history);
      setLoading(false);
    }
    fetchPoints();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Rewards & Referrals</h1>
      </div>

      <div className={styles.content}>
        <div className={styles.loyaltyCard}>
          <p className={styles.pointsLabel}>Available Points</p>
          <h2 className={styles.pointsValue}>{points} pts</h2>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${Math.min((points / 500) * 100, 100)}%` }}></div>
            </div>
            <div className={styles.progressText}>{Math.max(500 - points, 0)} pts away from your next reward!</div>
          </div>
          <button className={styles.redeemBtn} disabled={points < 500}>Redeem</button>
        </div>

        <h3 className={styles.sectionTitle}>Refer a Friend</h3>
        <div className={styles.referralCard}>
          <p className={styles.referralText}>
            Earn ₹200 in salon credits for every friend who books their first appointment using your code.
          </p>
          <div className={styles.codeContainer}>
            <span className={styles.codeValue}>{referralCode}</span>
            <button className={styles.copyBtn} onClick={handleCopy} aria-label="Copy code">
              {copied ? '✅' : '📋'}
            </button>
          </div>
          <div className={styles.shareActions}>
            <button className={styles.shareBtn}>WhatsApp</button>
            <button className={styles.shareBtn}>Copy Link</button>
          </div>
        </div>

        <h3 className={styles.sectionTitle}>Rewards History</h3>
        <div className={styles.historyList}>
          {loading ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Loading history...</div>
          ) : history.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>No points earned yet. Book a service or refer a friend!</div>
          ) : (
            history.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <div className={styles.historyInfo}>
                  <h4>{item.action}</h4>
                  <p className={styles.historyDate}>{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div className={`${styles.historyPoints} ${item.type === 'earned' ? styles.pointsEarned : styles.pointsRedeemed}`}>
                  {item.type === 'earned' ? '+' : ''}{item.points} pts
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <BottomNav active="rewards" variant="customer" />
    </div>
  );
}
