'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Camera, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './tryon.module.css';

const STYLES = [
  { id: 'hair1', name: 'Fade Buzz', type: 'hair', url: 'https://cdn-icons-png.flaticon.com/512/6287/6287515.png', width: '220px', top: '15%' },
  { id: 'hair2', name: 'Pompadour', type: 'hair', url: 'https://cdn-icons-png.flaticon.com/512/5753/5753512.png', width: '200px', top: '10%' },
  { id: 'beard1', name: 'Full Beard', type: 'beard', url: 'https://cdn-icons-png.flaticon.com/512/3233/3233515.png', width: '240px', top: '55%' },
  { id: 'beard2', name: 'Goatee', type: 'beard', url: 'https://cdn-icons-png.flaticon.com/512/3233/3233543.png', width: '120px', top: '65%' },
];

export default function TryOnPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('user');

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const handleBookNow = () => {
    stopCamera();
    router.push('/booking');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => { stopCamera(); router.back(); }} className={styles.iconButton}>
          <ArrowLeft size={24} color="#FFF" />
        </button>
        <h1 className={styles.title}>How I Look</h1>
        <button onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')} className={styles.iconButton}>
          <Camera size={24} color="#C9A84C" />
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.cameraWrapper}>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className={styles.video}
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          />
          
          {/* Alignment Guide */}
          <div className={styles.alignmentGuide}>
            <div className={styles.faceOval}></div>
            <p className={styles.guideText}>Align your face in the oval</p>
          </div>

          {/* AR Overlay */}
          {selectedStyle && (
            <img 
              src={selectedStyle.url} 
              alt={selectedStyle.name}
              className={styles.overlayImage}
              style={{
                width: selectedStyle.width,
                top: selectedStyle.top,
              }}
            />
          )}
        </div>

        <div className={styles.controlsArea}>
          <h3 className={styles.controlsTitle}>Select a Style</h3>
          <div className={styles.styleSelector}>
            {STYLES.map(s => (
              <button 
                key={s.id} 
                className={`${styles.styleBtn} ${selectedStyle.id === s.id ? styles.activeStyle : ''}`}
                onClick={() => setSelectedStyle(s)}
              >
                <div className={styles.styleIconWrapper}>
                  <img src={s.url} alt={s.name} className={styles.styleIcon} />
                </div>
                <span>{s.name}</span>
              </button>
            ))}
          </div>
          
          <div className={styles.actionRow}>
            <button className={styles.bookBtn} onClick={handleBookNow}>
              Book This Look
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
