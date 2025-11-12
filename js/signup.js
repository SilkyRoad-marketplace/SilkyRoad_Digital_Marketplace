// js/signup.js

document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("message");

  message.textContent = "Creating your account...";

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) throw error;

    message.style.color = "green";
    message.textContent = "✅ Signup successful! Please check your email to verify your account before logging in.";
    document.getElementById("signup-form").reset();
  } catch (err) {
    message.style.color = "red";
    message.textContent = "❌ Error: " + err.message;
  }
});
