/* ==========================================================
   The Wellness Ascent — core script
   Shared layout, icons, bilingual engine (EN/FR), interactions
   ========================================================== */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");
  const S = window.SITE;

  /* ---------------- Icons (inline SVG, stroke style) ---------------- */
  const P = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONS = {
    arrow: P('<path d="M5 12h14M13 5l7 7-7 7"/>'),
    "arrow-left": P('<path d="M19 12H5M11 19l-7-7 7-7"/>'),
    "arrow-up": P('<path d="M12 19V5M5 12l7-7 7 7"/>'),
    chevron: P('<path d="m6 9 6 6 6-6"/>'),
    phone: P('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
    mail: P('<rect x="2" y="4" width="20" height="16" rx="3"/><path d="m22 7-10 6L2 7"/>'),
    pin: P('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
    clock: P('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    brain: P('<path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.1A3 3 0 0 0 4.5 9a3 3 0 0 0 .4 5.3A3 3 0 0 0 9 18.9V20a2 2 0 0 0 3 0V4.5A2.5 2.5 0 0 0 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 1 17 4.5v.1A3 3 0 0 1 19.5 9a3 3 0 0 1-.4 5.3A3 3 0 0 1 15 18.9V20a2 2 0 0 1-3 0"/>'),
    psychiatry: P('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v6M9 11h6"/>'),
    nutrition: P('<path d="M12 7c-3-2-8-1-8 5 0 5 3 10 6 10 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-5 6-10 0-6-5-7-8-5z"/><path d="M12 7c0-3 2-5 4-5"/>'),
    leaf: P('<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.2-6.1 2.4-.5 4.8-2 5.8-3.9"/>'),
    sprout: P('<path d="M7 20h10M12 20v-8"/><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/>'),
    roots: P('<path d="M12 2v10"/><path d="M12 12c-2 2-5 2-7 5M12 12c2 2 5 2 7 5M12 12v10M9 15c-1 2-1 4-3 6M15 15c1 2 1 4 3 6"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    heart: P('<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>'),
    "heart-hand": P('<path d="M11 14h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 16"/><path d="m7 20 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.8-2.8l-4.2 3.9"/><path d="m2 15 6 6"/>'),
    lock: P('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
    shield: P('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>'),
    book: P('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
    calendar: P('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>'),
    chat: P('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
    globe: P('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>'),
    video: P('<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>'),
    laptop: P('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>'),
    building: P('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>'),
    users: P('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    user: P('<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>'),
    family: P('<circle cx="7" cy="5" r="2.5"/><circle cx="17" cy="5" r="2.5"/><circle cx="12" cy="13" r="2"/><path d="M3 21v-6a4 4 0 0 1 8 0M13 21v-6a4 4 0 0 1 8 0M10 21v-2a2 2 0 0 1 4 0v2"/>'),
    couple: P('<path d="M16.5 8.5 12 13l-4.5-4.5a3 3 0 0 1 4.5-4 3 3 0 0 1 4.5 4z"/><path d="M4 21v-1a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v1"/>'),
    sparkles: P('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z"/>'),
    check: P('<path d="M20 6 9 17l-5-5"/>'),
    "check-circle": P('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
    search: P('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
    quote: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.2 17.6c-1.3 0-2.3-.4-3-1.3-.7-.8-1-1.9-1-3.2 0-1.5.4-3 1.3-4.4.9-1.4 2.2-2.6 3.9-3.5l.9 1.3c-1 .6-1.8 1.3-2.4 2.1-.6.8-.9 1.6-.9 2.4.2-.1.5-.1.8-.1 1 0 1.8.3 2.4.9.6.6.9 1.3.9 2.2 0 1-.3 1.8-1 2.4-.5.8-1.4 1.2-2.6 1.2zm9.4 0c-1.3 0-2.3-.4-3-1.3-.7-.8-1-1.9-1-3.2 0-1.5.4-3 1.3-4.4.9-1.4 2.2-2.6 3.9-3.5l.9 1.3c-1 .6-1.8 1.3-2.4 2.1-.6.8-.9 1.6-.9 2.4.2-.1.5-.1.8-.1 1 0 1.8.3 2.4.9.6.6.9 1.3.9 2.2 0 1-.3 1.8-1 2.4-.6.8-1.5 1.2-2.7 1.2z"/></svg>',
    alert: P('<path d="m10.3 3.9-8.5 14.6A2 2 0 0 0 3.5 21h17a2 2 0 0 0 1.7-2.5L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>'),
    compass: P('<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>'),
    scale: P('<path d="M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8"/>'),
    pill: P('<path d="m10.5 20.5 10-10a4.9 4.9 0 0 0-7-7l-10 10a4.9 4.9 0 0 0 7 7z"/><path d="m8.5 8.5 7 7"/>'),
    clipboard: P('<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 12h6M9 16h4"/>'),
    refresh: P('<path d="M21 12a9 9 0 0 1-15 6.7L3 16M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5M3 21v-5h5"/>'),
    cloud: P('<path d="M17.5 19H9a7 7 0 1 1 6.7-9h1.8a4.5 4.5 0 1 1 0 9z"/>'),
    wind: P('<path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/>'),
    flower: P('<circle cx="12" cy="12" r="3"/><path d="M12 9a3 3 0 1 1 3-3M15 12a3 3 0 1 1 3 3M12 15a3 3 0 1 1-3 3M9 12a3 3 0 1 1-3-3"/>'),
    child: P('<circle cx="12" cy="6" r="3"/><path d="M8 22v-6l-2-3 3-3h6l3 3-2 3v6M12 16v6"/>'),
    activity: P('<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'),
    apple: P('<path d="M12 7c-3-2-8-1-8 5 0 5 3 10 6 10 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-5 6-10 0-6-5-7-8-5z"/><path d="M12 7c0-3 2-5 4-5"/>'),
    utensils: P('<path d="M3 2v7a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2V2M6 2v20M21 15V2a5 5 0 0 0-5 5v6a2 2 0 0 0 2 2h3zm0 0v7"/>'),
    droplet: P('<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7z"/>'),
    moon: P('<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>'),
    star: P('<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'),
    wifi: P('<path d="M5 12.6a10 10 0 0 1 14 0M8.5 16.1a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 20 0M12 20h.01"/>'),
    headphones: P('<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'),
    card: P('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>'),
    briefcase: P('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.8zm8.4-18.2A11.8 11.8 0 0 0 1.7 17.8L0 24l6.3-1.7a11.8 11.8 0 0 0 5.7 1.4c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.4-8.3z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8V6c0-.8.6-1 1-1h2.5V1.1L14 1C10.7 1 10 3.5 10 5.1V8H7.5v4H10v11h4V12h3.2l.4-4z"/></svg>',
    instagram: P('<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'),
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.1c.5-1 1.8-2 3.8-2 4 0 4.8 2.6 4.8 6V21h-4v-5.1c0-1.2 0-2.8-1.7-2.8-1.7 0-2 1.3-2 2.7V21h-4z"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9a7.3 7.3 0 0 0 4.3 1.4V7.3a4.3 4.3 0 0 1-3.2-1.5z"/></svg>',
  };
  window.ICON = (n) => ICONS[n] || "";
  function hydrateIcons(root) {
    (root || document).querySelectorAll("i[data-icon]").forEach((el) => {
      const svg = ICONS[el.dataset.icon];
      if (svg) el.outerHTML = svg;
    });
  }

  /* ---------------- Shared header ---------------- */
  const page = document.body.dataset.page || "";
  const act = (p) => (p === page ? ' class="active" aria-current="page"' : "");
  const serviceLinks = [
    ["psychotherapy.html", "brain", "Psychotherapy & Counselling", "Talk therapy for individuals, couples and families"],
    ["psychiatry.html", "psychiatry", "Psychiatric Consultation", "Assessment, diagnosis and medication management"],
    ["nutrition.html", "nutrition", "Nutrition & Dietetics", "Clinical nutrition and lifestyle guidance"],
    ["compass.html", "compass", "Find the Right Support", "A 2-minute guide to the care that fits you"],
  ];
  const aboutLinks = [
    ["about.html", "sprout", "About Us", "Our story, mission and philosophy"],
    ["testimonials.html", "chat", "Testimonials", "Stories shared by our clients"],
    ["about.html#faq", "book", "FAQs", "Answers to common questions"],
  ];
  const ddItems = (arr) => arr.map(([h, ic, t, d]) => `<li><a href="${h}"><span class="dd-icon">${ICONS[ic]}</span><span class="dd-text"><strong>${t}</strong><small>${d}</small></span></a></li>`).join("");
  const isService = ["psychotherapy", "psychiatry", "nutrition", "services", "compass"].includes(page);
  const isAbout = ["about", "testimonials"].includes(page);
  const hubLinks = [
    ["kenya.html", "building", "Kenya Hub", "In person in Nairobi and online across Kenya"],
    ["seychelles.html", "video", "Seychelles Hub", "Secure online sessions across the islands"],
  ];
  const isHub = ["kenya", "seychelles"].includes(page);

  const headerHTML = `
  <a class="skip-link" href="#main">Skip to content</a>
  <div class="topbar">
    <div class="container">
      <div class="topbar-info">
        <span><i data-icon="phone"></i><a href="tel:${S.phoneHref}">${S.phone}</a></span>
        <span class="hide-sm"><i data-icon="mail"></i><a href="mailto:${S.email}">${S.email}</a></span>
        <span class="hide-sm"><i data-icon="globe"></i>Kenya · Seychelles</span>
      </div>
      <div class="topbar-tools">
        <a class="emergency" href="contact.html#emergency">In crisis? Get help now</a>
        <span class="text-size" role="group" aria-label="Text size">
          <button type="button" data-ts="-1" aria-label="Decrease text size">A−</button>
          <button type="button" data-ts="1" aria-label="Increase text size">A+</button>
        </span>
      </div>
    </div>
  </div>
  <header class="site-header" id="siteHeader">
    <div class="container nav-wrap">
      <a class="brand" href="index.html" aria-label="The Wellness Ascent — home">
        <img src="assets/img/logo-mark.png" alt="" width="50" height="50">
        <span class="brand-text"><span class="brand-name">The Wellness Ascent</span><span class="brand-tag">Roots to Sun</span></span>
      </a>
      <nav class="main-nav" id="mainNav" aria-label="Main">
        <ul>
          <li><a href="index.html"${act("home")}>Home</a></li>
          <li class="has-dd"><button type="button" class="dd-toggle${isAbout ? " active" : ""}" aria-expanded="false">About ${ICONS.chevron}</button><ul class="dropdown">${ddItems(aboutLinks)}</ul></li>
          <li class="has-dd"><button type="button" class="dd-toggle${isService ? " active" : ""}" aria-expanded="false">Services ${ICONS.chevron}</button><ul class="dropdown">${ddItems(serviceLinks)}</ul></li>
          <li class="has-dd"><button type="button" class="dd-toggle${isHub ? " active" : ""}" aria-expanded="false">Hubs ${ICONS.chevron}</button><ul class="dropdown">${ddItems(hubLinks)}</ul></li>
          <li><a href="articles.html"${act("articles")}>Articles</a></li>
          <li><a href="contact.html"${act("contact")}>Contact</a></li>
          <li class="mobile-book"><a href="book.html" class="btn btn-gold btn-block">Book Appointment</a></li>
        </ul>
      </nav>
      <div class="nav-actions">
        <div class="lang-switch" role="group" aria-label="Language">
          <button type="button" data-lang="en" aria-pressed="true">EN</button>
          <button type="button" data-lang="fr" aria-pressed="false">FR</button>
        </div>
        <a href="book.html" class="btn btn-gold btn-sm nav-book pulse">Book Appointment</a>
        <button class="menu-toggle" id="menuToggle" aria-controls="mainNav" aria-expanded="false"><span></span><span class="sr-only">Menu</span></button>
      </div>
    </div>
    <div class="nav-backdrop" id="navBackdrop"></div>
  </header>`;

  /* ---------------- Shared footer ---------------- */
  const year = new Date().getFullYear();
  const footerHTML = `
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <img src="assets/img/logo-mark.png" alt="" width="74" height="74" loading="lazy">
          <div class="brand-name">The Wellness Ascent</div>
          <span class="brand-tag">Roots to Sun</span>
          <p>Compassionate psychotherapy, psychiatric and nutrition care — in person in Kenya and online across Kenya and Seychelles.</p>
          <div class="socials">
            <a href="${S.socials.facebook}" aria-label="Facebook">${ICONS.facebook}</a>
            <a href="${S.socials.instagram}" aria-label="Instagram">${ICONS.instagram}</a>
            <a href="${S.socials.linkedin}" aria-label="LinkedIn">${ICONS.linkedin}</a>
            <a href="${S.socials.tiktok}" aria-label="TikTok">${ICONS.tiktok}</a>
          </div>
        </div>
        <div>
          <h4>Explore</h4>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="kenya.html">Kenya Hub</a></li>
            <li><a href="seychelles.html">Seychelles Hub</a></li>
            <li><a href="articles.html">Articles</a></li>
            <li><a href="testimonials.html">Testimonials</a></li>
            <li><a href="about.html#faq">FAQs</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4>Services</h4>
          <ul>
            <li><a href="psychotherapy.html">Psychotherapy & Counselling</a></li>
            <li><a href="psychiatry.html">Psychiatric Consultation</a></li>
            <li><a href="nutrition.html">Nutrition & Dietetics</a></li>
            <li><a href="compass.html">Find the Right Support</a></li>
            <li><a href="book.html">Book Appointment</a></li>
          </ul>
        </div>
        <div>
          <h4>Get in touch</h4>
          <ul>
            <li><a href="tel:${S.phoneHref}">${S.phone}</a></li>
            <li><a href="mailto:${S.email}">${S.email}</a></li>
            <li>${S.address}</li>
            <li>${S.hours[0][0]}: ${S.hours[0][1]}</li>
          </ul>
          <div class="footer-emergency"><strong>Not for emergencies</strong>If you are in immediate danger, call 999 or 112 (Kenya) or 999 (Seychelles).</div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© ${year} <span>The Wellness Ascent. All rights reserved.</span></span>
        <nav aria-label="Legal"><a href="privacy.html">Privacy Policy</a><a href="privacy.html#terms">Terms & Conditions</a><a href="privacy.html#cookies">Cookie Policy</a></nav>
      </div>
    </div>
  </footer>
  <a class="wa-float" href="https://wa.me/${S.whatsapp}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">${ICONS.whatsapp}</a>
  <button class="to-top" id="toTop" aria-label="Back to top">${ICONS["arrow-up"]}</button>
  <div class="cookie" id="cookie" role="dialog" aria-live="polite" aria-label="Cookie notice">
    <p>We use only essential cookies to keep this site secure and remember your language. No advertising trackers.</p>
    <div class="btn-row"><button class="btn btn-teal btn-sm" data-cookie="accept">Accept</button><a class="btn btn-ghost btn-sm" href="privacy.html#cookies">Learn more</a></div>
  </div>`;

  const headerSlot = document.getElementById("site-header");
  const footerSlot = document.getElementById("site-footer");
  if (headerSlot) headerSlot.outerHTML = headerHTML;
  if (footerSlot) footerSlot.outerHTML = footerHTML;

  // Fill any [data-site] placeholders with config values
  document.querySelectorAll("[data-site]").forEach((el) => {
    const k = el.dataset.site;
    if (k === "phone") { el.textContent = S.phone; if (el.tagName === "A") el.href = "tel:" + S.phoneHref; }
    else if (k === "email") { el.textContent = S.email; if (el.tagName === "A") el.href = "mailto:" + S.email; }
    else if (k === "whatsapp") { if (el.tagName === "A") el.href = "https://wa.me/" + S.whatsapp; }
    else if (k === "address") el.textContent = S.address;
    else if (k.startsWith("price.")) { const [, c, s] = k.split("."); el.textContent = S.pricing[c][s]; }
  });
  document.querySelectorAll("[data-site-hours]").forEach((tb) => {
    tb.innerHTML = S.hours.map(([d, h]) => `<tr><td>${d}</td><td>${h}</td></tr>`).join("");
  });

  hydrateIcons();

  /* ---------------- Storage helpers (fail-safe) ---------------- */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  /* ---------------- Bilingual engine ---------------- */
  // English is authored in the HTML. French comes from window.I18N_FR,
  // keyed by the English text, so every page translates automatically.
  const FR = window.I18N_FR || {};
  const norm = (s) => s.replace(/\s+/g, " ").trim();
  let lang = (new URLSearchParams(location.search).get("lang") || store.get("twa-lang") || "en").toLowerCase();
  if (!["en", "fr"].includes(lang)) lang = "en";
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  const SKIP = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "svg", "path"]);
  let busy = false;

  function translateNode(node) {
    if (node.__en === undefined) node.__en = node.nodeValue;
    const en = node.__en;
    if (lang === "fr") {
      const k = norm(en);
      if (k && FR[k]) {
        const lead = en.match(/^\s*/)[0], trail = en.match(/\s*$/)[0];
        node.nodeValue = lead + FR[k] + trail;
      } else node.nodeValue = en;
    } else node.nodeValue = en;
  }
  function translateEl(el) {
    ATTRS.forEach((a) => {
      if (!el.hasAttribute || !el.hasAttribute(a)) return;
      const key = "en" + a.replace(/-./g, (m) => m[1].toUpperCase());
      if (el.dataset[key] === undefined) el.dataset[key] = el.getAttribute(a);
      const en = el.dataset[key];
      el.setAttribute(a, lang === "fr" && FR[norm(en)] ? FR[norm(en)] : en);
    });
  }
  function applyLang(root) {
    root = root || document.body;
    busy = true;
    if (root.nodeType === 3) { translateNode(root); busy = false; return; }
    if (root.closest && root.closest("[data-no-i18n]")) { busy = false; return; }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
      acceptNode(n) {
        if (n.nodeType === 1) return SKIP.has(n.nodeName) || n.hasAttribute("data-no-i18n") ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        return n.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
      },
    });
    if (root.nodeType === 1) translateEl(root);
    let n;
    while ((n = walker.nextNode())) n.nodeType === 3 ? translateNode(n) : translateEl(n);
    busy = false;
  }
  const docTitleEn = document.title;
  const metaDesc = document.querySelector('meta[name="description"]');
  const metaDescEn = metaDesc ? metaDesc.content : "";
  function setLang(l) {
    lang = l;
    store.set("twa-lang", l);
    document.documentElement.lang = l;
    document.title = l === "fr" && FR[docTitleEn] ? FR[docTitleEn] : docTitleEn;
    if (metaDesc) metaDesc.content = l === "fr" && FR[metaDescEn] ? FR[metaDescEn] : metaDescEn;
    document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === l)));
    applyLang(document.body);
    document.dispatchEvent(new CustomEvent("langchange", { detail: l }));
  }
  window.I18N = {
    get lang() { return lang; },
    t: (s) => (lang === "fr" && FR[norm(s)]) || s,
    apply: applyLang,
    set: setLang,
  };
  // Translate content rendered later by other scripts automatically
  new MutationObserver((muts) => {
    if (busy || lang === "en") return;
    muts.forEach((m) => m.addedNodes.forEach((n) => { if (n.nodeType === 1 || n.nodeType === 3) applyLang(n); }));
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener("click", (e) => {
    const b = e.target.closest(".lang-switch button");
    if (b) setLang(b.dataset.lang);
  });

  /* ---------------- Text size ---------------- */
  let scale = parseFloat(store.get("twa-ts")) || 1;
  const applyScale = () => document.documentElement.style.setProperty("--text-scale", scale);
  applyScale();
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ts]");
    if (!b) return;
    scale = Math.min(1.3, Math.max(0.9, +(scale + 0.1 * +b.dataset.ts).toFixed(2)));
    store.set("twa-ts", scale);
    applyScale();
  });

  /* ---------------- Navigation ---------------- */
  const header = document.getElementById("siteHeader");
  const nav = document.getElementById("mainNav");
  const toggle = document.getElementById("menuToggle");
  const backdrop = document.getElementById("navBackdrop");
  const closeNav = () => { nav.classList.remove("open"); backdrop.classList.remove("show"); toggle.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; };
  toggle && toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("open");
    nav.classList.toggle("open", open); backdrop.classList.toggle("show", open);
    toggle.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  });
  backdrop && backdrop.addEventListener("click", closeNav);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeNav(); document.querySelectorAll(".has-dd.open").forEach((d) => { d.classList.remove("open"); d.querySelector(".dd-toggle").setAttribute("aria-expanded", "false"); }); } });
  document.querySelectorAll(".dd-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const li = btn.parentElement, open = !li.classList.contains("open");
      document.querySelectorAll(".has-dd.open").forEach((d) => d !== li && d.classList.remove("open"));
      li.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", (e) => { if (!e.target.closest(".has-dd")) document.querySelectorAll(".has-dd.open").forEach((d) => d.classList.remove("open")); });

  const toTop = document.getElementById("toTop");
  const onScroll = () => {
    const y = window.scrollY;
    header && header.classList.toggle("scrolled", y > 10);
    toTop && toTop.classList.toggle("show", y > 700);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop && toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------------- Reveal on scroll ---------------- */
  const io = "IntersectionObserver" in window ? new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }) : null;
  window.observeReveal = (root) => (root || document).querySelectorAll(".reveal:not(.in)").forEach((el) => (io ? io.observe(el) : el.classList.add("in")));
  window.observeReveal();

  /* ---------------- Gentle parallax on hero images ---------------- */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parallax = document.querySelectorAll("[data-parallax]");
  if (!reduce && parallax.length) {
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      parallax.forEach((el) => { if (y < 1200) el.style.transform = `translateY(${y * 0.12}px) scale(1.06)`; });
    }, { passive: true });
  }

  /* ---------------- Testimonial carousel ---------------- */
  document.querySelectorAll("[data-carousel]").forEach((root) => {
    const track = root.querySelector(".t-track");
    const slides = [...track.children];
    const dots = root.querySelector(".t-dots");
    let i = 0, timer;
    dots.innerHTML = slides.map((_, k) => `<button type="button" aria-label="Show testimonial ${k + 1}"></button>`).join("");
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      track.style.transform = `translateX(-${i * 100}%)`;
      [...dots.children].forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
      slides.forEach((s, k) => s.setAttribute("aria-hidden", String(k !== i)));
    };
    const auto = () => { if (reduce) return; clearInterval(timer); timer = setInterval(() => go(i + 1), 7000); };
    root.querySelector("[data-prev]").addEventListener("click", () => { go(i - 1); auto(); });
    root.querySelector("[data-next]").addEventListener("click", () => { go(i + 1); auto(); });
    [...dots.children].forEach((d, k) => d.addEventListener("click", () => { go(k); auto(); }));
    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", auto);
    let sx = null;
    root.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    root.addEventListener("touchend", (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1)); sx = null; auto(); });
    go(0); auto();
  });

  /* ---------------- Cookie notice ---------------- */
  const cookie = document.getElementById("cookie");
  if (cookie && !store.get("twa-cookie")) setTimeout(() => cookie.classList.add("show"), 1500);
  document.addEventListener("click", (e) => {
    if (e.target.closest('[data-cookie="accept"]')) { store.set("twa-cookie", "1"); cookie.classList.remove("show"); }
  });

  /* ---------------- Generic secure form submit ---------------- */
  // Used by contact & testimonial forms. Booking has its own flow.
  window.submitForm = async function (form, endpoint, statusEl) {
    const data = Object.fromEntries(new FormData(form).entries());
    data.language = lang;
    const show = (ok, msg) => { statusEl.className = "form-status show " + (ok ? "ok" : "err"); statusEl.textContent = window.I18N.t(msg); };
    try {
      const res = await fetch(S.api + endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), credentials: "same-origin" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Something went wrong. Please try again.");
      return { ok: true, show, body };
    } catch (err) {
      const offline = err instanceof TypeError || location.protocol === "file:";
      return { ok: false, show, message: offline ? "We could not reach the server. Please contact us directly by phone, WhatsApp or email." : err.message };
    }
  };

  window.validateForm = function (form) {
    let ok = true, first = null;
    form.querySelectorAll("[required]").forEach((inp) => {
      const field = inp.closest(".field");
      let valid = inp.type === "checkbox" ? inp.checked : inp.value.trim() !== "";
      if (valid && inp.type === "email") valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim());
      if (valid && inp.type === "tel") valid = /^[+\d][\d\s()-]{6,}$/.test(inp.value.trim());
      if (field) field.classList.toggle("invalid", !valid);
      inp.setAttribute("aria-invalid", String(!valid));
      if (!valid) { ok = false; first = first || inp; }
    });
    if (first) first.focus();
    return ok;
  };

  /* ---------------- Initial language ---------------- */
  if (lang !== "en") setLang(lang);
  else document.querySelectorAll(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === "en")));
})();
