// js/supabaseClient.js
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseAnon = "YOUR_SUPABASE_ANON_KEY";

const client = createClient(supabaseUrl, supabaseAnon);

// Make sure ALL scripts can find it
window.supabase = client;
window.supabaseClient = client;

export default client;
