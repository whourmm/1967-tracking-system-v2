import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL ?? "https://placeholder.supabase.co";
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "placeholder";

export const supabase = createClient(supabaseURL, publishableKey);
