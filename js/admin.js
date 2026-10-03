/* ============================================================
   Sev Digital — لوحة التحكم (Admin)
   تعديل المنتجات والتصنيفات والإعدادات بالنقر، بدون كتابة كود.
   في الآخر يولّد ملف js/data.js جاهز تُحدّثه في المشروع.
   ============================================================ */

var DRAFT_KEY = "sev_admin_draft_v1";
var CURRENT_PRODUCT = -1;
var CURRENT_CATEGORY = -1;
var previewCat = "all";

var BADGE_COLORS = [
  { id: "", name: "بلا لون", cls: "sw-none", label: "✕" },
  { id: "badge-red", name: "بنفسجي", cls: "sw-red" },
  { id: "badge-blue", name: "وردي", cls: "sw-blue" },
  { id: "badge-gold", name: "ذهبي", cls: "sw-gold" },
  { id: "badge-green", name: "أخضر", cls: "sw-green" }
];

var EMOJI_CHOICES = [
  "🎬", "📺", "🔥", "✨", "🌙", "🧩", "🚀", "🎵", "🎮", "📱", "💻", "📚",
  "🎨", "🏆", "⚽", "🎯", "👑", "💎", "🛡️", "🌍", "🧠", "💡", "🎧", "📸",
  "🗓️", "🪙", "🐉", "🦁", "🐼", "🍿", "🏰", "🧊", "🔮", "🕹️", "🧲", "🪄",
  "⭐", "🎬", "🏅", "🥇", "🔔", "📦", "🧃", "🍭", "🎪", "🗝️", "🛒", "🚀"
];

/* ---------- حالة التطبيق ---------- */
var state = { products: [], categories: [], config: null };

/* ---------- أدوات عامة ---------- */

function $(sel) { return document.querySelector(sel); }
function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

function esc(v) {
  return String(v == null ? "" : v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

function num(v, fallback) {
  var n = parseFloat(v);
  return isFinite(n) ? n : (fallback || 0);
}

function toast(msg, isErr) {
  var t = $("#toast");
  t.textContent = msg;
  t.className = "toast on" + (isErr ? " err" : "");
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.className = "toast"; }, 3200);
}

function catById(id) {
  for (var i = 0; i < state.categories.length; i++) {
    if (state.categories[i].id === id) return state.categories[i];
  }
  return null;
}

function catName(id) {
  var c = catById(id);
  return c ? c.name : "غير مصنّف";
}

/* ============================================================
   1) التحميل والحفظ
   ============================================================ */

function loadInitial() {
  var draft = null;
  try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null"); } catch (e) { draft = null; }

  if (draft && draft.products && draft.categories) {
    state.products = draft.products;
    state.categories = draft.categories;
    state.config = draft.config || clone(SITE_CONFIG);
    renderAll();
    showDraftNotice();
    return;
  }

  state.categories = clone(CATEGORIES);
  state.products = clone(PRODUCTS).map(normalizeProduct);
  state.config = clone(SITE_CONFIG);

  renderAll();
  saveDraft();
}

/* ضمان وجود كل الحقول + إصلاح الأيقونات الناقصة */
function normalizeProduct(p) {
  var c = catByIdSafe(p.cat);
  return {
    id: num(p.id, 0),
    title: p.title || "منتج بدون عنوان",
    cat: p.cat || "other",
    catName: p.catName || (c ? c.name : ""),
    emoji: p.emoji || (c ? c.icon : "🧩") || "🧩",
    price: num(p.price, 0),
    oldPrice: num(p.oldPrice, 0),
    rate: num(p.rate, 5),
    reviews: num(p.reviews, 0),
    sales: p.sales == null ? "" : String(p.sales),
    badge: p.badge || null,
    badgeColor: p.badgeColor || "",
    features: Array.isArray(p.features) ? p.features.slice() : [],
    desc: p.desc || ""
  };
}

/* نسخة آمنة قبل ما تكون state.categories جاهزة */
function catByIdSafe(id) {
  var list = (typeof CATEGORIES !== "undefined") ? CATEGORIES : [];
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
  } catch (e) {
    toast("تعذّر حفظ المسودة محلياً", true);
  }
}

function discardDraft() {
  if (!confirm("غادي يتمحيّد كل التعديلات اللي ما تصدّرتيش والرجوع للمحتوى الأصلي ديال الملفات.\nمتأكد؟")) return;
  try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  state.categories = clone(CATEGORIES);
  state.products = clone(PRODUCTS).map(normalizeProduct);
  state.config = clone(SITE_CONFIG);
  renderAll();
  toast("رجعنا للمحتوى الأصلي");
}

function showDraftNotice() {
  var box = $("#draftNote");
  box.className = "alert alert-info";
  box.innerHTML =
    "<span>💡</span><div><b>رجّعنا المسودة المحفوظة</b> — عندك تعديلات ما تصدّرتش بعد. " +
    "الموقع نفسه ما تأثّرش، التعديلات كتبقى عندك حتى ت export.</div>";
  box.style.display = "flex";
}

function hideDraftNotice() {
  $("#draftNote").style.display = "none";
}

/* ============================================================
   2) تطبيق الهوية اللونية على اللوحة
   ============================================================ */

