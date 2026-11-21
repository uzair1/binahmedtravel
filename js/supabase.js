
const SUPABASE_URL = "https://rgaidgsnqdqnordrotgb.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qJhb0-JbPhTjjk-M8FZgaQ_UDzH-v4B";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
