/* Contact form, testimonial form and testimonial filters */
(function () {
  "use strict";

  function wire(form, endpoint, successMsg) {
    if (!form) return;
    const status = form.querySelector(".form-status");
    const btn = form.querySelector('button[type="submit"]');
    form.querySelectorAll("input, select, textarea").forEach((el) =>
      el.addEventListener("input", () => el.closest(".field") && el.closest(".field").classList.remove("invalid")));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!window.validateForm(form)) return;
      btn.disabled = true;
      const r = await window.submitForm(form, endpoint, status);
      btn.disabled = false;
      if (r.ok) { r.show(true, successMsg); form.reset(); }
      else r.show(false, r.message);
    });
  }

  wire(document.getElementById("contactForm"), "/contact", "Thank you — your message has been received. We will reply within one working day.");
  wire(document.getElementById("testimonialForm"), "/testimonials", "Thank you for sharing your story. It will appear once reviewed by our team.");

  const chips = document.getElementById("tChips");
  if (chips) {
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-filter]");
      if (!b) return;
      chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b)));
      document.querySelectorAll("#tGrid [data-service]").forEach((card) => {
        card.hidden = !(b.dataset.filter === "all" || card.dataset.service === b.dataset.filter);
      });
    });
  }
})();
