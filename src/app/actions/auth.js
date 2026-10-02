'use server';

import { supabaseAdmin } from '@/lib/supabase';
import { createSession, deleteSession } from '@/lib/session';
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
    return { success: true, role: user.role };

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
    return { success: true, role: newUser.role };
  }
}

export async function logout() {
  await deleteSession();
}
