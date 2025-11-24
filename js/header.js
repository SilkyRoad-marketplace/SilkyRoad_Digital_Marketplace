import { supabase } from "/js/supabase-config.js";

const btn = document.getElementById("sellerAuthBtn");

// On load — check session
supabase.auth.getSession().then(({ data }) => {
  updateButton(data.session);
});

// Listen for login/logout changes globally
supabase.auth.onAuthStateChange((event, session) => {
  updateButton(session);
});

// Update button based on session
function updateButton(session) {
  if (session && session.user) {
    // Logged in
    btn.textContent = "Logout";
    btn.classList.add("logout-btn");

    btn.onclick = async () => {
      await supabase.auth.signOut();
      window.location.href = "login.html";
    };

  } else {
    // Logged out
    btn.textContent = "Seller Login";
    btn.classList.remove("logout-btn");

    btn.onclick = () => {
      window.location.href = "login.html";
    };
  }
}
