import fs from 'fs';

const content = `'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './TopBar.module.css';
import { getNotifications } from '@/app/actions/data';

export default function TopBar({ 
  title, 
  showBack = false, 
  showNotification = false, 
  greeting, 
  avatar 
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (showNotification) {
      async function loadNotifs() {
        const data = await getNotifications();
        setNotifications(data || []);
      }
      loadNotifs();
      
      // Optionally, poll every 30 seconds for new alerts
      const interval = setInterval(loadNotifs, 30000);
      return () => clearInterval(interval);
    }
  }, [showNotification]);

  return (
    <header className={styles.topBar} style={{ position: 'relative' }}>
      <div className={styles.left}>
        {showBack && (
          <button className={styles.iconButton} onClick={() => router.back()} aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        )}
        
        {avatar && (
          <div className={styles.avatarWrapper}>
            <Image 
              src={avatar} 
              alt="Profile" 
              width={40} 
              height={40} 
              className={styles.avatar} 
            />
          </div>
        )}
        
        {greeting && (
          <div className={styles.greetingContainer}>
            <span className={styles.greetingText}>{greeting}</span>
            <span className={styles.greetingTitle}>{title}</span>
          </div>
        )}
      </div>

      {!greeting && title && (
        <div className={styles.center}>
          <h1 className={styles.title}>{title}</h1>
        </div>
      )}

      <div className={styles.right} style={{ position: 'relative' }}>
        {showNotification && (
          <div style={{ position: 'relative' }}>
            <button 
              className={styles.iconButton} 
              aria-label="Notifications"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && (
                <span className={styles.badge} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'white', width: '16px', height: '16px', top: '0', right: '0' }}>
                  {notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showDropdown && (
              <div style={{
                position: 'absolute', top: '50px', right: '0', width: '300px',
                background: 'var(--card)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.5)', zIndex: 1000, overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'var(--surface)' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)' }}>Notifications</h3>
                </div>
                <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div key={notif.id} style={{
                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: 'transparent', transition: 'background 0.2s', cursor: 'pointer'
                      }} onMouseOver={e => e.currentTarget.style.background='var(--surface)'} onMouseOut={e => e.currentTarget.style.background='transparent'}>
                        <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.4 }}>
                          {notif.message}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
`;

fs.writeFileSync('src/components/TopBar/TopBar.js', content);
