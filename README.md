<div align="center">

# 🛒 Sev Digital

**منصة عربية متكاملة لبيع المنتجات الرقمية**
تطبيق ويب + تطبيق جوال (PWA) — تصميم داكن أنيق بألوان بنفسجي / وردي / ذهبي

<br>

![HTML5](https://img.shields.io/badge/HTML5-%23E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-%231572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-%23F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-%235A0EF8?style=flat-square&logo=pwa&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-%23222?style=flat-square&logo=github&logoColor=white)

</div>

---

## ✨ المميزات

- 🏪 **متجر كامل**: 22 منتجاً رقمياً في 6 تصنيفات
- 🔍 **بحث وفلترة** فورية + 4 طرق ترتيب
- 🛒 **سلة تسوق** محفوظة على الجهاز (LocalStorage)
- 💳 **دفع مبسّط** (تأكيد يدوي — بدون بوابات دفع متقدمة)
- 🎨 **ألوان قابلة للتخصيص بالكامل** من ملف إعدادات واحد
- 📱 **تطبيق جوال PWA**: تثبيت على الشاشة الرئيسية + اشتغال بدون إنترنت
- ⌨️ **RTL كامل** بخط Cairo العربي
- ⚡ حركات الظهور + شريط تطبيق سفلي للجوال

## 📁 بنية المشروع

```
Sev-Digital/
├── index.html          # الرئيسية
├── products.html       # المتجر + الفلترة
├── product.html        # تفاصيل المنتج
├── cart.html           # سلة التسوق
├── checkout.html       # صفحة الطلب المبسطة
├── success.html        # تأكيد الطلب
├── about.html          # من نحن
├── contact.html        # تواصل معنا
├── terms.html          # الشروط والأحكام
├── privacy.html        # سياسة الخصوصية
├── css/
│   └── style.css       # التصميم الكامل
├── js/
│   ├── config.js       # ⚙️ ملف الإعدادات المركزي (عدّل كل شيء منه)
│   ├── data.js         # المنتجات والتصنيفات
│   └── app.js          # منطق التطبيق
├── icons/              # أيقونات التطبيق
├── manifest.json       # إعدادات PWA
├── sw.js               # Service Worker
└── .github/workflows/  # نشر تلقائي على GitHub Pages
```

## ⚙️ التخصيص السريع

عدّل ملف **`js/config.js`** — كل شيء سيتغير تلقائياً:

```js
var SITE_CONFIG = {
  brandName: "Sev Digital",     // اسم المتجر
  brandShort: "SV",             // أحرف الشعار
  currency: "$",                // العملة
  colors: { red: "#8b5cf6", blue: "#ec4899", /* ... */ },  // هوية الألوان
  heroProducts: [20, 5, 14],    // منتجات الواجهة
  // ...
};
```

## 🚀 التشغيل محلياً

```bash
# أي خادم ثابت (Python مثالاً)
python -m http.server 8080
# ثم افتح: http://localhost:8080
```

أو فقط افتح `index.html` مباشرة في المتصفح للمعاينة.
> ميزة تثبيت التطبيق والاشتغال دون إنترنت تتطلب HTTP/HTTPS (وليس `file://`).

## ☁️ النشر على GitHub Pages

الريبو مجهّز بـ GitHub Actions — بعد رفع الكود على GitHub:

1. ارفع الملفات مستودعك (مع سكربت الاستضافة أو مباشرة من الويب).
2. اذهب إلى **Settings → Pages**.
3. من *Source* اختر `GitHub Actions`.
4. عند كل `push` إلى `main` سيُنشر الموقع تلقائياً.

## 🧾 الرخصة

جميع الحقوق محفوظة © [Rab3a](https://github.com/) — انظر ملف [`LICENSE`](./LICENSE).

---

<div align="center">
  <sub>صُنع بحب في العالم العربي 🖤</sub>
</div>