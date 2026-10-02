import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabase';
import { rpName, rpID, setChallenge } from '@/lib/webauthn';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user details to use in webauthn options
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get any existing passkeys for this user so we can exclude them
    const { data: existingKeys } = await supabaseAdmin
      .from('passkeys')
      .select('credential_id')
      .eq('user_id', user.id);

    const excludeCredentials = (existingKeys || []).map(key => ({
      id: Buffer.from(key.credential_id, 'base64'),
      type: 'public-key',
    }));

    // Generate options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new Uint8Array(Buffer.from(user.id)), // Must be Uint8Array
      userName: user.phone_number || user.full_name || 'User',
      // Don't prompt users for their authenticator if they've already registered it
      excludeCredentials,
      authenticatorSelection: {
        // "platform" means device-bound (FaceID/TouchID)
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
    });

    // Save challenge in a cookie
    await setChallenge(options.challenge);

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
