import fs from 'fs';

const actionsPath = 'src/app/actions/data.js';
let content = fs.readFileSync(actionsPath, 'utf8');

const newAction = `
// ==========================================
// BOOKING ACTIONS
// ==========================================

export async function bookWalkinAppointment(serviceId) {
  const session = await getSession();
  if (!session) return { error: 'Not authorized' };

  // For walk-ins, just book for the current time
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  const { error } = await supabaseAdmin
    .from('appointments')
    .insert([{ 
      customer_id: session.userId,
      service_id: serviceId,
      date: dateStr,
      start_time: timeStr,
      status: 'confirmed'
    }]);

  if (error) {
    console.error('Error booking walk-in:', error);
    return { error: 'Failed to secure instant booking' };
  }
  return { success: true };
}
`;

fs.writeFileSync(actionsPath, content + newAction);