function applyColors() {
  var c = state.config && state.config.colors;
  if (!c) return;
  var map = {
    "--red": c.red, "--red-dark": c.redDark, "--blue": c.blue,
    "--blue-light": c.blueLight, "--gold": c.gold, "--bg": c.bg,
    "--bg-2": c.bg2, "--card": c.card, "--card-2": c.card2,
    "--text": c.text, "--text-dim": c.textDim
  };
  Object.keys(map).forEach(function (k) {
    if (map[k]) document.documentElement.style.setProperty(k, map[k]);
  });
  document.documentElement.style.setProperty("--gradient",
    "linear-gradient(135deg, " + c.red + " 0%, #a855f7 40%, " + c.blue + " 100%)");
  document.documentElement.style.setProperty("--gradient-soft",
    "linear-gradient(135deg, " + hexA(c.red, 0.16) + ", " + hexA(c.blue, 0.16) + ")");
}

function hexA(hex, a) {
  var h = String(hex || "").replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length !== 6) return "rgba(139,92,246," + a + ")";
  var n = parseInt(h, 16);
  return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
}

function money(v) {
  var s = (Math.round(num(v, 0) * 100) / 100).toString();
  return s + " " + (state.config.currency || "د.م.");
}

/* ============================================================
   3) العرض العام
   ============================================================ */

function renderAll() {
  applyColors();
  renderCounts();
  renderProductList();
  renderCategoryList();
  renderSettings();
  renderPreview();
  renderStats();
  renderCode();
  fillEditorSelects();
}

function renderCounts() {
  $("#cntProducts").textContent = state.products.length;
  $("#cntCategories").textContent = state.categories.length;
}

function renderStats() {
  var on = state.products.filter(function (p) { return p.price > 0; });
  var avg = on.length
    ? Math.round(on.reduce(function (s, p) { return s + p.price; }, 0) / on.length)
    : 0;
  var withOffer = state.products.filter(function (p) { return p.oldPrice > p.price && p.price > 0; }).length;
  var noEmoji = state.products.filter(function (p) { return !p.emoji; }).length;

  $("#stats").innerHTML =
    '<div class="stat"><b>' + state.products.length + "</b><span>منتج</span></div>" +
    '<div class="stat"><b>' + state.categories.length + "</b><span>تصنيف</span></div>" +
    '<div class="stat"><b>' + avg + "</b><span>متوسط السعر</span></div>" +
    '<div class="stat"><b>' + withOffer + "</b><span>عندها تخفيض</span></div>" +
    '<div class="stat"><b>' + noEmoji + "</b><span>بلا صورة</span></div>";
}

/* ---------- قائمة المنتجات ---------- */

function renderProductList() {
  var q = ($("#searchProducts").value || "").trim().toLowerCase();
  var f = $("#filterCat").value || "all";

  var rows = state.products.map(function (p, i) { return { p: p, i: i }; });
  if (f !== "all") rows = rows.filter(function (r) { return r.p.cat === f; });
  if (q) {
    rows = rows.filter(function (r) {
      return (r.p.title + " " + r.p.desc + " " + (r.p.badge || "")).toLowerCase().indexOf(q) > -1;
    });
  }

  $("#pCount").textContent = rows.length + " / " + state.products.length;

  var box = $("#plist");
  if (!rows.length) {
    box.innerHTML =
      '<div class="empty"><span class="ec">📭</span><h3>ما كاين حتى منتج</h3>' +
      "<p>بدّل البحث ولا ضيف منتج جديد</p></div>";
    return;
  }

  box.innerHTML = rows.map(function (r) {
    var p = r.p, i = r.i;
    var offer = p.oldPrice > p.price && p.price > 0
      ? " <span class='tag tag-green'>-" + Math.round((1 - p.price / p.oldPrice) * 100) + "%</span>"
      : "";
    var badge = p.badge
      ? "<span class='tag " + esc(p.badgeColor || "tag-mute") + "'>" + esc(p.badge) + "</span>"
      : "";
    var priceOld = p.oldPrice > p.price
      ? " <s style='color:var(--text-mute);font-size:.8rem'>" + money(p.oldPrice) + "</s>"
      : "";

    return (
      '<div class="pcard" data-i="' + i + '">' +
        '<div class="pemoji">' + esc(p.emoji || "❔") + "</div>" +
        '<div class="pmeta">' +
          '<div class="ptitle">' + esc(p.title) + ' <span class="pid">#' + esc(p.id) + "</span>" + badge + "</div>" +
          '<div class="psub">' +
            "<span>📂 " + esc(catName(p.cat)) + "</span>" +
            "<span>💰 <b>" + money(p.price) + "</b>" + priceOld + "</span>" +
            "<span>★ " + esc(p.rate) + " (" + esc(p.reviews) + ")</span>" +
          "</div>" +
        "</div>" +
        '<div class="pbtns">' +
          '<button class="icon-btn" data-act="up" data-i="' + i + '" title="أعلى"' + (i === 0 ? " disabled" : "") + ">↑</button>" +
          '<button class="icon-btn" data-act="down" data-i="' + i + '" title="أسفل"' + (i === state.products.length - 1 ? " disabled" : "") + ">↓</button>" +
          '<button class="icon-btn" data-act="dup" data-i="' + i + '" title="نسخ">⧉</button>' +
          '<button class="icon-btn" data-act="edit" data-i="' + i + '" title="تعديل">✏️</button>' +
          '<button class="icon-btn danger" data-act="del" data-i="' + i + '" title="حذف">🗑️</button>' +
        "</div>" +
      "</div>"
    );
  }).join("");
}

