/* The Wellness Compass — client-side only; answers never leave the device */
(function () {
  "use strict";
  const root = document.getElementById("compass");
  if (!root) return;
  const t = (s) => window.I18N.t(s);
  const body = document.getElementById("compassBody");
  const barEl = document.getElementById("compassBar");
  const prev = document.getElementById("cPrev");
  const next = document.getElementById("cNext");
  const navEl = document.getElementById("compassNav");
  body.setAttribute("data-no-i18n", "");

  // w = weights for therapy (t), psychiatry (p), nutrition (n)
  const Q = [
    { q: "What brings you here today?", o: [
      ["Difficult emotions — sadness, worry or stress", { t: 2 }],
      ["Relationship or family challenges", { t: 3 }],
      ["Symptoms that feel severe or have lasted a long time", { p: 3 }],
      ["Questions about medication or a diagnosis", { p: 3 }],
      ["Weight, eating or a health condition", { n: 3 }],
      ["I want to feel more balanced overall", { t: 1, n: 1 }],
    ] },
    { q: "How long have you been feeling this way?", o: [
      ["A few weeks", { t: 1 }],
      ["A few months", { t: 1, p: 1 }],
      ["More than six months", { p: 2 }],
      ["It is more about my physical health and food", { n: 2 }],
    ] },
    { q: "How much is this affecting your daily life — sleep, work or relationships?", o: [
      ["A little", { t: 1, n: 1 }],
      ["Quite a lot", { t: 2, p: 1 }],
      ["Very much — it is hard to function", { p: 3 }],
    ] },
    { q: "Have you been diagnosed with a health condition?", o: [
      ["No", { t: 1 }],
      ["Yes — a mental health condition", { p: 2 }],
      ["Yes — a physical condition such as diabetes or high blood pressure", { n: 3 }],
      ["I’m not sure", { t: 1 }],
    ] },
    { q: "What kind of support are you looking for?", o: [
      ["Someone to talk to, and practical tools", { t: 3 }],
      ["A medical assessment or medication review", { p: 3 }],
      ["Guidance on food, eating and lifestyle", { n: 3 }],
      ["I’m open to whatever helps", { t: 1, p: 1, n: 1 }],
    ] },
    { q: "Where would you prefer to meet?", key: "where", o: [
      ["In person in Nairobi", {}, "country=kenya&type=physical"],
      ["Online, in Kenya", {}, "country=kenya&type=virtual"],
      ["Online, in Seychelles", {}, "country=seychelles&type=virtual"],
    ] },
    { q: "One last question, asked with care: are you currently having thoughts of harming yourself or someone else?", key: "safety", o: [
      ["No", {}],
      ["Yes", {}],
      ["I’d rather not say", {}],
    ] },
  ];
  const answers = new Array(Q.length).fill(null);
  let cur = -1; // -1 = intro, Q.length = result

  const SERVICES = {
    t: { key: "therapy", name: "Psychotherapy & Counselling", icon: "brain", page: "psychotherapy.html", why: "Talking with a therapist can help you understand what you are feeling, cope with stress and relationships, and build practical tools for change." },
    p: { key: "psychiatry", name: "Psychiatric Consultation", icon: "psychiatry", page: "psychiatry.html", why: "A psychiatrist can carry out a thorough medical assessment, clarify a diagnosis and discuss whether medication could help — alongside other support." },
    n: { key: "nutrition", name: "Nutrition & Dietetics", icon: "nutrition", page: "nutrition.html", why: "A nutritionist can build a practical eating plan for your health goals or condition, and help you see how food affects your energy and mood." },
  };

  const btnHTML = (label, icon, cls) => `${t(label)} ${window.ICON(icon)}`;

  function render() {
    const total = Q.length;
    barEl.style.width = (Math.max(0, cur) / total) * 100 + "%";
    navEl.hidden = cur === -1 || cur === total;
    if (cur === -1) {
      body.innerHTML = `<div class="center"><div class="icon-circle gold mx-auto">${window.ICON("compass")}</div>
        <h2>${t("Let’s find your starting point")}</h2>
        <p class="lead mx-auto">${t("Seven short questions. About two minutes. Your answers stay private on your device.")}</p>
        <button type="button" class="btn btn-gold mt-1" id="cStart">${btnHTML("Begin", "arrow")}</button></div>`;
      document.getElementById("cStart").addEventListener("click", () => { cur = 0; render(); });
      return;
    }
    if (cur === total) return renderResult();
    const item = Q[cur];
    body.innerHTML = `<div class="compass-q active"><p class="eyebrow">${t("Question")} ${cur + 1} / ${total}</p><h2>${t(item.q)}</h2>
      <div class="compass-opts" role="radiogroup">${item.o.map((o, i) => `<button type="button" role="radio" aria-checked="${answers[cur] === i}" aria-pressed="${answers[cur] === i}" data-i="${i}"><span class="ltr">${String.fromCharCode(65 + i)}</span>${t(o[0])}</button>`).join("")}</div></div>`;
    body.querySelectorAll("[data-i]").forEach((b) => b.addEventListener("click", () => {
      answers[cur] = +b.dataset.i;
      body.querySelectorAll("[data-i]").forEach((x) => { x.setAttribute("aria-pressed", String(x === b)); x.setAttribute("aria-checked", String(x === b)); });
      next.disabled = false;
      setTimeout(() => { if (answers[cur] !== null) { cur++; render(); } }, 280);
    }));
    prev.disabled = false;
    next.disabled = answers[cur] === null;
    next.innerHTML = btnHTML(cur === total - 1 ? "See my result" : "Next", "arrow");
    const h = body.querySelector("h2"); h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true });
  }

  function renderResult() {
    barEl.style.width = "100%";
    const score = { t: 0, p: 0, n: 0 };
    Q.forEach((q, i) => { if (answers[i] !== null) Object.entries(q.o[answers[i]][1]).forEach(([k, v]) => (score[k] += v)); });
    const ranked = Object.entries(score).sort((a, b) => b[1] - a[1]);
    const top = SERVICES[ranked[0][0]];
    const second = ranked[1][1] > 0 && ranked[0][1] - ranked[1][1] <= 2 ? SERVICES[ranked[1][0]] : null;
    const whereIdx = answers[5];
    const where = whereIdx !== null ? Q[5].o[whereIdx][2] : "";
    const safety = answers[6];
    const crisis = safety === 1 || safety === 2;
    const S = window.SITE;
    body.innerHTML = `
      ${crisis ? `<div class="emergency-box"><h3>${window.ICON("alert")}${t("Your safety comes first")}</h3>
        <p>${t("Thank you for telling us. If you are in immediate danger, please call emergency services now: 999 or 112 in Kenya, 999 in Seychelles.")}</p>
        <p>${t("You can also call Befrienders Kenya on +254 722 178 177, or call us and we will help you find support quickly:")} <a href="tel:${S.phoneHref}">${S.phone}</a></p></div><div class="mt-2"></div>` : ""}
      <div class="result-card">
        <span class="eyebrow">${t("Our suggestion")}</span>
        <h2>${t(top.name)}</h2>
        <p>${t(top.why)}</p>
        ${second ? `<p><strong>${t("You may also benefit from:")}</strong> ${t(second.name)}. ${t("Many clients combine services — your practitioner can advise.")}</p>` : ""}
        <div class="btn-row mt-1">
          <a class="btn btn-gold" href="book.html?service=${top.key}${where ? "&" + where : ""}">${btnHTML("Book this service", "arrow")}</a>
          <a class="btn btn-light" href="${top.page}">${t("Learn more")}</a>
        </div>
      </div>
      <p class="muted mt-1">${t("This is guidance, not a diagnosis. If you are unsure, call or WhatsApp us and we will gladly help you decide.")}</p>
      <button type="button" class="btn btn-ghost" id="cRestart">${btnHTML("Start again", "refresh")}</button>`;
    navEl.hidden = true;
    document.getElementById("cRestart").addEventListener("click", () => { answers.fill(null); cur = -1; render(); });
  }

  prev.addEventListener("click", () => { cur = Math.max(-1, cur - 1); render(); });
  next.addEventListener("click", () => { if (answers[cur] !== null) { cur++; render(); } });
  document.addEventListener("langchange", render);
  render();
})();
