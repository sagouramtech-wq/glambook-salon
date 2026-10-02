import fs from 'fs';

const actionsPath = 'src/app/actions/data.js';
let content = fs.readFileSync(actionsPath, 'utf8');

const newActions = `
// ==========================================
// INVENTORY / PRODUCTS ACTIONS
// ==========================================

export async function getAllProducts() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data || [];
}

export async function getAvailableProducts() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('is_available', true)
    .gt('stock_quantity', 0)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching available products:', error);
    return [];
  }
  return data || [];
}

export async function addProduct(productData) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('products')
    .insert([productData]);

  if (error) {
    console.error('Error adding product:', error);
    return { error: 'Failed to add product' };
  }
  return { success: true };
}

export async function toggleProductAvailability(id, currentStatus) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('products')
    .update({ is_available: !currentStatus })
    .eq('id', id);

  if (error) {
    console.error('Error toggling product:', error);
    return { error: 'Failed to update product' };
  }
  return { success: true };
}

export async function deleteProduct(id) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    return { error: 'Failed to delete product' };
  }
  return { success: true };
}
`;

fs.writeFileSync(actionsPath, content + newActions);
