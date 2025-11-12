// Configure these with your Supabase project details
const SUPABASE_URL = "https://paqvgsruppgadgguynde.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcXZnc3J1cHBnYWRnZ3V5bmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTg3NTMsImV4cCI6MjA3NzkzNDc1M30.pwEE4WLFu2-tHkmH1fFYYwcEPmLPyavN7ykXdPGQ3AY";
// Optional: if you use a custom auth/signup URL (or OAuth redirect), set here
const SUPABASE_AUTH_URL = "https://paqvgsruppgadgguynde.supabase.co/auth/v1";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
