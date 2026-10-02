const fs = require('fs');
let text = fs.readFileSync('src/app/(customer)/booking/page.js', 'utf8');

// Add import
text = text.replace("import { getActiveServices, getActiveStaff, createAppointment } from '@/app/actions/data';", "import { getActiveServices, getActiveStaff, createAppointment, validateCoupon } from '@/app/actions/data';");

// Add states for coupon
const stateInsert = `  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);`;
text = text.replace("const [error, setError] = useState('');", "const [error, setError] = useState('');\n" + stateInsert);

// Add Coupon Validate Function
const validateFn = `
  const handleApplyCoupon = async () => {
    if (!couponCodeInput) return;
    setValidatingCoupon(true);
    setCouponError('');
    const res = await validateCoupon(couponCodeInput);
    if (res.success) {
      setAppliedCoupon(res.coupon);
    } else {
      setCouponError(res.error);
      setAppliedCoupon(null);
    }
    setValidatingCoupon(false);
  };
`;
text = text.replace('const handleConfirm = () => {', validateFn + '\n  const handleConfirm = () => {');

// Update Final Price calculation
const priceCalcSearch = `const finalPrice = (selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0);`;
const priceCalcReplace = `let finalPrice = (selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0);
        let discountAmount = 0;
        if (appliedCoupon) {
          if (appliedCoupon.discount_type === 'percentage') {
            discountAmount = Math.round(finalPrice * (appliedCoupon.discount_value / 100));
          } else {
            discountAmount = appliedCoupon.discount_value;
          }
          finalPrice = Math.max(0, finalPrice - discountAmount);
        }`;
text = text.replace(priceCalcSearch, priceCalcReplace);

// Pass coupon info to createAppointment
const createAptSearch = `const result = await createAppointment({
          serviceId: selectedServiceId,
          staffId: selectedStylistId === 'any' ? null : selectedStylistId,
          date: dateString,
          time: timeString,
          totalAmount: finalPrice,
          notes
        });`;
const createAptReplace = `const result = await createAppointment({
          serviceId: selectedServiceId,
          staffId: selectedStylistId === 'any' ? null : selectedStylistId,
          date: dateString,
          time: timeString,
          totalAmount: finalPrice,
          notes,
          couponCode: appliedCoupon?.code || null,
          discountAmount: discountAmount || 0
        });`;
text = text.replace(createAptSearch, createAptReplace);

// Update UI
const uiSearch = `<div className={styles.summaryRow} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className={styles.summaryLabel}>Total Amount</div>
                  <div className={styles.summaryValue} style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    ₹{(selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0)}
                  </div>
                </div>`;

const uiReplace = `
                {/* Coupon Input Area */}
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Enter Promo Code" 
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      style={{ flex: 1, padding: '0.8rem', background: 'var(--bg)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', textTransform: 'uppercase' }}
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      disabled={validatingCoupon}
                      style={{ padding: '0 1rem', background: 'var(--primary)', border: 'none', borderRadius: '8px', color: 'var(--bg)', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      {validatingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponError && <div style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: '0.5rem' }}>{couponError}</div>}
                  {appliedCoupon && <div style={{ color: 'var(--success)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Promo Code Applied!</div>}
                </div>

                {appliedCoupon && (
                  <div className={styles.summaryRow} style={{ marginTop: '1rem', color: 'var(--success)' }}>
                    <div className={styles.summaryLabel} style={{ color: 'var(--success)' }}>Discount ({appliedCoupon.code})</div>
                    <div className={styles.summaryValue}>
                      - ₹{appliedCoupon.discount_type === 'percentage' 
                        ? Math.round(((selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0)) * (appliedCoupon.discount_value / 100))
                        : appliedCoupon.discount_value}
                    </div>
                  </div>
                )}

                <div className={styles.summaryRow} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className={styles.summaryLabel}>Total Amount</div>
                  <div className={styles.summaryValue} style={{ color: 'var(--primary)', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    ₹{Math.max(0, ((selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0)) - (appliedCoupon ? (appliedCoupon.discount_type === 'percentage' ? Math.round(((selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0)) * (appliedCoupon.discount_value / 100)) : appliedCoupon.discount_value) : 0))}
                  </div>
                </div>`;
text = text.replace(uiSearch, uiReplace);

fs.writeFileSync('src/app/(customer)/booking/page.js', text);
console.log('Booking page updated');
