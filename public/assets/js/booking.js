/* Guided booking flow */
(function () {
  "use strict";
  const form = document.getElementById("bookingForm");
  if (!form) return;
  const t = (s) => window.I18N.t(s);
  const steps = [...form.querySelectorAll(".wstep")];
  const dots = [...document.querySelectorAll("#progress li:not(.bar)")];
  const bar = document.getElementById("progressBar");
  const prev = document.getElementById("prevBtn");
  const next = document.getElementById("nextBtn");
  const nav = document.getElementById("wizardNav");
  const status = document.getElementById("bookingStatus");
  const timesEl = document.getElementById("times");
  const dateEl = document.getElementById("date");
  const altDateEl = document.getElementById("altDate");
  const LAST = 6;
  let cur = 1;

  const val = (n) => { const el = form.querySelector(`[name="${n}"]:checked`) || form.elements[n]; return el ? el.value : ""; };

  /* Date limits: tomorrow → +90 days */
  const iso = (d) => d.toISOString().slice(0, 10);
  const today = new Date();
  const min = new Date(today); min.setDate(min.getDate() + 1);
  const max = new Date(today); max.setDate(max.getDate() + 90);
  [dateEl, altDateEl].forEach((el) => { el.min = iso(min); el.max = iso(max); });

  /* Time slots (practice hours; Saturdays shorter) */
  function slotsFor(dateStr) {
    if (!dateStr) return [];
    const day = new Date(dateStr + "T12:00:00").getDay();
    if (day === 0) return [];
    const end = day === 6 ? 13 : 17;
    const start = day === 6 ? 9 : 8;
    const out = [];
    for (let h = start; h <= end; h++) out.push(String(h).padStart(2, "0") + ":00");
    return out;
  }
  function renderTimes() {
    const prevSel = val("time");
    const slots = slotsFor(dateEl.value);
    timesEl.innerHTML = slots.length
      ? slots.map((s, i) => `<div class="choice"><input type="radio" name="time" id="tm${i}" value="${s}" ${s === prevSel ? "checked" : ""}><label for="tm${i}">${s}</label></div>`).join("")
      : `<p class="muted">${t(dateEl.value ? "We are closed on Sundays. Please choose another day." : "Choose a date to see available times.")}</p>`;
  }
  dateEl.addEventListener("change", () => { dateEl.closest(".field").classList.remove("invalid"); renderTimes(); });

  /* Country rules: Seychelles = virtual only */
  function applyCountry() {
    const c = val("country");
    const phys = document.getElementById("tPhysical");
    const sey = c === "seychelles";
    phys.disabled = sey;
    if (sey && phys.checked) { phys.checked = false; document.getElementById("tVirtual").checked = true; }
    if (sey && !val("type")) document.getElementById("tVirtual").checked = true;
    document.getElementById("typeNote").textContent = t(sey ? "In Seychelles, sessions are currently virtual only." : "Choose the format that feels most comfortable.");
    document.getElementById("tzLabel").textContent = t(sey ? "Seychelles time (UTC+4)" : "Kenya time (UTC+3)");
  }
  form.addEventListener("change", (e) => {
    if (e.target.name === "country") applyCountry();
    if (e.target.name === "service") document.getElementById("therapyFormatWrap").hidden = e.target.value !== "therapy";
    status.className = "form-status";
  });

  /* Prefill from URL */
  const q = new URLSearchParams(location.search);
  [["country", q.get("country")], ["service", q.get("service")], ["type", q.get("type")]].forEach(([n, v]) => {
    if (!v) return;
    const el = form.querySelector(`[name="${n}"][value="${CSS.escape(v)}"]`);
    if (el) el.checked = true;
  });
  document.getElementById("therapyFormatWrap").hidden = val("service") !== "therapy";
  document.getElementById("sessionLang").value = window.I18N.lang;
  applyCountry();
  renderTimes();

  /* Step validation */
  function err(msg) { status.className = "form-status show err"; status.textContent = t(msg); }
  function validate(step) {
    status.className = "form-status";
    if (step === 1 && !val("country")) return err("Please choose where you will receive care."), false;
    if (step === 2 && !val("service")) return err("Please choose a service."), false;
    if (step === 3 && !val("type")) return err("Please choose how you would like to meet."), false;
    if (step === 4) {
      const d = dateEl.value;
      const ok = d && d >= dateEl.min && d <= dateEl.max && slotsFor(d).length;
      dateEl.closest(".field").classList.toggle("invalid", !ok);
      if (!ok) { dateEl.focus(); return false; }
      const hasTime = !!form.querySelector('[name="time"]:checked');
      document.getElementById("timeError").hidden = hasTime;
      if (!hasTime) return false;
    }
    if (step === 5) return window.validateForm(steps[4]);
    return true;
  }

  const LABELS = {
    kenya: "Kenya", seychelles: "Seychelles",
    therapy: "Psychotherapy & Counselling", psychiatry: "Psychiatric Consultation", nutrition: "Nutrition & Dietetics",
    physical: "In person (Nairobi)", virtual: "Virtual (secure video)",
    individual: "Individual", couples: "Couples", family: "Family", adolescent: "Adolescent (under 18)",
    en: "English", fr: "French", yes: "Yes, first time", no: "No, returning client",
  };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function fmtDate(d) {
    if (!d) return "—";
    return new Date(d + "T12:00:00").toLocaleDateString(window.I18N.lang === "fr" ? "fr-FR" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function renderReview() {
    const rows = [
      ["Location", t(LABELS[val("country")])],
      ["Service", t(LABELS[val("service")]) + (val("service") === "therapy" ? " · " + t(LABELS[val("format")]) : "")],
      ["Session type", t(LABELS[val("type")])],
      ["Preferred date", fmtDate(dateEl.value) + " · " + val("time")],
      ["Alternative date", altDateEl.value ? fmtDate(altDateEl.value) : "—"],
      ["Name", val("firstName") + " " + val("lastName")],
      ["Email", val("email")],
      ["Phone", val("phone")],
      ["Session language", t(LABELS[val("sessionLanguage")])],
      ["First visit", t(LABELS[val("firstVisit")])],
      ["Notes", val("notes") || "—"],
    ];
    document.getElementById("review").innerHTML = rows.map(([k, v]) => `<div><dt>${esc(t(k))}</dt><dd>${esc(v)}</dd></div>`).join("");
  }

  function show(n, initial) {
    cur = n;
    steps.forEach((s) => s.classList.toggle("active", +s.dataset.step === n));
    dots.forEach((d, i) => { d.classList.toggle("done", i + 1 < n); d.classList.toggle("current", i + 1 === n); });
    bar.style.width = (Math.min(n - 1, LAST - 1) / (LAST - 1)) * 92 + "%";
    prev.hidden = n === 1 || n > LAST;
    nav.hidden = n > LAST;
    next.innerHTML = n === LAST ? `${t("Confirm request")} ${window.ICON("check")}` : `${t("Continue")} ${window.ICON("arrow")}`;
    if (n === LAST) renderReview();
    if (initial) return;
    const h = steps[n - 1].querySelector("h2");
    if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  prev.addEventListener("click", () => show(Math.max(1, cur - 1)));
  next.addEventListener("click", async () => {
    if (cur < LAST) {
      if (!validate(cur)) return;
      return show(cur + 1);
    }
    next.disabled = true;
    next.textContent = t("Sending…");
    const r = await window.submitForm(form, "/appointments", status);
    next.disabled = false;
    if (r.ok) {
      document.getElementById("bookingRef").textContent = r.body.reference || "—";
      status.className = "form-status";
      show(7);
    } else {
      r.show(false, r.message);
      show(LAST);
    }
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  document.addEventListener("langchange", () => { applyCountry(); renderTimes(); show(cur, true); });

  // Start on first incomplete step when arriving with prefilled choices
  let start = 1;
  if (val("country")) start = 2;
  if (start === 2 && val("service")) start = 3;
  if (start === 3 && val("type")) start = 4;
  show(start, true);
})();
