import fs from 'fs';

const content = `'use client';

import { useState, useEffect, useTransition, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './booking.module.css';
import BottomNav from '@/components/BottomNav';
import { getActiveServices, getActiveStaff, createAppointment } from '@/app/actions/data';

const TIME_SLOTS = ['9:00 AM', '10:30 AM', '12:00 PM', '2:00 PM', '3:30 PM', '5:00 PM'];

function BookingWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const preSelectedService = searchParams.get('service');

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function loadData() {
      const fetchedServices = await getActiveServices();
      const fetchedStaff = await getActiveStaff();
      setServices(fetchedServices);
      
      // Auto set active category if pre-selected service exists
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

  const handleConfirm = () => {
    setError('');
    startTransition(async () => {
      // Create a proper date string for the DB (using current month/year for demo)
      const now = new Date();
      const dateString = \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, '0')}-\${String(selectedDate).padStart(2, '0')}\`;

      // Convert time to 24h format for DB
      const [time, modifier] = selectedTime.split(' ');
      let [hours, minutes] = time.split(':');
      if (hours === '12') hours = '00';
      if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
      const timeString = \`\${hours}:\${minutes}:00\`;

      const result = await createAppointment({
        serviceId: selectedServiceId,
        staffId: selectedStylistId === 'any' ? null : selectedStylistId,
        date: dateString,
        time: timeString,
        totalAmount: selectedService.price,
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
            <div key={step} className={\`\${styles.stepNode} \${step < currentStep ? styles.stepNodeCompleted : ''} \${step === currentStep ? styles.stepNodeActive : ''}\`}>
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
            <div className={styles.categoryTabs}>
              {categories.map(cat => (
                <button key={cat} className={\`\${styles.categoryTab} \${activeCategory === cat ? styles.categoryTabActive : ''}\`} onClick={() => setActiveCategory(cat)}>
                  {cat}
                </button>
              ))}
            </div>
            <div className={styles.serviceList}>
              {services.filter(s => s.category === activeCategory).map(service => (
                <div key={service.id} className={\`\${styles.serviceCard} \${selectedServiceId === service.id ? styles.serviceCardSelected : ''}\`} onClick={() => setSelectedServiceId(service.id)}>
                  <div className={styles.serviceInfo}>
                    <div className={styles.serviceName}>{service.name}</div>
                    <div className={styles.serviceDetails}>{service.duration_minutes} min • {service.category}</div>
                  </div>
                  <div className={styles.servicePrice}>₹{service.price}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <h2 className={styles.sectionTitle}>Choose a Stylist</h2>
            <div className={styles.stylistContainer}>
              {staff.map(stylist => (
                <div key={stylist.id} className={\`\${styles.stylistCard} \${selectedStylistId === stylist.id ? styles.stylistCardSelected : ''}\`} onClick={() => setSelectedStylistId(stylist.id)}>
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
                {Array.from({length: 30}, (_, i) => i + 1).map(i => (
                  <div key={i} className={\`\${styles.dayCell} \${i < 15 ? styles.dayPast : styles.dayAvailable} \${selectedDate === i ? styles.daySelected : ''}\`} onClick={() => i >= 15 && setSelectedDate(i)}>
                    {i}
                  </div>
                ))}
              </div>
            </div>
            {selectedDate && (
              <>
                <h3 className={styles.sectionTitle} style={{ marginTop: '1.5rem' }}>Available Times</h3>
                <div className={styles.timeGrid}>
                  {TIME_SLOTS.map(time => (
                    <div key={time} className={\`\${styles.timeSlot} \${selectedTime === time ? styles.timeSlotSelected : ''}\`} onClick={() => setSelectedTime(time)}>
                      {time}
                    </div>
                  ))}
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
                <div className={styles.summaryValue}>{selectedService?.name}</div>
              </div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryLabel}>Stylist</div>
                <div className={styles.summaryValue}>{selectedStylist?.name}</div>
              </div>
              <div className={styles.summaryRow}>
                <div className={styles.summaryLabel}>Time</div>
                <div className={styles.summaryValue}>{selectedDate}th, {selectedTime}</div>
              </div>
              <div className={styles.totalRow}>
                <div>Total</div>
                <div>₹{selectedService?.price}</div>
              </div>
            </div>
            <div className={styles.paymentOptions}>
              <div className={\`\${styles.paymentOption} \${paymentMethod === 'salon' ? styles.paymentOptionSelected : ''}\`} onClick={() => setPaymentMethod('salon')}>
                <div style={{ flexGrow: 1, fontWeight: '500' }}>Pay at Salon</div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={styles.footerNav}>
        {currentStep > 1 && (
          <button className={\`\${styles.btn} \${styles.btnBack}\`} onClick={handleBack} disabled={isPending}>Back</button>
        )}
        {currentStep < totalSteps ? (
          <button className={\`\${styles.btn} \${styles.btnNext}\`} onClick={handleNext} disabled={(currentStep === 1 && !selectedServiceId) || (currentStep === 3 && (!selectedDate || !selectedTime))}>
            Next
          </button>
        ) : (
          <button className={styles.btnPrimary} onClick={handleConfirm} disabled={isPending}>
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
`;

fs.writeFileSync('src/app/(customer)/booking/page.js', content);
