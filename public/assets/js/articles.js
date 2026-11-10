/* Articles: latest (home), listing with search/filter/pagination, single view */
(function () {
  "use strict";
  const A = (window.ARTICLES || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const t = (s) => window.I18N.t(s);
  const L = () => window.I18N.lang;
  const img = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=72`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString(L() === "fr" ? "fr-FR" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const card = (a) => `
    <a class="article-card reveal" href="article.html?slug=${encodeURIComponent(a.slug)}">
      <div class="media"><img src="${img(a.img, 700)}" alt="" loading="lazy" width="700" height="440"></div>
      <div class="body">
        <div class="article-meta"><span class="tag">${esc(t(a.category))}</span><span>${a.minutes} ${esc(t("min read"))}</span></div>
        <h3>${esc(a.title[L()])}</h3>
        <p>${esc(a.excerpt[L()])}</p>
        <span class="read-more">${esc(t("Read article"))} ${window.ICON("arrow")}</span>
      </div>
    </a>`;

  function mount(el, html) {
    el.setAttribute("data-no-i18n", "");
    el.innerHTML = html;
    window.observeReveal && window.observeReveal(el);
  }

  /* --- Home: latest 3 --- */
  const latest = document.getElementById("latestArticles");
  const renderLatest = () => latest && mount(latest, A.slice(0, 3).map(card).join(""));

  /* --- Listing --- */
  const list = document.getElementById("articleList");
  const chipsEl = document.getElementById("articleChips");
  const searchEl = document.getElementById("articleSearch");
  const pagEl = document.getElementById("pagination");
  const PER = 6;
  const cats = ["All", ...new Set(A.map((a) => a.category))];
  const params = new URLSearchParams(location.search);
  let state = { cat: params.get("category") || "All", q: "", page: 1 };

  function renderList() {
    if (!list) return;
    mount(chipsEl, cats.map((c) => `<button type="button" class="chip" data-cat="${esc(c)}" aria-pressed="${c === state.cat}">${esc(t(c))}</button>`).join(""));
    const q = state.q.toLowerCase();
    const items = A.filter((a) => (state.cat === "All" || a.category === state.cat) &&
      (!q || [a.title.en, a.title.fr, a.excerpt.en, a.excerpt.fr, a.tags.join(" "), a.category].join(" ").toLowerCase().includes(q)));
    const pages = Math.max(1, Math.ceil(items.length / PER));
    state.page = Math.min(state.page, pages);
    const slice = items.slice((state.page - 1) * PER, state.page * PER);
    mount(list, slice.length ? slice.map(card).join("") : `<p class="empty">${esc(t("No articles match your search. Try a different word or category."))}</p>`);
    mount(pagEl, pages > 1 ? Array.from({ length: pages }, (_, i) => `<button type="button" data-page="${i + 1}" ${i + 1 === state.page ? 'aria-current="page"' : ""} aria-label="Page ${i + 1}">${i + 1}</button>`).join("") : "");
  }
  if (list) {
    chipsEl.addEventListener("click", (e) => { const b = e.target.closest("[data-cat]"); if (b) { state.cat = b.dataset.cat; state.page = 1; renderList(); } });
    pagEl.addEventListener("click", (e) => { const b = e.target.closest("[data-page]"); if (b) { state.page = +b.dataset.page; renderList(); list.scrollIntoView({ behavior: "smooth", block: "start" }); } });
    let deb;
    searchEl.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => { state.q = searchEl.value.trim(); state.page = 1; renderList(); }, 200); });
  }

  /* --- Single article --- */
  const view = document.getElementById("articleView");
  function renderView() {
    if (!view) return;
    const a = A.find((x) => x.slug === params.get("slug")) || A[0];
    if (!a) return;
    document.getElementById("articleTitle").textContent = a.title[L()];
    document.getElementById("articleCrumb").textContent = a.title[L()];
    document.getElementById("articleMeta").innerHTML = `<span class="tag">${esc(t(a.category))}</span><span>${fmtDate(a.date)}</span><span>${a.minutes} ${esc(t("min read"))}</span>`;
    ["articleTitle", "articleCrumb", "articleMeta"].forEach((id) => document.getElementById(id).setAttribute("data-no-i18n", ""));
    const heroImg = document.getElementById("articleHeroImg");
    heroImg.src = img(a.img, 1600);
    // The article body is trusted, first-party content from articles-data.js
    mount(view, `<div class="article-hero-img"><img src="${img(a.img, 1400)}" alt="" width="1400" height="700"></div><div class="prose">${a.body[L()]}</div>
      <p class="disclaimer">${esc(t("This article is for general information only and is not a substitute for professional advice, diagnosis or treatment."))}</p>`);
    document.title = a.title[L()] + " | The Wellness Ascent";
    const rel = A.filter((x) => x.slug !== a.slug).sort((x, y) => (y.category === a.category) - (x.category === a.category)).slice(0, 3);
    const relEl = document.getElementById("relatedArticles");
    relEl && mount(relEl, rel.map(card).join(""));
  }

  const renderAll = () => { renderLatest(); renderList(); renderView(); };
  renderAll();
  document.addEventListener("langchange", renderAll);
})();