function fillEditorSelects() {
  var sel = $("#fCat");
  var cur = sel.value;
  sel.innerHTML = state.categories
    .filter(function (c) { return c.id !== "all"; })
    .map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.icon || "") + " " + esc(c.name) + "</option>";
    })
    .join("");
  if (cur) sel.value = cur;

  var f = $("#filterCat");
  var fc = f.value;
  f.innerHTML = '<option value="all">كل التصنيفات</option>' + state.categories
    .filter(function (c) { return c.id !== "all"; })
    .map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.icon || "") + " " + esc(c.name) + "</option>"; })
    .join("");
  f.value = fc;
}

/* ---------- التصنيفات ---------- */

function renderCategoryList() {
  var counts = {};
  state.products.forEach(function (p) { counts[p.cat] = (counts[p.cat] || 0) + 1; });

  $("#clist").innerHTML = state.categories.map(function (c, i) {
    var n = c.id === "all" ? state.products.length : (counts[c.id] || 0);
    var locked = c.id === "all";
    return (
      '<div class="pcard" data-i="' + i + '">' +
        '<div class="pemoji">' + esc(c.icon || "📦") + "</div>" +
        '<div class="pmeta">' +
          '<div class="ptitle">' + esc(c.name) +
            (locked ? ' <span class="pid">ثابت</span>' : "") + "</div>" +
          '<div class="psub">' +
            "<span>🔑 <b>" + esc(c.id) + "</b></span>" +
            "<span>📦 " + n + " منتج</span>" +
          "</div>" +
        "</div>" +
        '<div class="pbtns">' +
          '<button class="icon-btn" data-act="cedit" data-i="' + i + '" title="تعديل">✏️</button>' +
          '<button class="icon-btn danger" data-act="cdel" data-i="' + i + '" title="حذف"' + (locked ? " disabled" : "") + ">🗑️</button>" +
        "</div>" +
      "</div>"
    );
  }).join("");
}

/* ---------- الإعدادات ---------- */

var COLOR_FIELDS = [
  ["red", "الأساسي"], ["redDark", "أساسي غامق"], ["blue", "الثانوي"],
  ["blueLight", "ثانوي فاتح"], ["blueDeep", "ثانوي غامق"], ["gold", "الذهبي"],
  ["goldLight", "ذهبي فاتح"], ["bg", "الخلفية"], ["bg2", "خلفية 2"],
  ["bg3", "خلفية 3"], ["card", "البطاقة"], ["card2", "بطاقة 2"],
  ["text", "النص"], ["textDim", "نص خافت"], ["textMute", "نص مكتوم"]
];

function renderSettings() {
  var c = state.config;

  setVal("sBrandName", c.brandName);
  setVal("sBrandShort", c.brandShort);
  setVal("sTagline", c.tagline);
  setVal("sCurrency", c.currency);
  setVal("sTax", Math.round(c.taxRate * 100));
  setVal("sPromoCode", c.promo && c.promo.code);
  setVal("sPromoOff", c.promo ? Math.round(c.promo.discount * 100) : 0);

  setVal("sEmail", c.contact && c.contact.email);
  setVal("sPhone", c.contact && c.contact.phone);
  setVal("sWa", c.contact && c.contact.whatsapp);
  setVal("sHours", c.contact && c.contact.workHours);

  setVal("sPaymentNote", c.paymentNote);
  setVal("sDeliveryNote", c.deliveryNote);

  $("#colorGrid").innerHTML = COLOR_FIELDS.map(function (f) {
    return (
      '<label class="color-item">' +
        '<input type="color" data-color="' + f[0] + '" value="' + esc(c.colors[f[0]] || "#000000") + '">' +
        '<span class="ci-txt"><b>' + esc(f[1]) + "</b><span>" + esc(f[0]) + "</span></span>" +
      "</label>"
    );
  }).join("");

  var hero = (c.heroProducts || []).map(String);
  $("#heroBox").innerHTML = state.products.length
    ? state.products.map(function (p) {
        var id = String(p.id);
        return (
          '<label class="pcard" style="grid-template-columns:44px 1fr;cursor:pointer">' +
            '<div class="pemoji" style="width:44px;height:44px;font-size:1.3rem">' + esc(p.emoji || "❔") + "</div>" +
            '<div class="pmeta"><div class="ptitle" style="font-size:.88rem">' + esc(p.title) + "</div></div>" +
            '<input type="checkbox" data-hero="' + esc(id) + '"' + (hero.indexOf(id) > -1 ? " checked" : "") +
            ' style="width:20px;height:20px;accent-color:#8b5cf6">' +
          "</label>"
        );
      }).join("")
    : '<div class="empty"><span class="ec">📭</span><p>زيد منتجات قبل ما تختار</p></div>';

  $("#testiBox").value = (c.testimonials || []).map(function (t) {
    return [t.name, t.role, t.rating, t.text].join(" | ");
  }).join("\n");
}

function setVal(id, v) { var el = $("#" + id); if (el) el.value = v == null ? "" : v; }

/* ---------- المعاينة ---------- */

