const fs = require('fs');
let code = fs.readFileSync('src/app/actions/auth.js', 'utf8');

if (!code.includes('updateUserName')) {
  code = code.replace(/import \{ createSession, deleteSession \} from '@\/lib\/session';/, "import { createSession, deleteSession } from '@/lib/session';\nimport { cookies } from 'next/headers';\nimport { jwtVerify } from 'jose';\nconst secretKey = process.env.SESSION_SECRET || 'fallback_secret_for_development_only_123!';\nconst encodedKey = new TextEncoder().encode(secretKey);");

  code += `
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
`;
  fs.writeFileSync('src/app/actions/auth.js', code);
}
