import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Message clair plutôt qu'un plantage opaque au premier appel réseau.
  console.error(
    "Variables d'environnement Supabase manquantes. " +
      "Copiez .env.example en .env et renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const FUNCTIONS_URL = url ? `${url}/functions/v1` : "";