function renderPreview() {
  var box = $("#pvChips");
  var cats = state.categories.filter(function (c) { return c.id !== "all"; });
  if (previewCat !== "all" && !cats.some(function (c) { return c.id === previewCat; })) previewCat = "all";

  box.innerHTML =
    '<button class="chip' + (previewCat === "all" ? " active" : "") + '" data-pv="all">الكل (' + state.products.length + ")</button>" +
    cats.map(function (c) {
      var n = state.products.filter(function (p) { return p.cat === c.id; }).length;
      return '<button class="chip' + (previewCat === c.id ? " active" : "") + '" data-pv="' + esc(c.id) + '">' +
        esc(c.icon || "") + " " + esc(c.name) + " (" + n + ")</button>";
    }).join("");

  var items = state.products.filter(function (p) { return previewCat === "all" || p.cat === previewCat; });
  var g = $("#pvGrid");

  if (!items.length) {
    g.innerHTML = '<div class="empty" style="grid-column:1/-1"><span class="ec">📭</span><p>ما كاين حتى منتج هنا</p></div>';
    return;
  }

  g.innerHTML = items.map(function (p) {
    var offer = p.oldPrice > p.price && p.price > 0
      ? '<span class="pv-offer">-' + Math.round((1 - p.price / p.oldPrice) * 100) + "%</span>" : "";
    var badge = p.badge
      ? '<span class="pv-badge ' + esc(p.badgeColor || "tag-mute") + '">' + esc(p.badge) + "</span>" : "";
    return (
      '<article class="pv-card">' +
        '<div class="pv-media">' + badge + offer + esc(p.emoji || "❔") + "</div>" +
        '<div class="pv-body">' +
          '<span class="pv-cat">' + esc(catName(p.cat)) + "</span>" +
          '<h3 class="pv-title">' + esc(p.title) + "</h3>" +
          '<div class="pv-rate"><span class="st">★ ' + esc(p.rate) + "</span>" +
            "<span>(" + esc(p.reviews) + " تقييم)</span>" +
            (p.sales ? "<span>" + esc(p.sales) + " مبيعات</span>" : "") + "</div>" +
          '<div class="pv-foot"><div><span class="pv-price">' + money(p.price) + "</span>" +
            (p.oldPrice > p.price ? '<span class="pv-old">' + money(p.oldPrice) + "</span>" : "") +
            "</div>" +
            '<div class="pv-add">＋</div></div>' +
        "</div>" +
      "</article>"
    );
  }).join("");
}

/* ============================================================
   4) محرّر المنتج
   ============================================================ */

function openEditor(i) {
  CURRENT_PRODUCT = i;
  var isNew = i < 0;
  var p = isNew
    ? normalizeProduct({
        id: nextId(), title: "", cat: firstRealCat(),
        price: 0, oldPrice: 0, rate: 5, reviews: 0, sales: "",
        badge: null, badgeColor: "", features: [""], desc: ""
      })
    : clone(state.products[i]);

  fillEditorSelects();
  setVal("fId", p.id);
  setVal("fEmoji", p.emoji);
  setVal("fTitle", p.title);
  $("#fCat").value = p.cat;
  setVal("fPrice", p.price);
  setVal("fOldPrice", p.oldPrice);
  setVal("fRate", p.rate);
  setVal("fReviews", p.reviews);
  setVal("fSales", p.sales);
  setVal("fBadge", p.badge || "");
  setVal("fFeatures", p.features.join("\n"));
  setVal("fDesc", p.desc);
  setBadgeColor(p.badgeColor || "");
  renderEmojiPicker(p.emoji);

  $("#editorTitle").textContent = isNew ? "➕ منتج جديد" : "✏️ تعديل المنتج";
  $("#drawer").classList.add("on");
  $("#drawerBg").classList.add("on");
  document.body.style.overflow = "hidden";
  setTimeout(function () { $("#fTitle").focus(); }, 260);
}

function closeEditor() {
  $("#drawer").classList.remove("on");
  $("#drawerBg").classList.remove("on");
  document.body.style.overflow = "";
  CURRENT_PRODUCT = -1;
}

function setBadgeColor(id) { $("#fBadgeColor").value = id || ""; renderSwatches(); }

function renderSwatches() {
  var cur = $("#fBadgeColor").value;
  $("#swatches").innerHTML = BADGE_COLORS.map(function (b) {
    return '<button class="sw ' + b.cls + (cur === b.id ? " on" : "") +
      '" data-bc="' + esc(b.id) + '" title="' + esc(b.name) + '">' + esc(b.label) + "</button>";
  }).join("");
}

function renderEmojiPicker(current) {
  var uniq = EMOJI_CHOICES.filter(function (e, i) { return EMOJI_CHOICES.indexOf(e) === i; });
  $("#emojiPicker").innerHTML = uniq.map(function (e) {
    return '<button type="button" data-emoji="' + esc(e) + '">' + e + "</button>";
  }).join("");
}

