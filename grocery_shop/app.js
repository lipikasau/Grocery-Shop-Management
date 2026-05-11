/* ===================================================
   FreshNest — app.js  (API-connected version)
   =================================================== */

"use strict";

// Always point to the FastAPI backend.
// If served by Live Server (port 5500) or file://, use the absolute backend URL.
// If served by uvicorn itself (port 8000), use a relative path.
const API = (window.location.port === "8000")
  ? "/api"
  : "http://127.0.0.1:8000/api";

// ===================================================
// STATE
// ===================================================
const state = {
  products:       [],
  cart:           [],
  activeCategory: "all",
  searchQuery:    "",
  sortOrder:      "default",
};

// ===================================================
// DOM REFERENCES
// ===================================================
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ===================================================
// LOADER
// ===================================================
window.addEventListener("load", async () => {
  await loadProducts();   // fetch from API before hiding loader
  setTimeout(() => {
    $("loader").classList.add("hidden");
  }, 800);
});

// ===================================================
// CUSTOM CURSOR
// ===================================================
const cursor         = $("cursor");
const cursorFollower = $("cursor-follower");
let mx = 0, my = 0, fx = 0, fy = 0;

document.addEventListener("mousemove", e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + "px";
  cursor.style.top  = my + "px";
});

function animateCursor() {
  fx += (mx - fx) * 0.12;
  fy += (my - fy) * 0.12;
  cursorFollower.style.left = fx + "px";
  cursorFollower.style.top  = fy + "px";
  requestAnimationFrame(animateCursor);
}
animateCursor();

document.addEventListener("mouseover", e => {
  if (e.target.closest("button, a, select, input, .cat-pill, .product-card")) {
    document.body.classList.add("cursor-hover");
  }
});
document.addEventListener("mouseout", e => {
  if (e.target.closest("button, a, select, input, .cat-pill, .product-card")) {
    document.body.classList.remove("cursor-hover");
  }
});

// ===================================================
// NAVBAR SCROLL
// ===================================================
window.addEventListener("scroll", () => {
  $("navbar").classList.toggle("scrolled", window.scrollY > 40);
});

// ===================================================
// SEARCH
// ===================================================
$("searchToggle").addEventListener("click", openSearch);
$("searchClose").addEventListener("click", closeSearch);
$("searchInput").addEventListener("input", e => {
  state.searchQuery = e.target.value.toLowerCase();
  renderProducts();
});
$("searchOverlay").addEventListener("click", e => {
  if (e.target === $("searchOverlay")) closeSearch();
});

function openSearch() {
  $("searchOverlay").classList.add("open");
  setTimeout(() => $("searchInput").focus(), 300);
}
function closeSearch() {
  $("searchOverlay").classList.remove("open");
  state.searchQuery = "";
  $("searchInput").value = "";
  renderProducts();
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") { closeSearch(); closeCart(); }
});

// ===================================================
// CATEGORY FILTER
// ===================================================
$$(".cat-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    $$(".cat-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.activeCategory = btn.dataset.cat;
    renderProducts();
  });
});

// ===================================================
// SORT
// ===================================================
$("sortSelect").addEventListener("change", e => {
  state.sortOrder = e.target.value;
  renderProducts();
});

