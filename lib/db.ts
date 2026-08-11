import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

if (!url || !key) {
  throw new Error(
    "Missing env vars: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (ver .env.example)"
  );
}

// Solo se usa desde el servidor (service role). Nunca importar desde client.
export const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});