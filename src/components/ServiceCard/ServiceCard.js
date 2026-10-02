'use client';

import styles from './ServiceCard.module.css';

export default function ServiceCard({ name, price, duration, rating, image }) {
  return (
    <div className={styles.card}>
      {image && (
        <div className={styles.imageContainer} style={{ backgroundImage: `url(${image})` }} />
      )}
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{name}</h3>
          <div className={styles.rating}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{rating}</span>
          </div>
        </div>
        
        <div className={styles.details}>
          <span className={styles.duration}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            {duration} min
          </span>
          <span className={styles.price}>₹{price}</span>
        </div>
      </div>
    </div>
  );
}
