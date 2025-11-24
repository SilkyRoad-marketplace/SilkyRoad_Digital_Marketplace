// js/login.js
import { supabase } from "./supabase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#login-form");
  const errorBox = document.querySelector("#login-error");
  const googleBtn = document.querySelector("#google-signin");

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.style.display = "block";
  }

  // Email + password sign in
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (errorBox) {
        errorBox.textContent = "";
        errorBox.style.display = "none";
      }

      const email = form.email.value.trim();
      const password = form.password.value;

      if (!email || !password) {
        showError("Please enter both email and password.");
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        showError(error.message || "Login failed. Please try again.");
        return;
      }

      // Login OK → go to dashboard
      window.location.href = "/dashboard.html";
    });
  }

  // Google sign in
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      if (errorBox) {
        errorBox.textContent = "";
        errorBox.style.display = "none";
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://silkyroad.vercel.app/verified.html",
        },
      });

      if (error) {
        showError(error.message || "Google sign-in failed. Please try again.");
      }
    });
  }
});
