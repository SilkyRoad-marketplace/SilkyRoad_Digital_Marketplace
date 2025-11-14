document.addEventListener("DOMContentLoaded", async () => {
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

  const uploadForm = document.getElementById("upload-form");
  const statusText = document.getElementById("upload-status");
  const bucketName = "seller-uploads";

  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("product-title").value;
    const category = document.getElementById("product-category").value;
    const price = parseFloat(document.getElementById("product-price").value) || 0;
    const file = document.getElementById("product-file").files[0];

    if (!category) {
      alert("Please select a category.");
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

    // Insert product row in Supabase table
    const { data, error } = await supabase
      .from("products")
      .insert([{
        title,
        filename: file.name,
        bucket: bucketName,
        seller_id: user.id,
        price,
        category
      }]);

    if (error) {
      console.error("Insert error:", error.message);
      statusText.textContent = `Failed to save product: ${error.message}`;
    } else {
      console.log("Product uploaded:", data);
      statusText.textContent = "Product uploaded successfully!";
      uploadForm.reset();
    }
  });
});
