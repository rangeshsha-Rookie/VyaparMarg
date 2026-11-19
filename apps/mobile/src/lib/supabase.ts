import { createClient } from "@supabase/supabase-js";

const url =
  (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
  "https://jikdtvhcztvxmvydznxa.supabase.co";
const key =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  "sb_publishable_hiMK8Xb-OTtF7KhgEaZSCQ_Mqx1KDRt";

export const supabase = createClient(url, key);

