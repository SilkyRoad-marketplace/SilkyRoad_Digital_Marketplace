// js/dashboard-auth.js

document.addEventListener("DOMContentLoaded", async () => {
  // Wait for Supabase session
  const { data: { session } } = await supabase.auth.getSession();
  const welcome = document.getElementById("welcome-message");
  const logoutBtn = document.getElementById("logoutBtn");
  const uploadForm = document.getElementById("upload-form");
  const uploadStatus = document.getElementById("upload-status");
  const sellerProducts = document.getElementById("seller-products");
  const bucketName = "seller-uploads";

  // ✅ Redirect if not logged in
  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.user;
  welcome.textContent = `👋 Welcome, ${user.email}`;

  // ✅ Handle logout
  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    alert("You have been logged out.");
    window.location.href = "login.html";
  });

  // ✅ Handle file upload
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    uploadStatus.textContent = "⏳ Uploading... please wait";

    const fileInput = document.getElementById("product-file");
    const titleInput = document.getElementById("product-title");
    const priceInput = document.getElementById("product-price");
    const file = fileInput.files[0];

    if (!file) {
      uploadStatus.textContent = "❌ Please select a file to upload.";
      return;
    }

    const filePath = `${user.id}/${file.name}`;

    // ✅ Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error.message);
      uploadStatus.textContent = `❌ Upload failed: ${error.message}`;
      return;
    }

    // ✅ Insert record into products table
    const { error: insertError } = await supabase
      .from("products")
      .insert([{
        title: titleInput.value,
        filename: file.name,
        bucket: bucketName,
        seller_id: user.id,
        price: priceInput.value || 0
      }]);

    if (insertError) {
      console.error("Insert error:", insertError.message);
      uploadStatus.textContent = `⚠️ File uploaded but failed to save product data: ${insertError.message}`;
    } else {
      uploadStatus.textContent = "✅ Upload successful!";
      fileInput.value = "";
      titleInput.value = "";
      priceInput.value = "";
      loadProducts(); // refresh list
    }
  });

  // ✅ Load seller's uploaded products
  async function loadProducts() {
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Load error:", error.message);
      sellerProducts.textContent = "⚠️ Could not load your products.";
      return;
    }

    if (!products || products.length === 0) {
      sellerProducts.innerHTML = "<p>No products uploaded yet.</p>";
      return;
    }

    sellerProducts.innerHTML = products.map(p => `
      <div class="card">
        <strong>${p.title}</strong><br>
        <small>${p.filename}</small><br>
        <small>💲${p.price}</small><br>
        <small>🕒 ${new Date(p.created_at).toLocaleString()}</small>
      </div>
    `).join("");
  }

  // Load on page start
  loadProducts();
});
