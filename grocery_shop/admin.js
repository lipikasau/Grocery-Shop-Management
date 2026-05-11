/* ===================================================
   FreshNest Admin Panel — admin.js
   =================================================== */

"use strict";

const API = "http://127.0.0.1:8000/api";

// ─── State ───────────────────────────────────────────
let allProducts  = [];
let allOrders    = [];
let categories   = [];
let editingId    = null;

// ─── DOM helpers ─────────────────────────────────────
const $  = id  => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ===================================================
// INIT
// ===================================================
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupProductModal();
  setupOrderModal();
  setupRefreshBtn();
  await checkAPI();
  await loadAll();
});

// ===================================================
// API HEALTH CHECK
// ===================================================
async function checkAPI() {
  const el = $("apiStatus");
  try {
    const res = await fetch(`${API}/health`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      el.classList.add("online");
      el.querySelector(".status-text").textContent = "API Online";
    } else throw new Error();
  } catch {
    el.classList.add("offline");
    el.querySelector(".status-text").textContent = "API Offline";
    showToast("⚠️ Backend not reachable. Start the server first.");
  }
}

// ===================================================
// LOAD ALL DATA
// ===================================================
async function loadAll() {
  await Promise.all([loadStats(), loadCategories(), loadProducts(), loadOrders()]);
}

async function loadStats() {
  try {
    const res  = await fetch(`${API}/stats`);
    const data = await res.json();
    $("statProducts").textContent = data.total_products;
    $("statOrders").textContent   = data.total_orders;
    $("statRevenue").textContent  = `$${data.total_revenue.toFixed(2)}`;
    $("statPending").textContent  = data.pending_orders;
  } catch { /* silently fail */ }
}

async function loadCategories() {
  try {
    const res = await fetch(`${API}/categories`);
    categories = await res.json();
    // Populate category dropdowns
    const filter   = $("productCatFilter");
    const formSel  = $("fCategory");
    filter.innerHTML = `<option value="">All Categories</option>`;
    formSel.innerHTML = `<option value="">Select category</option>`;
    categories.forEach(c => {
      filter.innerHTML  += `<option value="${c.key}">${c.emoji} ${c.label}</option>`;
      formSel.innerHTML += `<option value="${c.key}">${c.emoji} ${c.label}</option>`;
    });
  } catch { /* silently fail */ }
}

async function loadProducts() {
  try {
    const res   = await fetch(`${API}/products?limit=500`);
    allProducts = await res.json();
    renderProductsTable(allProducts);
  } catch {
    $("productsTableBody").innerHTML = `<tr><td colspan="8" class="table-loading" style="color:#e05252">Failed to load products</td></tr>`;
  }
}

async function loadOrders() {
  try {
    const res  = await fetch(`${API}/orders?limit=200`);
    allOrders  = await res.json();
    $("ordersCountBadge").textContent = `${allOrders.length} order${allOrders.length !== 1 ? "s" : ""}`;
    renderOrdersTable(allOrders);
    renderRecentOrders(allOrders.slice(0, 6));
  } catch {
    $("ordersTableBody").innerHTML  = `<tr><td colspan="7" class="table-loading" style="color:#e05252">Failed to load orders</td></tr>`;
    $("recentOrdersBody").innerHTML = `<tr><td colspan="6" class="table-loading" style="color:#e05252">Failed to load orders</td></tr>`;
  }
}

