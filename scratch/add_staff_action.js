import fs from 'fs';
import path from 'path';

const actionsPath = 'src/app/actions/data.js';
let content = fs.readFileSync(actionsPath, 'utf8');

const addStaffAction = `
export async function addStaff(name, speciality, phone) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  // Insert into staff table
  const { data, error } = await supabaseAdmin
    .from('staff')
    .insert([
      { name, speciality, phone, is_active: true }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error adding staff:', error);
    return { error: 'Failed to add staff member' };
  }

  // Generate a random referral code
  const referralCode = 'GLAM-' + name.substring(0,3).toUpperCase() + '-' + Math.floor(Math.random() * 1000);
  await supabaseAdmin.from('staff').update({ referral_code: referralCode }).eq('id', data.id);

  return { success: true, staff: data };
}
`;

fs.writeFileSync(actionsPath, content + addStaffAction);