function commitEditor() {
  var cat = $("#fCat").value;
  var c = catById(cat);

  var title = ($("#fTitle").value || "").trim();
  if (!title) { toast("العنوان خاصو يكون موجود", true); $("#fTitle").focus(); return; }

  var price = num($("#fPrice").value, 0);
  var oldPrice = num($("#fOldPrice").value, 0);

  var err = validateProduct({
    id: num($("#fId").value, 0),
    title: title, price: price, oldPrice: oldPrice,
    rate: num($("#fRate").value, 5), cat: cat
  }, CURRENT_PRODUCT);
  if (err) { toast(err, true); return; }

  var p = {
    id: num($("#fId").value, 0),
    title: title,
    cat: cat,
    catName: c ? c.name : "",
    emoji: ($("#fEmoji").value || "").trim() || (c ? c.icon : "🧩"),
    price: price,
    oldPrice: oldPrice,
    rate: num($("#fRate").value, 5),
    reviews: num($("#fReviews").value, 0),
    sales: ($("#fSales").value || "").trim(),
    badge: ($("#fBadge").value || "").trim() || null,
    badgeColor: $("#fBadgeColor").value || "",
    features: ($("#fFeatures").value || "")
      .split("\n")
      .map(function (s) { return s.trim(); })
      .filter(function (s) { return s.length; }),
    desc: ($("#fDesc").value || "").trim()
  };

  if (CURRENT_PRODUCT < 0) {
    state.products.push(p);
    toast("تزاد المنتج ✅");
  } else {
    state.products[CURRENT_PRODUCT] = p;
    toast("تسجّل التعديل ✅");
  }

  saveDraft();
  renderAll();
  closeEditor();
  flashRow(p.id);
}

function validateProduct(p, ignoreIndex) {
  if (p.id <= 0) return "المعرّف (ID) خاصو يكون رقم أكبر من 0";
  for (var i = 0; i < state.products.length; i++) {
    if (i !== ignoreIndex && state.products[i].id === p.id) return "المعرّف " + p.id + " مستعمل من قبل";
  }
  if (!p.cat || p.cat === "all") return "اختار تصنيفاً صحيحاً";
  if (p.price < 0 || p.oldPrice < 0) return "السعر ما يمكنش يكون بالسالب";
  if (p.rate < 0 || p.rate > 5) return "التقييم خاصو يكون بين 0 و 5";
  return "";
}

function nextId() {
  var max = 0;
  state.products.forEach(function (p) { if (p.id > max) max = p.id; });
  return max + 1;
}

function firstRealCat() {
  for (var i = 0; i < state.categories.length; i++) {
    if (state.categories[i].id !== "all") return state.categories[i].id;
  }
  return "other";
}

function flashRow(id) {
  var row = $('#plist .pcard[data-i="' + state.products.map(function (p) { return p.id; }).indexOf(id) + '"]');
  if (!row) return;
  row.classList.add("flash");
  row.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(function () { row.classList.remove("flash"); }, 900);
}

/* ---------- محرّر التصنيف ---------- */

function openCatEditor(i) {
  CURRENT_CATEGORY = i;
  var isNew = i < 0;
  var c = isNew ? { id: "", name: "", icon: "📦" } : clone(state.categories[i]);

  $("#cId").value = c.id;
  $("#cName").value = c.name;
  $("#cIcon").value = c.icon || "";
  $("#cId").disabled = !isNew;
  $("#catEditorTitle").textContent = isNew ? "➕ تصنيف جديد" : "✏️ تعديل التصنيف";
  renderEmojiPickerCat();

  $("#catDrawer").classList.add("on");
  $("#drawerBg").classList.add("on");
  document.body.style.overflow = "hidden";
  setTimeout(function () { (isNew ? $("#cName") : $("#cId")).focus(); }, 260);
}

function renderEmojiPickerCat() {
  var uniq = EMOJI_CHOICES.filter(function (e, i) { return EMOJI_CHOICES.indexOf(e) === i; });
  $("#catEmojiPicker").innerHTML = uniq.map(function (e) {
    return '<button type="button" data-emoji="' + esc(e) + '">' + e + "</button>";
  }).join("");
}

function closeCatEditor() {
  $("#catDrawer").classList.remove("on");
  $("#drawerBg").classList.remove("on");
  document.body.style.overflow = "";
  CURRENT_CATEGORY = -1;
}

function commitCatEditor() {
  var id = ($("#cId").value || "").trim().toLowerCase().replace(/\s+/g, "-");
  var name = ($("#cName").value || "").trim();
  var icon = ($("#cIcon").value || "").trim() || "📦";

  if (!name) { toast("اسم التصنيف خاصو يكون موجود", true); return; }

  if (CURRENT_CATEGORY < 0) {
    if (!id) { toast("الرمز (ID) خاصو يكون موجود", true); $("#cId").focus(); return; }
    if (catById(id)) { toast("الرمز " + id + " مستعمل من قبل", true); return; }
    state.categories.push({ id: id, name: name, icon: icon });
    toast("تزاد التصنيف ✅");
  } else {
    var c = state.categories[CURRENT_CATEGORY];
    if (c.id === "all") { toast("ما يمكنش تبدّل تصنيف «الكل»", true); return; }
    var newId = id || c.id;
    if (newId !== c.id && catById(newId)) { toast("الرمز " + newId + " مستعمل من قبل", true); return; }
    c.id = newId;
    c.name = name;
    c.icon = icon;
    state.products.forEach(function (p) {
      if (p.cat === newId) p.catName = name;
    });
    toast("تسجّل التعديل ✅");
  }

  saveDraft();
  renderAll();
  closeCatEditor();
}

/* ============================================================
   5) توليد الملفات
   ============================================================ */

