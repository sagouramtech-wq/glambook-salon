import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { rpID, expectedOrigin, getChallenge, clearChallenge } from '@/lib/webauthn';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const expectedChallenge = await getChallenge();

    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Session expired. Please try again.' }, { status: 400 });
    }

    let verification;
    try {
      verification = await verifyRegistrationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
      const { credentialPublicKey, credentialID, counter, credentialDeviceType, credentialBackedUp } = registrationInfo;

      // Base64Url encode values for database storage
      const encodedCredentialID = Buffer.from(credentialID).toString('base64url');
      const encodedPublicKey = Buffer.from(credentialPublicKey).toString('base64url');

      // Save the passkey to Supabase
      const { error } = await supabaseAdmin
        .from('passkeys')
        .insert({
          user_id: session.userId,
          webauthn_user_id: session.userId, // We used user.id as userID during generate
          credential_id: encodedCredentialID,
          public_key: encodedPublicKey,
          counter,
          device_type: credentialDeviceType,
          backed_up: credentialBackedUp,
          transports: JSON.stringify(body.response.transports || [])
        });

      if (error) {
        throw error;
      }

      await clearChallenge();
      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  } catch (error) {
    console.error('Error verifying registration:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
