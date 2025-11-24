// js/forgot.js
import { supabase } from "./supabase-config.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("#forgot-form");
  const errorBox = document.querySelector("#forgot-error");
  const messageBox = document.querySelector("#forgot-message");

  function showError(msg) {
    if (!errorBox) return;
    errorBox.textContent = msg;
    errorBox.style.display = "block";
  }

  function showMessage(msg) {
    if (!messageBox) return;
    messageBox.textContent = msg;
    messageBox.style.display = "block";
  }

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorBox) {
      errorBox.textContent = "";
      errorBox.style.display = "none";
    }
    if (messageBox) {
      messageBox.textContent = "";
      messageBox.style.display = "none";
    }

    const email = form.email.value.trim();
    if (!email) {
      showError("Please enter your email.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://silkyroad.vercel.app/reset.html",
    });

    if (error) {
      showError(error.message || "Error sending reset email.");
      return;
    }

    showMessage("Reset email sent. Please check your inbox.");
  });
});