// ===================================================
// API — FETCH PRODUCTS
// ===================================================
async function loadProducts() {
  try {
    const res  = await fetch(`${API}/products?limit=500`);
    if (!res.ok) throw new Error("API error");
    state.products = await res.json();
    renderProducts();
  } catch (err) {
    console.error("Failed to load products:", err);
    showToast("⚠️ Could not load products. Is the server running?");
    $("productsGrid").innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted);">
        <div style="font-size:3rem;margin-bottom:16px">⚡</div>
        <p style="font-family:var(--font-display);font-size:1.4rem;color:var(--bark)">Server not running</p>
        <p style="margin-top:8px;font-size:.85rem">Start the backend with: <code>uvicorn main:app --reload</code></p>
      </div>`;
  }
}

// ===================================================
// PRODUCTS RENDER
// ===================================================
function getFilteredProducts() {
  let list = [...state.products];

  if (state.activeCategory !== "all") {
    list = list.filter(p => p.category === state.activeCategory);
  }

  if (state.searchQuery) {
    const q = state.searchQuery;
    list = list.filter(p =>
      p.name.toLowerCase().includes(q)  ||
      p.brand.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  }

  switch (state.sortOrder) {
    case "price-asc":  list.sort((a, b) => a.price - b.price);              break;
    case "price-desc": list.sort((a, b) => b.price - a.price);              break;
    case "name":       list.sort((a, b) => a.name.localeCompare(b.name));   break;
  }

  return list;
}

function getCartQty(productId) {
  const entry = state.cart.find(i => i.product.id === productId);
  return entry ? entry.qty : 0;
}

function renderProducts() {
  const list = getFilteredProducts();
  const grid = $("productsGrid");

  $("resultsCount").textContent = list.length === 0
    ? "No products found"
    : `Showing ${list.length} product${list.length !== 1 ? "s" : ""}`;

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted);">
        <div style="font-size:3rem;margin-bottom:16px">🌿</div>
        <p style="font-family:var(--font-display);font-size:1.4rem;color:var(--bark)">Nothing found</p>
        <p style="margin-top:8px;font-size:.85rem">Try a different search or category</p>
      </div>`;
    return;
  }

  grid.innerHTML = list.map((p, i) => {
    const qty = getCartQty(p.id);
    const badgeHTML = p.badge
      ? `<span class="product-badge ${p.badge === "organic" ? "organic" : ""}">${p.badge === "organic" ? "🌱 Organic" : "🔥 Sale"}</span>`
      : "";

    const footerHTML = qty > 0
      ? `<div class="qty-controls">
           <button class="qty-btn" data-id="${p.id}" data-action="dec">−</button>
           <span class="qty-num">${qty}</span>
           <button class="qty-btn" data-id="${p.id}" data-action="inc">+</button>
         </div>`
      : `<button class="add-btn" data-id="${p.id}">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M12 5v14M5 12h14"/>
           </svg>
         </button>`;

    const stockBadge = p.in_stock === false
      ? `<span class="product-badge" style="background:var(--text-muted)">Out of Stock</span>` : "";

    return `
      <div class="product-card${p.in_stock === false ? " out-of-stock" : ""}" style="animation-delay:${i * 0.04}s">
        <div class="product-img-wrap">
          <span>${p.emoji}</span>
          ${badgeHTML}${stockBadge}
        </div>
        <div class="product-body">
          <p class="product-category">${catLabel(p.category)}</p>
          <p class="product-name">${p.name}</p>
          <p class="product-brand">${p.brand} · per ${p.unit}</p>
          <div class="product-footer">
            <p class="product-price">$${p.price.toFixed(2)} <span>/ ${p.unit}</span></p>
            ${p.in_stock !== false ? footerHTML : `<span style="font-size:.78rem;color:var(--text-muted)">Unavailable</span>`}
          </div>
        </div>
      </div>`;
  }).join("");

  // Attach events
  grid.querySelectorAll(".add-btn").forEach(btn => {
    btn.addEventListener("click", () => addToCart(parseInt(btn.dataset.id)));
  });
  grid.querySelectorAll(".qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      if (btn.dataset.action === "inc") addToCart(id);
      else removeFromCart(id);
    });
  });
}

function catLabel(cat) {
  const map = {
    fruits:"Fruits & Vegetables", dairy:"Dairy & Eggs", bakery:"Bakery",
    meat:"Meat & Seafood", beverages:"Beverages", snacks:"Snacks",
    pantry:"Pantry & Staples", frozen:"Frozen Foods"
  };
  return map[cat] || cat;
}

// ===================================================
// CART LOGIC
// ===================================================
function addToCart(productId) {
  const product  = state.products.find(p => p.id === productId);
  const existing = state.cart.find(i => i.product.id === productId);

  if (existing) {
    existing.qty++;
  } else {
    state.cart.push({ product, qty: 1 });
    showToast(`${product.emoji} ${product.name} added to basket`);
  }

  updateCartCount();
  renderProducts();
  renderCartItems();
}

function removeFromCart(productId) {
  const idx = state.cart.findIndex(i => i.product.id === productId);
  if (idx === -1) return;

  if (state.cart[idx].qty > 1) {
    state.cart[idx].qty--;
  } else {
    state.cart.splice(idx, 1);
  }

  updateCartCount();
  renderProducts();
  renderCartItems();
}

function deleteFromCart(productId) {
  state.cart = state.cart.filter(i => i.product.id !== productId);
  updateCartCount();
  renderProducts();
  renderCartItems();
}

