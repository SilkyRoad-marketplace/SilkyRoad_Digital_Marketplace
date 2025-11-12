// js/dashboard-auth.js

// Wait for Supabase and DOM to load
document.addEventListener("DOMContentLoaded", async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const welcome = document.getElementById("welcome-message");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!session) {
    // Not logged in → redirect to login.html
    window.location.href = "login.html";
    return;
  }

  // Logged in → show user info
  const userEmail = session.user.email;
  welcome.textContent = `👋 Welcome, ${userEmail}`;
  
  // Handle logout
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    alert("You have been logged out.");
    window.location.href = "login.html";
  });
});
