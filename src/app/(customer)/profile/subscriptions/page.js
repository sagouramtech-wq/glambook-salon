'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './subscriptions.module.css';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getActiveSubscriptionPlans, getCustomerSubscriptions, purchaseSubscription } from '@/app/actions/data';

export default function SubscriptionsPage() {
  const router = useRouter();
  
  const [activePlans, setActivePlans] = useState([]);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasingId, setPurchasingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Fetch user's active subscriptions and all available plans concurrently
    const [userSubs, allPlans] = await Promise.all([
      getCustomerSubscriptions(),
      getActiveSubscriptionPlans()
    ]);
    
    // Filter active subscriptions
    const active = userSubs.filter(sub => sub.status === 'active');
    setActivePlans(active);
    
    // Filter out plans the user already has active
    const activePlanIds = active.map(sub => sub.plan_id);
    const available = allPlans.filter(plan => !activePlanIds.includes(plan.id));
    
    setAvailablePlans(available);
    setLoading(false);
  }

  const handleSubscribe = async (planId, billingCycle) => {
    if (!confirm("Confirm purchase of this subscription? (Mock Payment)")) return;
    
    setPurchasingId(planId);
    const res = await purchaseSubscription(planId, billingCycle);
    
    if (res.success) {
      alert("Subscription activated successfully!");
      loadData(); // Refresh data
    } else {
      alert(res.error || "Failed to purchase subscription.");
    }
    
    setPurchasingId(null);
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button onClick={() => router.back()} className={styles.backBtn}>←</button>
        <h1 className={styles.title}>Subscriptions</h1>
      </div>

      <div className={styles.content}>
        
        {loading ? (
          <div style={{color:'var(--text-muted)'}}>Loading your plans...</div>
        ) : (
          <>
            {activePlans.length > 0 && (
              <>
                <h2 className={styles.sectionTitle}>Your Active Plans</h2>
                <div style={{display:'flex', flexDirection:'column', gap:'1rem', marginBottom:'2rem'}}>
                  {activePlans.map(sub => (
                    <div key={sub.id} className={styles.activePlan}>
                      <div className={styles.planHeader}>
                        <h3 className={styles.planName}>{sub.subscription_plans?.name || 'Unknown Plan'}</h3>
                        <span className={styles.statusBadge}>Active</span>
                      </div>
                      
                      <div className={styles.planDetails}>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Started on</span>
                          <span className={styles.detailValue}>{formatDate(sub.current_period_start)}</span>
                        </div>
                        <div className={styles.detailRow}>
                          <span className={styles.detailLabel}>Next Renewal</span>
                          <span className={styles.detailValue}>{formatDate(sub.current_period_end)}</span>
                        </div>
                      </div>
                      
                      <button className={styles.manageBtn}>Manage Subscription</button>
                    </div>
                  ))}
                </div>
              </>
            )}

            <h2 className={styles.sectionTitle}>Available Plans</h2>
            
            {availablePlans.length === 0 ? (
              <div style={{color:'var(--text-muted)'}}>No new plans available at this time.</div>
            ) : (
              <div className={styles.otherPlans}>
                {availablePlans.map(plan => (
                  <div key={plan.id} className={styles.otherPlanCard}>
                    <div className={styles.otherPlanInfo}>
                      <h3>{plan.name}</h3>
                      <p>{plan.description}</p>
                      <span className={styles.price}>₹{plan.price} / {plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}</span>
                    </div>
                    <button 
                      className={styles.upgradeBtn}
                      onClick={() => handleSubscribe(plan.id, plan.billing_cycle)}
                      disabled={purchasingId === plan.id}
                    >
                      {purchasingId === plan.id ? 'Processing...' : 'Subscribe'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      
      <BottomNav active="profile" variant="customer" />
    </div>
  );
}