// ===================================================
// RENDER — PRODUCTS TABLE
// ===================================================
function renderProductsTable(list) {
  const tbody = $("productsTableBody");
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="table-loading">No products found</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(p => `
    <tr>
      <td style="color:var(--text-muted)">#${p.id}</td>
      <td>
        <div class="td-product">
          <div class="td-emoji">${p.emoji}</div>
          <div>
            <div class="td-name">${p.name}</div>
            <div class="td-unit">per ${p.unit}</div>
          </div>
        </div>
      </td>
      <td>${catLabel(p.category)}</td>
      <td>${p.brand}</td>
      <td style="font-family:var(--font-display);font-size:1rem;color:var(--cream)">$${p.price.toFixed(2)}</td>
      <td>${p.badge ? `<span class="badge badge-${p.badge}">${p.badge === "organic" ? "🌱 Organic" : "🔥 Sale"}</span>` : `<span style="color:var(--text-muted)">—</span>`}</td>
      <td>${p.in_stock
        ? `<span class="badge badge-instock">In Stock</span>`
        : `<span class="badge badge-outstock">Out of Stock</span>`}
      </td>
      <td>
        <div class="table-actions">
          <button class="act-btn edit" onclick="openEditProduct(${p.id})" title="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="act-btn danger" onclick="deleteProduct(${p.id}, '${p.name.replace(/'/g,"\\'")}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join("");
}

// ===================================================
// RENDER — ORDERS TABLE
// ===================================================
function renderOrdersTable(list) {
  const tbody = $("ordersTableBody");
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-loading">No orders yet</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(o => `
    <tr>
      <td style="font-family:var(--font-display);color:var(--cream)">#${o.id}</td>
      <td>${o.customer_name || "Guest"}</td>
      <td>${o.items ? o.items.length : "—"} item${o.items && o.items.length !== 1 ? "s" : ""}</td>
      <td style="font-family:var(--font-display);font-size:1rem;color:var(--cream)">$${o.total.toFixed(2)}</td>
      <td>
        <select class="status-select" onchange="updateStatus(${o.id}, this.value)">
          ${["pending","confirmed","preparing","delivered","cancelled"].map(s =>
            `<option value="${s}" ${o.status===s?"selected":""}>${capitalize(s)}</option>`
          ).join("")}
        </select>
      </td>
      <td style="color:var(--text-muted)">${formatDate(o.created_at)}</td>
      <td>
        <button class="act-btn" onclick="openOrderDetail(${o.id})" title="View Detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </td>
    </tr>
  `).join("");
}

// ===================================================
// RENDER — RECENT ORDERS (Dashboard)
// ===================================================
function renderRecentOrders(list) {
  const tbody = $("recentOrdersBody");
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="table-loading">No orders yet</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(o => `
    <tr>
      <td style="font-family:var(--font-display);color:var(--cream)">#${o.id}</td>
      <td>${o.customer_name || "Guest"}</td>
      <td>${o.items ? o.items.length : "—"} items</td>
      <td style="font-family:var(--font-display);font-size:1rem;color:var(--cream)">$${o.total.toFixed(2)}</td>
      <td><span class="badge badge-${o.status}">${capitalize(o.status)}</span></td>
      <td style="color:var(--text-muted)">${formatDate(o.created_at)}</td>
    </tr>
  `).join("");
}

// ===================================================
// PRODUCT SEARCH + FILTER (client-side)
// ===================================================
function setupProductSearch() {
  $("productSearch").addEventListener("input", filterProductTable);
  $("productCatFilter").addEventListener("change", filterProductTable);
}

function filterProductTable() {
  const q   = $("productSearch").value.toLowerCase();
  const cat = $("productCatFilter").value;
  let list  = allProducts;
  if (cat) list = list.filter(p => p.category === cat);
  if (q)   list = list.filter(p =>
    p.name.toLowerCase().includes(q)  ||
    p.brand.toLowerCase().includes(q)
  );
  renderProductsTable(list);
}

// ===================================================
// PRODUCT MODAL
// ===================================================
function setupProductModal() {
  $("addProductBtn").addEventListener("click", () => openProductModal());
  $("modalClose").addEventListener("click",    closeProductModal);
  $("modalCancel").addEventListener("click",   closeProductModal);
  $("productModalBackdrop").addEventListener("click", closeProductModal);
  $("productForm").addEventListener("submit", handleProductSubmit);
}

function openProductModal(product = null) {
  editingId = product ? product.id : null;
  $("modalTitle").textContent   = product ? "Edit Product" : "Add Product";
  $("modalSubmit").textContent  = product ? "Save Changes" : "Save Product";
  $("editProductId").value      = product ? product.id : "";

  // Reset form
  $("productForm").reset();

  if (product) {
    $("fName").value        = product.name;
    $("fBrand").value       = product.brand;
    $("fCategory").value    = product.category;
    $("fUnit").value        = product.unit;
    $("fPrice").value       = product.price;
    $("fEmoji").value       = product.emoji;
    $("fBadge").value       = product.badge || "";
    $("fInStock").checked   = product.in_stock !== false;
    $("fDescription").value = product.description || "";
  }

  $("productModal").classList.add("open");
  $("productModalBackdrop").classList.add("open");
}

function openEditProduct(id) {
  const product = allProducts.find(p => p.id === id);
  if (product) openProductModal(product);
}

function closeProductModal() {
  $("productModal").classList.remove("open");
  $("productModalBackdrop").classList.remove("open");
  editingId = null;
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const btn = $("modalSubmit");
  btn.textContent = "Saving…";
  btn.disabled    = true;

  const payload = {
    name:        $("fName").value.trim(),
    brand:       $("fBrand").value.trim(),
    category:    $("fCategory").value,
    unit:        $("fUnit").value.trim(),
    price:       parseFloat($("fPrice").value),
    emoji:       $("fEmoji").value.trim() || "🛒",
    badge:       $("fBadge").value || null,
    in_stock:    $("fInStock").checked,
    description: $("fDescription").value.trim(),
  };

  try {
    let res;
    if (editingId) {
      res = await fetch(`${API}/products/${editingId}`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
    } else {
      res = await fetch(`${API}/products`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Save failed");
    }

    showToast(editingId ? `✅ Product updated` : `✅ Product added`);
    closeProductModal();
    await loadProducts();
    await loadStats();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  } finally {
    btn.textContent = editingId ? "Save Changes" : "Save Product";
    btn.disabled    = false;
  }
}

async function deleteProduct(id, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  try {
    const res = await fetch(`${API}/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Delete failed");
    showToast(`🗑️ ${name} deleted`);
    await loadProducts();
    await loadStats();
  } catch (err) {
    showToast(`❌ ${err.message}`);
  }
}

