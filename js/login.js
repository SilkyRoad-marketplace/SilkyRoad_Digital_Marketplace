// js/login.js

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("message");

  message.textContent = "Logging in...";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    message.style.color = "green";
    message.textContent = "✅ Login successful! Redirecting to dashboard...";

    // Redirect to dashboard after a short delay
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } catch (err) {
    message.style.color = "red";
    message.textContent = "❌ " + err.message;
  }
});