function jstr(v) { return JSON.stringify(String(v == null ? "" : v)); }

function jnum(v) {
  var n = Math.round(num(v, 0) * 100) / 100;
  return String(n);
}

/* كائن = سطر لكل خاصية، مصفوفة بسيطة = سطر واحد */
function serialize(value, indent, inlineArrays) {
  var pad = " ".repeat(indent);

  if (value === null) return "null";
  if (Array.isArray(value)) {
    if (!value.length) return "[]";
    var isPrimitive = value.every(function (v) { return typeof v !== "object" || v === null; });
    if (isPrimitive || inlineArrays) {
      return "[" + value.map(function (v) { return serialize(v, 0, true); }).join(", ") + "]";
    }
    return "[\n" + value.map(function (v) {
      return pad + "  " + serialize(v, indent + 2, false);
    }).join(",\n") + "\n" + pad + "]";
  }

  if (typeof value === "object") {
    var keys = Object.keys(value);
    if (!keys.length) return "{}";
    return "{\n" + keys.map(function (k) {
      var v = value[k];
      var line = pad + "  " + (/^[A-Za-z_$][\w$]*$/.test(k) ? k : jstr(k)) + ": " + serialize(v, indent + 2, false);
      if (k === "avatarBg" && typeof v === "string" && v.indexOf("gradient") > -1) {
        line += " /* يُحدَّث تلقائياً مع الألوان */";
      }
      return line;
    }).join(",\n") + "\n" + pad + "}";
  }

  if (typeof value === "string") return jstr(value);
  return String(value);
}

function buildDataJS() {
  var lines = [];
  lines.push("/* ============================================================");
  lines.push("   Sev Digital — بيانات المنتجات الرقمية");
  lines.push("   هذا الملف مولّد من لوحة التحكم (admin.html)");
  lines.push("   تقدر تعديله هنا مباشرة أو ترجع للوحة التحكم");
  lines.push("   ============================================================ */");
  lines.push("");
  lines.push("const CATEGORIES = [");
  lines.push(state.categories.map(function (c) {
    return "  { id: " + jstr(c.id) + ", name: " + jstr(c.name) + ", icon: " + jstr(c.icon || "📦") + " }";
  }).join(",\n"));
  lines.push("];");
  lines.push("");
  lines.push("const PRODUCTS = [");

  var blocks = [];
  state.products.forEach(function (p) {
    var body = [
      "    id: " + jnum(p.id),
      "    title: " + jstr(p.title),
      "    cat: " + jstr(p.cat),
      "    catName: " + jstr(p.catName || catName(p.cat)),
      "    emoji: " + jstr(p.emoji || "🧩"),
      "    price: " + jnum(p.price),
      "    oldPrice: " + jnum(p.oldPrice),
      "    rate: " + jnum(p.rate),
      "    reviews: " + jnum(p.reviews),
      "    sales: " + jstr(p.sales),
      "    badge: " + (p.badge ? jstr(p.badge) : "null"),
      "    badgeColor: " + jstr(p.badgeColor || ""),
      "    features: [" + p.features.map(jstr).join(", ") + "]",
      "    desc: " + jstr(p.desc)
    ].join(",\n");
    blocks.push("  {\n" + body + "\n  }");
  });

  /* نحط تعليقات بين التصنيفات باش الملف يبقى مقروء */
  var withComments = [];
  var lastCat = null;
  blocks.forEach(function (b, i) {
    var p = state.products[i];
    if (p.cat !== lastCat) {
      lastCat = p.cat;
      var c = catById(p.cat);
      withComments.push("  /* " + (c ? c.icon + " " + c.name : p.cat) + " */");
    }
    withComments.push(b);
  });

  lines.push(withComments.join(",\n"));
  lines.push("];");
  lines.push("");
  return lines.join("\n");
}

function buildConfigJS() {
  var c = clone(state.config);

  /* نحيّد أي معرّف منتج ما بقاش موجود */
  var liveIds = state.products.map(function (p) { return p.id; });
  c.heroProducts = (c.heroProducts || []).filter(function (id) {
    return liveIds.indexOf(num(id, -1)) > -1;
  });

  /* نحدّث تدرجات الألوان فـ آراء العملاء */
  if (Array.isArray(c.testimonials)) {
    var base = ["#8b5cf6", "#ec4899", "#38bdf8", "#f59e0b", "#10b981"];
    c.testimonials.forEach(function (t, i) {
      t.avatarBg = "linear-gradient(135deg, " + base[i % base.length] + ", " + (base[(i + 2) % base.length]) + ")";
    });
  }

  var head = [
    "/* ============================================================",
    "   Sev Digital — ملف الإعدادات المركزي",
    "   مولّد من لوحة التحكم (admin.html) — " + new Date().toLocaleDateString("ar"),
    "   تنبيه: هذا الملف كيعوّض القديم، فالتعليقات القديمة تولّي محذوفة.",
    "   ============================================================ */",
    ""
  ].join("\n");

  return head + "var SITE_CONFIG = " + serialize(c, 0, false) + ";\n";
}

function renderCode() {
  $("#codeOut").value = buildDataJS();
}