// ===================================================
// ORDER DETAIL MODAL
// ===================================================
function setupOrderModal() {
  $("orderModalClose").addEventListener("click",    closeOrderModal);
  $("orderModalBackdrop").addEventListener("click", closeOrderModal);
}

async function openOrderDetail(id) {
  try {
    const res   = await fetch(`${API}/orders/${id}`);
    const order = await res.json();

    $("orderModalTitle").textContent = `Order #${order.id}`;
    $("orderModalBody").innerHTML = `
      <div class="order-detail-meta">
        <div class="detail-field">
          <span>Customer</span>
          <span>${order.customer_name || "Guest"}</span>
        </div>
        <div class="detail-field">
          <span>Email</span>
          <span>${order.customer_email || "—"}</span>
        </div>
        <div class="detail-field">
          <span>Status</span>
          <span><span class="badge badge-${order.status}">${capitalize(order.status)}</span></span>
        </div>
        <div class="detail-field">
          <span>Date</span>
          <span>${formatDate(order.created_at)}</span>
        </div>
        ${order.notes ? `<div class="detail-field" style="grid-column:1/-1"><span>Notes</span><span>${order.notes}</span></div>` : ""}
      </div>

      <div class="order-items-list">
        ${(order.items || []).map(item => `
          <div class="order-item-row">
            <div class="oi-emoji">${item.product ? item.product.emoji : "🛒"}</div>
            <div class="oi-info">
              <div class="oi-name">${item.product ? item.product.name : `Product #${item.product_id}`}</div>
              <div class="oi-unit">$${item.unit_price.toFixed(2)} / ${item.product ? item.product.unit : "unit"}</div>
            </div>
            <span class="oi-qty">×${item.qty}</span>
            <span class="oi-price">$${(item.unit_price * item.qty).toFixed(2)}</span>
          </div>
        `).join("")}
      </div>

      <div class="order-total-row">
        <span class="order-total-label">Order Total</span>
        <span class="order-total-value">$${order.total.toFixed(2)}</span>
      </div>
    `;

    $("orderModal").classList.add("open");
    $("orderModalBackdrop").classList.add("open");
  } catch (err) {
    showToast("❌ Could not load order detail");
  }
}

function closeOrderModal() {
  $("orderModal").classList.remove("open");
  $("orderModalBackdrop").classList.remove("open");
}

// ===================================================
// UPDATE ORDER STATUS
// ===================================================
async function updateStatus(id, status) {
  try {
    const res = await fetch(`${API}/orders/${id}/status?status=${status}`, { method: "PATCH" });
    if (!res.ok) throw new Error("Update failed");
    showToast(`✅ Order #${id} → ${capitalize(status)}`);
    await loadStats();
  } catch {
    showToast("❌ Status update failed");
  }
}

// ===================================================
// NAVIGATION
// ===================================================
function setupNavigation() {
  $$(".nav-item").forEach(item => {
    item.addEventListener("click", e => {
      e.preventDefault();
      goToPage(item.dataset.page);
    });
  });
}

function goToPage(page) {
  // Update nav
  $$(".nav-item").forEach(n => n.classList.toggle("active", n.dataset.page === page));
  // Update sections
  $$(".page").forEach(p => p.classList.remove("active"));
  $(`page${capitalize(page)}`).classList.add("active");

  // Update header
  const titles = { dashboard: ["Dashboard", "Welcome back — here's what's happening"],
                   products:  ["Products", "Manage your store catalogue"],
                   orders:    ["Orders", "View and manage customer orders"] };
  const [title, sub] = titles[page] || ["Dashboard", ""];
  $("pageTitle").textContent = title;
  $("pageSub").textContent   = sub;

  // Lazy init product search once
  if (page === "products") {
    setupProductSearch();
  }
}

// ===================================================
// REFRESH BUTTON
// ===================================================
function setupRefreshBtn() {
  $("refreshBtn").addEventListener("click", async () => {
    $("refreshBtn").classList.add("spinning");
    await loadAll();
    setTimeout(() => $("refreshBtn").classList.remove("spinning"), 600);
    showToast("✅ Data refreshed");
  });
}

// ===================================================
// HELPERS
// ===================================================
function catLabel(cat) {
  const map = {
    fruits:"Fruits & Veg", dairy:"Dairy & Eggs", bakery:"Bakery",
    meat:"Meat & Seafood", beverages:"Beverages", snacks:"Snacks",
    pantry:"Pantry", frozen:"Frozen"
  };
  return map[cat] || cat;
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
}

// ─── Toast ───────────────────────────────────────────
let _toastTimer;
function showToast(msg) {
  const t = $("adminToast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
}
