'use client';

import React, { useState, useEffect } from 'react';
import TopBar from '@/components/TopBar/TopBar';
import { getMyOrders } from '@/app/actions/data';

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      const data = await getMyOrders();
      setOrders(data);
      setLoading(false);
    }
    loadOrders();
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-bg)', color: 'var(--color-text)', paddingBottom: '80px' }}>
      <TopBar title="My Purchase History" showBack={true} />
      
      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>You haven't bought anything yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {orders.map(order => {
              // Parse image
              let img = '📦';
              if (order.products && order.products.image_url) {
                if (order.products.image_url.startsWith('[')) {
                  try {
                    const arr = JSON.parse(order.products.image_url);
                    if (arr.length > 0) img = arr[0];
                  } catch(e) {}
                } else {
                  img = order.products.image_url;
                }
              }

              return (
                <div key={order.id} style={{ backgroundColor: 'var(--color-surface)', borderRadius: '12px', padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, backgroundColor: 'var(--color-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                    {img.startsWith('http') || img.startsWith('data:') ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={img} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      img
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>{order.products?.name || 'Unknown Product'}</h3>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-muted)', marginBottom: '8px' }}>
                      Purchased on {new Date(order.purchased_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>Qty: {order.quantity}</span>
                      <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{order.total_price}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
