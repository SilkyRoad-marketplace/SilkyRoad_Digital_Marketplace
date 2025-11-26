import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✔ Correct Supabase Project URL
const supabase = createClient(
  "https://paqvgsruppgadgguynde.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhcXZnc3J1cHBnYWRnZ3V5bmRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTg3NTMsImV4cCI6MjA3NzkzNDc1M30.pwEE4WLFu2-tHkmH1fFYYwcEPmLPyavN7ykXdPGQ3AY"
);

async function updateHeader() {
  const { data: { user } } = await supabase.auth.getUser();

  const loginBtn = document.getElementById("loginBtn");
  const startBtn = document.getElementById("startSellingBtn");

  if (user) {
    // Change Login → Dashboard
    loginBtn.textContent = "Dashboard";
    loginBtn.href = "/dashboard.html";

    // Change Start Selling → Logout
    startBtn.textContent = "Logout";
    startBtn.href = "#";
    startBtn.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = "/";
    };
  }
}

updateHeader();
);
