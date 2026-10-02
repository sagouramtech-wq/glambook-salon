'use client';

import React, { useState, useEffect } from 'react';
import styles from './services.module.css';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import { 
  getServiceCategories, 
  getActiveServices, 
  addServiceCategory, 
  deleteServiceCategory, 
  addService, 
  deleteService, 
  toggleServicePopular 
} from '@/app/actions/data';

export default function ServicesManager() {
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // Category form
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('');

  // Service form
  const [srvName, setSrvName] = useState('');
  const [srvPrice, setSrvPrice] = useState('');
  const [srvDuration, setSrvDuration] = useState('');
  const [srvImage, setSrvImage] = useState('');
  const [srvCategory, setSrvCategory] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const cats = await getServiceCategories();
    setCategories(cats);
    const srvs = await getActiveServices();
    setServices(srvs);
    setLoading(false);
  }

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addServiceCategory(catName, catIcon);
    if (res.success) {
      setCatName('');
      setCatIcon('');
      setShowCategoryModal(false);
      loadData();
    } else {
      alert(res.error || 'Error adding category');
    }
    setIsSubmitting(false);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    const res = await deleteServiceCategory(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Error deleting category');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalName = srvName + (srvImage ? ' ||| ' + srvImage : '');
    const res = await addService(finalName, srvCategory, Number(srvPrice), Number(srvDuration));
    if (res.success) {
      setSrvName('');
      setSrvPrice('');
      setSrvDuration('');
      setSrvCategory('');
      setSrvImage('');
      setShowServiceModal(false);
      loadData();
    } else {
      alert(res.error || 'Error adding service');
    }
    setIsSubmitting(false);
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    const res = await deleteService(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Error deleting service');
    }
  };

  const handleTogglePopular = async (id, currentVal) => {
    const res = await toggleServicePopular(id, !currentVal);
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Error updating service');
    }
  };

  return (
    <div className={styles.container}>
      <TopBar title="Menu Manager" showBack={true} />

      <main className={styles.content}>
        {/* CATEGORIES SECTION */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Categories</h2>
            <button className={styles.addButton} onClick={() => setShowCategoryModal(true)}>+ Add</button>
          </div>
          
          <div className={styles.grid}>
            {loading ? <p>Loading...</p> : categories.map(cat => (
              <div key={cat.id} className={styles.card}>
                <div className={styles.cardInfo}>
                  <span className={styles.icon}>{cat.icon}</span>
                  <span className={styles.name}>{cat.name}</span>
                </div>
                <button className={styles.deleteBtn} onClick={() => handleDeleteCategory(cat.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES SECTION */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Services</h2>
            <button className={styles.addButton} onClick={() => setShowServiceModal(true)}>+ Add</button>
          </div>
          
          <div className={styles.list}>
            {loading ? <p>Loading...</p> : services.map(srv => (
              <div key={srv.id} className={styles.serviceItem}>
                <div className={styles.serviceMain}>
                  <div className={styles.serviceTitle}>
                    <span className={styles.serviceIcon}>{srv.service_categories?.icon || '✨'}</span>
                    <span className={styles.serviceName}>{srv.name.split('|||')[0].trim()}</span>
                  </div>
                  <div className={styles.serviceDetails}>
                    ₹{srv.price} • {srv.duration} min • {srv.service_categories?.name}
                  </div>
                </div>
                <div className={styles.serviceActions}>
                  <button 
                    className={`${styles.popularBtn} ${srv.is_popular ? styles.popularActive : ''}`}
                    onClick={() => handleTogglePopular(srv.id, srv.is_popular)}
                  >
                    {srv.is_popular ? '★ Popular' : '☆ Popular'}
                  </button>
                  <button className={styles.deleteBtn} onClick={() => handleDeleteService(srv.id)}>
                    Del
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ADD CATEGORY MODAL */}
      {showCategoryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Add Category</h2>
            <form onSubmit={handleAddCategory} className={styles.form}>
              <input 
                type="text" 
                required 
                placeholder="Category Name (e.g., Massage)" 
                value={catName} 
                onChange={e => setCatName(e.target.value)} 
                className={styles.input}
              />
              <input 
                type="text" 
                required 
                placeholder="Emoji Icon (e.g., 💆‍♂️)" 
                value={catIcon} 
                onChange={e => setCatIcon(e.target.value)} 
                className={styles.input}
              />
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowCategoryModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD SERVICE MODAL */}
      {showServiceModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Add Service</h2>
            <form onSubmit={handleAddService} className={styles.form}>
              <input 
                type="text" 
                required 
                placeholder="Service Name (e.g., Deep Tissue)" 
                value={srvName} 
                onChange={e => setSrvName(e.target.value)} 
                className={styles.input}
              />
              <select 
                required 
                value={srvCategory} 
                onChange={e => setSrvCategory(e.target.value)}
                className={styles.input}
              >
                <option value="">Select Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
              <input 
                type="url" 
                placeholder="Image URL (Optional)" 
                value={srvImage} 
                onChange={e => setSrvImage(e.target.value)} 
                className={styles.input}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input 
                  type="number" 
                  required 
                  placeholder="Price (₹)" 
                  value={srvPrice} 
                  onChange={e => setSrvPrice(e.target.value)} 
                  className={styles.input}
                />
                <input 
                  type="number" 
                  required 
                  placeholder="Duration (mins)" 
                  value={srvDuration} 
                  onChange={e => setSrvDuration(e.target.value)} 
                  className={styles.input}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowServiceModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <BottomNav active="dashboard" variant="admin" />
    </div>
  );
}
