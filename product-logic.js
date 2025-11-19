// product-logic.js
// Loads product details + customer reviews for product.html

import { supabase } from "./js/supabase-config.js";

// Get DOM elements
const productCard = document.getElementById("productCard");
const reviewsList = document.getElementById("reviewsList");
const noReviewsMessage = document.getElementById("noReviewsMessage");

// Get product ID from URL: product.html?id=xxxx
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

// ---------- LOAD PRODUCT DETAILS ----------
async function loadProduct() {
  if (!productId) {
    productCard.innerHTML = "<p>Product not found.</p>";
    return;
  }

  // Fetch product from Supabase
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !product) {
    console.error("Error loading product:", error);
    productCard.innerHTML = "<p>Product not found or no longer available.</p>";
    return;
  }

  // Try to fetch seller display name
  let sellerName = "Seller";
  if (product.seller_id) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", product.seller_id)
      .single();

    if (!profileError && profile && profile.display_name) {
      sellerName = profile.display_name;
    }
  }

  // Build layout: image left, text right
  const wrapper = document.createElement("div");
  wrapper.className = "flex";

  // LEFT COLUMN (image)
  const leftCol = document.createElement("div");
  const img = document.createElement("img");
  img.className = "product-img";
  img.alt = product.title || "Product";

  // For now, use placeholder (you can later change to real thumbnail column)
  img.src = product.thumbnail_url || "placeholder.jpg";

  leftCol.appendChild(img);

  // RIGHT COLUMN (details)
  const rightCol = document.createElement("div");
  rightCol.style.flex = "1";

  // Title
  const titleEl = document.createElement("h2");
  titleEl.textContent = product.title || "Untitled product";

  // Category / sub-category
  const meta = document.createElement("p");
  meta.className = "text-muted";
  const parts = [];
  if (product.category) parts.push(product.category);
  if (product.sub_category) parts.push("› " + product.sub_category);
  meta.textContent = parts.join(" ");

  // Price
  const priceEl = document.createElement("p");
  priceEl.style.fontSize = "20px";
  priceEl.style.fontWeight = "bold";

  const rawPrice = product.price;
  const priceNumber =
    typeof rawPrice === "number"
      ? rawPrice
      : parseFloat(rawPrice || "0");

  priceEl.textContent = "USD " + priceNumber.toFixed(2);

  // Seller
  const sellerEl = document.createElement("p");
  sellerEl.className = "text-muted";
  sellerEl.textContent = "Sold by: " + sellerName;

  // Description (you don't have description column yet, so this is placeholder)
  const descEl = document.createElement("p");
  descEl.style.marginTop = "12px";
  descEl.style.lineHeight = "1.6";
  descEl.textContent =
    product.description ||
    "No description has been added for this product yet.";

  // Buy Now button (placeholder – later we hook PayPal here)
  const ctaBtn = document.createElement("button");
  ctaBtn.textContent = "Buy Now with PayPal";
  ctaBtn.style.marginTop = "16px";
  ctaBtn.onclick = () => {
    alert("Checkout integration will be added here later.");
  };

  // Append to right column
  rightCol.appendChild(titleEl);
  rightCol.appendChild(meta);
  rightCol.appendChild(priceEl);
  rightCol.appendChild(sellerEl);
  rightCol.appendChild(descEl);
  rightCol.appendChild(ctaBtn);

  // Put both columns into wrapper
  wrapper.appendChild(leftCol);
  wrapper.appendChild(rightCol);

  // Replace "Loading product..." with our layout
  productCard.innerHTML = "";
  productCard.appendChild(wrapper);
}

// ---------- LOAD CUSTOMER REVIEWS ----------
async function loadReviews() {
  if (!productId) return;

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading reviews:", error);
    noReviewsMessage.textContent = "Error loading reviews.";
    return;
  }

  if (!data || data.length === 0) {
    noReviewsMessage.textContent =
      "No reviews yet. Only verified buyers can leave a review.";
    return;
  }

  noReviewsMessage.textContent = "";
  reviewsList.innerHTML = "";

  data.forEach((r) => {
    const row = document.createElement("div");
    row.style.borderTop = "1px solid #eee";
    row.style.padding = "10px 0";

    // Stars ⭐
    const stars = document.createElement("div");
    const rating = r.rating || 0;
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.textContent = i <= rating ? "★" : "☆";
      star.style.color = i <= rating ? "#f5b50a" : "#ccc";
      star.style.fontSize = "18px";
      stars.appendChild(star);
    }

    // Buyer name + date
    const header = document.createElement("p");
    header.style.margin = "4px 0";
    header.style.fontWeight = "bold";

    const name = r.buyer_name || "Verified buyer";
    const dateStr = r.created_at
      ? new Date(r.created_at).toLocaleDateString()
      : "";

    header.textContent = dateStr ? `${name} · ${dateStr}` : name;

    // Review text
    const body = document.createElement("p");
    body.style.margin = "4px 0";
    body.textContent = r.review_text || "";

    row.appendChild(stars);
    row.appendChild(header);
    row.appendChild(body);
    reviewsList.appendChild(row);
  });
}

// ---------- RUN ON PAGE LOAD ----------
loadProduct();
loadReviews();
