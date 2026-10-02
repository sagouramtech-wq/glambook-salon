'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getProductById } from '@/app/actions/data';
import TopBar from '@/components/TopBar/TopBar';
import styles from './product.module.css';

export default function ProductDetailPage({ params }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [images, setImages] = useState([]);
  
  const scrollRef = useRef(null);

  useEffect(() => {
    async function loadProduct() {
      const data = await getProductById(id);
      if (data) {
        setProduct(data);
        
        let parsedImages = [];
        if (data.image_url) {
          if (data.image_url.startsWith('[')) {
            try {
              parsedImages = JSON.parse(data.image_url);
            } catch(e) {
              parsedImages = [data.image_url];
            }
          } else {
            parsedImages = [data.image_url];
          }
        }
        setImages(parsedImages);
      }
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const currentSlide = Math.round(scrollLeft / width);
    if (currentSlide !== activeSlide) {
      setActiveSlide(currentSlide);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Check out ${product.name} on GlamBook!`,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      alert('Sharing is not supported on this browser.');
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -scrollRef.current.offsetWidth, behavior: 'smooth' });
  };
  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: scrollRef.current.offsetWidth, behavior: 'smooth' });
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading product details...</div>;
  if (!product) return <div style={{ padding: '2rem', textAlign: 'center' }}>Product not found. <button onClick={() => router.back()}>Go Back</button></div>;

  const mockReviews = [
    { id: 1, user: 'Aisha K.', rating: 5, date: '2 days ago', comment: 'Absolutely love this product! It feels so premium and works wonders.' },
    { id: 2, user: 'Rahul S.', rating: 4, date: '1 week ago', comment: 'Great quality, but the packaging could be slightly better.' }
  ];

  return (
    <div className={styles.container}>
      <TopBar title="Product Details" showBack={true} />

      <div className={styles.imageSection}>
        {images.length > 1 && (
          <button onClick={scrollLeft} className={styles.navButton} style={{ left: 12 }}>&lt;</button>
        )}
        
        <div ref={scrollRef} className={styles.carousel} onScroll={handleScroll}>
          {images.length === 0 ? (
            <div className={styles.slide} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>📦</div>
          ) : (
            images.map((img, idx) => (
              <div key={idx} className={styles.slide}>
                {img.startsWith('http') || img.startsWith('data:') ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={img} alt={`${product.name} ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', fontSize: '4rem' }}>{img || '📦'}</span>
                )}
              </div>
            ))
          )}
        </div>

        {images.length > 1 && (
          <button onClick={scrollRight} className={styles.navButton} style={{ right: 12 }}>&gt;</button>
        )}

        {images.length > 1 && (
          <div className={styles.dots}>
            {images.map((_, idx) => (
              <div key={idx} className={`${styles.dot} ${idx === activeSlide ? styles.dotActive : ''}`} />
            ))}
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.brandRow}>
          <span className={styles.brand}>{product.brand || 'Premium Brand'}</span>
          <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: 'var(--color-primary)' }}>★ 4.8</span> (124 reviews)
          </span>
        </div>
        
        <h1 className={styles.title}>{product.name}</h1>
        
        <div className={styles.priceRow}>
          <span className={styles.price}>₹{product.price}</span>
          {product.original_price && product.original_price > product.price && (
            <span className={styles.originalPrice}>₹{product.original_price}</span>
          )}
          {product.stock_quantity <= 0 && (
            <span style={{ background: 'rgba(239, 83, 80, 0.1)', color: '#EF5350', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>Out of Stock</span>
          )}
        </div>

        <div className={styles.actionsRow}>
          <button className={`${styles.actionBtn} ${isLiked ? styles.liked : ''}`} onClick={() => setIsLiked(!isLiked)}>
            {isLiked ? '♥ Liked' : '♡ Like'}
          </button>
          <button className={styles.actionBtn} onClick={handleShare}>
            ➦ Share
          </button>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Description</h2>
          <p className={styles.description}>
            {product.description || `Experience the ultimate care with ${product.name}. Carefully formulated by ${product.brand || 'our experts'}, this product delivers salon-quality results right at home. It nourishes, protects, and revitalizes, ensuring you always look and feel your absolute best.`}
          </p>
        </div>

        <div className={styles.section}>
          <div className={styles.reviewsHeader}>
            <h2 className={styles.sectionTitle} style={{ margin: 0 }}>Customer Reviews</h2>
            <button className={styles.writeReviewBtn} onClick={() => alert('Review modal would open here')}>
              Write a Review
            </button>
          </div>
          
          <div className={styles.reviewsList}>
            {mockReviews.map(review => (
              <div key={review.id} className={styles.reviewCard}>
                <div className={styles.reviewerRow}>
                  <div className={styles.avatar}>{review.user.charAt(0)}</div>
                  <div className={styles.reviewerInfo}>
                    <h4>{review.user}</h4>
                    <div className={styles.reviewDate}>{review.date}</div>
                  </div>
                </div>
                <div className={styles.reviewStars}>
                  {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                </div>
                <p className={styles.reviewText}>{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.bottomBar}>
        <button 
          className={styles.addToCartBtn} 
          disabled={product.stock_quantity <= 0}
          onClick={() => {
            try {
              const saved = localStorage.getItem('glambook_cart');
              const cart = saved ? JSON.parse(saved) : {};
              cart[product.id] = (cart[product.id] || 0) + 1;
              localStorage.setItem('glambook_cart', JSON.stringify(cart));
              router.push('/checkout');
            } catch(e) {}
          }}
        >
          {product.stock_quantity <= 0 ? 'Out of Stock' : `Add to Cart - ₹${product.price}`}
        </button>
      </div>
    </div>
  );
}
