import fs from 'fs';

const content = `'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';
import { loginOrRegister } from '@/app/actions/auth';
import { Fingerprint } from 'lucide-react';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const source = searchParams.get('source');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    const formData = new FormData();
    formData.append('phone', phone);
    formData.append('password', password);

    startTransition(async () => {
      const result = await loginOrRegister(null, formData);
      if (result?.error) {
        setError(result.error);
      } else if (result?.success) {
        if (result.role === 'admin') {
          router.push('/dashboard');
        } else if (result.role === 'staff') {
          router.push('/staff-portal');
        } else {
          // If customer and source is walkin, preserve it!
          if (source === 'walkin') {
            router.push('/?source=walkin');
          } else {
            router.push('/');
          }
        }
      }
    });
  };

  const handleBiometricLogin = async () => {
    // Biometric login logic (WebAuthn) will go here
    alert('Biometric login will be initialized here.');
  };

  return (
    <div className={styles.container}>
      <div className={styles.heroSection}>
        <h1 className={styles.logo}>GlamBook</h1>
        <p className={styles.tagline}>Your Beauty, Our Priority</p>
      </div>

      <div className={styles.formSection}>
        {source === 'walkin' && (
          <div style={{ background: 'rgba(201, 168, 76, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
            <strong>Welcome Walk-in!</strong> Log in to secure your slot instantly.
          </div>
        )}
      
        <form className={styles.form} onSubmit={handleSubmit}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.inputGroup}>
            <div className={styles.countryCode}>
              <span role="img" aria-label="India Flag">🇮🇳</span>
              <span>+91</span>
            </div>
            <input
              type="tel"
              className={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={10}
              required
            />
          </div>

          <div className={styles.inputGroup}>
             <input
              type="password"
              className={styles.input}
              placeholder="Password (used for testing)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', paddingLeft: '1rem' }}
            />
          </div>

          <button type="submit" className={styles.primaryBtn} disabled={isPending}>
            {isPending ? 'Authenticating...' : (source === 'walkin' ? 'Continue to Book' : 'Continue')}
          </button>
        </form>

        <div className={styles.divider}>
          <span>or log in instantly with</span>
        </div>

        <button type="button" className={styles.biometricBtn} onClick={handleBiometricLogin}>
          <Fingerprint size={20} />
          <span>Use Passkey / Biometrics</span>
        </button>

        <p className={styles.terms}>
          By continuing, you agree to our <a href="#">Terms</a> & <a href="#">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{color:'white'}}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
`;

fs.writeFileSync('src/app/login/page.js', content);
