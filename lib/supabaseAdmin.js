import { createClient } from "@supabase/supabase-js";

// Cliente para uso SOMENTE no servidor (API routes) — usa a secret key,
// que dá acesso privilegiado ignorando o RLS. Nunca importe este arquivo
// em componentes que rodam no navegador.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
