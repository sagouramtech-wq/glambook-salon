import fs from 'fs';
import path from 'path';

const actionsPath = 'src/app/actions/data.js';
let content = fs.readFileSync(actionsPath, 'utf8');

const newActions = `
// ==========================================
// OFFERS & NOTIFICATIONS (QUICK ACTIONS)
// ==========================================

export async function addOffer(title) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('offers')
    .insert([{ title, is_active: true }]);

  if (error) {
    console.error('Error adding offer:', error);
    return { error: 'Failed to add offer' };
  }
  return { success: true };
}

export async function getActiveOffers() {
  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching offers:', error);
    return [];
  }
  return data || [];
}

export async function addNotification(message) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('notifications')
    .insert([{ message }]);

  if (error) {
    console.error('Error adding notification:', error);
    return { error: 'Failed to send notification' };
  }
  return { success: true };
}

export async function getNotifications() {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
  return data || [];
}
`;

fs.writeFileSync(actionsPath, content + newActions);
