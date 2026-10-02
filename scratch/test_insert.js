require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const phone = '9133636966';
  console.log("Checking user...");
  const { data: user, error } = await supabase.from('users').select('*').eq('phone_number', phone).single();
  console.log("User:", user, "Error:", error);
  
  if (!user) {
    console.log("Inserting...");
    const { data: newUser, error: insertError } = await supabase.from('users').insert([{ phone_number: phone, password_hash: 'test', role: 'customer' }]).select().single();
    console.log("NewUser:", newUser, "Error:", insertError);
  }
}
run();
