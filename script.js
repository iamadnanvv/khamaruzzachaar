/**
 * Khamaruzz Naadan Achaar — Main E-commerce & Interactive Handler
 */

(function () {
  "use strict";

  const WHATSAPP_NUMBER = "919645778508";
  const STORAGE_CART = "khamaruzz_cart";
  const STORAGE_FAV = "khamaruzz_favorites";

  const PRODUCTS = {
    mango: {
      name: "Mango Pickle",
      image: "mango.png",
      prices: { "250g": 149, "500g": 249, "1kg": 499 }
    },
    garlic: {
      name: "Garlic Pickle",
      image: "garlic.png",
      prices: { "250g": 169, "500g": 299, "1kg": 549 }
    },
    chilli: {
      name: "Chilli Pickle",
      image: "chilli.png",
      prices: { "250g": 199, "500g": 349, "1kg": 649 }
    },
    fish: {
      name: "Fish Pickle",
      image: "fish.png",
      prices: { "500g": 450, "1kg": 850 }
    }
  };

  const PRODUCT_BY_NAME = {
    "Mango Pickle": "mango",
    "Garlic Pickle": "garlic",
    "Chilli Pickle": "chilli",
    "Fish Pickle": "fish"
  };

  /* Helper Functions */
  function formatPrice(amount) {
    return "₹" + amount.toLocaleString("en-IN");
  }

  function openWhatsApp(message) {
    const url = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function saveJson(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch {}
  }

  /* Cart State */
  let cart = loadJson(STORAGE_CART, []);

  function saveCart() {
    saveJson(STORAGE_CART, cart);
    renderCart();
    updateBadges();
    updateOrderFormMode();
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function getCartSubtotal() {
    return cart.reduce((sum, item) => sum + PRODUCTS[item.productId].prices[item.size] * item.qty, 0);
  }

  function addToCart(productId, size, qty = 1) {
    const key = productId + "::" + size;
    const existing = cart.find(i => i.key === key);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ key, productId, size, qty });
    }
    saveCart();
    showToast(PRODUCTS[productId].name + " (" + size + ") added to cart");
  }

  function updateCartQty(key, delta) {
    const item = cart.find(i => i.key === key);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.key !== key);
    }
    saveCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    showToast("Cart cleared");
  }

  /* Favorites State */
  let favorites = loadJson(STORAGE_FAV, []);

  function toggleFavorite(productId) {
    const idx = favorites.indexOf(productId);
    if (idx === -1) {
      favorites.push(productId);
      showToast(PRODUCTS[productId].name + " saved to favorites");
    } else {
      favorites.splice(idx, 1);
      showToast(PRODUCTS[productId].name + " removed from favorites");
    }
    saveJson(STORAGE_FAV, favorites);
    updateFavoritesUI();
    updateBadges();
  }

  /* UI Elements */
  const cartBadge = document.getElementById("cartBadge");
  const favBadge = document.getElementById("favBadge");
  const cartDrawer = document.getElementById("cartDrawer");
  const favoritesDrawer = document.getElementById("favoritesDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const toastRoot = document.getElementById("toastRoot");

  function updateBadges() {
    if (cartBadge) {
      cartBadge.textContent = getCartCount();
      cartBadge.hidden = getCartCount() === 0;
    }
    if (favBadge) {
      favBadge.textContent = favorites.length;
      favBadge.hidden = favorites.length === 0;
    }

    document.querySelectorAll("[data-favorite]").forEach(btn => {
      const pid = btn.dataset.favorite;
      if (favorites.includes(pid)) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    });
  }

  function showToast(msg) {
    if (!toastRoot) return;
    toastRoot.textContent = msg;
    toastRoot.classList.add("is-visible");
    setTimeout(() => toastRoot.classList.remove("is-visible"), 2500);
  }

  function openDrawer(drawer) {
    if (drawerOverlay) drawerOverlay.hidden = false;
    if (drawer) {
      drawer.classList.add("is-open");
      drawer.setAttribute("aria-hidden", "false");
    }
  }

  function closeDrawers() {
    if (drawerOverlay) drawerOverlay.hidden = true;
    [cartDrawer, favoritesDrawer].forEach(d => {
      if (d) {
        d.classList.remove("is-open");
        d.setAttribute("aria-hidden", "true");
      }
    });
  }

  function renderCart() {
    const cartItemsEl = document.getElementById("cartItems");
    const cartSubtotalEl = document.getElementById("cartSubtotal");
    const checkoutBtn = document.getElementById("cartCheckoutBtn");

    if (!cartItemsEl) return;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = '<p class="drawer-empty" style="text-align:center; color:var(--text-muted); padding:2rem 0;">Your cart is empty.</p>';
      if (cartSubtotalEl) cartSubtotalEl.textContent = "₹0";
      if (checkoutBtn) checkoutBtn.disabled = true;
      return;
    }

    if (checkoutBtn) checkoutBtn.disabled = false;

    cartItemsEl.innerHTML = cart.map(item => {
      const p = PRODUCTS[item.productId];
      const itemPrice = p.prices[item.size] * item.qty;
      return `
        <div class="cart-item" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
          <div>
            <h4 style="font-size:1rem; margin-bottom:0.2rem;">${p.name}</h4>
            <p style="font-size:0.85rem; color:var(--text-muted);">${item.size} — ${formatPrice(p.prices[item.size])}</p>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.4rem;">
              <button type="button" class="btn-qty" data-cart-dec="${item.key}" style="padding:2px 8px; border:1px solid var(--border-color); background:#fff; border-radius:4px; cursor:pointer;">-</button>
              <span style="font-size:0.9rem; font-weight:600;">${item.qty}</span>
              <button type="button" class="btn-qty" data-cart-inc="${item.key}" style="padding:2px 8px; border:1px solid var(--border-color); background:#fff; border-radius:4px; cursor:pointer;">+</button>
            </div>
          </div>
          <div style="text-align:right;">
            <strong style="color:var(--primary);">${formatPrice(itemPrice)}</strong>
          </div>
        </div>
      `;
    }).join("");

    if (cartSubtotalEl) cartSubtotalEl.textContent = formatPrice(getCartSubtotal());

    // Bind quantity increment/decrement buttons
    cartItemsEl.querySelectorAll("[data-cart-inc]").forEach(btn => {
      btn.addEventListener("click", () => updateCartQty(btn.dataset.cartInc, 1));
    });
    cartItemsEl.querySelectorAll("[data-cart-dec]").forEach(btn => {
      btn.addEventListener("click", () => updateCartQty(btn.dataset.cartDec, -1));
    });
  }

  function updateFavoritesUI() {
    const favItemsEl = document.getElementById("favoritesItems");
    if (!favItemsEl) return;

    if (favorites.length === 0) {
      favItemsEl.innerHTML = '<p style="text-align:center; color:var(--text-muted); padding:2rem 0;">No saved favorites yet.</p>';
      return;
    }

    favItemsEl.innerHTML = favorites.map(pid => {
      const p = PRODUCTS[pid];
      return `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-color);">
          <div>
            <h4 style="font-size:1rem;">${p.name}</h4>
            <p style="font-size:0.85rem; color:var(--text-muted);">Starting at ${formatPrice(Object.values(p.prices)[0])}</p>
          </div>
          <button class="btn btn-outline btn-sm" data-fav-add="${pid}" style="padding:0.4rem 0.8rem; font-size:0.85rem;">Add to Cart</button>
        </div>
      `;
    }).join("");

    favItemsEl.querySelectorAll("[data-fav-add]").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = btn.dataset.favAdd;
        const defaultSize = Object.keys(PRODUCTS[pid].prices)[0];
        addToCart(pid, defaultSize, 1);
      });
    });
  }

  /* Form Helpers */
  const formProduct = document.getElementById("formProduct");
  const formSize = document.getElementById("formSize");

  function populateFormSizes(productId) {
    if (!formSize) return;
    if (!productId || !PRODUCTS[productId]) {
      formSize.innerHTML = '<option value="">Select product first</option>';
      formSize.disabled = true;
      return;
    }

    const sizes = Object.keys(PRODUCTS[productId].prices);
    formSize.innerHTML = sizes.map(s => `<option value="${s}">${s}</option>`).join("");
    formSize.disabled = false;
  }

  function updateOrderFormMode() {
    const notice = document.getElementById("formCartNotice");
    if (notice) {
      const count = getCartCount();
      notice.hidden = count === 0;
      if (count > 0) {
        notice.querySelector("[data-cart-count]").textContent = count;
        notice.querySelector("[data-cart-total]").textContent = formatPrice(getCartSubtotal());
      }
    }
  }

  /* Event Listeners Initialization */
  document.addEventListener("DOMContentLoaded", () => {
    updateBadges();
    updateFavoritesUI();
    renderCart();

    // Footer Year
    const yearEl = document.getElementById("year");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    // Size dropdown price update
    document.querySelectorAll(".size-select").forEach(select => {
      select.addEventListener("change", (e) => {
        const pid = e.target.dataset.product;
        const priceEl = document.querySelector(`[data-price-for="${pid}"]`);
        if (priceEl) {
          priceEl.textContent = formatPrice(PRODUCTS[pid].prices[e.target.value]);
        }
      });
    });

    // Add to Cart Buttons
    document.querySelectorAll("[data-add-cart]").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = btn.dataset.addCart;
        const select = document.querySelector(`.size-select[data-product="${pid}"]`);
        const size = select ? select.value : Object.keys(PRODUCTS[pid].prices)[0];
        addToCart(pid, size, 1);
      });
    });

    // Individual Product Direct WhatsApp Order Buttons
    document.querySelectorAll(".product-order").forEach(btn => {
      btn.addEventListener("click", () => {
        const pid = btn.dataset.product;
        const select = document.querySelector(`.size-select[data-product="${pid}"]`);
        const size = select ? select.value : Object.keys(PRODUCTS[pid].prices)[0];
        const p = PRODUCTS[pid];
        const msg = `Hi! I would like to order:\n\n*Product:* ${p.name}\n*Size:* ${size}\n*Price:* ${formatPrice(p.prices[size])}\n\nPlease let me know the payment details and delivery time!`;
        openWhatsApp(msg);
      });
    });

    // Header CTAs
    document.querySelectorAll("[data-wa-default]").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        openWhatsApp("Hi! I would like to inquire about ordering Khamaruzz Naadan Achaar.");
      });
    });

    // Favorites Buttons
    document.querySelectorAll("[data-favorite]").forEach(btn => {
      btn.addEventListener("click", () => {
        toggleFavorite(btn.dataset.favorite);
      });
    });

    // Drawer triggers
    document.querySelectorAll("[data-open-cart]").forEach(b => b.addEventListener("click", () => { renderCart(); openDrawer(cartDrawer); }));
    document.querySelectorAll("[data-open-favorites]").forEach(b => b.addEventListener("click", () => { updateFavoritesUI(); openDrawer(favoritesDrawer); }));
    document.querySelectorAll(".drawer-close").forEach(b => b.addEventListener("click", closeDrawers));
    if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawers);

    // Clear Cart button
    const clearCartBtn = document.getElementById("clearCartBtn");
    if (clearCartBtn) clearCartBtn.addEventListener("click", clearCart);

    // Cart Drawer Checkout Button
    const cartCheckoutBtn = document.getElementById("cartCheckoutBtn");
    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener("click", () => {
        if (cart.length === 0) return;
        let msg = "*New Order Request*\n\n*Items Ordered:*\n";
        cart.forEach(item => {
          msg += `- ${PRODUCTS[item.productId].name} (${item.size}) x${item.qty} — ${formatPrice(PRODUCTS[item.productId].prices[item.size] * item.qty)}\n`;
        });
        msg += `\n*Total:* ${formatPrice(getCartSubtotal())}\n\nPlease confirm availability and payment options.`;
        openWhatsApp(msg);
      });
    }

    // Dynamic Select Populate in Contact Form
    if (formProduct) {
      formProduct.addEventListener("change", (e) => {
        const productId = PRODUCT_BY_NAME[e.target.value];
        populateFormSizes(productId);
      });
    }

    // Form Submit Handler
    const orderForm = document.getElementById("orderForm");
    if (orderForm) {
      orderForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("fullName").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const address = document.getElementById("address").value.trim();
        const notes = document.getElementById("notes").value.trim();

        let msg = `*New Customer Order*\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Address:* ${address}\n`;
        if (notes) msg += `*Notes:* ${notes}\n`;

        if (cart.length > 0) {
          msg += `\n*Cart Items:*\n` + cart.map(i => `- ${PRODUCTS[i.productId].name} (${i.size}) x${i.qty} — ${formatPrice(PRODUCTS[i.productId].prices[i.size] * i.qty)}`).join("\n");
          msg += `\n\n*Total Amount:* ${formatPrice(getCartSubtotal())}`;
        } else if (formProduct.value) {
          msg += `\n*Selected Product:* ${formProduct.value} (${formSize.value})`;
        }

        openWhatsApp(msg);
      });
    }
  });
})();