function download(filename, text) {
  var blob = new Blob(["﻿" + text], { type: "text/javascript;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
}

function copyText(text, okMsg) {
  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    toast(ok ? okMsg : "ما قدرناش ننسخو — حدّد الكود و Ctrl+C", !ok);
  }

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text)
      .then(function () { toast(okMsg); })
      .catch(fallback);
  } else {
    fallback();
  }
}

/* ---------- تنزيل المسودة JSON (نسخة احتياطية) ---------- */

function exportJSON() {
  var payload = JSON.stringify({
    _note: "نسخة احتياطية من لوحة تحكم Sev Digital — للاسترجاع فقط، الموقع ما كيقراهاش",
    savedAt: new Date().toISOString(),
    products: state.products,
    categories: state.categories,
    config: state.config
  }, null, 2);
  download("sev-digital-backup.json", payload);
  toast("تنزّل النسخة الاحتياطية ✅");
}

function importJSON(file) {
  var reader = new FileReader();
  reader.onload = function () {
    try {
      var d = JSON.parse(reader.result);
      if (!d.products || !d.categories) throw new Error("بنية خاطئة");
      state.products = d.products.map(normalizeProduct);
      state.categories = d.categories;
      if (d.config) state.config = d.config;
      saveDraft();
      renderAll();
      hideDraftNotice();
      toast("تمّ الاسترجاع ✅");
    } catch (e) {
      toast("الملف ما صالحش — تأكد أنه نسخة احتياطية من اللوحة", true);
    }
  };
  reader.readAsText(file);
}

/* ============================================================
   6) ربط الأحداث
   ============================================================ */

function switchTab(name) {
  $$(".tab").forEach(function (t) { t.classList.toggle("active", t.dataset.tab === name); });
  $$(".view").forEach(function (v) { v.classList.toggle("on", v.id === "view-" + name); });
  if (name === "export") renderCode();
  if (name === "preview") renderPreview();
}

function afterChange() {
  saveDraft();
  renderAll();
}

/* تحديث خفيف — بلا ما نمسّ الحقول اللي المستخدم كيكتب فيها */
function lightUpdate() {
  saveDraft();
  applyColors();
  renderStats();
  renderPreview();
  renderCode();
}

