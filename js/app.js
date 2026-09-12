/* ============================================================
   Sev Digital — منطق التطبيق
   يعتمد على js/config.js: الألوان، العملة، الدفع، التواصل
   الوظائف: السلة، الفلترة، البحث، الإشعارات، الشريط السفلي، PWA
   ============================================================ */

(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  function detectCurrency() {
    var fallback = CFG.currency || "$";
    if (!CFG.detectCurrency || !CFG.currencies) return fallback;
    try {
      var lang = (navigator.language || (navigator.languages && navigator.languages[0]) || "").toUpperCase();
      var m = lang.match(/-([A-Z]{2})$/);
      if (m && CFG.currencies[m[1]]) return CFG.currencies[m[1]];
    } catch (e) {}
    return fallback;
  }
  var CURRENCY = detectCurrency();
  var IS_DOLLAR = CURRENCY === "$";
  var TAX = typeof CFG.taxRate === "number" ? CFG.taxRate : 0.05;
  var PROMO = CFG.promo || { code: "SEV10", discount: 0.1 };

  function hexToRgba(hex, a) {
    var h = (hex || "").replace("#", "");
    if (h.length !== 6) return "rgba(139,92,246," + a + ")";
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  /* حماية من XSS: تهريب أي نص قادم من زوار/روابط قبل عرضه في HTML */
  function escapeHtml(v) {
    return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- تطبيق الهوية والألوان من config ---------- */
  function applyTheme() {
    var c = CFG.colors;
    if (!c) return;
    var root = document.documentElement;
    var map = {
      red: "--red", redDark: "--red-dark",
      blue: "--blue", blueLight: "--blue-light", blueDeep: "--blue-deep",
      gold: "--gold", goldLight: "--gold-light",
      bg: "--bg", bg2: "--bg-2", bg3: "--bg-3",
      card: "--card", card2: "--card-2",
      text: "--text", textDim: "--text-dim", textMute: "--text-mute"
    };
    Object.keys(map).forEach(function (key) {
      if (c[key]) root.style.setProperty(map[key], c[key]);
    });
    root.style.setProperty("--gradient", "linear-gradient(135deg, var(--red) 0%, #a855f7 40%, var(--blue) 100%)");
    root.style.setProperty(
      "--gradient-soft",
      "linear-gradient(135deg, " + hexToRgba(c.red, 0.16) + ", " + hexToRgba(c.blue, 0.16) + ")"
    );
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && c.red) meta.setAttribute("content", c.red);
    var bg = document.getElementById("bgDecor");
    if (bg && c.red && c.blue) {
      bg.style.background =
        "radial-gradient(700px 420px at 85% -5%, " + hexToRgba(c.red, 0.16) + ", transparent 60%)," +
        "radial-gradient(700px 420px at 8% 8%, " + hexToRgba(c.blue, 0.16) + ", transparent 60%)," +
        "radial-gradient(600px 500px at 50% 110%, " + hexToRgba(c.red, 0.12) + ", transparent 60%), var(--bg)";
    }
  }

  function applyBranding() {
    var name = CFG.brandName || "Sev Digital";
    document.querySelectorAll(".brand span:last-child").forEach(function (s) {
      s.textContent = name;
    });
    document.querySelectorAll(".brand-icon").forEach(function (i) {
      i.textContent = (CFG.brandShort || "SV").toUpperCase();
    });
    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  }

  function applyContact() {
    if (!CFG.contact) return;
    var el = document.getElementById("contactEmail");
    if (el) el.textContent = CFG.contact.email;
  }

  /* ---------- السلة (LocalStorage) ---------- */
  var CART_KEY = "sev_digital_cart";

  function getCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch (e) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCartCount();
  }

  function addToCart(id, qty) {
    qty = qty || 1;
    var product = PRODUCTS.find(function (p) { return p.id === Number(id); });
    if (!product) return;
    var cart = getCart();
    var found = cart.find(function (i) { return i.id === product.id; });
    if (found) { found.qty += qty; } else { cart.push({ id: product.id, qty: qty }); }
    saveCart(cart);
    showToast('تمت إضافة "' + product.title + '" إلى السلة 🛒');
  }

  function removeFromCart(id) {
    saveCart(getCart().filter(function (i) { return i.id !== Number(id); }));
    if (window.renderCartPage) renderCartPage();
  }

  function updateQty(id, delta) {
    var cart = getCart();
    var item = cart.find(function (i) { return i.id === Number(id); });
    if (!item) return;
    item.qty = Number(item.qty || 0) + delta;
    saveCart(item.qty <= 0 ? cart.filter(function (i) { return i.id !== Number(id); }) : cart);
    if (window.renderCartPage) renderCartPage();
  }

  function cartCount() { return getCart().reduce(function (s, i) { return s + i.qty; }, 0); }

  function cartTotal() {
    return getCart().reduce(function (s, i) {
      var p = PRODUCTS.find(function (x) { return x.id === i.id; });
      return s + (p ? p.price * i.qty : 0);
    }, 0);
  }

  function money(n) {
    var v = Number(n);
    var s = Number.isInteger(v) ? String(v) : v.toFixed(2);
    return IS_DOLLAR ? "$" + s : s + " " + CURRENCY;
  }

  /* ---------- شارة السلة ---------- */
  function renderCartCount() {
    document.querySelectorAll(".nav-cart-badge").forEach(function (badge) {
      var count = cartCount();
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = count ? "grid" : "none";
    });
  }

  /* ---------- بطاقة المنتج ---------- */
  function productCard(p) {
    var offer = p.oldPrice
      ? '<span class="product-offer">-' + Math.round((1 - p.price / p.oldPrice) * 100) + "%</span>"
      : "";
    var badge = p.badge
      ? '<span class="product-badge ' + p.badgeColor + '">' + p.badge + "</span>"
      : "";
    var media = p.img
      ? '<span class="product-img"><img src="' + p.img + '" alt="' + p.title + '" loading="lazy" onerror="this.nextElementSibling.style.display=\'grid\';this.remove()"><span class="big-emoji">' + p.emoji + '</span></span>'
      : '<span class="big-emoji">' + p.emoji + "</span>";
    return (
      '<article class="product-card card-hover-glow" data-cat="' + p.cat + '">' +
        '<a href="product.html?id=' + p.id + '" class="product-media">' + badge + offer + media + "</a>" +
        '<div class="product-body">' +
          '<span class="product-cat">' + p.catName + "</span>" +
          '<a href="product.html?id=' + p.id + '"><h3 class="product-title">' + p.title + "</h3></a>" +
          '<div class="product-rate"><span>★ ' + p.rate + '</span><span class="reviews">(' + p.reviews + ' تقييم) • ' + p.sales + " مبيعات</span></div>" +
          '<div class="product-footer">' +
            '<div class="price-box"><span class="price">' + money(p.price) + "</span>" +
            (p.oldPrice ? '<span class="price-old">' + money(p.oldPrice) + "</span>" : "") + "</div>" +
            '<button class="add-btn" onclick="window.SevAPI.add(' + p.id + ')" title="أضف للسلة" aria-label="أضف للسلة">＋</button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  function renderProductsGrid(container, products) {
    if (!container) return;
    if (!products.length) {
      container.innerHTML =
        '<div class="empty-cart" style="grid-column:1/-1">' +
          '<span class="ec-icon">🔍</span><h3>لا توجد منتجات مطابقة</h3>' +
          "<p>جرّب كلمات بحث أخرى أو تصفح تصنيفاً مختلفاً</p>" +
        "</div>";
      return;
    }
    container.innerHTML = products.map(productCard).join("");
  }

  /* ---------- صفحة المتجر ---------- */
  function initShopPage() {
    var grid = document.getElementById("productsGrid");
    if (!grid) return;

    var chipsBox = document.querySelector(".chips");
    var searchInput = document.getElementById("searchInput");
    var sortSelect = document.getElementById("sortSelect");

    var activeCat = "all";
    var query = "";
    var sort = "featured";

    if (chipsBox) {
      chipsBox.innerHTML = CATEGORIES.map(function (c) {
        return '<button class="chip' + (c.id === activeCat ? " active" : "") + '" data-cat="' + c.id + '">' + c.icon + " " + c.name + "</button>";
      }).join("");
      chipsBox.addEventListener("click", function (e) {
        var chip = e.target.closest(".chip");
        if (!chip) return;
        activeCat = chip.dataset.cat;
        chipsBox.querySelectorAll(".chip").forEach(function (c) { c.classList.toggle("active", c === chip); });
        applyFilters();
      });
    }

    if (searchInput) searchInput.addEventListener("input", function () { query = searchInput.value.trim().toLowerCase(); applyFilters(); });
    if (sortSelect) sortSelect.addEventListener("change", function () { sort = sortSelect.value; applyFilters(); });

    function applyFilters() {
      var items = PRODUCTS.slice();
      if (activeCat !== "all") items = items.filter(function (p) { return p.cat === activeCat; });
      if (query) {
        items = items.filter(function (p) {
          return p.title.toLowerCase().indexOf(query) > -1 ||
                 p.catName.toLowerCase().indexOf(query) > -1 ||
                 p.desc.toLowerCase().indexOf(query) > -1;
        });
      }
      if (sort === "price_asc") items.sort(function (a, b) { return a.price - b.price; });
      else if (sort === "price_desc") items.sort(function (a, b) { return b.price - a.price; });
      else if (sort === "rate") items.sort(function (a, b) { return b.rate - a.rate; });
      else if (sort === "sales") items.sort(function (a, b) { return parseFloat(b.sales) - parseFloat(a.sales); });
      renderProductsGrid(grid, items);
    }

    applyFilters();
  }

  /* ---------- صفحة المنتج ---------- */
  function initProductPage() {
    var params = new URLSearchParams(window.location.search);
    var id = Number(params.get("id"));
    var product = PRODUCTS.find(function (p) { return p.id === id; });

    var detail = document.getElementById("productDetail");
    if (!detail) return;

    if (!product) {
      detail.innerHTML =
        '<div class="empty-cart" style="grid-column:1/-1">' +
          '<span class="ec-icon">😕</span><h3>المنتج غير موجود</h3>' +
          "<p>ربما تم حذف هذا المنتج أو أن الرابط غير صحيح</p>" +
          '<a href="products.html" class="btn btn-primary">تصفح المتجر</a>' +
        "</div>";
      return;
    }

    var related = PRODUCTS.filter(function (p) { return p.cat === product.cat && p.id !== product.id; }).slice(0, 4);
    var title = document.getElementById("pageTitle");
    if (title) title.textContent = product.title + " — " + (CFG.brandName || "Sev Digital");

    var relatedBox = document.getElementById("relatedGrid");
    if (relatedBox) renderProductsGrid(relatedBox, related);

    var gallery = product.img
      ? '<div class="product-gallery has-img"><img src="' + product.img + '" alt="' + product.title + '" onerror="this.nextElementSibling.style.display=\'grid\';this.remove()"><span class="big-emoji">' + product.emoji + '</span></div>'
      : '<div class="product-gallery"><span class="big-emoji">' + product.emoji + "</span></div>";

    detail.innerHTML =
      gallery +
      '<div class="product-info">' +
        '<span class="eyebrow red">' + product.catName + "</span>" +
        "<h1>" + product.title + "</h1>" +
        '<div class="product-meta">' +
          '<span class="meta-item"><i>★</i> ' + product.rate + " / 5.0</span>" +
          '<span class="meta-item"><i>🗨️</i> ' + product.reviews + " تقييم</span>" +
          '<span class="meta-item"><i>📦</i> ' + product.sales + " عملية شراء</span>" +
          '<span class="meta-item"><i>⚡</i> تسليم فوري</span>' +
        "</div>" +
        '<p class="desc">' + product.desc + "</p>" +
        '<ul class="features-list">' +
          product.features.map(function (f) { return "<li><i>✓</i> " + f + "</li>"; }).join("") +
        "</ul>" +
        '<div class="big-price">' +
          '<span class="price">' + money(product.price) + "</span>" +
          (product.oldPrice ? '<span class="price old">' + money(product.oldPrice) + "</span>" : "") +
        "</div>" +
        '<div class="buy-actions">' +
          '<button class="btn btn-red btn-lg" onclick="window.SevAPI.add(' + product.id + ')">🛒 أضف إلى السلة</button>' +
          '<button class="btn btn-blue btn-lg" onclick="window.SevAPI.buyNow(' + product.id + ')">⚡ اشترِ الآن</button>' +
        "</div>" +
        '<div class="detail-notes">' +
          '<div class="note-item"><i>✉️</i> ' + (CFG.deliveryNote || "") + "</div>" +
          '<div class="note-item"><i>🔄</i> نسخة تجريبية: لن يتم خصم أي مبلغ — سيؤكد فريقنا الطلب معك.</div>' +
          '<div class="note-item"><i>💬</i> ' + (CFG.contact && CFG.contact.workHours ? CFG.contact.workHours : "دعم فني متواصل") + ".</div>" +
        "</div>" +
      "</div>";
  }

  /* ---------- صفحة السلة ---------- */
  function initCartPage() {
    var list = document.getElementById("cartList");
    if (!list) return;
    renderCartPage();
  }

  window.renderCartPage = function () {
    var list = document.getElementById("cartList");
    if (!list) return;
    var cart = getCart();

    if (!cart.length) {
      list.innerHTML =
        '<div class="empty-cart">' +
          '<span class="ec-icon">🛒</span><h3>سلتك فارغة حالياً</h3>' +
          "<p>اكتشف منتجاتنا الرقمية المميزة وأضف ما يعجبك</p>" +
          '<a href="products.html" class="btn btn-primary">ابدأ التسوق</a>' +
        "</div>";
      var summary = document.getElementById("cartSummary");
      if (summary) summary.innerHTML = "";
      return;
    }

    list.innerHTML = cart.map(function (item) {
      var p = PRODUCTS.find(function (x) { return x.id === item.id; });
      if (!p) return "";
      return (
        '<div class="cart-item" data-id="' + p.id + '">' +
          '<div class="cart-item-media"><span>' + p.emoji + "</span></div>" +
          '<div class="cart-item-info"><h4>' + p.title + "</h4>" +
            "<span>" + p.catName + " • سعر الوحدة " + money(p.price) + "</span></div>" +
          '<div class="qty-ctrl">' +
            '<button class="qty-btn" onclick="window.SevAPI.qty(' + p.id + ',-1)">−</button>' +
            '<span class="qty-num">' + Number(item.qty) + "</span>" +
            '<button class="qty-btn" onclick="window.SevAPI.qty(' + p.id + ',1)">＋</button>' +
          "</div>" +
          '<div class="cart-item-side">' +
            '<div class="cart-item-price">' + money(p.price * item.qty) + "</div>" +
            '<button class="remove-btn" onclick="window.SevAPI.remove(' + p.id + ')">✕ حذف</button>' +
          "</div>" +
        "</div>"
      );
    }).join("");

    var sub = cartTotal();
    var tax = sub * TAX;
    var total = sub + tax;
    var totalAfter = total * (1 - PROMO.discount);

    var summaryEl = document.getElementById("cartSummary");
    if (summaryEl) {
      summaryEl.innerHTML =
        "<h3>ملخص الطلب</h3>" +
        '<div class="sum-row"><span>المجموع الفرعي</span><span>' + money(sub) + "</span></div>" +
        '<div class="sum-row"><span>الضريبة (' + Math.round(TAX * 100) + "%)</span><span>" + money(tax) + "</span></div>" +
        '<input class="promo-input" type="text" placeholder="🧧 كود الخصم؟ جرب ' + PROMO.code + '">' +
        '<div class="sum-row total"><span>الإجمالي</span><span>' + money(total) + "</span></div>" +
        '<a href="checkout.html" class="btn btn-primary btn-block btn-lg" style="margin-top:16px">إتمام الطلب ←</a>';

      var promo = summaryEl.querySelector(".promo-input");
      promo.addEventListener("keydown", function (e) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (promo.value.trim().toUpperCase() === PROMO.code) {
          showToast("🎉 تم تفعيل كود الخصم " + Math.round(PROMO.discount * 100) + "%!");
          promo.value = PROMO.code;
          promo.style.borderColor = "var(--success)";
          var totalRow = summaryEl.querySelector(".sum-row.total span:last-child");
          if (totalRow) totalRow.textContent = money(totalAfter);
        } else {
          showToast("❌ كود الخصم غير صحيح", true);
        }
      });
    }
  };

  /* ---------- صفحة الدفع (مبسطة — بدون بوابات دفع متقدمة) ---------- */
  function initCheckoutPage() {
    var orderBox = document.getElementById("orderItems");
    var form = document.getElementById("payForm");
    if (!orderBox || !form) return;

    /* نصوص الدفع من الإعدادات */
    var payLabel = document.getElementById("payLabel");
    var payNote = document.getElementById("payNote");
    var deliveryNote = document.getElementById("deliveryNote");
    if (payLabel) payLabel.textContent = CFG.paymentLabel || "تأكيد يدوي";
    if (payNote) payNote.textContent = CFG.paymentNote || "";
    if (deliveryNote) deliveryNote.textContent = CFG.deliveryNote || "";

    var cart = getCart();
    var productId = new URLSearchParams(window.location.search).get("id");
    var items;
    if (productId) {
      var p = PRODUCTS.find(function (x) { return x.id === Number(productId); });
      items = p ? [{ id: p.id, qty: 1 }] : [];
    } else {
      items = cart;
    }

    if (!items.length) {
      orderBox.innerHTML =
        '<div class="empty-cart" style="padding:30px">' +
          '<span class="ec-icon">🛒</span><h3>لا يوجد منتج محدد</h3>' +
          '<a href="products.html" class="btn btn-primary" style="margin-top:14px">تصفح المتجر</a>' +
        "</div>";
      return;
    }

    var shown = [];
    items.forEach(function (it) {
      var prod = PRODUCTS.find(function (x) { return x.id === it.id; });
      if (!prod) return;
      shown.push(prod);
      orderBox.insertAdjacentHTML("beforeend",
        '<div class="order-item">' +
          '<div class="oi-icon"><span>' + prod.emoji + "</span></div>" +
          '<div class="oi-info"><h5>' + prod.title + "</h5><span>× " + Number(it.qty) + "</span></div>" +
          '<span class="oi-price">' + money(prod.price * it.qty) + "</span>" +
        "</div>"
      );
    });

    var sub = shown.reduce(function (s, x) { return s + x.price; }, 0);
    var tax = sub * TAX;
    var total = sub + tax;

    var billSub = document.getElementById("billSub");
    if (billSub) billSub.textContent = money(sub);
    var billTax = document.getElementById("billTax");
    if (billTax) billTax.textContent = money(tax);
    var billTotal = document.getElementById("billTotal");
    if (billTotal) billTotal.textContent = money(total);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fullName");
      var email = document.getElementById("email");
      var phone = document.getElementById("phone");
      if (!name || !email || !name.value.trim() || !email.value.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value)) {
        showToast("❌ يرجى تعبئة الاسم والبريد الإلكتروني بشكل صحيح", true);
        return;
      }
      var summaryLines = items.map(function (it) {
        var pr = PRODUCTS.find(function (x) { return x.id === it.id; });
        return pr ? pr.title + " × " + it.qty : null;
      }).filter(Boolean);
      var summaryText = summaryLines.join("، ");
      var totalText = money(sub + tax);

      /* 1) إشعار البائع عبر الإيميل (Netlify Forms) — يُرسل قبل الانتقال حتى لا يُقطَع */
      var fd = new FormData();
      fd.append("form-name", "checkout");
      fd.append("bot-field", "");
      fd.append("fullName", name.value.trim());
      fd.append("email", email.value.trim());
      if (phone && phone.value) fd.append("phone", phone.value.trim());
      fd.append("items", summaryText);
      fd.append("total", totalText);
      fd.append("method", CFG.paymentLabel || "تأكيد يدوي");
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/", fd);
      } else {
        fetch("/", { method: "POST", body: fd, keepalive: true, headers: { "Accept": "application/json" } }).catch(function () {});
      }

      /* 2) إشعار البائع عبر الواتساب برسالة جاهزة */
      var waDigits = ((CFG.contact && CFG.contact.whatsapp) || "").replace(/[^0-9]/g, "");
      if (waDigits) {
        var msg = "🛒 طلبية جديدة من Sev Digital" +
          "\n👤 " + name.value.trim() +
          "\n📧 " + email.value.trim() +
          (phone && phone.value ? "\n📞 " + phone.value.trim() : "") +
          "\n📦 " + summaryText +
          "\n💰 " + totalText +
          "\n" + (CFG.paymentLabel || "تأكيد يدوي");
        window.open("https://wa.me/" + waDigits + "?text=" + encodeURIComponent(msg), "_blank");
      }

      if (productId) {
        saveCart(getCart().filter(function (i) { return i.id !== Number(productId); }));
      } else {
        saveCart([]);
      }
      showToast("✅ تم استلام طلبك بنجاح!");
      setTimeout(function () {
        window.location.href = "success.html?name=" + encodeURIComponent(name.value.trim()) + "&items=" + encodeURIComponent(summaryText) + "&total=" + encodeURIComponent(totalText);
      }, 900);
    });
  }

  /* ---------- صفحة النجاح ---------- */
  function initSuccessPage() {
    var box = document.getElementById("successBody");
    if (!box) return;
    var params = new URLSearchParams(window.location.search);
    var nameRaw = params.get("name") || "عميلنا العزيز";
    var itemsRaw = params.get("items") || "المنتجات الرقمية";
    var totalRaw = params.get("total") || "حسب ملخص الطلب";
    var ref = "SV-" + Date.now().toString(36).toUpperCase().slice(-6);
    var waDigits = ((CFG.contact && CFG.contact.whatsapp) || "").replace(/[^0-9]/g, "");
    var waHref = "";
    if (waDigits) {
      var waMsg = "مرحباً، أنا " + nameRaw +
        "\n📦 منتجاتي: " + itemsRaw +
        "\n💰 المجموع: " + totalRaw +
        "\n🔖 المرجع: " + ref +
        "\nأرجو تأكيد طلبي / الاستفسار عنه.";
      waHref = "https://wa.me/" + waDigits + "?text=" + encodeURIComponent(waMsg);
    }
    box.innerHTML =
      '<div class="success-check">✓</div>' +
      '<h1 class="section-title" style="font-size:1.9rem;margin-bottom:12px">شكراً لك، ' + escapeHtml(nameRaw) + "! 🎉</h1>" +
      '<p style="color:var(--text-dim);margin-bottom:8px">تم تسجيل طلبك بنجاح.<br>طريقة الإتمام: <b style="color:var(--gold)">' + escapeHtml(CFG.paymentLabel || "تأكيد يدوي") + "</b></p>" +
      '<p style="color:var(--text-dim);margin-bottom:8px">المنتجات: <b style="color:var(--gold)">' + escapeHtml(itemsRaw) + "</b></p>" +
      '<p style="color:var(--text-dim);margin-bottom:10px">المجموع: <b style="color:var(--gold)">' + escapeHtml(totalRaw) + "</b> • مرجع الطلب: <b style=\"color:var(--gold)\">" + escapeHtml(ref) + "</b></p>" +
      '<div style="background:var(--gradient-soft);border:1.5px dashed rgba(139,92,246,0.5);border-radius:16px;padding:18px;margin:20px auto;max-width:460px;color:var(--text-dim);font-size:0.92rem">' +
        "🕐 " + (CFG.paymentNote || "") +
      "</div>" +
      (waHref
        ? '<a href="' + waHref + '" target="_blank" rel="noopener" class="btn btn-wa" style="margin-top:6px">' +
            "💬 أكّد طلبك الآن عبر واتساب" +
          "</a>"
        : "") +
      '<div class="hero-actions" style="justify-content:center;margin-top:16px">' +
        '<a href="products.html" class="btn btn-primary">متابعة التسوق</a>' +
        '<a href="index.html" class="btn btn-outline">العودة للرئيسية</a>' +
      "</div>";
  }

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function showToast(message, isError) {
    var toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.innerHTML =
      '<i>' + (isError ? "⚠️" : "✓") + "</i> " + message;
    toast.style.borderColor = isError ? "rgba(239,68,68,0.6)" : "rgba(139,92,246,0.6)";
    requestAnimationFrame(function () { toast.classList.add("show"); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("show"); }, 3000);
  }
  window.showToast = showToast;

  /* ---------- واجهة عامة ---------- */
  window.productCard = productCard;
  window.SevAPI = {
    add: function (id) { addToCart(id); },
    buyNow: function (id) { addToCart(id); window.location.href = "checkout.html?id=" + id; },
    remove: function (id) { removeFromCart(id); },
    qty: function (id, delta) { updateQty(id, delta); }
  };

  /* ---------- الهيرو (منتجات قابلة للتعديل في config) ---------- */
  function initHeroProducts() {
    var box = document.getElementById("heroProducts");
    if (!box) return;
    var ids = CFG.heroProducts || [];
    var items = ids.map(function (id) { return PRODUCTS.find(function (p) { return p.id === id; }); }).filter(Boolean).slice(0, 3);
    var iconKinds = ["red", "blue", "gold"];
    box.innerHTML = items.map(function (p, i) {
      return (
        '<div class="mini-product anim-rise" style="cursor:pointer;animation-delay:' + (i * 140 + 180) + 'ms" onclick="window.location.href=\'product.html?id=' + p.id + '\'">' +
          '<span class="mp-icon ' + iconKinds[i % 3] + '">' + p.emoji + "</span>" +
          "<div><p class=\"mp-name\">" + p.title + '</p><p class="mp-cat">' + p.catName + "</p></div>" +
          '<div class="mp-info"><p class="mp-price">' + money(p.price) + '</p><p class="mp-sales">🔥 ' + p.sales + " مبيعات</p></div>" +
        "</div>"
      );
    }).join("");
  }

  function initHeroStat() {
    var el = document.getElementById("statProducts");
    var em = el ? el.querySelector("em") : null;
    if (em) em.textContent = PRODUCTS.length;
  }

  /* ---------- الصفحة الرئيسية: التصنيفات + المميز + الهيرو ---------- */
  function initHomePage() {
    var catsGrid = document.getElementById("catsGrid");
    if (catsGrid) {
      catsGrid.innerHTML = CATEGORIES.filter(function (c) { return c.id !== "all"; }).map(function (c) {
        return (
          '<a href="products.html?cat=' + c.id + '" class="cat-card">' +
            '<span class="cat-icon">' + c.icon + "</span>" +
            "<h4>" + c.name + "</h4>" +
            "<p>" + PRODUCTS.filter(function (p) { return p.cat === c.id; }).length + " منتجات</p>" +
          "</a>"
        );
      }).join("");
    }

    var featuredGrid = document.getElementById("featuredGrid");
    if (featuredGrid) {
      var featured = PRODUCTS.filter(function (p) { return p.badge && p.badge.indexOf("الأكثر") > -1; }).slice(0, 4);
      var rest = PRODUCTS.filter(function (p) { return featured.indexOf(p) === -1; })
        .sort(function (a, b) { return b.rate - a.rate; })
        .slice(0, Math.max(0, 8 - featured.length));
      renderProductsGrid(featuredGrid, featured.concat(rest));
    }
  }

  /* ---------- الشريط السفلي (تجربة التطبيق) ---------- */
  function initAppBar() {
    var body = document.body;
    if (body.querySelector(".app-bar")) return;

    var icons = {
      home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
      shop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
      cart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>',
      contact: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>'
    };
    var links = [
      { id: "home", href: "index.html", label: "الرئيسية", icon: icons.home },
      { id: "shop", href: "products.html", label: "المتجر", icon: icons.shop },
      { id: "cart", href: "cart.html", label: "السلة", icon: icons.cart, badge: true },
      { id: "contact", href: "contact.html", label: "تواصل", icon: icons.contact }
    ];

    var path = window.location.pathname;
    var nav = document.createElement("nav");
    nav.className = "app-bar";
    nav.setAttribute("aria-label", "التنقل السفلي");
    nav.innerHTML = links.map(function (l) {
      var active = false;
      if (l.href === "index.html" && (path === "/" || path.endsWith("index.html"))) active = true;
      else if (path.endsWith(l.href)) active = true;
      if (l.id === "cart" && !path.endsWith("cart.html") && (path.endsWith("checkout.html") || path.endsWith("success.html"))) active = true;
      var badge = l.badge ? '<span class="nav-cart-badge" style="display:none">0</span>' : "";
      return (
        '<a class="app-bar-link' + (active ? " active" : "") + '" href="' + l.href + '">' +
          l.icon + badge + "<span>" + l.label + "</span>" +
        "</a>"
      );
    }).join("");
    body.appendChild(nav);
    renderCartCount();
  }

  /* ---------- القائمة الرئيسية على الجوال ---------- */
  function initHamburger() {
    var btn = document.getElementById("hamburger");
    var links = document.getElementById("navLinks");
    if (!btn || !links) return;
    btn.addEventListener("click", function () {
      btn.classList.toggle("open");
      links.classList.toggle("open");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        btn.classList.remove("open");
        links.classList.remove("open");
      }
    });
  }

  /* ---------- زر العودة للأعلى ---------- */
  function initToTop() {
    var btn = document.getElementById("toTop");
    if (!btn) return;
    window.addEventListener("scroll", function () {
      btn.classList.toggle("show", window.scrollY > 400);
    });
    btn.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ---------- حركات الظهور عند التمرير ---------- */
  function initReveal() {
    var els = document.querySelectorAll(
      ".product-card, .feature-card, .testi-card, .cat-card, .section-head, .cart-item, .form-card, .order-summary, .cart-summary, .cta-box"
    );
    var elems = Array.prototype.slice.call(els);
    if (!("IntersectionObserver" in window)) {
      elems.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.06 });
    elems.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = Math.min(i % 12, 10) * 55 + "ms";
      io.observe(el);
    });
  }

  /* ---------- زر واتساب العائم ---------- */
  function initWaFloat() {
    if (document.querySelector(".wa-float")) return;
    var digits = ((CFG.contact && CFG.contact.whatsapp) || "").replace(/[^0-9]/g, "");
    if (!digits) return;
    var a = document.createElement("a");
    a.className = "wa-float";
    a.href = "https://wa.me/" + digits + "?text=" + encodeURIComponent("مرحباً! وصلتك من موقع Sev Digital 👋");
    a.target = "_blank";
    a.rel = "noopener";
    a.setAttribute("aria-label", "تواصل عبر واتساب");
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>';
    document.body.appendChild(a);
  }

  function initSW() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () {});
  }

  /* ---------- ربط الشرائط النشطة ---------- */
  function initActiveNav() {
    var path = window.location.pathname;
    document.querySelectorAll(".nav-links a").forEach(function (a) {
      var href = a.getAttribute("href");
      if (href === "index.html" && (path === "/" || path.endsWith("index.html"))) a.classList.add("active");
      else if (href && path.endsWith(href)) a.classList.add("active");
    });
  }

  /* ---------- التشغيل ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    applyTheme();
    applyBranding();
    applyContact();
    renderCartCount();
    initHamburger();
    initToTop();
    initSW();
    initAppBar();
    initWaFloat();
    initShopPage();
    initProductPage();
    initCartPage();
    initCheckoutPage();
    initSuccessPage();
    initHeroProducts();
    initHomePage();
    initHeroStat();
    initActiveNav();
    initReveal();
  });
})();