// js/dashboard-auth.js

document.addEventListener("DOMContentLoaded", async () => {
  // Get current session
  const { data: { session } } = await supabase.auth.getSession();
  const welcome = document.getElementById("welcome-message");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!session) {
    window.location.href = "login.html";
    return;
  }

  const user = session.user;
  welcome.textContent = `👋 Welcome, ${user.email}`;

  logoutBtn.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "login.html";
  });

  // Dynamic sub-category options
  const subCategories = {
    "Educational": ["eBooks", "Online Courses", "Worksheets", "Tutorials", "Digital Workbooks"],
    "Creative Assets": ["Stock Photos", "Videos", "Music / Audio Tracks", "Sound Effects", "Digital Art", "Fonts", "Brushes", "Lightroom Presets", "3D Models", "UI Kits", "Website Themes"],
    "Productivity": ["Planners", "Journals", "Social Media Packs", "Business Templates", "Spreadsheets", "Notion Templates"],
    "Templates": ["Canva Templates", "Website Themes", "Digital Stickers", "Printable Games", "Craft Patterns", "Email Templates"]
  };

  const categorySelect = document.getElementById("product-category");
  const subCategorySelect = document.getElementById("product-sub-category");

  categorySelect.addEventListener("change", () => {
    const selectedCategory = categorySelect.value;
    subCategorySelect.innerHTML = '<option value="">Select Sub-Category</option>';
    if(subCategories[selectedCategory]){
      subCategories[selectedCategory].forEach(sub => {
        const option = document.createElement("option");
        option.value = sub;
        option.textContent = sub;
        subCategorySelect.appendChild(option);
      });
    }
  });

  const uploadForm = document.getElementById("upload-form");
  const statusText = document.getElementById("upload-status");
  const bucketName = "seller-uploads";

  // Handle product upload
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("product-title").value;
    const category = categorySelect.value;
    const sub_category = subCategorySelect.value;
    const price = parseFloat(document.getElementById("product-price").value) || 0;
    const file = document.getElementById("product-file").files[0];

    if (!category) {
      alert("Please select a category.");
      return;
    }
    if (!sub_category) {
      alert("Please select a sub-category.");
      return;
    }

    const filePath = `${user.id}/${file.name}`;

    // Upload file to Supabase Storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: false });

    if (fileError) {
      console.error("Upload error:", fileError.message);
      statusText.textContent = `Upload failed: ${fileError.message}`;
      return;
    }

    // Insert product row into Supabase table
    const { data, error } = await supabase
      .from("products")
      .insert([{
        title,
        filename: file.name,
        bucket: bucketName,
        seller_id: user.id,
        price,
        category,
        sub_category,
        created_at: new Date()
      }]);

    if (error) {
      console.error("Insert error:", error.message);
      statusText.textContent = `Failed to save product: ${error.message}`;
    } else {
      console.log("Product uploaded:", data);
      statusText.textContent = "Product uploaded successfully!";
      uploadForm.reset();
      subCategorySelect.innerHTML = '<option value="">Select Sub-Category</option>'; // Reset sub-category
    }
  });
});
