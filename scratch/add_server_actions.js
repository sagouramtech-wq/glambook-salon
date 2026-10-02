import fs from 'fs';
import path from 'path';

const actionsPath = 'src/app/actions/data.js';
let content = fs.readFileSync(actionsPath, 'utf8');

const newActions = `
// ==========================================
// ATTENDANCE & LEAVES (STAFF PORTAL & ADMIN)
// ==========================================

export async function submitLeaveRequest(startDate, endDate, reason) {
  const session = await getSession();
  if (!session || session.role !== 'staff') return { error: 'Not authorized' };

  // Need to get the staff's ID based on their phone number in the users table
  // Since session.userId is the users.id, we lookup staff by phone
  const { data: user } = await supabaseAdmin.from('users').select('phone_number').eq('id', session.userId).single();
  if (!user) return { error: 'User not found' };

  const { data: staff } = await supabaseAdmin.from('staff').select('id').eq('phone', user.phone_number).single();
  if (!staff) return { error: 'Staff profile not found' };

  const { error } = await supabaseAdmin
    .from('staff_leaves')
    .insert([{
      staff_id: staff.id,
      start_date: startDate,
      end_date: endDate,
      reason: reason,
      status: 'pending'
    }]);

  if (error) {
    console.error('Error submitting leave:', error);
    return { error: 'Failed to submit leave request' };
  }
  return { success: true };
}

export async function getStaffLeaves() {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { data, error } = await supabaseAdmin
    .from('staff_leaves')
    .select(\`
      *,
      staff (
        name,
        phone
      )
    \`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leaves:', error);
    return [];
  }
  return data || [];
}

export async function updateLeaveStatus(leaveId, status) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { error } = await supabaseAdmin
    .from('staff_leaves')
    .update({ status })
    .eq('id', leaveId);

  if (error) {
    console.error('Error updating leave:', error);
    return { error: 'Failed to update leave status' };
  }
  return { success: true };
}

export async function getStaffAttendance(dateStr) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  const { data, error } = await supabaseAdmin
    .from('staff_attendance')
    .select('*')
    .eq('date', dateStr);

  if (error) {
    console.error('Error fetching attendance:', error);
    return [];
  }
  return data || [];
}

export async function markAttendance(staffId, dateStr, status, checkInTime) {
  const session = await getSession();
  if (!session || session.role !== 'admin') return { error: 'Not authorized' };

  // Use UPSERT (on conflict)
  const { error } = await supabaseAdmin
    .from('staff_attendance')
    .upsert({
      staff_id: staffId,
      date: dateStr,
      status: status,
      check_in_time: checkInTime || null
    }, { onConflict: 'staff_id, date' });

  if (error) {
    console.error('Error marking attendance:', error);
    return { error: 'Failed to mark attendance' };
  }
  return { success: true };
}
`;

fs.writeFileSync(actionsPath, content + newActions);
