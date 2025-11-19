import { supabase } from "./supabase-config.js";

// ===============================
// GET PRODUCT ID FROM URL
// ===============================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// ===============================
// DOM ELEMENTS
// ===============================
const productCard = document.getElementById("productCard");
const reviewsList = document.getElementById("reviewsList");
const noReviewsMessage = document.getElementById("noReviewsMessage");
const reviewForm = document.getElementById("reviewForm");
const reviewText = document.getElementById("reviewText");
const ratingInputs = reviewForm.querySelectorAll("input[name='rating']");

let currentUser = null;

// ===============================
// LOAD CURRENT USER
// ===============================
async function loadUser() {
  const { data: { user }} = await supabase.auth.getUser();
  currentUser = user;
}

await loadUser();

// ===============================
// STAR RENDERING
// ===============================
function renderStars(count) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= count ? "filled" : ""}">★</span>`;
  }
  return html;
}

// ===============================
// LOAD PRODUCT
// ===============================
async function loadProduct() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !data) {
    productCard.innerHTML = `<p>Error loading product.</p>`;
    return;
  }

  productCard.innerHTML = `
    <div class="flex">
      <img src="${data.image_url}" class="product-img">

      <div>
        <h2>${data.title}</h2>

        <p style="font-size:20px;font-weight:bold;color:#1a7f37;">
          $${(data.price_cents / 100).toFixed(2)}
        </p>

        <p>${data.description}</p>

        <button style="
          background:#0066ff;color:#fff;border:none;border-radius:6px;
          padding:10px 18px;font-size:15px;cursor:pointer;">
          Buy Now
        </button>
      </div>
    </div>
  `;
}

loadProduct();

// ===============================
// LOAD REVIEWS
// ===============================
async function loadReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("rating, review_text, created_at, user_id, profiles(display_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    reviewsList.innerHTML = `<p>Error loading reviews.</p>`;
    return;
  }

  reviewsList.innerHTML = "";

  if (data.length === 0) {
    noReviewsMessage.textContent = "No reviews yet.";
    return;
  }

  noReviewsMessage.textContent = "";

  data.forEach(r => {
    const name = r.profiles?.display_name || "Anonymous";

    const box = document.createElement("div");
    box.style.padding = "10px 0";
    box.style.borderBottom = "1px solid #e6e6e6";

    box.innerHTML = `
      <div>${renderStars(r.rating)}</div>
      <p>${r.review_text}</p>
      <span class="text-muted">— ${name}</span><br>
      <span class="text-muted">${new Date(r.created_at).toLocaleDateString()}</span>
    `;

    reviewsList.appendChild(box);
  });
}

loadReviews();

// ===============================
// CHECK IF USER PURCHASED PRODUCT
// ===============================
async function userPurchasedProduct() {
  if (!currentUser) return false;

  const { data } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", currentUser.id)
    .eq("product_id", productId)
    .eq("status", "paid")
    .maybeSingle();

  return !!data;
}

// ===============================
// CHECK IF USER ALREADY REVIEWED
// ===============================
async function userAlreadyReviewed() {
  if (!currentUser) return false;

  const { data } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("product_id", productId)
    .maybeSingle();

  return !!data;
}

// ===============================
// SETUP REVIEW FORM
// ===============================
async function setupReviewForm() {
  if (!currentUser) {
    reviewForm.outerHTML = `<p class="text-muted">Log in to leave a review.</p>`;
    return;
  }

  const bought = await userPurchasedProduct();
  if (!bought) {
    reviewForm.outerHTML = `<p class="text-muted">Only buyers can leave a review.</p>`;
    return;
  }

  const already = await userAlreadyReviewed();
  if (already) {
    reviewForm.outerHTML = `<p class="text-muted">You already reviewed this product.</p>`;
    return;
  }

  // User can review
  reviewForm.style.display = "block";
}

setupReviewForm();

// ===============================
// SUBMIT REVIEW
// ===============================
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let rating = 0;
  ratingInputs.forEach(r => {
    if (r.checked) rating = parseInt(r.value);
  });

  if (rating === 0) {
    alert("Please select a rating.");
    return;
  }

  const text = reviewText.value.trim();
  if (text.length === 0) {
    alert("Please enter your review.");
    return;
  }

  const { error } = await supabase
    .from("reviews")
    .insert({
      product_id: productId,
      user_id: currentUser.id,
      rating,
      review_text: text
    });

  if (error) {
    console.error(error);
    alert("Error submitting review.");
    return;
  }

  alert("Review submitted!");
  reviewForm.style.display = "none";

  loadReviews();
});
