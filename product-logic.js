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
const ratingInputs = reviewForm ? reviewForm.querySelectorAll("input[name='rating']") : [];

let currentUser = null;
let currentProduct = null; // store loaded product for PayPal

// ===============================
// LOAD CURRENT USER
// ===============================
async function loadUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("Error getting user:", error);
  }
  currentUser = data?.user || null;
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
  if (!productId) {
    productCard.innerHTML = "<p>Missing product ID.</p>";
    return;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (error || !data) {
    console.error("Error loading product:", error);
    productCard.innerHTML = "<p>Error loading product.</p>";
    return;
  }

  currentProduct = data;

  // Render product card with PayPal container
  productCard.innerHTML = `
    <div class="flex">
      <img src="${data.image_url}" class="product-img" alt="Product image">

      <div>
        <h2>${data.title}</h2>

        <p style="font-size:20px;font-weight:bold;color:#1a7f37;">
          $${(data.price_cents / 100).toFixed(2)}
        </p>

        <p>${data.description}</p>

        <!-- PayPal button will be rendered here -->
        <div id="paypal-button-container" style="margin-top:12px;"></div>
        <p id="paypal-message" class="text-muted" style="margin-top:6px;"></p>
      </div>
    </div>
  `;

  initPayPalButtons();
}

loadProduct();

// ===============================
// INITIALIZE PAYPAL BUTTONS
// ===============================
function initPayPalButtons() {
  const paypalContainer = document.getElementById("paypal-button-container");
  const messageEl = document.getElementById("paypal-message");

  if (!paypalContainer) {
    console.warn("PayPal container not found.");
    return;
  }

  // Check PayPal SDK loaded
  if (typeof paypal === "undefined") {
    if (messageEl) {
      messageEl.textContent = "Payment system not loaded. Please refresh the page.";
    }
    console.error("PayPal SDK not loaded.");
    return;
  }

  // Require login to buy (so we can track buyer_id for reviews)
  if (!currentUser) {
    if (messageEl) {
      messageEl.textContent = "Please log in to buy this product.";
    }
    return;
  }

  if (!currentProduct) {
    if (messageEl) {
      messageEl.textContent = "Product not loaded yet.";
    }
    return;
  }

  const priceValue = (currentProduct.price_cents / 100).toFixed(2);

  paypal.Buttons({
    style: {
      layout: "horizontal",
      color: "gold",
      shape: "rect",
      label: "paypal"
    },

    // Create order on PayPal
    createOrder(data, actions) {
      return actions.order.create({
        purchase_units: [{
          description: currentProduct.title,
          amount: {
            value: priceValue,        // e.g. "9.99"
            currency_code: "USD"
          }
        }]
      });
    },

    // On successful approval/capture
    onApprove(data, actions) {
      return actions.order.capture().then(async (details) => {
        try {
          const pu = details.purchase_units && details.purchase_units[0];
          const paidValue = pu?.amount?.value || priceValue;
          const payerEmail = details.payer?.email_address || null;

          const amountCents = Math.round(parseFloat(paidValue) * 100);

          const { error } = await supabase
            .from("orders")
            .insert({
              product_id: productId,
              seller_id: currentProduct.seller_id || null,
              buyer_id: currentUser.id,
              buyer_email: payerEmail,
              amount_cents: amountCents,
              status: "paid",
              paid_at: new Date().toISOString()
            });

          if (error) {
            console.error("Supabase order insert error:", error);
            if (messageEl) {
              messageEl.textContent = "Payment received, but order logging failed. Please contact support.";
            }
            return;
          }

          if (messageEl) {
            messageEl.textContent = "Payment successful! Thank you for your purchase.";
          }

          // After payment, user will now be considered a buyer for this product
          // so they can leave a review
          setupReviewForm(); // re-run logic
        } catch (err) {
          console.error("Error handling PayPal approval:", err);
          if (messageEl) {
            messageEl.textContent = "There was an error after payment. Please contact support if needed.";
          }
        }
      });
    },

    onError(err) {
      console.error("PayPal error:", err);
      if (messageEl) {
        messageEl.textContent = "There was an error with PayPal. Please try again.";
      }
    }

  }).render("#paypal-button-container");
}

// ===============================
// LOAD REVIEWS
// ===============================
async function loadReviews() {
  if (!productId) return;

  const { data, error } = await supabase
    .from("reviews")
    .select("rating, review_text, created_at, user_id, profiles(display_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading reviews:", error);
    reviewsList.innerHTML = "<p>Error loading reviews.</p>";
    return;
  }

  reviewsList.innerHTML = "";

  if (!data || data.length === 0) {
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
  if (!currentUser || !productId) return false;

  const { data, error } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_id", currentUser.id)
    .eq("product_id", productId)
    .eq("status", "paid")
    .maybeSingle();

  if (error) {
    console.error("Error checking purchase:", error);
  }

  return !!data;
}

// ===============================
// CHECK IF USER ALREADY REVIEWED
// ===============================
async function userAlreadyReviewed() {
  if (!currentUser || !productId) return false;

  const { data, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", currentUser.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    console.error("Error checking existing review:", error);
  }

  return !!data;
}

// ===============================
// SETUP REVIEW FORM
// ===============================
async function setupReviewForm() {
  if (!reviewForm) return;

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
if (reviewForm) {
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
      console.error("Error submitting review:", error);
      alert("Error submitting review.");
      return;
    }

    alert("Review submitted!");
    reviewForm.style.display = "none";
    loadReviews();
  });
}
