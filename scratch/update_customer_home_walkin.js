import fs from 'fs';

const content = `'use client';

import React, { useState, useEffect, Suspense } from 'react';
import styles from './home.module.css';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getActiveServices, getActiveOffers, bookWalkinAppointment } from '@/app/actions/data';

function CustomerHomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');

  const [activeSlide, setActiveSlide] = useState(0);
  const [banners, setBanners] = useState([
    { id: 1, title: 'Welcome to GlamBook!' }
  ]);
  const [popularServices, setPopularServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Walk-in modal state
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [selectedWalkinService, setSelectedWalkinService] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const categories = [
    { id: 'hair', name: 'Hair', icon: '💇' },
    { id: 'spa', name: 'Spa', icon: '💆' },
    { id: 'nails', name: 'Nails', icon: '💅' },
    { id: 'makeup', name: 'Makeup', icon: '💄' },
    { id: 'skincare', name: 'Skincare', icon: '🧴' },
    { id: 'grooming', name: 'Grooming', icon: '🧔' },
  ];

  useEffect(() => {
    async function loadData() {
      const services = await getActiveServices();
      setPopularServices(services);
      
      const offers = await getActiveOffers();
      if (offers && offers.length > 0) {
        setBanners(offers);
      }
      
      setLoading(false);
      
      // If they arrived from a QR scan, show the instant booking modal
      if (source === 'walkin') {
        setShowWalkinModal(true);
      }
    }
    loadData();
  }, [source]);

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    setActiveSlide(newIndex);
  };
  
  const handleWalkinBooking = async () => {
    if (!selectedWalkinService) {
      alert("Please select a service first.");
      return;
    }
    
    setIsBooking(true);
    const res = await bookWalkinAppointment(selectedWalkinService);
    
    if (res.success) {
      alert("Booking confirmed! We are ready for you.");
      setShowWalkinModal(false);
      // Clean up URL so refresh doesn't trigger modal again
      router.replace('/'); 
    } else {
      alert(res.error || 'Failed to book slot.');
    }
    setIsBooking(false);
  };

  return (
    <div className={styles.container}>
      <TopBar greeting="Hello 👋" avatarInitials="U" showNotification={true} />

      <main className={styles.content}>
        {/* Search Bar */}
        <div className={styles.searchContainer}>
          <span className={styles.searchIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Search services, products..." 
            className={styles.searchInput}
          />
        </div>

        {/* Banner Carousel */}
        <section className={styles.bannerSection}>
          <div className={styles.carousel} onScroll={handleScroll}>
            {banners.map((banner) => (
              <div key={banner.id} className={styles.bannerCard}>
                <h2 className={styles.bannerTitle}>{banner.title}</h2>
              </div>
            ))}
          </div>
          <div className={styles.indicators}>
            {banners.map((_, index) => (
              <div 
                key={index} 
                className={\`\${styles.dot} \${index === activeSlide ? styles.active : ''}\`}
              />
            ))}
          </div>
        </section>

        {/* Categories */}
        <section className={styles.categoriesSection}>
          <h2 className={styles.sectionTitle}>Categories</h2>
          <div className={styles.categoryGrid}>
            {categories.map((category) => (
              <div key={category.id} className={styles.categoryCard}>
                <span className={styles.categoryIcon}>{category.icon}</span>
                <span className={styles.categoryName}>{category.name}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Services */}
        <section className={styles.popularSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Popular Services</h2>
            <Link href="/services" className={styles.seeAll}>See All</Link>
          </div>
          
          <div className={styles.servicesHorizontalScroll}>
            {loading ? (
              <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>Loading services...</div>
            ) : popularServices.length === 0 ? (
              <div style={{ padding: '2rem', color: 'var(--text-muted)' }}>No services available.</div>
            ) : (
              popularServices.map((service) => (
                <div key={service.id} className={styles.serviceCard}>
                  <div className={styles.serviceImagePlaceholder}>
                    <span className={styles.serviceImageEmoji}>
                      {service.category === 'hair' ? '💇' : service.category === 'spa' ? '💆' : '✨'}
                    </span>
                  </div>
                  <div className={styles.serviceContent}>
                    <h3 className={styles.serviceName}>{service.name}</h3>
                    <div className={styles.serviceDetails}>
                      <span className={styles.servicePrice}>₹{service.price}</span>
                      <span className={styles.serviceDuration}>• {service.duration} mins</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button className={styles.fab} aria-label="Book Appointment">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span>Book</span>
      </button>

      <BottomNav active="home" variant="customer" />
      
      {/* Walk-in Modal */}
      {showWalkinModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem', backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'var(--surface)', width: '100%', maxWidth: '400px',
            borderRadius: '24px', padding: '2rem', border: '1px solid var(--primary)'
          }}>
            <h2 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)', textAlign: 'center' }}>Welcome to GlamBook!</h2>
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              You're in the salon. Book your slot instantly to skip the queue!
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text)', fontSize: '0.875rem' }}>What do you need today?</label>
                <select 
                  value={selectedWalkinService}
                  onChange={e => setSelectedWalkinService(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg)', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', outline: 'none' }}
                >
                  <option value="">-- Select a Service --</option>
                  {popularServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name} - ₹{s.price}</option>
                  ))}
                </select>
              </div>
              
              <button 
                onClick={handleWalkinBooking}
                disabled={isBooking || !selectedWalkinService}
                style={{ width: '100%', padding: '16px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', marginTop: '1rem', opacity: (!selectedWalkinService || isBooking) ? 0.5 : 1 }}
              >
                {isBooking ? 'Securing slot...' : 'Book Next Available Slot'}
              </button>
              
              <button 
                onClick={() => { setShowWalkinModal(false); router.replace('/'); }}
                style={{ width: '100%', padding: '12px', background: 'transparent', border: 'none', color: 'var(--text-muted)' }}
              >
                I'm just browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerHome() {
  return (
    <Suspense fallback={<div style={{color:'white'}}>Loading...</div>}>
      <CustomerHomeContent />
    </Suspense>
  );
}
`;

fs.writeFileSync('src/app/(customer)/page.js', content);
