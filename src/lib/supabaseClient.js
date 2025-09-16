import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  console.error('Supabase env faltando:', { hasUrl: !!url, hasAnon: !!anon });
  throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não configuradas');
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'zapfollow.auth',
   },
});
