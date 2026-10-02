import { generateAuthenticationOptions } from '@simplewebauthn/server';
import { rpID, setChallenge } from '@/lib/webauthn';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate authentication options
    // Since we don't know who is logging in yet (discoverable credentials / passwordless),
    // we don't pass an allowCredentials array here.
    // The device will prompt for any passkeys associated with rpID.
    const options = await generateAuthenticationOptions({
      rpID,
      userVerification: 'required',
    });

    // Save challenge in a cookie
    await setChallenge(options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
