require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('Starting seed process...');

  // 1. Users
  console.log('Upserting users...');
  const { data: adminUser } = await supabase.from('users').upsert({
    id: 'a0000000-0000-0000-0000-000000000001',
    full_name: 'Admin User',
    phone_number: '+919999999999',
    role: 'admin'
  }).select().single();

  const { data: customerUser } = await supabase.from('users').upsert({
    id: 'c0000000-0000-0000-0000-000000000001',
    full_name: 'Priya Sharma',
    phone_number: '+918888888888',
    role: 'customer'
  }).select().single();

  // 2. Services
  console.log('Upserting services...');
  const services = [
    { name: 'Hair Spa Premium', category: 'Hair', price: 1499, duration_minutes: 90 },
    { name: 'Classic Haircut', category: 'Hair', price: 399, duration_minutes: 30 },
    { name: 'Manicure Deluxe', category: 'Nails', price: 799, duration_minutes: 60 },
    { name: 'Beard Grooming', category: 'Hair', price: 299, duration_minutes: 20 },
    { name: 'Deep Cleansing Facial', category: 'Spa', price: 999, duration_minutes: 45 }
  ];
  
  for (const s of services) {
    await supabase.from('services').upsert(s, { onConflict: 'name' });
  }

  const { data: insertedServices } = await supabase.from('services').select('*');

  // 3. Staff
  console.log('Upserting staff...');
  const staffMembers = [
    { name: 'Rahul Verma', speciality: 'Hair Coloring', is_active: true },
    { name: 'Sneha Gupta', speciality: 'Facials & Spa', is_active: true },
    { name: 'Amit Kumar', speciality: 'Men Grooming', is_active: true }
  ];
  
  // Since staff table doesn't have a unique constraint on name, we just delete existing and insert
  await supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // clear table
  await supabase.from('staff').insert(staffMembers);
  const { data: insertedStaff } = await supabase.from('staff').select('*');

  // 4. Products
  console.log('Upserting products...');
  const products = [
    { name: 'Argan Oil Shampoo', brand: 'L\'Oreal', category: 'Hair Care', price: 599, original_price: 799, stock_quantity: 15, min_stock_level: 5, image_url: '🧴', is_available: true },
    { name: 'Keratin Hair Serum', brand: 'TRESemme', category: 'Styling', price: 899, original_price: 999, stock_quantity: 8, min_stock_level: 3, image_url: '💧', is_available: true },
    { name: 'Face Wash Charcoal', brand: 'Garnier', category: 'Skin Care', price: 299, original_price: 349, stock_quantity: 20, min_stock_level: 5, image_url: '🧼', is_available: true }
  ];

  for (const p of products) {
    await supabase.from('products').upsert(p, { onConflict: 'name' });
  }

  // 5. Appointments
  console.log('Creating mock appointments...');
  if (insertedServices && insertedStaff) {
    const today = new Date().toISOString().split('T')[0];
    const appointments = [
      { customer_id: customerUser.id, service_id: insertedServices[0].id, staff_id: insertedStaff[0].id, appointment_date: today, start_time: '10:00:00', status: 'confirmed', total_amount: insertedServices[0].price, payment_status: 'paid' },
      { customer_id: customerUser.id, service_id: insertedServices[1].id, staff_id: insertedStaff[2].id, appointment_date: today, start_time: '14:30:00', status: 'pending', total_amount: insertedServices[1].price, payment_status: 'pending' },
    ];
    await supabase.from('appointments').insert(appointments);
  }

  console.log('Database seeded successfully with mock data!');
  process.exit(0);
}

seed();
