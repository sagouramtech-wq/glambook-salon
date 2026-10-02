import { cookies } from 'next/headers';

// RP Configuration
export const rpName = 'Rishi Hairstyles';
// For local dev, rpID is usually 'localhost'. 
// For production, it should be your actual domain (e.g. 'glambook.com')
export const rpID = process.env.NODE_ENV === 'development' ? 'localhost' : process.env.NEXT_PUBLIC_RP_ID || 'localhost'; 
export const expectedOrigin = process.env.NODE_ENV === 'development' 
  ? ['http://localhost:3000', 'http://localhost:3001'] // Allow local testing
  : process.env.NEXT_PUBLIC_ORIGIN || 'https://yourdomain.com';

export async function setChallenge(challenge) {
  const cookieStore = await cookies();
  // Store the challenge in a secure HTTP-only cookie for 5 minutes
  cookieStore.set('webauthn_challenge', challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: 300 // 5 minutes
  });
}

export async function getChallenge() {
  const cookieStore = await cookies();
  return cookieStore.get('webauthn_challenge')?.value;
}

export async function clearChallenge() {
  const cookieStore = await cookies();
  cookieStore.delete('webauthn_challenge');
}