function updateCartCount() {
  const total = state.cart.reduce((sum, i) => sum + i.qty, 0);
  const badge = $("cartCount");
  if (!badge) return;
  badge.textContent = total;
  badge.classList.remove("bump");
  void badge.offsetWidth;
  badge.classList.add("bump");
}

function renderCartItems() {
  const container = $("cartItems");
  const footer    = $("cartFooter");

  if (state.cart.length === 0) {
    // Write empty state directly as innerHTML — never rely on re-appending
    // a DOM node that may have been wiped by a previous innerHTML assignment
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your basket is empty</p>
        <span>Add some fresh goods!</span>
      </div>`;
    footer.style.display = "none";
    return;
  }

  footer.style.display = "block";

  const subtotal = state.cart.reduce((sum, i) => sum + i.product.price * i.qty, 0);

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-emoji">${item.product.emoji}</div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.product.name}</p>
        <p class="cart-item-price">$${item.product.price.toFixed(2)} / ${item.product.unit}</p>
      </div>
      <div class="cart-item-controls">
        <div class="cart-item-qty">
          <button class="ci-qty-btn" data-id="${item.product.id}" data-action="dec">−</button>
          <span class="ci-qty-num">${item.qty}</span>
          <button class="ci-qty-btn" data-id="${item.product.id}" data-action="inc">+</button>
        </div>
        <button class="cart-item-remove" data-id="${item.product.id}" title="Remove">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
          </svg>
        </button>
      </div>
    </div>
  `).join("");

  $("cartSubtotal").textContent = `$${subtotal.toFixed(2)}`;
  $("cartTotal").textContent    = `$${subtotal.toFixed(2)}`;

  container.querySelectorAll(".ci-qty-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = parseInt(btn.dataset.id);
      if (btn.dataset.action === "inc") addToCart(id);
      else removeFromCart(id);
    });
  });
  container.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => deleteFromCart(parseInt(btn.dataset.id)));
  });
}

// ===================================================
// CART DRAWER
// ===================================================
$("cartToggle").addEventListener("click", openCart);
$("cartClose").addEventListener("click", closeCart);
$("cartBackdrop").addEventListener("click", closeCart);

function openCart() {
  $("cartDrawer").classList.add("open");
  $("cartBackdrop").classList.add("open");
  renderCartItems();
}
function closeCart() {
  $("cartDrawer").classList.remove("open");
  $("cartBackdrop").classList.remove("open");
}

// ===================================================
// CHECKOUT MODAL
// ===================================================

function openCheckoutModal() {
  if (state.cart.length === 0) return;

  // Reset to step 1
  $("checkoutStep1").style.display = "flex";
  $("checkoutStep2").style.display = "none";

  // Populate order summary
  const subtotal = state.cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  $("checkoutOrderList").innerHTML = state.cart.map(item => `
    <div class="checkout-order-item">
      <div class="co-item-emoji">${item.product.emoji}</div>
      <div class="co-item-info">
        <p class="co-item-name">${item.product.name}</p>
        <p class="co-item-qty">Qty: ${item.qty}</p>
      </div>
      <span class="co-item-price">$${(item.product.price * item.qty).toFixed(2)}</span>
    </div>
  `).join("");
  $("checkoutSubtotal").textContent    = `$${subtotal.toFixed(2)}`;
  $("checkoutGrandTotal").textContent  = `$${subtotal.toFixed(2)}`;

  // Clear any previous validation state
  clearCheckoutErrors();

  // Open
  $("checkoutBackdrop").classList.add("open");
  $("checkoutModal").classList.add("open");
  document.body.style.overflow = "hidden";

  // Close the cart drawer behind the modal
  closeCart();

  // Focus first field
  setTimeout(() => { const f = $("co-name"); if (f) f.focus(); }, 350);
}

function closeCheckoutModal() {
  $("checkoutBackdrop").classList.remove("open");
  $("checkoutModal").classList.remove("open");
  document.body.style.overflow = "";
}

function clearCheckoutErrors() {
  ["co-name", "co-email", "co-address"].forEach(id => {
    const el = $(id);
    if (el) { el.classList.remove("input-error"); el.value = ""; }
  });
  ["co-name-err", "co-email-err", "co-address-err"].forEach(id => {
    const el = $(id);
    if (el) el.textContent = "";
  });
  const notes = $("co-notes");
  if (notes) notes.value = "";
}

