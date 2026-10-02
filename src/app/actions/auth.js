'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { createSession, deleteSession } from '@/lib/session';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
const secretKey = process.env.SESSION_SECRET || 'fallback_secret_for_development_only_123!';
const encodedKey = new TextEncoder().encode(secretKey);
import bcrypt from 'bcryptjs';

export async function loginOrRegister(prevState, formData) {
  const phone = formData.get('phone');
  const password = formData.get('password');

  if (!phone || !password) {
    return { error: 'Phone and password are required.' };
  }

  // 1. Check if user exists
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('phone_number', phone)
    .single();

  if (user) {
    // 2. User exists -> Verify Password
    if (!user.password_hash) {
      return { error: 'Account exists without a password. Please contact support.' };
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return { error: 'Invalid password.' };
    }

    // Success -> Create Session
    await createSession(user.id, user.role);
    return { success: true, role: user.role, needsName: !user.full_name };

  } else {
    // 3. User does not exist -> Register
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if they are a pre-registered staff member
    const { data: staffRec } = await supabaseAdmin
      .from('staff')
      .select('id')
      .eq('phone', phone)
      .single();
    
    // Automatically assign role based on owner phone or staff list
    const assignedRole = phone === '8500393777' ? 'admin' : (staffRec ? 'staff' : 'customer');
    
    const { data: newUser, error: insertError } = await supabaseAdmin
      .from('users')
      .insert([
        { phone_number: phone, password_hash: hashedPassword, role: assignedRole }
      ])
      .select()
      .single();

    if (insertError) {
      console.error(insertError);
      return { error: 'Failed to register account.' };
    }

    // Success -> Create Session
    await createSession(newUser.id, newUser.role);
    return { success: true, role: newUser.role, needsName: true };
  }
}

export async function logout() {
  await deleteSession();
}

export async function updateUserName(formData) {
  const name = formData.get('name');
  if (!name) return { error: 'Name is required' };
  
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  if (!sessionToken) return { error: 'Unauthorized' };
  
  try {
    const { payload } = await jwtVerify(sessionToken, encodedKey, { algorithms: ['HS256'] });
    const { error } = await supabaseAdmin.from('users').update({ full_name: name }).eq('id', payload.userId);
    if (error) return { error: error.message };
    return { success: true };
  } catch (err) {
    return { error: 'Session invalid' };
  }
}
