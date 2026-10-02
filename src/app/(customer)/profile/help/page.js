'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './help.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';

export default function HelpPage() {
  const router = useRouter();
  
  const [openFaq, setOpenFaq] = useState(0);

  const faqs = [
    {
      q: 'What is your cancellation policy?',
      a: 'You can cancel or reschedule your appointment free of charge up to 4 hours before your scheduled time. Cancellations within 4 hours may be subject to a 20% cancellation fee.'
    },
    {
      q: 'Do you offer refunds for products?',
      a: 'Unopened products can be returned within 14 days of purchase with the original receipt for a full refund or exchange.'
    },
    {
      q: 'How do I redeem my reward points?',
      a: 'You can redeem your points during the checkout process either on the app or directly at the salon. 100 points equals ₹50 off.'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Help & Support</h1>
      </div>

      <div className={styles.content}>
        
        <div>
          <h2 className={styles.sectionTitle}>Contact Us</h2>
          <div className={styles.contactGrid}>
            <a href="https://wa.me/919640759519" target="_blank" rel="noopener noreferrer" className={`${styles.contactBtn} ${styles.primaryContact}`} style={{textDecoration: 'none'}}>
              <span className={styles.contactIcon}>💬</span>
              <span>Chat on WhatsApp</span>
            </a>
            <a href="tel:9640759519" className={styles.contactBtn} style={{textDecoration: 'none'}}>
              <span className={styles.contactIcon}>📞</span>
              <span>Call Salon</span>
            </a>
            <a href="mailto:sannaila91@gmail.com" className={styles.contactBtn} style={{textDecoration: 'none'}}>
              <span className={styles.contactIcon}>✉️</span>
              <span>Email Support</span>
            </a>
          </div>
        </div>

        <div>
          <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
          <div className={styles.faqList}>
            {faqs.map((faq, idx) => (
              <div key={idx} className={styles.faqItem}>
                <button 
                  className={styles.faqQuestion}
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                >
                  <span>{faq.q}</span>
                  <span>{openFaq === idx ? '−' : '+'}</span>
                </button>
                {openFaq === idx && (
                  <div className={styles.faqAnswer}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
      
      <BottomNav active="profile" variant="customer" />
    </div>
  );
}
