// ----------- header.js --------------

// Make sure Supabase client exists
let supabaseClient = null;

document.addEventListener("DOMContentLoaded", () => {
  // Try both possible exports
  if (window.supabase) supabaseClient = window.supabase;
  if (window.supabaseClient) supabaseClient = window.supabaseClient;
});

// Wait for header.html to finish loading
document.addEventListener("header:loaded", async () => {
  console.log("Header loaded, initializing auth button...");

  const btn = document.getElementById("sellerAuthBtn");
  if (!btn) {
    console.error("sellerAuthBtn NOT FOUND in header!");
    return;
  }

  if (!supabaseClient) {
    console.error("Supabase client missing.");
    return;
  }

  // Set button actions
  btn.addEventListener("click", async () => {
    // If logout mode
    if (btn.classList.contains("logout")) {
      await supabaseClient.auth.signOut();
      window.location.reload();
      return;
    }

    // If login mode
    window.location.href = "login.html";
  });

  // Check initial user state
  const { data } = await supabaseClient.auth.getUser();

  if (data?.user) {
    setLoggedIn(btn);
  } else {
    setLoggedOut(btn);
  }

  // React to login/logout events
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      setLoggedIn(btn);
    } else {
      setLoggedOut(btn);
    }
  });
});

// Functions for button UI
function setLoggedIn(btn) {
  btn.textContent = "Logout";
  btn.classList.add("logout");   // Turns button RED
}

function setLoggedOut(btn) {
  btn.textContent = "Seller Login";
  btn.classList.remove("logout");  // Turns button BLUE
}
