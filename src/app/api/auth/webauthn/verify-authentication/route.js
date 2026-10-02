import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { supabaseAdmin } from '@/lib/supabase';
import { rpID, expectedOrigin, getChallenge, clearChallenge } from '@/lib/webauthn';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createToken } from '@/lib/jwt'; // Assumes you have a JWT utility or similar session maker
// We will also import createSession if needed. Let's adapt based on existing auth.
import { createSession } from '@/lib/session';

export async function POST(request) {
  try {
    const body = await request.json();
    const expectedChallenge = await getChallenge();

    if (!expectedChallenge) {
      return NextResponse.json({ error: 'Session expired. Please try again.' }, { status: 400 });
    }

    // The user sends back their credential ID
    const credentialID = Buffer.from(body.id, 'base64url').toString('base64url');

    // Look up the credential in our DB
    const { data: passkey, error } = await supabaseAdmin
      .from('passkeys')
      .select('*, users(*)')
      .eq('credential_id', credentialID)
      .single();

    if (error || !passkey) {
      return NextResponse.json({ error: 'Passkey not found in our records.' }, { status: 404 });
    }

    const authenticator = {
      credentialPublicKey: Buffer.from(passkey.public_key, 'base64url'),
      credentialID: Buffer.from(passkey.credential_id, 'base64url'),
      counter: passkey.counter,
      transports: JSON.parse(passkey.transports || '[]')
    };

    let verification;
    try {
      verification = await verifyAuthenticationResponse({
        response: body,
        expectedChallenge,
        expectedOrigin,
        expectedRPID: rpID,
        authenticator,
      });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const { verified, authenticationInfo } = verification;

    if (verified) {
      // Update the authenticator's counter in the DB to prevent replay attacks
      await supabaseAdmin
        .from('passkeys')
        .update({ counter: authenticationInfo.newCounter })
        .eq('id', passkey.id);

      await clearChallenge();

      // LOG THE USER IN
      const user = passkey.users;
      await createSession(user.id, user.role);

      return NextResponse.json({ 
        verified: true, 
        user: { id: user.id, role: user.role, name: user.full_name } 
      });
    }

    return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
