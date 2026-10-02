'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './booking.module.css';
import BottomNav from '@/components/BottomNav';
import { getActiveServices, getActiveStaff, createAppointment, getAppointmentsByDate } from '@/app/actions/data';

const TIME_SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM'];

const SALON_LAT = 17.3525582;
const SALON_LNG = 78.5519718;

function deg2rad(deg) { return deg * (Math.PI/180); }
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371;
  var dLat = deg2rad(lat2-lat1);
  var dLon = deg2rad(lon2-lon1); 
  var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

function BookingWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preSelectedService = searchParams.get('service');

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Home Service State
  const [bookingType, setBookingType] = useState('salon');
  const [homeLocation, setHomeLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [homeAddress, setHomeAddress] = useState('');

  // Step 1 State
  const [activeCategory, setActiveCategory] = useState('Hair');
  const [selectedServiceId, setSelectedServiceId] = useState(preSelectedService || null);

  // Step 2 State
  const [selectedStylistId, setSelectedStylistId] = useState(null);

  // Step 3 State
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  // Step 4 State
  const [paymentMethod, setPaymentMethod] = useState('salon');
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  
  const [bookedTimes, setBookedTimes] = useState([]);

  useEffect(() => {
    async function loadData() {
      const fetchedServices = await getActiveServices();
      const fetchedStaff = await getActiveStaff();
      setServices(fetchedServices);
      
      if (preSelectedService) {
        const s = fetchedServices.find(s => s.id === preSelectedService);
        if (s) setActiveCategory(s.category);
      } else if (fetchedServices.length > 0) {
        setActiveCategory(fetchedServices[0].category);
      }

      setStaff([{ id: 'any', name: 'Any Available', speciality: 'First available stylist' }, ...fetchedStaff]);
      setSelectedStylistId('any');
      setLoading(false);
    }
    loadData();
  }, [preSelectedService]);

  useEffect(() => {
    async function fetchBookings() {
      if (!selectedDate) return;
      const today = new Date();
      const monthStr = String(today.getMonth() + 1).padStart(2, '0');
      const dateStr = `${today.getFullYear()}-${monthStr}-${String(selectedDate).padStart(2, '0')}`;
      
      const appts = await getAppointmentsByDate(dateStr);
      const formattedTimes = appts.map(a => {
        let [hours, minutes] = a.time.split(':');
        hours = parseInt(hours, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${hours}:${minutes} ${ampm}`;
      });
      setBookedTimes(formattedTimes);
    }
    fetchBookings();
  }, [selectedDate]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const dist = getDistanceFromLatLonInKm(lat, lng, SALON_LAT, SALON_LNG);
      
      let f = 0;
      if (dist <= 2) f = 50;
      else if (dist <= 5) f = 100;
      else if (dist <= 10) f = 150;
      
      if (f === 0 && dist > 10) {
        setError('Sorry, you are outside our 10km service radius. (' + dist.toFixed(1) + 'km away)');
        setGpsLoading(false);
        return;
      }
      
      setHomeLocation({ lat, lng, distance: dist, fee: f });
      setGpsLoading(false);
      setError('');
    }, (err) => {
      setError('Failed to get location. Please enable GPS permissions.');
      setGpsLoading(false);
    });
  };

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedStylist = staff.find(s => s.id === selectedStylistId);

  const categories = [...new Set(services.map(s => s.category))];

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const getInitials = (name) => {
    if (name === 'Any Available') return 'AA';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  
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

  const handleConfirm = () => {
    setError('');
    startTransition(async () => {
      const now = new Date();
      const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`;

      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      const timeString = `${hours}:${minutes}:00`;

      let finalPrice = (selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0);
        let discountAmount = 0;
        if (appliedCoupon) {
          if (appliedCoupon.discount_type === 'percentage') {
            discountAmount = Math.round(finalPrice * (appliedCoupon.discount_value / 100));
          } else {
            discountAmount = appliedCoupon.discount_value;
          }
          finalPrice = Math.max(0, finalPrice - discountAmount);
        }
      const notes = bookingType === 'home' ? `HOME SERVICE (Fee: ₹${homeLocation.fee}, Dist: ${homeLocation.distance.toFixed(1)}km). Address: ${homeAddress}` : null;

      const result = await createAppointment({
        serviceId: selectedServiceId,
        staffId: selectedStylistId === 'any' ? null : selectedStylistId,
        date: dateString,
        time: timeString,
        totalAmount: finalPrice,
        notes: notes
      });

      if (result.error) {
        setError(result.error);
      } else {
        setBookingConfirmed(true);
      }
    });
  };

  if (loading) {
    return <div className={styles.container} style={{justifyContent:'center', alignItems:'center'}}>Loading booking data...</div>;
  }

  if (bookingConfirmed) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
        <h2 className={styles.title} style={{ color: 'var(--primary)' }}>Booking Confirmed!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>We'll see you on the {selectedDate}th at {selectedTime}.</p>
        <button className={styles.btnPrimary} style={{ padding: '1rem', borderRadius: '8px' }} onClick={() => router.push('/')}>
          Return to Home
        </button>
        <BottomNav active="bookings" />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Book Appointment</h1>
        <div className={styles.stepIndicator}>
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`${styles.stepNode} ${step < currentStep ? styles.stepNodeCompleted : ''} ${step === currentStep ? styles.stepNodeActive : ''}`}>
              {step < currentStep ? '✓' : step}
            </div>
          ))}
        </div>
      </header>

      <main style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, paddingBottom: '80px' }}>
        {error && <div style={{ color: 'var(--error)', padding: '1rem', textAlign: 'center' }}>{error}</div>}
        
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <h2 className={styles.sectionTitle}>Select a Service</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                onClick={() => { setBookingType('salon'); setSelectedServiceId(null); setError(''); }} 
                style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: bookingType==='salon' ? '2px solid var(--primary)' : '1px solid var(--border)', background: bookingType==='salon' ? 'var(--primary-dark)' : 'var(--surface)', color: 'white' }}>
                📍 At Salon
              </button>
              <button 
                onClick={() => { setBookingType('home'); setSelectedServiceId(null); setError(''); }} 
                style={{ flex: 1, padding: '1rem', borderRadius: '8px', border: bookingType==='home' ? '2px solid var(--primary)' : '1px solid var(--border)', background: bookingType==='home' ? 'var(--primary-dark)' : 'var(--surface)', color: 'white' }}>
                🏠 At Home
              </button>
            </div>

            {bookingType === 'home' && !homeLocation ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                <h3>Check Availability</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', marginTop: '0.5rem' }}>We need your location to check if you are within our 10km service radius.</p>
                <button onClick={handleDetectLocation} className={styles.btnPrimary} disabled={gpsLoading}>
                  {gpsLoading ? 'Detecting...' : 'Detect My Location'}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.categoryTabs}>
                  {categories.map(cat => (
                    <button key={cat} className={`${styles.categoryTab} ${activeCategory === cat ? styles.categoryTabActive : ''}`} onClick={() => setActiveCategory(cat)}>
                      {cat}
                    </button>
                  ))}
                </div>
                <div className={styles.serviceList}>
                  {services
                    .filter(s => s.category === activeCategory)
                    .filter(s => {
                      if (bookingType === 'salon') return true;
                      const n = s.name.split('|||')[0].trim().toLowerCase();
                      return n === 'hair cutting' || n === 'hair cutting + beard cutting' || n === 'hair cutting + beard cutting + hair coloring' || n === 'hair cutting + hair coloring';
                    })
                    .map(service => (
                      <div key={service.id} className={`${styles.serviceCard} ${selectedServiceId === service.id ? styles.serviceCardSelected : ''}`} onClick={() => setSelectedServiceId(service.id)}>
                        <div className={styles.serviceInfo}>
                          <div className={styles.serviceName}>{service.name.split('|||')[0].trim()}</div>
                          <div className={styles.serviceDetails}>{service.duration_minutes} min • {service.category}</div>
                        </div>
                        <div className={styles.servicePrice}>₹{service.price}</div>
                      </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.sectionTitle}>Choose a Stylist</h2>
            <div className={styles.stylistContainer}>
              {staff.map(stylist => (
                <div key={stylist.id} className={`${styles.stylistCard} ${selectedStylistId === stylist.id ? styles.stylistCardSelected : ''}`} onClick={() => setSelectedStylistId(stylist.id)}>
                  <div className={styles.avatar}>{getInitials(stylist.name)}</div>
                  <div className={styles.stylistInfo}>
                    <div className={styles.stylistName}>{stylist.name}</div>
                    <div className={styles.stylistSpeciality}>{stylist.speciality}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <h2 className={styles.sectionTitle}>Select Date</h2>
            <div className={styles.calendar}>
              <div className={styles.daysGrid}>
                {Array.from({length: 30}, (_, i) => i + 1).map(i => {
                  const today = new Date().getDate();
                  const isPast = i < today;
                  const isToday = i === today;
                  const isDisabled = isPast || (bookingType === 'home' && isToday);
                  return (
                    <div 
                      key={i} 
                      className={`${styles.dayCell} ${isDisabled ? styles.dayPast : styles.dayAvailable} ${selectedDate === i ? styles.daySelected : ''}`} 
                      onClick={() => !isDisabled && setSelectedDate(i)}
                      style={isDisabled ? { opacity: 0.3 } : {}}
                    >
                      {i}
                    </div>
                  );
                })}
              </div>
            </div>
            {selectedDate && (
              <>
                <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>Available Times</h3>
                <div className={styles.timeGrid}>
                  {TIME_SLOTS.map(time => {
                    const isBooked = bookedTimes.includes(time);
                    return (
                      <div 
                        key={time} 
                        className={`${styles.timeSlot} ${selectedTime === time ? styles.timeSlotSelected : ''} ${isBooked ? styles.timeSlotBooked : ''}`} 
                        onClick={() => !isBooked && setSelectedTime(time)}
                        style={isBooked ? { opacity: 0.5, cursor: 'not-allowed', textDecoration: 'line-through' } : {}}
                      >
                        {time}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className={styles.stepContent}>
            <h2 className={styles.sectionTitle}>Confirm & Pay</h2>
            <div className={styles.summaryCard}>
              <div className={styles.summaryRow}>
                <div className={styles.summaryLabel}>Service</div>
                <div className={styles.summaryValue}>{selectedService?.name?.split('|||')[0].trim()}</div>
              </div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryLabel}>Stylist</div>
                <div className={styles.summaryValue}>{selectedStylist?.name}</div>
              </div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryLabel}>Time</div>
                <div className={styles.summaryValue}>{selectedDate}th, {selectedTime}</div>
              </div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryLabel}>Location</div>
                <div className={styles.summaryValue}>{bookingType === 'salon' ? '📍 At Salon' : '🏠 At Home'}</div>
              </div>
              {bookingType === 'home' && (
                <div className={styles.summaryRow}>
                  <div className={styles.summaryLabel}>Home Service Fee ({homeLocation?.distance?.toFixed(1)}km)</div>
                  <div className={styles.summaryValue}>+₹{homeLocation?.fee}</div>
                </div>
              )}
              {bookingType === 'home' && (
                <div style={{ marginBottom: '1.5rem', marginTop: '1rem' }}>
                  <input type="text" placeholder="House No, Street, Landmark" value={homeAddress} onChange={e => setHomeAddress(e.target.value)} style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'white' }} required={bookingType === 'home'} />
                </div>
              )}
              <div className={styles.totalRow}>
                <div>Total</div>
                <div>₹{(selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0)}</div>
              </div>
            </div>
            <div className={styles.paymentOptions}>
              <div className={`${styles.paymentOption} ${paymentMethod === 'salon' ? styles.paymentOptionSelected : ''}`} onClick={() => setPaymentMethod('salon')}>
                <div style={{ flexGrow: 1, fontWeight: '500' }}>Pay at Salon</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footerNav}>
        {currentStep > 1 && (
          <button className={`${styles.btn} ${styles.btnBack}`} onClick={handleBack} disabled={isPending}>Back</button>
        )}
        {currentStep < totalSteps ? (
          <button 
            className={`${styles.btn} ${styles.btnNext}`} 
            onClick={handleNext} 
            disabled={(currentStep === 1 && (!selectedServiceId || (bookingType === 'home' && !homeLocation))) || (currentStep === 3 && (!selectedDate || !selectedTime))}
          >
            Next
          </button>
        ) : (
          <button 
            className={styles.btnPrimary} 
            onClick={handleConfirm} 
            disabled={isPending || (bookingType === 'home' && !homeAddress)}
          >
            {isPending ? 'Confirming...' : 'Confirm Booking'}
          </button>
        )}
      </footer>
      <BottomNav active="bookings" />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div style={{padding: '2rem', color: '#fff'}}>Loading...</div>}>
      <BookingWizard />
    </Suspense>
  );
}
