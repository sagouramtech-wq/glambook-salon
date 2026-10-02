'use client';

import React, { useState, useEffect } from 'react';
import styles from './store.module.css';
import { getAvailableProducts, checkoutStoreOrder } from '@/app/actions/data';
import BottomNav from '@/components/BottomNav/BottomNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

function ProductImageCarousel({ product }) {
  const scrollRef = React.useRef(null);
  
  let images = [];
  if (product.image_url) {
    if (product.image_url.startsWith('[')) {
      try {
        images = JSON.parse(product.image_url);
      } catch(e) {
        images = [product.image_url];
      }
    } else {
      images = [product.image_url];
    }
  }

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: scrollRef.current.offsetWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.productImage} style={{ position: 'relative' }}>
      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); scrollLeft(); }} 
          style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          &lt;
        </button>
      )}
      
      <div ref={scrollRef} style={{ display: 'flex', width: '100%', height: '100%', overflowX: 'auto', scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {images.length === 0 ? (
          <div style={{ flex: '0 0 100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>
        ) : (
          images.map((img, idx) => (
            <div key={idx} style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
              {img.startsWith('http') || img.startsWith('data:image') ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={img} alt={`${product.name} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className={styles.emoji} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '3rem' }}>{img || '📦'}</span>
              )}
            </div>
          ))
        )}
      </div>

      {images.length > 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); scrollRight(); }} 
          style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', zIndex: 2, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          &gt;
        </button>
      )}
    </div>
  );
}

export default function StorePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState({}); // { productId: quantity }
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  // Dynamic categories based on fetched products
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    async function loadProducts() {
      const data = await getAvailableProducts();
      setProducts(data);
      
      // Extract unique categories
      const uniqueCats = ['All', ...new Set(data.map(p => p.category))];
      setCategories(uniqueCats);
      setLoading(false);
    }
    loadProducts();
  }, []);

  const filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  const handleAddToCart = (productId) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  // Sync cart to local storage when it changes
  useEffect(() => {
    if (Object.keys(cart).length > 0) {
      localStorage.setItem('glambook_cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Load existing cart on mount if any
  useEffect(() => {
    try {
      const saved = localStorage.getItem('glambook_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const handleCheckout = () => {
    if (Object.keys(cart).length === 0) return;
    localStorage.setItem('glambook_cart', JSON.stringify(cart));
    router.push('/checkout');
  };

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find(p => p.id === id); // UUID is a string
    return sum + ((product?.price || 0) * qty);
  }, 0);

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <header className={styles.topBar}>
        <h1 className={styles.title}>Salon Store</h1>
        <div className={styles.cartIconWrapper} onClick={handleCheckout} style={{ cursor: 'pointer' }}>
          <span>🛒</span>
          {totalItems > 0 && (
            <div className={styles.cartBadge}>{totalItems}</div>
          )}
        </div>
      </header>

      {/* Category Filter Chips */}
      <div className={styles.filterScroll}>
        {categories.map(category => (
          <button
            key={category}
            className={`${styles.filterChip} ${activeCategory === category ? styles.active : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <main className={styles.productGrid}>
        {loading ? (
          <div style={{ padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div style={{ padding: '2rem', color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center' }}>No products available right now.</div>
        ) : (
          filteredProducts.map(product => (
            <div key={product.id} className={styles.productCard}>
              <Link href={`/store/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <ProductImageCarousel product={product} />
              </Link>
              
              <div className={styles.productInfo}>
                <Link href={`/store/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <h3 className={styles.productName}>{product.name}</h3>
                </Link>
                <span className={styles.productBrand}>{product.brand || 'Unbranded'}</span>
                
                <div className={styles.priceRow}>
                  <span className={styles.price}>₹{product.price}</span>
                  {product.original_price && product.original_price > product.price && (
                    <span className={styles.originalPrice}>₹{product.original_price}</span>
                  )}
                </div>
                
                <div className={styles.ratingRow}>
                  <span className={styles.stars}>★★★★☆</span>
                  <span className={styles.stockText}>
                    {product.stock_quantity <= 0 ? (
                      <span style={{ color: 'var(--error, #EF5350)' }}>Out of Stock</span>
                    ) : product.stock_quantity <= product.min_stock_level ? (
                      <span style={{ color: 'var(--warning, #FF9800)' }}>Only {product.stock_quantity} left</span>
                    ) : (
                      'In Stock'
                    )}
                  </span>
                </div>
                
                <button 
                  className={styles.addToCartBtn}
                  onClick={() => handleAddToCart(product.id)}
                  disabled={product.stock_quantity <= 0}
                  style={product.stock_quantity <= 0 ? { opacity: 0.5, cursor: 'not-allowed', background: 'transparent', borderColor: 'var(--text-subtle)', color: 'var(--text-subtle)' } : {}}
                >
                  {product.stock_quantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))
        )}
      </main>

      {/* Sticky Cart Bar */}
      {totalItems > 0 && (
        <div className={styles.cartBar}>
          <div className={styles.cartInfo}>
            <span className={styles.cartCount}>{totalItems} item{totalItems > 1 ? 's' : ''}</span>
            <span className={styles.cartTotal}>₹{totalPrice.toFixed(2)}</span>
          </div>
          <button 
            className={styles.checkoutBtn} 
            onClick={handleCheckout}
            disabled={isCheckingOut}
          >
            {isCheckingOut ? 'Processing...' : 'Checkout & Pay at Salon'}
          </button>
        </div>
      )}

      {/* Spacer to prevent cart bar from overlapping content at the bottom */}
      <div style={{ height: totalItems > 0 ? '160px' : '80px' }}></div>
      <BottomNav active="store" variant="customer" />
    </div>
  );
}
