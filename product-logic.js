// ===============================
// product-logic.js
// ===============================

import { supabase } from "./supabase-config.js";

// =======================================
// 1. GET PRODUCT ID FROM URL
// =======================================
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

// DOM Elements
const productTitle = document.getElementById("product-title");
const productImage = document.getElementById("product-image");
const productPrice = document.getElementById("product-price");
const productDescription = document.getElementById("product-description");

const reviewsContainer = document.getElementById("reviews-container");
const reviewForm = document.getElementById("review-form");
const reviewTextInput = document.getElementById("review-text");
const starInputs = document.querySelectorAll(".review-star");

// =======================================
// 2. LOAD CURRENT USER
// =======================================
let currentUser = null;

async function loadUser() {
  const { data: { user } } = await supabase.auth.getUser();
  currentUser = user;
}

await loadUser();

// ======================================================
// 3. LOAD PRODUCT INFO
// ======================================================
async function loadProduct() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error) {
    console.error("Error loading product:", error);
    return;
  }

  productTitle.textContent = data.title;
  productImage.src = data.image_url;
  productPrice.textContent = "$" + (data.price_cents / 100).toFixed(2);
  productDescription.textContent = data.description;
}

loadProduct();

// ======================================================
// 4. SHOW STAR GRAPHICS
// ======================================================
function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += i <= rating
      ? `<span class="star filled">★</span>`
      : `<span class="star">☆</span>`;
  }
  return html;
}

// ======================================================
// 5. LOAD AND DISPLAY REVIEWS
// ======================================================
async function loadReviews() {
  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("rating, review_text, created_at, user_id, profiles(display_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading reviews:", error);
    return;
  }

  reviewsContainer.innerHTML = "";

  reviews.forEach((r) => {
    const name = r.profiles?.display_name || "Anonymous";

    const reviewHTML = `
      <div class="review-box">
        <div class="review-stars">${renderStars(r.rating)}</div>
        <p class="review-text">${r.review_text}</p>
        <p class="review-author">— ${name}</p>
        <p class="review-date">${new Date(r.created_at).toLocaleDateString()}</p>
      </div>
    `;

    reviewsContainer.innerHTML += reviewHTML;
  });
}

loadReviews();

// ======================================================
// 6. CHECK IF USER PURCHASED PRODUCT
// ======================================================
async function userPurchasedProduct() {
  if (!currentUser) return false;

  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", currentUser.id)
    .eq("product_id", productId)
    .eq("status", "paid")   // only paid orders
    .maybeSingle();

  return data ? true : false;
}

// ======================================================
// 7. CHECK IF USER ALREADY REVIEWED
// ======================================================
async function userAlreadyReviewed() {
  if (!currentUser) return false;

  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("product_id", productId)
    .maybeSingle();

  return data ? true : false;
}

// ======================================================
// 8. ENABLE OR DISABLE REVIEW FORM
// ======================================================
async function setupReviewForm() {
  if (!currentUser) {
    reviewForm.innerHTML = `<p>Please log in to leave a review.</p>`;
    return;
  }

  const purchased = await userPurchasedProduct();
  if (!purchased) {
    reviewForm.innerHTML = `<p>You must purchase this product before writing a review.</p>`;
    return;
  }

  const already = await userAlreadyReviewed();
  if (already) {
    reviewForm.innerHTML = `<p>You have already reviewed this product.</p>`;
    return;
  }

  // Otherwise allow review
  reviewForm.style.display = "block";
}

setupReviewForm();

// ======================================================
// 9. SUBMIT REVIEW
// ======================================================
reviewForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  let selectedRating = 0;
  starInputs.forEach((s) => {
    if (s.checked) selectedRating = parseInt(s.value);
  });

  if (selectedRating === 0) {
    alert("Please select a rating.");
    return;
  }

  const reviewText = reviewTextInput.value.trim();

  const { error } = await supabase
    .from("reviews")
    .insert({
      product_id: productId,
      user_id: currentUser.id,
      rating: selectedRating,
      review_text: reviewText,
    });

  if (error) {
    console.error("Error submitting review:", error);
    alert("Error submitting review.");
    return;
  }

  alert("Review submitted successfully!");
  reviewForm.style.display = "none";
  loadReviews();
});
