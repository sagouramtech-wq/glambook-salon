const fs = require('fs');
let code = fs.readFileSync('src/app/(customer)/booking/page.js', 'utf8');

// 1. Add states
const stateCode = `  const [bookingType, setBookingType] = useState('salon');
  const [homeLocation, setHomeLocation] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [homeAddress, setHomeAddress] = useState('');
  
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
  };`;

code = code.replace(/const \[error, setError\] = useState\(''\);/, "const [error, setError] = useState('');\n" + stateCode);

// 2. Filter services if bookingType == 'home'
// 'Hair Cutting', 'Hair Cutting + Beard Cutting', 'Hair Cutting + Beard Cutting + Hair Coloring', 'Hair Cutting + Hair Coloring'
const serviceListCode = `
            {bookingType === 'home' && !homeLocation ? (
              <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
                <h3>Check Service Availability</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', marginTop: '0.5rem' }}>We need your location to check if you are within our 10km service radius.</p>
                <button onClick={handleDetectLocation} className={styles.btnPrimary} disabled={gpsLoading}>
                  {gpsLoading ? 'Detecting...' : 'Detect My Location'}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.categoryTabs}>
                  {categories.map(cat => (
                    <button key={cat} className={\`\${styles.categoryTab} \${activeCategory === cat ? styles.categoryTabActive : ''}\`} onClick={() => setActiveCategory(cat)}>
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
                      <div key={service.id} className={\`\${styles.serviceCard} \${selectedServiceId === service.id ? styles.serviceCardSelected : ''}\`} onClick={() => setSelectedServiceId(service.id)}>
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
`;

const replaceStep1 = `
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
            ${serviceListCode}
          </div>
        )}
`;

code = code.replace(/\{currentStep === 1 && \([\s\S]*?\}\)/, replaceStep1.trim());

// 3. Update Calendar for Next Day constraint
const calendarCode = `
                {Array.from({length: 30}, (_, i) => i + 1).map(i => {
                  const today = new Date().getDate();
                  const isPast = i < today;
                  const isToday = i === today;
                  const isDisabled = isPast || (bookingType === 'home' && isToday);
                  return (
                    <div 
                      key={i} 
                      className={\`\${styles.dayCell} \${isDisabled ? styles.dayPast : styles.dayAvailable} \${selectedDate === i ? styles.daySelected : ''}\`} 
                      onClick={() => !isDisabled && setSelectedDate(i)}
                      style={isDisabled ? { opacity: 0.3 } : {}}
                    >
                      {i}
                    </div>
                  );
                })}
`;
code = code.replace(/\{Array\.from\(\{length: 30\}[\s\S]*?\)\}\)/, calendarCode.trim());

// 4. Update Summary & Payment
const summaryCode = `
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
`;

code = code.replace(/<div className=\{styles\.summaryRow\}>\s*<div className=\{styles\.summaryLabel\}>Time<\/div>[\s\S]*?<div className=\{styles\.totalRow\}>[\s\S]*?<\/div>\s*<\/div>/, summaryCode.trim());

// 5. Update Confirm params
const confirmCode = `
      const result = await createAppointment({
        serviceId: selectedServiceId,
        staffId: selectedStylistId === 'any' ? null : selectedStylistId,
        date: dateString,
        time: timeString,
        totalAmount: (selectedService?.price || 0) + (bookingType === 'home' ? homeLocation?.fee || 0 : 0),
        notes: bookingType === 'home' ? \`HOME SERVICE (Fee: ₹\${homeLocation.fee}, Dist: \${homeLocation.distance.toFixed(1)}km). Address: \${homeAddress}\` : null
      });
`;
code = code.replace(/const result = await createAppointment\(\{[\s\S]*?\}\);/, confirmCode.trim());

// 6. Update Button Disabled State
const btnCode = `disabled={(currentStep === 1 && (!selectedServiceId || (bookingType === 'home' && !homeLocation))) || (currentStep === 3 && (!selectedDate || !selectedTime)) || (currentStep === 4 && bookingType === 'home' && !homeAddress)}`;
code = code.replace(/disabled=\{\(currentStep === 1 && !selectedServiceId\) \|\| \(currentStep === 3 && \(!selectedDate \|\| !selectedTime\)\)\}/, btnCode);

fs.writeFileSync('src/app/(customer)/booking/page.js', code);
