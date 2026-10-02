'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '@/components/TopBar/TopBar';
import styles from './checkout.module.css';
import { getAvailableProducts, checkoutStoreOrder } from '@/app/actions/data';

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState({});
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const saved = localStorage.getItem('glambook_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Object.keys(parsed).length === 0) {
            router.replace('/store');
            return;
          }
          setCart(parsed);
        } else {
          router.replace('/store');
          return;
        }
      } catch (e) {
        router.replace('/store');
        return;
      }

      const allProducts = await getAvailableProducts();
      setProducts(allProducts);
      setLoading(false);
    }
    loadData();
  }, [router]);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.address) {
      alert("Please fill in all required contact & address details.");
      return;
    }
    
    setIsProcessing(true);
    // In a real app, integrate Razorpay / Stripe UPI gateway here.
    // We simulate a 1.5s delay for payment processing.
    await new Promise(r => setTimeout(r, 1500));
    
    const res = await checkoutStoreOrder(cart);
    setIsProcessing(false);
    
    if (res.success) {
      alert('Payment Successful & Order placed!');
      localStorage.removeItem('glambook_cart');
      router.push('/orders');
    } else {
      alert(res.error || 'Failed to place order');
    }
  };

  const updateQuantity = (id, delta) => {
    const newCart = { ...cart };
    if (!newCart[id]) return;
    newCart[id] += delta;
    if (newCart[id] <= 0) {
      delete newCart[id];
    }
    setCart(newCart);
    localStorage.setItem('glambook_cart', JSON.stringify(newCart));
    if (Object.keys(newCart).length === 0) {
      router.replace('/store');
    }
  };

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading checkout...</div>;

  let subtotal = 0;
  const cartItems = Object.entries(cart).map(([id, qty]) => {
    const p = products.find(prod => prod.id === id);
    if (p) {
      subtotal += p.price * qty;
    }
    return { id, qty, product: p };
  }).filter(item => item.product);

  const deliveryFee = subtotal > 1000 ? 0 : 50;
  const total = subtotal + deliveryFee;

  return (
    <div className={styles.container}>
      <TopBar title="Secure Checkout" showBack={true} />
      
      <form className={styles.content} onSubmit={handlePayment}>
        
        {/* Contact Details */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>👤 Contact Details</h2>
          <div className={styles.inputGroup}>
            <label>Full Name *</label>
            <input required type="text" name="name" value={form.name} onChange={handleInputChange} className={styles.input} placeholder="John Doe" />
          </div>
          <div className={styles.inputGroup}>
            <label>Phone Number *</label>
            <input required type="tel" name="phone" value={form.phone} onChange={handleInputChange} className={styles.input} placeholder="+91 98765 43210" />
          </div>
        </div>

        {/* Delivery Address */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📍 Delivery Address</h2>
          <div className={styles.inputGroup}>
            <label>Complete Address *</label>
            <textarea required name="address" value={form.address} onChange={handleInputChange} className={styles.input} placeholder="House No, Building, Street Area..." />
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>City</label>
              <input required type="text" name="city" value={form.city} onChange={handleInputChange} className={styles.input} placeholder="City" />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Pincode</label>
              <input required type="text" name="pincode" value={form.pincode} onChange={handleInputChange} className={styles.input} placeholder="123456" />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🛍️ Order Summary</h2>
          <div style={{ marginBottom: '16px' }}>
            {cartItems.map(item => (
              <div key={item.id} className={styles.cartItem}>
                <div>
                  <div className={styles.itemName}>{item.product.name}</div>
                  <div className={styles.qtyControls}>
                    <button type="button" className={styles.qtyBtn} onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span className={styles.qtyValue}>{item.qty}</span>
                    <button type="button" className={styles.qtyBtn} onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                </div>
                <div className={styles.itemPrice}>₹{item.product.price * item.qty}</div>
              </div>
            ))}
          </div>

          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? <span style={{ color: 'var(--color-success)' }}>FREE</span> : `₹${deliveryFee}`}</span>
          </div>
          <div className={styles.summaryTotal}>
            <span>Total to Pay</span>
            <span>₹{total}</span>
          </div>
        </div>

        <div className={styles.bottomBar}>
          <button type="submit" className={styles.payBtn} disabled={isProcessing}>
            {isProcessing ? 'Processing Payment...' : `Pay ₹${total} via UPI`}
          </button>
        </div>
      </form>
    </div>
  );
}
