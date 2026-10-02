import fs from 'fs';

const actionsPath = 'src/app/actions/data.js';
let content = fs.readFileSync(actionsPath, 'utf8');

const newActions = `
// ==========================================
// OFFERS MANAGEMENT ACTIONS
// ==========================================

export async function getAllOffers() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return [];

  const { data, error } = await supabaseAdmin
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all offers:', error);
    return [];
  }
  return data || [];
}

export async function toggleOfferStatus(id, currentStatus) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('offers')
    .update({ is_active: !currentStatus })
    .eq('id', id);

  if (error) {
    console.error('Error toggling offer:', error);
    return { error: 'Failed to update offer' };
  }
  return { success: true };
}

export async function deleteOffer(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('offers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting offer:', error);
    return { error: 'Failed to delete offer' };
  }
  return { success: true };
}
`;

fs.writeFileSync(actionsPath, content + newActions);
