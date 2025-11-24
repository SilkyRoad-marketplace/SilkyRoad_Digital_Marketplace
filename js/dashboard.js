import { supabase } from "./supabase-config.js";

// Check if user is logged in
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    window.location.href = "login.html";
  }
});

// LOG OUT BUTTON
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.onclick = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = "login.html";
    } else {
      alert("Logout failed: " + error.message);
    }
  };
}
