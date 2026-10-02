'use client';

import React, { useState, useEffect } from 'react';
import { 
  ToggleRight, 
  ToggleLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Send, 
  Share2, 
  Camera, 
  Users, 
  Image as ImageIcon 
} from 'lucide-react';
import styles from './marketing.module.css';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import { addOffer, getAllOffers, toggleOfferStatus, deleteOffer, sendPushNotification, getPushNotifications, getActiveCoupons, addCoupon, deleteCoupon } from '@/app/actions/data';

export default function MarketingHub() {
    const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState('percentage');
  const [couponValue, setCouponValue] = useState('');

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [modalInput, setModalInput] = useState('');
  const [modalSubtitle, setModalSubtitle] = useState('');
  const [modalGradient, setModalGradient] = useState('linear-gradient(135deg, #2D1B4E, #1A0B2E)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [postTitle, setPostTitle] = useState('');
  const [postPrice, setPostPrice] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    loadOffers();
    loadCoupons();
    loadNotifications();
  }, []);

    const loadCoupons = async () => {
    setLoadingCoupons(true);
    const data = await getActiveCoupons();
    setCoupons(data);
    setLoadingCoupons(false);
  };

  const loadNotifications = async () => {
    setLoadingNotifications(true);
    const data = await getPushNotifications();
    setNotifications(data);
    setLoadingNotifications(false);
  };

  const loadOffers = async () => {
    setLoading(true);
    const data = await getAllOffers();
    setOffers(data);
    setLoading(false);
  };

  const handleAddOffer = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addOffer(modalInput, modalSubtitle || 'Limited time offer', modalGradient);
    if (res.success) {
      alert('Offer published to Customer App!');
      setShowOfferModal(false);
      setModalInput('');
      setModalSubtitle('');
      loadOffers();
    } else {
      alert(res.error || 'Failed to add offer');
    }
    setIsSubmitting(false);
  };

    const handleAddCoupon = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addCoupon(couponCode, couponType, parseFloat(couponValue));
    if (res.success) {
      alert('Coupon created!');
      setShowCouponModal(false);
      setCouponCode('');
      setCouponValue('');
      loadCoupons();
    } else {
      alert(res.error || 'Failed to create coupon');
    }
    setIsSubmitting(false);
  };

  const handleDeleteCoupon = async (id) => {
    if (confirm('Delete this coupon?')) {
      const res = await deleteCoupon(id);
      if (res.success) loadCoupons();
    }
  };

  const handleToggleOffer = async (id, currentStatus) => {
    const res = await toggleOfferStatus(id, currentStatus);
    if (res.success) {
      loadOffers();
    } else {
      alert(res.error || 'Failed to toggle offer');
    }
  };

  const handleDeleteOffer = async (id) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      const res = await deleteOffer(id);
      if (res.success) {
        loadOffers();
      } else {
        alert(res.error || 'Failed to delete offer');
      }
    }
  };

  const handleSendNotification = async () => {
    const title = prompt('Enter notification title:');
    if (!title) return;
    const res = await sendPushNotification(title);
    if (res.success) {
      alert('Notification sent!');
      loadNotifications();
    } else {
      alert(res.error || 'Failed to send notification');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPostImageFile(file);
      setPostImagePreview(URL.createObjectURL(file));
    }
  };

  const handleShare = async (platform) => {
    let text = '';
    if (postTitle) text += `✨ ${postTitle}`;
    if (postPrice) text += ` - ${postPrice}`;
    if (postTitle || postPrice) text += '\n\n';
    if (postDescription) text += `${postDescription}\n\n`;
    text += '#RishiHairstyles #SelfCare';

    if (navigator.share) {
      try {
        const shareData = {
          title: postTitle || 'Rishi Hairstyles',
          text: text,
        };

        if (postImageFile && navigator.canShare) {
           const filesArray = [postImageFile];
           if (navigator.canShare({ files: filesArray })) {
             shareData.files = filesArray;
           }
        }

        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      // Fallback
      alert('Native sharing is not supported on this browser. Try on a mobile device.');
    }
  };

  return (
    <div className={styles.container}>
      <TopBar title="Marketing Hub" />
      
      <main className={styles.content}>
        {/* 1. Active Offers Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active Offers</h2>
            <button className={styles.primaryButton} onClick={() => setShowOfferModal(true)}>
              <Plus size={16} /> Create New
            </button>
          </div>
          
          <div className={styles.card}>
            {loading ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading offers...</div>
            ) : offers.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No offers yet.</div>
            ) : (
              offers.map(offer => (
                <div key={offer.id} className={styles.offerCard}>
                  <div className={styles.offerInfo}>
                    <h3>{offer.title}</h3>
                    <p>{new Date(offer.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className={styles.offerActions}>
                    <button 
                      className={`${styles.toggleSwitch} ${offer.is_active ? styles.active : ''}`}
                      onClick={() => handleToggleOffer(offer.id, offer.is_active)}
                      aria-label={`Toggle ${offer.title}`}
                    >
                      {offer.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button className={styles.iconButton} aria-label="Edit offer" onClick={() => alert('Editing is coming soon!')}>
                      <Edit size={18} />
                    </button>
                    <button className={styles.iconButton} aria-label="Delete offer" onClick={() => handleDeleteOffer(offer.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        
        {/* Coupon Codes Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Coupon Codes</h2>
            <button className={styles.primaryButton} onClick={() => setShowCouponModal(true)}>
              <Plus size={16} /> Create Code
            </button>
          </div>
          
          <div className={styles.card}>
            {loadingCoupons ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : coupons.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No coupons yet.</div>
            ) : (
              coupons.map(coupon => (
                <div key={coupon.id} className={styles.offerCard}>
                  <div className={styles.offerInfo}>
                    <h3 style={{letterSpacing: '2px', color: 'var(--primary)'}}>{coupon.code}</h3>
                    <p>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`}</p>
                  </div>
                  <div className={styles.offerActions}>
                    <button className={styles.iconButton} onClick={() => handleDeleteCoupon(coupon.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 2. Push Notifications Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Push Notifications</h2>
            <button className={styles.secondaryButton} onClick={handleSendNotification}>
              <Send size={16} /> Send New
            </button>
          </div>
          
          <div className={styles.card}>
            <div className={styles.notificationList}>
              {loadingNotifications ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No notifications sent yet.</div>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={styles.notificationItem}>
                    <div>
                      <h4>{notif.title}</h4>
                      <p>{new Date(notif.created_at).toLocaleString()}</p>
                    </div>
                    <div className={styles.reachBadge}>
                      Reach: {notif.reach}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* 3. Social Post Builder Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Social Post Builder</h2>
          <div className={styles.card}>
            
            <div className={styles.builderForm}>
              <div className={styles.inputGroup}>
                <label>Post Title</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. Weekend Special Hair Spa"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Pricing</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="e.g. ₹999"
                  value={postPrice}
                  onChange={(e) => setPostPrice(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Description</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Glow up this weekend! Limited slots available."
                  value={postDescription}
                  onChange={(e) => setPostDescription(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Image (PNG/JPG)</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className={styles.fileInput}
                  onChange={handleImageChange}
                />
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Live Preview</h3>
            <div className={styles.postPreview}>
              {postImagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={postImagePreview} alt="Post Preview" className={styles.postImage} />
              ) : (
                <div className={styles.postImagePlaceholder}>
                  <ImageIcon size={32} />
                  <span style={{marginLeft: '0.5rem', fontSize: '0.8rem'}}>No image selected</span>
                </div>
              )}
              <p className={styles.postText}>
                {postTitle || postPrice || postDescription ? (
                  <>
                    {postTitle && <strong>✨ {postTitle}</strong>}
                    {postPrice && <strong> - {postPrice}</strong>}
                    <br/><br/>
                    {postDescription}
                    <br/><br/>
                    <span style={{color: 'var(--primary-gold)'}}>#RishiHairstyles #SelfCare</span>
                  </>
                ) : (
                  'Your caption will appear here...'
                )}
              </p>
            </div>
            
            <div className={styles.socialButtons}>
              <button className={styles.socialButton} onClick={() => handleShare('native')}>
                <Share2 size={16} /> Share Now
              </button>
            </div>
          </div>
        </section>

        {/* 4. Banner Builder Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>In-App Banner</h2>
          </div>
          <div className={styles.card}>
            <div className={styles.bannerPreview}>
              <h4>🎉 HOLIDAY SPECIAL 🎉</h4>
              <p>Up to 50% off on all premium services</p>
            </div>
            <button className={styles.secondaryButton} style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowOfferModal(true)}>
              <Edit size={16} /> Edit Banner
            </button>
          </div>
        </section>
      </main>

      
      {/* Coupon Modal */}
      {showCouponModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card)', width: '100%', maxWidth: '400px',
            borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Create Coupon</h2>
            <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input type="text" required placeholder="Code (e.g. MONDAY25)" value={couponCode} onChange={e => setCouponCode(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white', textTransform: 'uppercase' }} />
              <select value={couponType} onChange={e => setCouponType(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}>
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
              <input type="number" required placeholder={couponType === 'percentage' ? 'e.g. 25' : 'e.g. 150'} value={couponValue} onChange={e => setCouponValue(e.target.value)} style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }} />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowCouponModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '12px' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', borderRadius: '12px', fontWeight: 'bold' }}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'var(--card)', width: '100%', maxWidth: '400px',
            borderRadius: '24px', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Create Live Offer</h2>
            <form onSubmit={handleAddOffer} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                required
                placeholder="Offer Title (e.g., 50% Off Hair Spa)"
                value={modalInput}
                onChange={e => setModalInput(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
              />
              <input
                type="text"
                required
                placeholder="Subtitle (e.g., This weekend only)"
                value={modalSubtitle}
                onChange={e => setModalSubtitle(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
              />
              <select
                value={modalGradient}
                onChange={e => setModalGradient(e.target.value)}
                style={{ background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '12px', color: 'white' }}
              >
                <option value="linear-gradient(135deg, #2D1B4E, #1A0B2E)">Purple/Dark</option>
                <option value="linear-gradient(135deg, #4E3B1B, #2E210B)">Gold/Dark</option>
                <option value="linear-gradient(135deg, #1B4E3B, #0B2E1E)">Green/Dark</option>
              </select>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => {setShowOfferModal(false); setModalInput('');}} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--text-muted)', color: 'var(--text-muted)', borderRadius: '12px' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ flex: 1, padding: '12px', background: 'var(--primary)', border: 'none', color: 'var(--bg)', borderRadius: '12px', fontWeight: 'bold' }}>
                  {isSubmitting ? 'Sending...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav active="marketing" variant="admin" />
    </div>
  );
}
