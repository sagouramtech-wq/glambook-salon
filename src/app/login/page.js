'use client';

import React, { useState, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';
import { loginOrRegister, updateUserName } from '@/app/actions/auth';
import { Fingerprint } from 'lucide-react';
import { startAuthentication } from '@simplewebauthn/browser';

function LoginForm() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const [needsNameForm, setNeedsNameForm] = useState(false);
  const [name, setName] = useState('');
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
        } else if (result.needsName) {
          setNeedsNameForm(true);
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

  
  const handleNameSubmit = (e) => {
    e.preventDefault();
    setError('');
    const formData = new FormData();
    formData.append('name', name);
    startTransition(async () => {
      const res = await updateUserName(formData);
      if (res?.error) setError(res.error);
      else {
        if (source === 'walkin') router.push('/?source=walkin');
        else router.push('/');
      }
    });
  };

  const handleBiometricLogin = async () => {
    try {
      // 1. Get options from server
      const resp = await fetch('/api/auth/webauthn/generate-authentication-options');
      if (!resp.ok) throw new Error('Failed to generate options');
      const options = await resp.json();

      // 2. Pass options to browser authenticator
      const attResp = await startAuthentication(options);

      // 3. Send response back to server for verification
      const verificationResp = await fetch('/api/auth/webauthn/verify-authentication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      });

      const verificationResult = await verificationResp.json();
      if (verificationResult.verified) {
        const role = verificationResult.user.role;
        if (role === 'admin') router.push('/dashboard');
        else if (role === 'staff') router.push('/staff-portal');
        else router.push(source === 'walkin' ? '/?source=walkin' : '/');
      } else {
        alert(verificationResult.error || 'Failed to authenticate.');
      }
    } catch (error) {
      console.error(error);
      alert('Biometric login failed. Please ensure you have registered a passkey for this device.');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1 className={styles.title}>Rishi Hairstyles</h1>
        <p className={styles.tagline}>Your Beauty, Our Priority</p>
        <div className={styles.heroImageWrapper}>
          <img src="/images/barber-login.jpg" alt="Barber Cutting Hair" className={styles.heroImage} />
        </div>
      </div>

      <div className={styles.formContainer}>
        {source === 'walkin' && (
          <div style={{ background: 'rgba(201, 168, 76, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '12px', marginBottom: '1.5rem', textAlign: 'center', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
            <strong>Welcome Walk-in!</strong> Log in to secure your slot instantly.
          </div>
        )}
      
        {needsNameForm ? (
          <form className={styles.form} onSubmit={handleNameSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--text)' }}>
              <h3>Welcome to Rishi Hairstyles!</h3>
              <p style={{ color: 'var(--text-muted)' }}>What should we call you?</p>
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.inputGroup}>
              <input
                type="text"
                className={styles.input}
                placeholder="Your Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: '100%', paddingLeft: '1rem' }}
              />
            </div>
            <button type="submit" className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Saving...' : 'Enter Salon'}
            </button>
          </form>
        ) : (
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

          <button type="submit" className={styles.btnPrimary} disabled={isPending}>
            {isPending ? 'Authenticating...' : (source === 'walkin' ? 'Continue to Book' : 'Continue')}
          </button>
        </form>
        )} 
        {!needsNameForm && (
          <>
            <div className={styles.divider}>
              <span>or log in instantly with</span>
            </div>

            <button type="button" className={styles.btnGoogle} onClick={handleBiometricLogin}>
              <Fingerprint size={20} />
              <span>Use Passkey / Biometrics</span>
            </button>
          </>
        )}

        <p className={styles.footerText}>
          By continuing, you agree to our <a href="#" className={styles.footerLink}>Terms</a> & <a href="#" className={styles.footerLink}>Privacy Policy</a>
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
