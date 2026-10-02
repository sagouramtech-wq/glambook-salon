'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getAllOrders } from '@/app/actions/data';

export default function AdminSalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSales() {
      const data = await getAllOrders();
      setSales(data);
      setLoading(false);
    }
    loadSales();
  }, []);

  const totalRevenue = sales.reduce((sum, order) => sum + (order.total_price || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', paddingBottom: '80px' }}>
      <TopBar title="Sales History" showBack={true} />
      
      <div style={{ padding: '20px' }}>
        <div style={{ backgroundColor: 'var(--color-surface)', padding: '20px', borderRadius: '12px', marginBottom: '24px', textAlign: 'center', border: '1px solid var(--color-primary)' }}>
          <h2 style={{ margin: '0 0 8px', fontSize: '1rem', color: 'var(--color-muted)', fontWeight: 'normal' }}>Total Store Revenue</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>₹{totalRevenue}</div>
        </div>

        <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem' }}>Recent Purchases</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading sales...</div>
        ) : sales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sales yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sales.map(order => (
              <div key={order.id} style={{ backgroundColor: 'var(--color-card)', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{order.products?.name || 'Unknown Product'} (x{order.quantity})</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>
                    Buyer: {order.users?.name || 'Customer'} • {new Date(order.purchased_at).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--color-success)', fontSize: '1.1rem' }}>
                  +₹{order.total_price}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="" variant="admin" />
    </div>
  );
}
