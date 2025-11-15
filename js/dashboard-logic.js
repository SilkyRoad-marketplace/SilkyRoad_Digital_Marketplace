// dashboard-logic.js
import { supabase } from "./js/supabase-config.js";

/* DOM Elements */
const signupBtn = document.getElementById("signupBtn");
const loginBtn = document.getElementById("loginBtn");
const googleLoginBtn = document.getElementById("googleLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const authSection = document.getElementById("authSection");
const dashboardSection = document.getElementById("dashboardSection");
const authMessage = document.getElementById("authMessage");

const signupFirstName = document.getElementById("signupFirstName");
const signupLastName = document.getElementById("signupLastName");
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");

const profileFirstName = document.getElementById("profileFirstName");
const profileLastName = document.getElementById("profileLastName");
const profileEmail = document.getElementById("profileEmail");
const profilePaypalEmail = document.getElementById("profilePaypalEmail");
const profileMessage = document.getElementById("profileMessage");

const thumbnailInput = document.getElementById("thumbnailInput");
const productTitle = document.getElementById("productTitle");
const productDescription = document.getElementById("productDescription");
const productPrice = document.getElementById("productPrice");
const fileInput = document.getElementById("fileInput");
const externalLink = document.getElementById("externalLink");
const uploadProductBtn = document.getElementById("uploadProductBtn");
const uploadMessage = document.getElementById("uploadMessage");

const productsList = document.getElementById("productsList");
const noProductsMessage = document.getElementById("noProductsMessage");

const totalOrders = document.getElementById("totalOrders");
const totalRevenue = document.getElementById("totalRevenue");
const recentOrdersList = document.getElementById("recentOrdersList");

/* -----------------------------
   1. SIGN UP
--------------------------------*/
signupBtn.addEventListener("click", async () => {
  authMessage.textContent = "";

  if (!signupEmail.value || !signupPassword.value) {
    authMessage.textContent = "Please fill in all fields.";
    return;
  }

  const { data, error } = await supabase.auth.signUp({
    email: signupEmail.value.trim(),
    password: signupPassword.value,
    options: {
      data: {
        first_name: signupFirstName.value.trim(),
        last_name: signupLastName.value.trim()
      },
      emailRedirectTo: window.location.origin + "/verified.html"
    }
  });

  if (error) {
    authMessage.textContent = "Signup error: " + error.message;
  } else {
    authMessage.textContent =
      "Signup successful! Please check your email to confirm.";
  }
});

/* -----------------------------
   2. LOGIN
--------------------------------*/
loginBtn.addEventListener("click", async () => {
  authMessage.textContent = "";

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail.value,
    password: loginPassword.value
  });

  if (error) {
    authMessage.textContent = "Login error: " + error.message;
  } else {
    showDashboard();
  }
});

/* -----------------------------
   3. GOOGLE LOGIN
--------------------------------*/
googleLoginBtn.addEventListener("click", async () => {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/dashboard.html"
    }
  });
});

/* -----------------------------
   4. LOGOUT
--------------------------------*/
logoutBtn.addEventListener("click", async () => {
  await supabase.auth.signOut();
  location.reload();
});

/* -----------------------------
   5. CHECK SESSION
--------------------------------*/
async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) {
    showDashboard();
  }
}
checkSession();

/* -----------------------------
   SHOW DASHBOARD
--------------------------------*/
async function showDashboard() {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  profileEmail.value = user.email;

  loadProfile(user.id);
  loadProducts(user.id);
  loadSales(user.id);
}

/* -----------------------------
   6. LOAD PROFILE
--------------------------------*/
async function loadProfile(user_id) {
  let { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user_id)
    .single();

  if (data) {
    profileFirstName.value = data.first_name || "";
    profileLastName.value = data.last_name || "";
    profilePaypalEmail.value = data.paypal_email || "";
  }
}

/* -----------------------------
   7. SAVE PROFILE
--------------------------------*/
saveProfileBtn.addEventListener("click", async () => {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    first_name: profileFirstName.value.trim(),
    last_name: profileLastName.value.trim(),
    paypal_email: profilePaypalEmail.value.trim()
  });

  profileMessage.textContent = error
    ? "Error saving profile"
    : "Profile saved!";
});

/* -----------------------------
   8. UPLOAD PRODUCT
--------------------------------*/
uploadProductBtn.addEventListener("click", async () => {
  uploadMessage.textContent = "";

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  const user_id = user.id;

  if (!productTitle.value.trim()) {
    uploadMessage.textContent = "Title is required.";
    return;
  }

  // Upload thumbnail (optional)
  let thumbnail_url = null;
  if (thumbnailInput.files.length > 0) {
    const file = thumbnailInput.files[0];
    const path = `thumbnails/${user_id}-${Date.now()}.jpg`;

    const { data, error } = await supabase.storage
      .from("seller-uploads")
      .upload(path, file);

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("seller-uploads")
        .getPublicUrl(path);
      thumbnail_url = urlData.publicUrl;
    }
  }

  // Upload main file (max 10MB)
  let file_url = null;
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];

    if (file.size > 10 * 1024 * 1024) {
      uploadMessage.textContent = "File is too large (max 10MB).";
      return;
    }

    const path = `products/${user_id}-${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("seller-uploads")
      .upload(path, file);

    if (!error) {
      const { data: urlData } = supabase.storage
        .from("seller-uploads")
        .getPublicUrl(path);
      file_url = urlData.publicUrl;
    }
  }

  // Save external link
  const external_url = externalLink.value.trim() || null;

  // Insert product
  const { error } = await supabase.from("products").insert({
    user_id,
    title: productTitle.value.trim(),
    description: productDescription.value.trim(),
    price: productPrice.value,
    thumbnail_url,
    file_url,
    external_url
  });

  uploadMessage.textContent = error
    ? "Error uploading product."
    : "Product uploaded successfully!";

  loadProducts(user_id);
});

/* -----------------------------
   9. LOAD PRODUCTS
--------------------------------*/
async function loadProducts(user_id) {
  let { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  productsList.innerHTML = "";

  if (!data || data.length === 0) {
    noProductsMessage.textContent = "You have no products yet.";
    return;
  }

  noProductsMessage.textContent = "";

  data.forEach((p) => {
    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <img src="${p.thumbnail_url || "placeholder.jpg"}" alt="Thumbnail">
      <h4>${p.title}</h4>
      <p><strong>USD $${p.price}</strong></p>
      <button data-id="${p.id}" class="btn-danger deleteBtn">Delete</button>
    `;

    productsList.appendChild(card);
  });

  // Delete handlers
  document.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;

      await supabase.from("products").delete().eq("id", id);
      loadProducts(user_id);
    });
  });
}

/* -----------------------------
   10. LOAD SALES SUMMARY (simple placeholder)
--------------------------------*/
async function loadSales(user_id) {
  totalOrders.textContent = "0";
  totalRevenue.textContent = "0.00";
  recentOrdersList.innerHTML = "<li>No sales yet.</li>";
}
