import { createClient } from "@supabase/supabase-js";

// Cliente para uso no navegador — usa a chave publishable (pública, segura de expor)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