function validateCheckoutForm() {
  let valid = true;

  const name    = ($("co-name")?.value    || "").trim();
  const email   = ($("co-email")?.value   || "").trim();
  const address = ($("co-address")?.value || "").trim();

  // Name
  if (!name) {
    setFieldError("co-name", "co-name-err", "Full name is required.");
    valid = false;
  } else {
    clearFieldError("co-name", "co-name-err");
  }

  // Email
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!email) {
    setFieldError("co-email", "co-email-err", "Email address is required.");
    valid = false;
  } else if (!emailOk) {
    setFieldError("co-email", "co-email-err", "Enter a valid email address.");
    valid = false;
  } else {
    clearFieldError("co-email", "co-email-err");
  }

  // Address
  if (!address) {
    setFieldError("co-address", "co-address-err", "Delivery address is required.");
    valid = false;
  } else {
    clearFieldError("co-address", "co-address-err");
  }

  return valid;
}

function setFieldError(inputId, errId, msg) {
  const input = $(inputId), err = $(errId);
  if (input) input.classList.add("input-error");
  if (err)   err.textContent = msg;
}
function clearFieldError(inputId, errId) {
  const input = $(inputId), err = $(errId);
  if (input) input.classList.remove("input-error");
  if (err)   err.textContent = "";
}

// Attach events
$("checkoutBtn")?.addEventListener("click", openCheckoutModal);
$("checkoutClose")?.addEventListener("click", closeCheckoutModal);
$("checkoutBack")?.addEventListener("click", () => { closeCheckoutModal(); openCart(); });
$("checkoutBackdrop")?.addEventListener("click", closeCheckoutModal);
$("successCta")?.addEventListener("click", () => { closeCheckoutModal(); });

// Escape key closes checkout too (already closes cart & search)
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeCheckoutModal();
}, { capture: true });

// Real-time validation clear on input
["co-name", "co-email", "co-address"].forEach(id => {
  $(id)?.addEventListener("input", () => clearFieldError(id, id + "-err"));
});

// Prevent form submission on Enter and trigger place order
$("checkoutForm")?.addEventListener("submit", e => {
  e.preventDefault();
  $("checkoutSubmit")?.click();
});

// ===================================================
// PLACE ORDER — POST TO API
// ===================================================
$("checkoutSubmit")?.addEventListener("click", async () => {
  if (!validateCheckoutForm()) return;

  const btn = $("checkoutSubmit");
  const originalHTML = btn.innerHTML;
  btn.innerHTML = "Placing order…";
  btn.disabled  = true;

  const payload = {
    customer_name:  ($("co-name")?.value   || "").trim(),
    customer_email: ($("co-email")?.value   || "").trim(),
    address:        ($("co-address")?.value || "").trim(),
    notes:          ($("co-notes")?.value   || "").trim(),
    items: state.cart.map(i => ({ product_id: i.product.id, qty: i.qty })),
  };

  try {
    const res = await fetch(API + "/orders", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!res.ok) {
      let detail = "";
      try { const j = await res.json(); detail = j.detail || JSON.stringify(j); }
      catch { detail = await res.text().catch(() => "Unknown error"); }
      throw new Error(`Server ${res.status}: ${detail}`);
    }

    const order   = await res.json();
    const orderId = order?.id      ?? "—";
    const total   = typeof order?.total === "number" ? order.total.toFixed(2) : "0.00";
    const name    = order?.customer_name || payload.customer_name;

    // Clear cart state
    state.cart = [];
    const badge = $("cartCount");
    if (badge) badge.textContent = "0";
    renderCartItems();
    renderProducts();

    // Show success screen
    $("checkoutStep1").style.display = "none";
    $("checkoutStep2").style.display = "flex";
    $("successMessage").textContent = `Thank you, ${name.split(" ")[0]}! Your order is being prepared.`;
    $("successOrderInfo").innerHTML = `
      <div><span>Order ID</span><strong>#${orderId}</strong></div>
      <div><span>Total</span><strong>$${total}</strong></div>
      <div><span>Delivery</span><strong>FREE</strong></div>
    `;

  } catch (err) {
    console.error("Checkout error:", err);
    showToast("⚠️ " + (err.message || "Order failed. Please try again."));
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled  = false;
  }
});

// ===================================================
// TOAST
// ===================================================
let toastTimer;
function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}

// ===================================================
// INIT
// ===================================================
renderCartItems();
