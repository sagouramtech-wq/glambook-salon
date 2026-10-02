'use client';

import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ToggleRight, 
  ToggleLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Search
} from 'lucide-react';
import styles from './inventory.module.css';
import TopBar from '@/components/TopBar/TopBar';
import BottomNav from '@/components/BottomNav/BottomNav';
import { getAllProducts, addProduct, toggleProductAvailability, deleteProduct } from '@/app/actions/data';

export default function InventoryHub() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    brand: '',
    category: 'Hair Care',
    price: '',
    original_price: '',
    stock_quantity: 10,
    min_stock_level: 5,
    image_urls: []
  });

  const [imageUrlInput, setImageUrlInput] = useState('');

  const categories = ['Hair Care', 'Skin Care', 'Styling', 'Tools', 'Nails'];

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({...prev, image_urls: [...prev.image_urls, reader.result]}));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setNewProduct(prev => ({...prev, image_urls: [...prev.image_urls, imageUrlInput.trim()]}));
      setImageUrlInput('');
    }
  };

  const removeImage = (index) => {
    setNewProduct(prev => ({...prev, image_urls: prev.image_urls.filter((_, i) => i !== index)}));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    const data = await getAllProducts();
    setProducts(data);
    setLoading(false);
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const res = await addProduct({
      name: newProduct.name,
      brand: newProduct.brand,
      category: newProduct.category,
      image_url: newProduct.image_urls.length > 0 ? JSON.stringify(newProduct.image_urls) : '📦',
      price: parseFloat(newProduct.price),
      original_price: newProduct.original_price ? parseFloat(newProduct.original_price) : null,
      stock_quantity: parseInt(newProduct.stock_quantity),
      min_stock_level: parseInt(newProduct.min_stock_level)
    });
    
    if (res.success) {
      alert('Product added to Store!');
      setShowModal(false);
      setNewProduct({
        name: '', brand: '', category: 'Hair Care', price: '', original_price: '', stock_quantity: 10, min_stock_level: 5, image_urls: []
      });
      loadProducts();
    } else {
      alert(res.error || 'Failed to add product');
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (id, currentStatus) => {
    const res = await toggleProductAvailability(id, currentStatus);
    if (res.success) loadProducts();
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const res = await deleteProduct(id);
      if (res.success) loadProducts();
    }
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={styles.container}>
      <TopBar title="Store Inventory" />
      
      <main className={styles.content}>
        {/* Actions & Search */}
        <section className={styles.actionsSection}>
          <div className={styles.searchBar}>
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className={styles.primaryButton} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Product
          </button>
        </section>

        {/* Product List */}
        <section className={styles.listSection}>
          <div className={styles.card}>
            {loading ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading inventory...</div>
            ) : filteredProducts.length === 0 ? (
              <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No products found.</div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className={styles.productRow}>
                  <div className={styles.productIcon}>
                    {(() => {
                      let firstImg = product.image_url || '📦';
                      if (product.image_url && product.image_url.startsWith('[')) {
                        try {
                          const parsed = JSON.parse(product.image_url);
                          if (parsed.length > 0) firstImg = parsed[0];
                        } catch(e) {}
                      }
                      
                      if (firstImg.startsWith('http') || firstImg.startsWith('data:image')) {
                        return <img src={firstImg} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />;
                      }
                      return firstImg;
                    })()}
                  </div>
                  <div className={styles.productInfo}>
                    <h3>{product.name}</h3>
                    <p>{product.category} • {product.brand}</p>
                    <div className={styles.productMeta}>
                      <span className={styles.price}>₹{product.price}</span>
                      <span className={`${styles.stock} ${product.stock_quantity > product.min_stock_level ? styles.inStock : styles.lowStock}`}>
                        {product.stock_quantity} in stock (Min: {product.min_stock_level})
                      </span>
                    </div>
                  </div>
                  <div className={styles.productActions}>
                    <button 
                      className={`${styles.toggleSwitch} ${product.is_available ? styles.active : ''}`}
                      onClick={() => handleToggle(product.id, product.is_available)}
                    >
                      {product.is_available ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                    <button className={styles.iconButton} onClick={() => handleDelete(product.id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Add Product Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h2>Add New Product</h2>
            <form onSubmit={handleAddProduct} className={styles.form}>
              
              <div className={styles.inputGroup}>
                <label>Product Name</label>
                <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="e.g. Argan Oil Shampoo" />
              </div>
              
              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Brand</label>
                  <input type="text" value={newProduct.brand} onChange={e => setNewProduct({...newProduct, brand: e.target.value})} placeholder="e.g. L'Oreal" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Category</label>
                  <select value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Price (₹)</label>
                  <input required type="number" min="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} placeholder="e.g. 599" />
                </div>
                <div className={styles.inputGroup}>
                  <label>Original Price (₹) - Optional</label>
                  <input type="number" min="0" value={newProduct.original_price} onChange={e => setNewProduct({...newProduct, original_price: e.target.value})} placeholder="e.g. 799" />
                </div>
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Initial Stock</label>
                  <input required type="number" min="0" value={newProduct.stock_quantity} onChange={e => setNewProduct({...newProduct, stock_quantity: e.target.value})} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Min Stock Level (Alert)</label>
                  <input required type="number" min="0" value={newProduct.min_stock_level} onChange={e => setNewProduct({...newProduct, min_stock_level: e.target.value})} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Product Images</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    onChange={handleImageUpload}
                    style={{ flex: 1, padding: '0.4rem', borderRadius: '8px', background: 'var(--surface)', border: '1px solid var(--card)' }}
                  />
                  <input 
                    type="text" 
                    value={imageUrlInput} 
                    onChange={e => setImageUrlInput(e.target.value)} 
                    placeholder="Or enter URL"
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={handleAddImageUrl} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', background: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer' }}>Add URL</button>
                </div>
                
                {newProduct.image_urls.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {newProduct.image_urls.map((imgUrl, idx) => (
                      <div key={idx} style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <img src={imgUrl.startsWith('http') || imgUrl.startsWith('data:') ? imgUrl : ''} alt={`Preview ${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>&times;</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add to Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* For now, just render BottomNav. In a real app, you might want to add Inventory to the nav array. */}
      <BottomNav active="dashboard" variant="admin" />
    </div>
  );
}
