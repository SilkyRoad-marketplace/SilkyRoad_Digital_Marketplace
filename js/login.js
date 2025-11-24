/* -------------------------------------------------------
   IMPORT SUPABASE CLIENT
------------------------------------------------------- */
import { supabase } from "./supabase-config.js";

/* -------------------------------------------------------
   REDIRECT IF USER IS ALREADY LOGGED IN
------------------------------------------------------- */
supabase.auth.getSession().then(({ data }) => {
  const hash = window.location.hash;

  // If user is coming from password recovery link, do NOT redirect
  if (hash && hash.includes("type=recovery")) return;

  // Already logged in
  if (data.session) {
    window.location.href = "dashboard.html";
  }
});

/* -------------------------------------------------------
   DOM ELEMENTS
------------------------------------------------------- */
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupBtn = document.getElementById("signupBtn");
const signupMessage = document.getElementById("signupMessage");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");
const googleBtn = document.getElementById("googleBtn");
const forgotBtn = document.getElementById("forgotBtn");

const toggleSignupPw = document.getElementById("toggleSignupPw");
const toggleLoginPw = document.getElementById("toggleLoginPw");
const pwStrength = document.getElementById("pwStrength");

/* -------------------------------------------------------
   PASSWORD TOGGLE
------------------------------------------------------- */
if (toggleSignupPw) {
  toggleSignupPw.onclick = () => {
    if (signupPassword.type === "password") {
      signupPassword.type = "text";
      toggleSignupPw.textContent = "🙈";
    } else {
      signupPassword.type = "password";
      toggleSignupPw.textContent = "👁️";
    }
  };
}

if (toggleLoginPw) {
  toggleLoginPw.onclick = () => {
    if (loginPassword.type === "password") {
      loginPassword.type = "text";
      toggleLoginPw.textContent = "🙈";
    } else {
      loginPassword.type = "password";
      toggleLoginPw.textContent = "👁️";
    }
  };
}

/* -------------------------------------------------------
   PASSWORD STRENGTH CHECKER
------------------------------------------------------- */
if (signupPassword) {
  signupPassword.addEventListener("input", () => {
    const pw = signupPassword.value.trim();
    if (!pw) {
      pwStrength.textContent = "";
      return;
    }

    let score = 0;
    if (pw.length >= 8) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;

    if (score <= 1) {
      pwStrength.textContent = "Weak password";
      pwStrength.style.color = "#d00";
    } else if (score === 2) {
      pwStrength.textContent = "Medium strength";
      pwStrength.style.color = "#e69500";
    } else {
      pwStrength.textContent = "Strong password";
      pwStrength.style.color = "#089600";
    }
  });
}

/* -------------------------------------------------------
   SIGN UP LOGIC
------------------------------------------------------- */
if (signupBtn) {
  signupBtn.onclick = async () => {
    const first = firstName.value.trim();
    const last = lastName.value.trim();
    const email = signupEmail.value.trim();
    const pwd = signupPassword.value.trim();
    const msg = signupMessage;

    if (!first || !last) {
      msg.textContent = "First and last name required.";
      msg.className = "error-text";
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password: pwd,
      options: {
        data: { first_name: first, last_name: last },
        emailRedirectTo: "https://silkyroad.vercel.app/verified.html",
      },
    });

    if (error) {
      msg.textContent = error.message;
      msg.className = "error-text";
    } else {
      msg.textContent = "Success! Please check your email to confirm.";
      msg.className = "success-text";
    }
  };
}

/* -------------------------------------------------------
   LOGIN WITH EMAIL & PASSWORD
------------------------------------------------------- */
if (loginBtn) {
  loginBtn.onclick = async () => {
    const email = loginEmail.value.trim();
    const pwd = loginPassword.value.trim();
    const msg = loginMessage;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    });

    if (error) {
      msg.textContent = "Invalid email or password.";
      msg.className = "error-text";
    } else {
      window.location.href = "dashboard.html";
    }
  };
}

/* -------------------------------------------------------
   GOOGLE LOGIN
------------------------------------------------------- */
if (googleBtn) {
  googleBtn.onclick = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard.html",
      },
    });
  };
}

/* -------------------------------------------------------
   RESET PASSWORD EMAIL
------------------------------------------------------- */
if (forgotBtn) {
  forgotBtn.onclick = async () => {
    const email = loginEmail.value.trim();
    const msg = loginMessage;

    if (!email) {
      msg.textContent = "Enter your email first.";
      msg.className = "error-text";
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://silkyroad.vercel.app/reset.html",
    });

    msg.textContent = error ? "Error sending reset email." : "Reset link sent!";
    msg.className = error ? "error-text" : "success-text";
  };
}
