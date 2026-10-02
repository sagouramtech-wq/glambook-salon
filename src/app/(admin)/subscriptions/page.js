'use client';

import React, { useState, useEffect } from 'react';
import styles from './subscriptions.module.css';
import { getAllSubscriptionPlans, createSubscriptionPlan, toggleSubscriptionPlan, deleteSubscriptionPlan } from '@/app/actions/data';
import { Trash2 } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    const data = await getAllSubscriptionPlans();
    setPlans(data || []);
    setLoading(false);
  }

  const handleToggle = async (id, currentState) => {
    const res = await toggleSubscriptionPlan(id, currentState);
    if (res.success) {
      setPlans(plans.map(p => p.id === id ? { ...p, is_active: !currentState } : p));
    } else {
      alert(res.error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this plan? Customers with active subscriptions might be affected.")) {
      const res = await deleteSubscriptionPlan(id);
      if (res.success) {
        setPlans(plans.filter(p => p.id !== id));
      } else {
        alert(res.error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const planData = {
      name,
      description,
      price: parseFloat(price),
      billing_cycle: billingCycle,
      is_active: true
    };
    
    const res = await createSubscriptionPlan(planData);
    if (res.success) {
      setPlans([...plans, res.plan]);
      setShowModal(false);
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setBillingCycle('monthly');
    } else {
      alert(res.error);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>Subscription Plans</h1>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>
            + Add New Plan
          </button>
        </div>

        {loading ? (
          <div style={{color:'var(--text-muted)'}}>Loading plans...</div>
        ) : plans.length === 0 ? (
          <div style={{color:'var(--text-muted)'}}>No subscription plans found. Create one to get started!</div>
        ) : (
          <div className={styles.grid}>
            {plans.map(plan => (
              <div key={plan.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.planName}>{plan.name}</h3>
                    <div className={styles.planPrice}>₹{plan.price} / {plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</div>
                  </div>
                </div>
                <p className={styles.planDesc}>{plan.description}</p>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.toggleSwitch} ${plan.is_active ? styles.active : ''}`}
                    onClick={() => handleToggle(plan.id, plan.is_active)}
                    aria-label="Toggle active status"
                  ></button>
                  <button className={styles.iconButton} onClick={() => handleDelete(plan.id)} aria-label="Delete plan">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Create Subscription Plan</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label>Plan Name</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  required 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Gold Member"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description & Benefits</label>
                <textarea 
                  className={styles.input} 
                  required 
                  rows="3"
                  value={description} 
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Unlimited haircuts, 10% off products..."
                ></textarea>
              </div>
              <div className={styles.formGroup} style={{display:'flex', gap:'1rem'}}>
                <div style={{flex:1}}>
                  <label>Price (₹)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    required 
                    value={price} 
                    onChange={e => setPrice(e.target.value)}
                    placeholder="999"
                  />
                </div>
                <div style={{flex:1}}>
                  <label>Billing Cycle</label>
                  <select 
                    className={styles.input} 
                    value={billingCycle} 
                    onChange={e => setBillingCycle(e.target.value)}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <BottomNav active="more" variant="admin" />
    </div>
  );
}