function bind() {
  /* التبويبات */
  $$(".tab").forEach(function (t) {
    t.addEventListener("click", function () { switchTab(t.dataset.tab); });
  });

  /* قائمة المنتجات */
  $("#plist").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var i = parseInt(b.dataset.i, 10);
    var p = state.products[i];
    if (!p) return;

    if (b.dataset.act === "edit") openEditor(i);
    else if (b.dataset.act === "del") {
      if (!confirm("تحيّد «" + p.title + "»؟\nهاد التصادم ما يمكنش ترجع فيه.")) return;
      state.products.splice(i, 1);
      afterChange();
      toast("تحيّد المنتج 🗑️");
    } else if (b.dataset.act === "dup") {
      var copy = clone(p);
      copy.id = nextId();
      copy.title = p.title + " (نسخة)";
      state.products.splice(i + 1, 0, copy);
      afterChange();
      toast("تسخّم المنتج ⧉");
      flashRow(copy.id);
    } else if (b.dataset.act === "up" && i > 0) {
      state.products.splice(i - 1, 0, state.products.splice(i, 1)[0]);
      afterChange();
    } else if (b.dataset.act === "down" && i < state.products.length - 1) {
      state.products.splice(i + 1, 0, state.products.splice(i, 1)[0]);
      afterChange();
    }
  });

  $("#searchProducts").addEventListener("input", renderProductList);
  $("#filterCat").addEventListener("change", renderProductList);
  $("#btnAddProduct").addEventListener("click", function () { openEditor(-1); });

  /* التصنيفات */
  $("#clist").addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]");
    if (!b) return;
    var i = parseInt(b.dataset.i, 10);
    if (b.dataset.act === "cedit") openCatEditor(i);
    else if (b.dataset.act === "cdel") {
      var c = state.categories[i];
      if (!c || c.id === "all") return;
      var n = state.products.filter(function (p) { return p.cat === c.id; }).length;
      if (!confirm("تحيّد التصنيف «" + c.name + "»؟" +
        (n ? "\n\nغادي يبقى " + n + " منتج بلا تصنيف — خاصك تعاود تسنهم." : ""))) return;
      state.categories.splice(i, 1);
      afterChange();
      toast("تحيّد التصنيف 🗑️");
    }
  });

  $("#btnAddCategory").addEventListener("click", function () { openCatEditor(-1); });

  /* محرّر المنتج */
  $("#drawerClose").addEventListener("click", closeEditor);
  $("#drawerCloseX").addEventListener("click", closeEditor);
  $("#btnSaveProduct").addEventListener("click", commitEditor);
  $("#btnSaveCategory").addEventListener("click", commitCatEditor);
  $("#catDrawerClose").addEventListener("click", closeCatEditor);
  $("#catDrawerCloseX").addEventListener("click", closeCatEditor);
  $("#drawerBg").addEventListener("click", function () { closeEditor(); closeCatEditor(); });

  $("#swatches").addEventListener("click", function (e) {
    var b = e.target.closest("[data-bc]");
    if (b) setBadgeColor(b.dataset.bc);
  });

  $("#emojiPicker").addEventListener("click", function (e) {
    var b = e.target.closest("[data-emoji]");
    if (b) $("#fEmoji").value = b.dataset.emoji;
  });

  $("#catEmojiPicker").addEventListener("click", function (e) {
    var b = e.target.closest("[data-emoji]");
    if (b) $("#cIcon").value = b.dataset.emoji;
  });

  /* تغيير التصنيف → يحدّث الاسم والأيقونة تلقائياً */
  $("#fCat").addEventListener("change", function () {
    var c = catById(this.value);
    if (!c) return;
    if (!$("#fBadge").value) $("#fBadge").value = "";
    var emojiInput = $("#fEmoji");
    if (!emojiInput.value || emojiInput.dataset.auto === "1") {
      emojiInput.value = c.icon || "🧩";
    }
    emojiInput.dataset.auto = "1";
  });

  $("#fEmoji").addEventListener("input", function () { this.dataset.auto = "0"; });

  /* الإعدادات */
  var bindText = function (id, fn) {
    var el = $("#" + id);
    el.addEventListener("input", function () { fn(el.value); lightUpdate(); });
  };

  bindText("sBrandName", function (v) { state.config.brandName = v; });
  bindText("sBrandShort", function (v) { state.config.brandShort = v; });
  bindText("sTagline", function (v) { state.config.tagline = v; });
  bindText("sCurrency", function (v) { state.config.currency = v; });
  bindText("sTax", function (v) { state.config.taxRate = num(v, 0) / 100; });
  bindText("sPromoCode", function (v) { state.config.promo.code = v; });
  bindText("sPromoOff", function (v) { state.config.promo.discount = num(v, 0) / 100; });
  bindText("sEmail", function (v) { state.config.contact.email = v; });
  bindText("sPhone", function (v) { state.config.contact.phone = v; });
  bindText("sWa", function (v) { state.config.contact.whatsapp = v; });
  bindText("sHours", function (v) { state.config.contact.workHours = v; });
  bindText("sPaymentNote", function (v) { state.config.paymentNote = v; });
  bindText("sDeliveryNote", function (v) { state.config.deliveryNote = v; });

  $("#colorGrid").addEventListener("input", function (e) {
    var k = e.target.dataset.color;
    if (!k) return;
    state.config.colors[k] = e.target.value;
    applyColors();
    saveDraft();
    renderPreview();
  });

  $("#heroBox").addEventListener("change", function (e) {
    var id = e.target.dataset.hero;
    if (!id) return;
    var list = (state.config.heroProducts || []).map(String);
    var i = list.indexOf(id);
    if (e.target.checked && i < 0) list.push(id);
    else if (!e.target.checked && i > -1) list.splice(i, 1);
    state.config.heroProducts = list.map(function (x) { return num(x, 0); });
    saveDraft();
  });

  $("#testiBox").addEventListener("input", function () {
    state.config.testimonials = this.value.split("\n")
      .map(function (line) { return line.trim(); })
      .filter(Boolean)
      .map(function (line) {
        var parts = line.split("|").map(function (s) { return s.trim(); });
        return {
          name: parts[0] || "",
          role: parts[1] || "",
          rating: num(parts[2], 5),
          text: parts.slice(3).join("|"),
          avatarBg: ""
        };
      });
    saveDraft();
    renderPreview();
  });

  /* المعاينة */
  $("#pvChips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-pv]");
    if (!b) return;
    previewCat = b.dataset.pv;
    renderPreview();
  });

  /* التصدير */
  $("#btnDownloadData").addEventListener("click", function () {
    download("data.js", buildDataJS());
    toast("تنزّل data.js — بدّلو بـ js/data.js 👈");
  });
  $("#btnDownloadConfig").addEventListener("click", function () {
    if (!confirm("تأكيد؟\n\nملف config.js الجديد ما كيحملش التعليقات القديمة اللي كانت كاينة فيه.\nغادي تبدّل الملف كامل.")) return;
    download("config.js", buildConfigJS());
    toast("تنزّل config.js — بدّلو بـ js/config.js 👈");
  });
  $("#btnCopyData").addEventListener("click", function () {
    copyText(buildDataJS(), "تنسخ الكود ✅ الصقو في js/data.js");
  });
  $("#btnExportJSON").addEventListener("click", exportJSON);
  $("#btnImportJSON").addEventListener("click", function () { $("#fileJSON").click(); });
  $("#fileJSON").addEventListener("change", function () {
    if (this.files && this.files[0]) importJSON(this.files[0]);
    this.value = "";
  });

  $("#btnDiscard").addEventListener("click", discardDraft);
  $("#btnOpenSite").addEventListener("click", function () { window.open("index.html", "_blank"); });
  $("#btnGoExport").addEventListener("click", function () { switchTab("export"); });
  $("#btnGoExport2").addEventListener("click", function () { switchTab("export"); });

  /* اختصارات */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeEditor(); closeCatEditor(); }
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      if ($("#drawer").classList.contains("on")) commitEditor();
      else if ($("#catDrawer").classList.contains("on")) commitCatEditor();
    }
  });

  /* تحذير قبل إغلاق الصفحة */
  window.addEventListener("beforeunload", function () { saveDraft(); });
}

/* ============================================================
   7) الإقلاع
   ============================================================ */

document.addEventListener("DOMContentLoaded", function () {
  renderSwatches();
  renderEmojiPicker("");
  renderEmojiPickerCat();
  bind();
  loadInitial();
  switchTab("products");
});