/* ==========================================================
   SITE CONFIG — edit these values once and they update
   everywhere (header, footer, contact page, booking, etc.)
   Values marked PLACEHOLDER must be replaced before launch.
   ========================================================== */
window.SITE = {
  name: "The Wellness Ascent",
  tagline: "Roots to Sun",

  phone: "+254 700 000 000",          // PLACEHOLDER
  phoneHref: "+254700000000",         // PLACEHOLDER (no spaces)
  whatsapp: "254700000000",           // PLACEHOLDER (country code, no +)
  email: "hello@thewellnessascent.com", // PLACEHOLDER
  address: "Nairobi, Kenya",          // PLACEHOLDER — full street address
  mapQuery: "Nairobi, Kenya",         // used for the Google Map embed

  hours: [
    ["Monday – Friday", "8:00 AM – 6:00 PM"],
    ["Saturday", "9:00 AM – 2:00 PM"],
    ["Sunday & public holidays", "Closed"],
  ],

  socials: {
    facebook: "#",
    instagram: "#",
    linkedin: "#",
    tiktok: "#",
  },

  // Indicative session fees — PLACEHOLDER, confirm with the practice
  pricing: {
    kenya: { therapy: "KES 3,500", psychiatry: "KES 6,000", nutrition: "KES 3,000" },
    seychelles: { therapy: "SCR 900", psychiatry: "SCR 1,500", nutrition: "SCR 750" },
  },

  // Where form submissions go. Leave as-is when using the bundled server.
  api: "/api",
};
