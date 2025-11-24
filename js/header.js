// /js/header.js
import { supabase } from "/js/supabase-config.js";

const btn = document.getElementById("sellerAuthBtn");

// Page loaded → check current session
supabase.auth.getSession().then(({ data }) => {
  updateButton(data.session);
});

// Detect login / logout changes globally
supabase.auth.onAuthStateChange((_event, session) => {
  updateButton(session);
});

function updateButton(session) {
  if (!btn) return;

  if (session && session.user) {
    // Logged in → show LOGOUT
    btn.textContent = "Logout";
    btn.classList.add("logout");

    btn.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    };

  } else {
    // Logged out → show LOGIN
    btn.textContent = "Seller Login";
    btn.classList.remove("logout");

    btn.onclick = () => {
      window.location.href = "login.html";
    };
  }
}
