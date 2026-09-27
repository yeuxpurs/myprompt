/* myprompt — no build step, no API keys, no network calls with prompt content. */
(() => {
  "use strict";
  const core = window.MYPROMPT_CORE;
  const formats = window.MYPROMPT_FORMATS;
  const catalog = window.MYPROMPT_PROMPTS;
  const locales = window.MYPROMPT_I18N;
  const store = core.createStore();
  let state = store.load();
  let language = locales[state.language] ? state.language : "ja";
  let route = readRoute();
  let category =
    new URLSearchParams(location.hash.split("?")[1] || "").get("category") ||
    "";
  let tagFilter = "",
    editorTags = [],
    editingTagIndex = null,
    editorCategory = "",
    editorCategoryDisplay = "";
  let query = "",
    sort = "recommended",
    selected = null,
    variables = Object.create(null),
    deleted = null;
  let toastTimer,
    generated = "",
    draft = loadDraft(),
    editorId = null;
  let editorMetadata = {},
    sourceFormat = "json",
    drag = null;
  const layoutBackupKey = "myprompt.layout-backup";
  const mobileQuery = window.matchMedia("(max-width: 800px)");
  const categories = [
    "writing",
    "research",
    "work",
    "coding",
    "engineering",
    "creative",
  ];
  const fieldKeys = ["goal", "context", "constraints", "output", "criteria"];
  const app = document.getElementById("app");
  const dialog = document.getElementById("prompt-dialog");
  const paths = {
    home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
    library:
      '<rect x="3" y="3" width="7" height="18" rx="1"/><path d="m14 3 5-1 4 18-5 1zM6 7h1M6 17h1"/>',
    studio:
      '<path d="m4 20 4-1L20 7l-3-3L5 16zM14 7l3 3M4 4v4M2 6h4M18 15v6M15 18h6"/>',
    workflows:
      '<rect x="3" y="3" width="6" height="6" rx="1"/><rect x="15" y="15" width="6" height="6" rx="1"/><path d="M6 9v9h9M9 6h9v9"/>',
    guide: '<path d="M3 4h7l2 2 2-2h7v15h-7l-2 2-2-2H3zM12 6v15"/>',
    star: '<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9z"/>',
    folder: '<path d="M3 6h7l2 3h9v11H3zM3 6V4h7l2 2h9v3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    writing: '<path d="M5 3h10l4 4v14H5zM14 3v5h5M8 12h8M8 16h5"/>',
    research:
      '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5M7 10h6M10 7v6"/>',
    work: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12h18M10 12v3h4v-3"/>',
    coding: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6M14 3l-4 18"/>',
    engineering: '<path d="m12 3 8 4v10l-8 4-8-4V7zM4 7l8 5 8-5M12 12v9"/>',
    creative: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',
    grip: '<path d="M8 5h.01M16 5h.01M8 12h.01M16 12h.01M8 19h.01M16 19h.01" stroke-width="3"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18"/>',
  };
  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${Object.hasOwn(paths, name) ? paths[name] : paths.writing}</svg>`;
  }
  function escape(value = "") {
    return String(value).replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  }
  function t(key, params = {}) {
    let value = locales[language][key] || key;
    for (const [name, replacement] of Object.entries(params))
      value = value.replaceAll(`{${name}}`, String(replacement));
    return value;
  }
  function readRoute() {
    const value = location.hash.slice(1).split("?")[0];
    return [
      "home",
      "library",
      "studio",
      "workflows",
      "guide",
      "favorites",
      "my",
    ].includes(value)
      ? value
      : "home";
  }
  function routeLabel() {
    return t(route === "my" ? "myPrompts" : route);
  }
  function items() {
    return [
      ...catalog.map((item) => ({
        ...item,
        ...item.translations[language],
        builtIn: true,
      })),
      ...state.prompts.map((item) => ({ ...item, builtIn: false })),
    ];
  }
  function itemById(id) {
    return items().find((item) => item.id === id);
  }
  function categoryName(value) {
    return categories.includes(value) ? t(value) : value || t("custom");
  }
  function ordered(values, saved = []) {
    const unique = [...new Set(values)];
    return [
      ...saved.filter((v, i) => unique.includes(v) && saved.indexOf(v) === i),
      ...unique.filter((v) => !saved.includes(v)),
    ];
  }
  function categoryOptions() {
    return ordered(
      [
        ...categories,
        ...state.prompts.map((p) => p.category).filter(Boolean),
        ...state.layout.categoryOrder.filter(Boolean),
      ],
      state.layout.categoryOrder,
    );
  }
  function categorySequence() {
    return ordered(["", ...categoryOptions()], state.layout.categoryOrder);
  }
  const tagAliases = new Map();
  for (const item of catalog)
    for (const translation of Object.values(item.translations)) {
      translation.tags.forEach((label, index) => {
        const identity = core.tagIdentity(label);
        if (!tagAliases.has(identity))
          tagAliases.set(identity, core.tagIdentity(item.tags[index]));
      });
    }
  function promptTagEntries(p) {
    const original = p.builtIn
      ? catalog.find((item) => item.id === p.id)
      : null;
    return (p.tags || []).map((tag, index) => [
      `tag:${original ? core.tagIdentity(original.tags[index]) : tagAliases.get(core.tagIdentity(tag)) || core.tagIdentity(tag)}`,
      tag,
    ]);
  }
  function subtagOptions(cat = category) {
    const entries = new Map();
    for (const p of items().filter((p) => !cat || p.category === cat)) {
      if (p.section) entries.set(p.section, p.section);
      for (const [key, label] of promptTagEntries(p))
        if (!entries.has(key)) entries.set(key, label);
    }
    const saved =
      state.layout.tagOrder.find((row) => row.category === cat)?.tags || [];
    for (const key of saved)
      if (!key.startsWith("tag:") && !entries.has(key)) entries.set(key, key);
    return ordered([...entries.keys()], saved).map((key) => [
      key,
      entries.get(key),
    ]);
  }
  function tagOptions() {
    return subtagOptions("").filter(([key]) => key.startsWith("tag:"));
  }
  function orderAttrs(kind, key, group = "") {
    return `data-order-kind="${kind}" data-order-key="${escape(key)}" data-order-group="${escape(group)}"`;
  }
  function dragHandle(name) {
    return `<button type="button" class="drag-handle" data-drag-handle aria-label="${escape(t("moveItem", { name }))}" title="${escape(t("arrangementHint"))}">${icon("grip")}</button>`;
  }
  function tagChips(tags, clickable = false, prompt) {
    const entries = prompt
      ? promptTagEntries(prompt)
      : (tags || []).map((tag) => [`tag:${core.tagIdentity(tag)}`, tag]);
    return `<div class="prompt-tags">${entries
      .map(([key, tag]) =>
        clickable
          ? `<button class="prompt-tag" data-filter-tag="${escape(key)}" aria-label="${escape(t("filterTag"))}: ${escape(tag)}">#${escape(tag)}</button>`
          : `<span class="prompt-tag">#${escape(tag)}</span>`,
      )
      .join("")}</div>`;
  }
  function filterRows() {
    return `<div class="arrange-heading"><span>${escape(t("arrange"))}<small>${escape(t("arrangementHint"))}</small></span><button class="btn quiet" data-action="layout-editor">${icon("coding")}${escape(t("layoutEditor"))}</button></div>
      <div class="filters" role="group" aria-label="${escape(t("categoryLabel"))}">${categorySequence()
        .map(
          (cat) =>
            `<span class="sortable-chip ${category === cat ? "active" : ""}" ${orderAttrs("category", cat)}>${dragHandle(cat ? categoryName(cat) : t("all"))}<button class="filter" data-category="${escape(cat)}" aria-pressed="${category === cat}">${escape(cat ? categoryName(cat) : t("all"))}</button></span>`,
        )
        .join("")}</div>
      <div class="subtag-row"><span class="subtag-label">${escape(t("subcategories"))}</span><div class="subtag-filters" role="group" aria-label="${escape(t("subcategories"))}"><button class="subtag-all ${!tagFilter ? "active" : ""}" data-filter-tag="" aria-pressed="${!tagFilter}">${escape(t("allSubtags"))}</button>${subtagOptions()
        .map(
          ([key, label]) =>
            `<span class="sortable-chip subtag ${tagFilter === key ? "active" : ""}" ${orderAttrs("subtag", key, category)}>${dragHandle(label)}<button class="filter" data-filter-tag="${escape(key)}" aria-pressed="${tagFilter === key}">${key.startsWith("tag:") ? "#" : ""}${escape(label)}</button></span>`,
        )
        .join("")}</div></div>`;
  }
  function persist() {
    state.language = language;
    const ok = store.save(state);
    if (!ok) notify(t("storageError"));
    updateStorageNotice();
    return ok;
  }
  function updateStorageNotice() {
    const el = document.getElementById("storage-notice");
    if (el) {
      el.hidden = !store.error;
      el.textContent = store.error ? t("storageError") : "";
    }
  }
  function notify(message, undo = false) {
    const toast = document.getElementById("toast");
    toast.innerHTML = `${escape(message)}${undo ? `<button data-action="undo">${escape(t("undo"))}</button>` : ""}`;
    toast.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(
      () => toast.classList.remove("visible"),
      undo ? 12000 : 5000,
    );
  }
  function navLink(id, glyph, key, count) {
    return `<a class="nav-link ${route === id ? "active" : ""}" href="#${id}" ${route === id ? 'aria-current="page"' : ""}>${icon(glyph)}<span>${escape(t(key))}</span>${count !== undefined ? `<span class="count">${count}</span>` : ""}</a>`;
  }
  function render() {
    document.documentElement.lang = language;
    document.title = `${routeLabel()} · myprompt · GPT-6`;
    app.innerHTML = `<a class="skip" href="#main-content">${escape(t("skipContent"))}</a>
      <aside class="sidebar" id="sidebar"><a class="brand" href="#home"><span class="brand-mark">m</span>myprompt</a><div class="brand-sub">${escape(t("tagline"))}</div>
      <nav aria-label="${escape(t("workspace"))}"><p class="nav-label">${escape(t("workspace"))}</p>${navLink("home", "home", "home")}${navLink("library", "library", "library")}${navLink("studio", "studio", "studio")}${navLink("workflows", "workflows", "workflows")}${navLink("guide", "guide", "guide")}
      <p class="nav-label">${escape(t("personal"))}</p>${navLink("favorites", "star", "favorites", state.favorites.length)}${navLink("my", "folder", "myPrompts", state.prompts.length)}</nav>
      <div class="sidebar-bottom"><div class="storage-card"><strong>${icon("lock")}${escape(t("backup"))}</strong>${escape(t("localNote"))}<button class="source-link" data-action="layout-editor">${escape(t("layoutEditor"))} ↗</button><div class="backup-actions"><button data-action="export">${escape(t("export"))} ↗</button><button data-action="import">${escape(t("import"))} ↙</button></div></div><div class="sidebar-foot"><span class="live-dot"></span>GPT-6 · 2026 EDITION</div></div></aside>
      <div class="shell"><header class="topbar"><button class="menu-button" data-action="menu" aria-label="${escape(t("mobileMenu"))}" aria-expanded="false" aria-controls="sidebar">${icon("menu")}</button><div class="crumb">myprompt <span>/</span> <strong>${escape(routeLabel())}</strong></div><div class="language-bar" role="group" aria-label="${escape(t("languageLabel"))}">${core.languages.map((lang) => `<button lang="${lang.code}" data-language="${lang.code}" aria-pressed="${language === lang.code}">${escape(lang.name)}</button>`).join("")}</div></header>
      <main id="main-content" class="main" tabindex="-1"><div class="notice" id="storage-notice" role="alert" ${store.error ? "" : "hidden"}>${store.error ? escape(t("storageError")) : ""}</div><div id="page"></div><footer class="bottom-note"><span>${icon("lock")}${escape(t("footer"))}</span><a href="https://github.com/yeuxpurs/myprompt" target="_blank" rel="noopener noreferrer">GitHub ↗</a></footer></main></div>`;
    renderPage();
    syncSidebar();
  }
  function header(title, description) {
    return `<header class="page-header"><div class="eyebrow"><span class="live-dot"></span>${escape(t("versionLabel"))}</div><h1>${escape(t(title))}</h1><p>${escape(t(description))}</p></header>`;
  }
  function renderPage() {
    const page = document.getElementById("page");
    if (route === "studio") {
      page.innerHTML = studioPage();
      updateStudio();
      return;
    }
    if (route === "workflows") {
      page.innerHTML = workflowsPage();
      return;
    }
    if (route === "guide") {
      page.innerHTML = guidePage();
      return;
    }
    if (tagFilter && !subtagOptions().some(([key]) => key === tagFilter))
      tagFilter = "";
    if (category && !categoryOptions().includes(category)) category = "";
    const home = route === "home";
    const titles = {
      library: ["libraryTitle", "libraryDescription"],
      my: ["myTitle", "myDescription"],
      favorites: ["favoritesTitle", "favoritesDescription"],
    };
    page.innerHTML = home ? homeHero() : header(...titles[route]);
    page.insertAdjacentHTML(
      "beforeend",
      `${home ? `<div class="section-head"><div><h2>${escape(t("featured"))}</h2><p>${escape(t("featuredDescription"))}</p></div><a href="#library">${escape(t("viewAll"))}${icon("arrow")}</a></div>` : ""}
      <div class="tools-row"><div class="search-box">${icon("search")}<input id="search" type="search" aria-label="${escape(t("searchPlaceholder"))}" placeholder="${escape(t("searchPlaceholder"))}" value="${escape(query)}" autocomplete="off"><kbd aria-hidden="true">/</kbd></div>${home ? "" : `<button class="btn primary" data-action="new">${icon("plus")}${escape(t("addPrompt"))}</button>`}</div>
      ${filterRows()}<div class="result-meta"><span id="result-count" role="status"></span><select class="sort" id="sort" aria-label="${escape(t("sortLabel"))}"><option value="recommended" ${sort === "recommended" ? "selected" : ""}>${escape(t("promptOrder"))}</option><option value="newest" ${sort === "newest" ? "selected" : ""}>${escape(t("sortNewest"))}</option></select></div><div class="prompt-grid" id="prompt-grid"></div>`,
    );
    renderGrid();
  }
  function homeHero() {
    return `<section class="hero"><div><div class="eyebrow"><span class="live-dot"></span>${escape(t("versionLabel"))}</div><h1>${escape(t("heroTitle"))}</h1><p>${escape(t("heroDescription"))}</p><div class="hero-actions"><a class="btn primary" href="#library">${escape(t("explore"))}${icon("arrow")}</a><button class="btn" data-action="new">${icon("plus")}${escape(t("createPrompt"))}</button></div></div><div class="hero-art" aria-hidden="true"><div class="orbit"></div><span class="art-dot"></span><span class="art-dot small"></span><div class="prompt-paper paper-back"></div><div class="prompt-paper"><div class="paper-top"><span>myprompt / 01</span>${icon("creative")}</div><div class="paper-line short"></div><div class="paper-line"></div><div class="paper-line medium"></div><div class="paper-line"></div><span class="paper-pill">{{ ${escape(t("goal"))} }}</span></div><span class="floating-tile">${icon("creative")}</span></div></section>
      <section class="stats" aria-label="${escape(t("library"))}"><div class="stat"><strong>${catalog.length.toString().padStart(2, "0")}</strong><span>${escape(t("statTemplates"))}</span></div><div class="stat"><strong>07</strong><span>${escape(t("statLanguages"))}</span></div><div class="stat"><strong>${state.prompts.length.toString().padStart(2, "0")}</strong><span>${escape(t("statYours"))}</span></div></section>`;
  }
  function filteredItems() {
    let list = items();
    if (route === "my") list = list.filter((p) => !p.builtIn);
    if (route === "favorites")
      list = list.filter((p) => state.favorites.includes(p.id));
    if (category) list = list.filter((p) => p.category === category);
    if (tagFilter)
      list = list.filter(
        (p) =>
          p.section === tagFilter ||
          promptTagEntries(p).some(([key]) => key === tagFilter),
      );
    const order = ordered(
      list.map((p) => p.id),
      state.layout.promptOrder,
    );
    list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    const needle = query.trim().toLocaleLowerCase(language);
    if (needle)
      list = list.filter((p) =>
        [
          p.title,
          p.description,
          p.body,
          categoryName(p.category),
          p.section || "",
          ...(p.tags || []),
        ]
          .join(" ")
          .toLocaleLowerCase(language)
          .includes(needle),
      );
    if (sort === "newest")
      list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    return list;
  }
  function renderGrid() {
    const grid = document.getElementById("prompt-grid");
    if (!grid) return;
    const list = filteredItems();
    document.getElementById("result-count").textContent = t("resultCount", {
      count: list.length,
    });
    grid.innerHTML = list.length
      ? list.map(card).join("")
      : `<div class="empty">${icon("search")}<h3>${escape(t("noResults"))}</h3><p>${escape(t("noResultsHint"))}</p><button class="btn" data-action="reset">${escape(t("resetFilters"))}</button> <button class="btn primary" data-action="new">${escape(t("addPrompt"))}</button></div>`;
  }
  function card(p) {
    const favorite = state.favorites.includes(p.id);
    return `<article class="prompt-card" ${orderAttrs("prompt", p.id)}><div class="card-top"><span class="category-icon ${categories.includes(p.category) ? p.category : ""}">${icon(p.category)}</span><div class="card-controls">${dragHandle(p.title)}<button class="icon-button quick-edit" data-edit-prompt="${escape(p.id)}" aria-label="${escape(t(p.builtIn ? "editCopy" : "edit"))}: ${escape(p.title)}">${icon("studio")}</button><button class="favorite-button" data-favorite="${escape(p.id)}" aria-label="${escape(t(favorite ? "unfavorite" : "favorite"))}: ${escape(p.title)}" aria-pressed="${favorite}">${icon("star")}</button></div></div><h3><button class="card-title" data-open="${escape(p.id)}">${escape(p.title)}</button></h3><p class="card-description">${escape(p.description || p.body.slice(0, 120))}</p>${p.section ? `<button class="section-badge" data-filter-tag="${escape(p.section)}">${escape(p.section)}</button>` : ""}${tagChips(p.tags, true, p)}<div class="card-bottom"><span class="tag">${escape(categoryName(p.category))} · ${escape(t(p.builtIn ? "curated" : "custom"))}</span><button data-open="${escape(p.id)}">${escape(t("usePrompt"))}${icon("arrow")}</button></div></article>`;
  }
  function workflowsPage() {
    return (
      header("workflowsTitle", "workflowsDescription") +
      `<div class="workflow-grid">${locales[language].workflowCards.map((flow, index) => `<article class="workflow-card"><div class="workflow-number">0${index + 1}</div><h2>${escape(flow.title)}</h2><p>${escape(flow.description)}</p><ol>${flow.steps.map((step) => `<li>${escape(step)}</li>`).join("")}</ol><button class="btn" data-open="${escape(flow.promptId)}">${escape(t("usePrompt"))}${icon("arrow")}</button></article>`).join("")}</div><div class="guide-banner">${icon("engineering")}<div><h2>${escape(t("qualityTitle"))}</h2><p>${escape(t("qualityDescription"))}</p></div></div>`
    );
  }
  function guidePage() {
    return (
      header("guideTitle", "guideDescription") +
      `<div class="guide-grid">${locales[language].guideCards.map((card, index) => `<article class="guide-card"><span class="number">0${index + 1}</span><h2>${escape(card.title)}</h2><p>${escape(card.body)}</p></article>`).join("")}</div><div class="guide-banner">${icon("creative")}<div><h2>GPT-6 · Astra / Sol / Luna</h2><p>${escape(t("modelNote"))}</p><div class="guide-links"><a href="https://developers.openai.com/api/docs/guides/latest-model" target="_blank" rel="noopener noreferrer">${escape(t("officialDocs"))} ↗</a><a href="https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra" target="_blank" rel="noopener noreferrer">GPT-6 · ${escape(t("guide"))} ↗</a></div></div></div><div class="guide-grid">${[
        ["enterpriseTitle", "enterpriseDescription"],
        ["privacyTitle", "privacyDescription"],
        ["changeTitle", "changeDescription"],
        ["qualityTitle", "qualityDescription"],
      ]
        .map(
          ([title, body]) =>
            `<article class="guide-card"><h2>${escape(t(title))}</h2><p>${escape(t(body))}</p></article>`,
        )
        .join("")}</div>`
    );
  }
  function openDialog(html) {
    dialog.innerHTML = html;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    const initial = dialog.querySelector(
      '#edit-title, [data-variable], [data-action="copy-detail"]',
    );
    initial?.focus({ preventScroll: true });
  }
  function dialogHeader(title, description) {
    return `<header class="dialog-header"><div><h2 id="dialog-title">${escape(title)}</h2>${description ? `<p>${escape(description)}</p>` : ""}</div><button class="icon-button" data-action="close" aria-label="${escape(t("close"))}">${icon("close")}</button></header>`;
  }
  function openDetail(id) {
    selected = itemById(id);
    if (!selected) return;
    variables = Object.create(null);
    const names = ordered(
      [...(selected.variables || []), ...core.extractVariables(selected.body)],
      selected.variableOrder || [],
    );
    openDialog(
      dialogHeader(selected.title, selected.description) +
        `<div class="dialog-content"><div class="detail-metadata"><span class="tag">${escape(categoryName(selected.category))}</span>${tagChips(selected.tags)}</div><div class="detail-grid ${names.length ? "" : "single"}">${names.length ? `<section><p class="field-label">${escape(t("variables"))}</p><p class="hint" style="margin:8px 0 20px">${escape(t("detailHint"))}</p>${names.map((name, index) => `<div class="field"><label for="var-${index}">${escape(name)}</label><textarea id="var-${index}" data-variable="${escape(name)}" placeholder="${escape(t("variablePlaceholder", { name }))}" maxlength="100000" rows="2"></textarea></div>`).join("")}</section>` : ""}<section><p class="field-label">${escape(t("preview"))}</p><pre class="preview-text" id="detail-preview"></pre><p id="unresolved" class="unresolved"></p><div class="detail-actions"><button class="btn primary" data-action="copy-detail">${icon("copy")}${escape(t("copy"))}</button><a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">${escape(t("openChatGPT"))} ↗</a></div><p class="privacy-hint">${escape(t("handoffHint"))}</p></section></div><div id="delete-confirm"></div></div><footer class="dialog-actions"><button class="btn quiet push-left" data-action="edit">${icon("studio")}${escape(t(selected.builtIn ? "editCopy" : "edit"))}</button>${!selected.builtIn ? `<button class="btn quiet danger" data-action="delete">${escape(t("delete"))}</button>` : ""}<button class="btn" data-action="duplicate">${icon("plus")}${escape(t("duplicate"))}</button><button class="btn" data-action="close">${escape(t("close"))}</button></footer>`,
    );
    updateDetail();
  }
  function updateDetail() {
    const text = core.fillVariables(selected.body, variables);
    document.getElementById("detail-preview").textContent = text;
    const count = core.extractVariables(text).length;
    document.getElementById("unresolved").textContent = count
      ? t("unresolvedHint", { count })
      : "";
  }
  function openEditor(source, duplicate = false) {
    const p = source || {
      title: "",
      description: "",
      body: "",
      category: category || "work",
      section: tagFilter && !tagFilter.startsWith("tag:") ? tagFilter : "",
      tags: [],
    };
    editorId = source && !source.builtIn && !duplicate ? source.id : null;
    editorMetadata = Object.fromEntries(
      ["variables", "variableOrder"]
        .filter((key) => p[key] !== undefined)
        .map((key) => [key, p[key]]),
    );
    editorCategory = p.category || "";
    editorCategoryDisplay = editorCategory ? categoryName(editorCategory) : "";
    editorTags = [...(p.tags || [])];
    editingTagIndex = null;
    const catOptions = [
      ...new Set([...categoryOptions(), p.category].filter(Boolean)),
    ];
    openDialog(
      dialogHeader(
        t(source?.builtIn ? "editCopy" : editorId ? "editTitle" : "newTitle"),
        t(source?.builtIn ? "editCopyHint" : "variablesHint"),
      ) +
        `<form id="editor-form"><div class="dialog-content">
      <div class="field"><label for="edit-title">${escape(t("titleLabel"))}</label><input id="edit-title" name="title" value="${escape(p.title)}" placeholder="${escape(t("titlePlaceholder"))}" maxlength="160" required></div>
      <div class="field"><label for="edit-description">${escape(t("descriptionLabel"))}</label><input id="edit-description" name="description" value="${escape(p.description)}" placeholder="${escape(t("descriptionPlaceholder"))}" maxlength="2000"></div>
      <div class="field"><label for="edit-category">${escape(t("categoryLabel"))}</label><input id="edit-category" name="category" list="category-options" value="${escape(editorCategoryDisplay)}" placeholder="${escape(t("categoryPlaceholder"))}" maxlength="100" aria-describedby="category-hint"><datalist id="category-options">${catOptions.map((cat) => `<option value="${escape(categoryName(cat))}"></option>`).join("")}</datalist><span class="hint" id="category-hint">${escape(t("categoryHint"))}</span></div>
      <div class="field"><label for="edit-section">${escape(t("sectionLabel"))}</label><input id="edit-section" name="section" value="${escape(p.section || "")}" maxlength="160" list="section-options" aria-describedby="section-hint"><datalist id="section-options">${[...new Set(state.prompts.map((p) => p.section).filter(Boolean))].map((section) => `<option value="${escape(section)}"></option>`).join("")}</datalist><span class="hint" id="section-hint">${escape(t("sectionHint"))}</span></div>
      <div class="field"><label for="edit-tags">${escape(t("tagsLabel"))}</label><div class="tag-editor" id="tag-editor"><div id="editable-tags" class="editable-tags"></div><div class="tag-input-row"><input id="edit-tags" placeholder="${escape(t("tagInputPlaceholder"))}" aria-describedby="tags-hint tag-edit-status" autocomplete="off" list="tag-suggestions" maxlength="2000"><button class="btn" type="button" data-action="commit-tag">${escape(t("addTag"))}</button><button class="icon-button" type="button" data-action="cancel-tag-edit" aria-label="${escape(t("cancelTagEdit"))}" hidden>${icon("close")}</button></div></div><datalist id="tag-suggestions">${tagOptions()
        .map(([, tag]) => `<option value="${escape(tag)}"></option>`)
        .join(
          "",
        )}</datalist><span class="hint" id="tags-hint">${escape(t("tagsHint"))}</span><span class="hint" id="tag-edit-status" role="status"></span></div>
      <div class="field"><label for="edit-body">${escape(t("bodyLabel"))}</label><textarea class="code" id="edit-body" name="body" placeholder="${escape(t("bodyPlaceholder"))}" maxlength="100000" required>${escape(p.body)}</textarea><span class="hint">${escape(t("variablesHint"))}</span></div><p class="error-text" id="editor-error" role="alert"></p></div>
      <footer class="dialog-actions"><button class="btn" type="button" data-action="close">${escape(t("cancel"))}</button><button class="btn primary" type="submit">${icon("check")}${escape(t("save"))}</button></footer></form>`,
    );
    renderTagEditor();
  }
  function renderTagEditor() {
    document.getElementById("editable-tags").innerHTML = editorTags.length
      ? editorTags
          .map(
            (tag, index) =>
              `<span class="editable-tag ${index === editingTagIndex ? "editing" : ""}" ${orderAttrs("editor-tag", core.tagIdentity(tag))}>${dragHandle(tag)}<button type="button" data-rename-tag="${index}" aria-label="${escape(t("renameTag", { tag }))}">#${escape(tag)}</button><button type="button" data-remove-tag="${index}" aria-label="${escape(t("removeTag", { tag }))}">${icon("close")}</button></span>`,
          )
          .join("")
      : `<span class="hint">${escape(t("noTags"))}</span>`;
    dialog.querySelector('[data-action="commit-tag"]').textContent = t(
      editingTagIndex === null ? "addTag" : "applyTag",
    );
    dialog.querySelector('[data-action="cancel-tag-edit"]').hidden =
      editingTagIndex === null;
    document.getElementById("tag-edit-status").textContent =
      editingTagIndex === null
        ? `${editorTags.length} / ${core.limits.tags}`
        : t("editingTag", { tag: editorTags[editingTagIndex] });
  }
  function commitTagInput() {
    const input = document.getElementById("edit-tags");
    if (!input.value.trim() && editingTagIndex === null) return true;
    try {
      editorTags =
        editingTagIndex === null
          ? core.normalizeTags([
              ...editorTags,
              ...core.normalizeTags(input.value),
            ])
          : core.renameTag(editorTags, editingTagIndex, input.value);
      input.value = "";
      editingTagIndex = null;
      document.getElementById("editor-error").textContent = "";
      renderTagEditor();
      return true;
    } catch (_) {
      document.getElementById("editor-error").textContent = t("invalidTags");
      input.focus();
      return false;
    }
  }
  function beginTagEdit(index) {
    const tag = editorTags[index];
    if (tag === undefined) return;
    const input = document.getElementById("edit-tags");
    if (input.value.trim() && !commitTagInput()) return;
    editingTagIndex = editorTags.findIndex(
      (value) => core.tagIdentity(value) === core.tagIdentity(tag),
    );
    if (editingTagIndex < 0) {
      editingTagIndex = null;
      return;
    }
    input.value = editorTags[editingTagIndex];
    renderTagEditor();
    input.focus();
    input.select();
  }
  function removeEditorTag(index) {
    if (index < 0 || index >= editorTags.length) return;
    editorTags = editorTags.filter((_, i) => i !== index);
    if (editingTagIndex === index) {
      editingTagIndex = null;
      document.getElementById("edit-tags").value = "";
    } else if (editingTagIndex !== null && editingTagIndex > index)
      editingTagIndex--;
    renderTagEditor();
    document.getElementById("edit-tags").focus();
  }
  function saveEditor(form) {
    const fields = new FormData(form);
    if (!commitTagInput()) return;
    const tags = [...editorTags];
    const enteredCategory = String(fields.get("category")).trim();
    const categoryValue =
      enteredCategory === editorCategoryDisplay
        ? editorCategory
        : categoryOptions().find(
            (value) => categoryName(value) === enteredCategory,
          ) || enteredCategory;
    if (!editorId && state.prompts.length >= core.limits.prompts) {
      document.getElementById("editor-error").textContent = t("limitError");
      return;
    }
    const existing = state.prompts.find((p) => p.id === editorId);
    try {
      const value = core.validatePrompt({
        ...editorMetadata,
        ...(existing || {}),
        title: fields.get("title"),
        description: fields.get("description"),
        category: categoryValue,
        section: String(fields.get("section") || "").trim(),
        tags,
        body: fields.get("body"),
        updatedAt: new Date().toISOString(),
      });
      if (existing)
        state.prompts = state.prompts.map((p) =>
          p.id === editorId ? value : p,
        );
      else {
        if (state.prompts.length >= core.limits.prompts)
          throw new Error("limit");
        state.prompts.push(value);
      }
      const saved = persist();
      dialog.close();
      query = "";
      category = "";
      tagFilter = "";
      if (route !== "my") location.hash = "my";
      else render();
      if (saved) notify(t("saved"));
    } catch (_) {
      document.getElementById("editor-error").textContent = t("invalidPrompt");
    }
  }
  async function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(text);
      else {
        const input = document.createElement("textarea");
        input.value = text;
        input.style.cssText = "position:fixed;opacity:0";
        (dialog.open ? dialog : document.body).appendChild(input);
        input.select();
        const ok = document.execCommand("copy");
        input.remove();
        if (!ok) throw new Error("copy");
      }
      notify(t("copied"));
    } catch (_) {
      notify(t("copyFailed"));
    }
  }
  function loadDraft() {
    try {
      const value = JSON.parse(localStorage.getItem("myprompt.studio") || "{}");
      return Object.fromEntries(
        ["goal", "context", "constraints", "output", "criteria"].map((key) => [
          key,
          typeof value?.[key] === "string" ? value[key].slice(0, 100000) : "",
        ]),
      );
    } catch (_) {
      return {};
    }
  }
  function studioPage() {
    return (
      header("studioTitle", "studioDescription") +
      `<div class="guide-banner refine-note">${icon("studio")}<div><h2>${escape(t("refineTitle"))}</h2><p>${escape(t("refineDescription"))}</p></div></div><div class="studio-layout"><form class="panel studio-form" id="studio-form"><h2 class="panel-title">${icon("studio")}${escape(t("createPrompt"))}</h2>${fieldKeys.map((key, index) => `<div class="field"><label for="studio-${key}"><span class="step">0${index + 1}</span>${escape(t(key))}</label><textarea id="studio-${key}" name="${key}" data-studio="${key}" placeholder="${escape(t(key + "Placeholder"))}" rows="2" maxlength="16000" ${key === "goal" ? "required" : ""}>${escape(draft[key] || "")}</textarea></div>`).join("")}<div class="panel-footer"><button class="btn primary" type="submit">${icon("creative")}${escape(t("compose"))}</button><button class="btn" type="button" data-action="clear-studio">${escape(t("clear"))}</button></div><p class="draft-note" id="draft-status"></p></form><section class="panel studio-output"><h2 class="panel-title">${icon("writing")}${escape(t("preview"))}</h2><div id="studio-preview"></div><p class="field-label">${escape(t("completionCheck"))}</p><div id="checklist" class="checklist"></div><div class="panel-footer"><button class="btn primary" data-action="copy-studio" ${generated ? "" : "disabled"}>${icon("copy")}${escape(t("copy"))}</button><button class="btn" data-action="save-studio" ${generated ? "" : "disabled"}>${icon("plus")}${escape(t("saveToLibrary"))}</button></div><p class="privacy-hint">${escape(t("studioDescription"))}</p></section></div>`
    );
  }
  function compose() {
    generated =
      fieldKeys
        .filter((key) => (draft[key] || "").trim())
        .map((key) => `${t(key)}\n${draft[key].trim()}`)
        .join("\n\n") +
      "\n\n" +
      t("generationRules");
    updateStudio();
  }
  function updateStudio() {
    const preview = document.getElementById("studio-preview");
    if (!preview) return;
    preview.innerHTML = generated
      ? `<pre class="preview-text">${escape(generated)}</pre>`
      : `<div class="output-empty">${icon("creative")}<p>${escape(t("studioEmpty"))}</p></div>`;
    document.getElementById("checklist").innerHTML = fieldKeys
      .map(
        (key) =>
          `<span class="check-item ${(draft[key] || "").trim() ? "done" : ""}">${icon("check")}${escape(t(key))}</span>`,
      )
      .join("");
    document
      .querySelectorAll(
        '[data-action="copy-studio"],[data-action="save-studio"]',
      )
      .forEach((el) => (el.disabled = !generated));
  }
  function workspaceDocument() {
    return {
      ...state,
      language,
      layout: { ...state.layout, categoryOrder: categorySequence() },
    };
  }
  function downloadSource(text, format) {
    const blob = new Blob([text], {
      type:
        format === "md"
          ? "text/markdown;charset=utf-8"
          : "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = `myprompt-${new Date().toISOString().slice(0, 10)}.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t("exportSuccess"));
  }
  function exportLibrary(format = "json") {
    downloadSource(formats.serialize(workspaceDocument(), format), format);
  }
  function prepareDocument(parsed) {
    const renamedIds = new Map();
    const prompts = parsed.prompts.map((p) => {
      if (!catalog.some((item) => item.id === p.id)) return p;
      const renamed = core.validatePrompt({ ...p, id: undefined });
      renamedIds.set(p.id, renamed.id);
      return renamed;
    });
    const remap = (id) => renamedIds.get(id) || id;
    return {
      ...parsed,
      prompts,
      favorites: parsed.favorites.map(remap),
      layout: {
        ...parsed.layout,
        promptOrder: parsed.layout.promptOrder.map(remap),
      },
    };
  }
  function mergeLayout(incoming, existing, remap) {
    const rows = new Map(
      existing.tagOrder.map((row) => [row.category, row.tags]),
    );
    for (const row of incoming.tagOrder)
      rows.set(row.category, [
        ...new Set([...row.tags, ...(rows.get(row.category) || [])]),
      ]);
    return core.normalizeLayout({
      categoryOrder: [
        ...new Set([...incoming.categoryOrder, ...existing.categoryOrder]),
      ],
      tagOrder: [...rows].map(([category, tags]) => ({ category, tags })),
      promptOrder: [
        ...new Set([
          ...incoming.promptOrder.map(remap),
          ...existing.promptOrder,
        ]),
      ],
    });
  }
  async function importLibrary(file) {
    if (!file) return;
    try {
      if (file.size > core.limits.importBytes) throw new Error("size");
      const incoming = prepareDocument(
        formats.parse(
          await file.text(),
          /\.(?:md|markdown)$/i.test(file.name) ? "md" : "json",
        ),
      );
      const before = state.prompts.length;
      const merged = core.mergeImport(state.prompts, incoming.prompts);
      const remap = (id) =>
        Object.hasOwn(merged.idMap, id) ? merged.idMap[id] : id;
      const allowed = new Set([
        ...catalog.map((p) => p.id),
        ...merged.prompts.map((p) => p.id),
      ]);
      const next = {
        ...state,
        prompts: merged.prompts,
        favorites: [
          ...new Set([...state.favorites, ...incoming.favorites.map(remap)]),
        ].filter((id) => allowed.has(id)),
        layout: mergeLayout(incoming.layout, state.layout, remap),
      };
      state = next;
      const ok = persist(),
        count = state.prompts.length - before;
      query = "";
      category = "";
      tagFilter = "";
      if (route !== "my") location.hash = "my";
      else render();
      if (ok) notify(t("importSuccess", { count }));
    } catch (_) {
      notify(t("importError"));
    } finally {
      document.getElementById("import-file").value = "";
    }
  }
  function openLayoutEditor() {
    sourceFormat = "json";
    let hasBackup = false;
    try {
      hasBackup = !!localStorage.getItem(layoutBackupKey);
    } catch (_) {}
    openDialog(
      dialogHeader(t("layoutTitle"), t("layoutDescription")) +
        `<div class="dialog-content source-editor">
      <div class="source-toolbar"><label for="source-format">${escape(t("formatLabel"))}</label><select id="source-format"><option value="json">JSON</option><option value="md">Markdown</option></select><button class="btn quiet" data-action="export-source-json">${escape(t("exportJSON"))}</button><button class="btn quiet" data-action="export-source-md">${escape(t("exportMarkdown"))}</button></div>
      <label class="field-label" for="layout-source">${escape(t("sourceLabel"))}</label><p class="hint">${escape(t("sourceHelp"))}</p><textarea class="code layout-source" id="layout-source" spellcheck="false" aria-describedby="layout-apply-hint">${escape(formats.serialize(workspaceDocument(), sourceFormat))}</textarea><p class="hint" id="layout-apply-hint">${escape(t("layoutApplyHint"))}</p><p class="error-text" id="layout-error" role="alert"></p></div><footer class="dialog-actions"><button class="btn quiet push-left" data-action="restore-layout" ${hasBackup ? "" : "disabled"}>${escape(t("restoreLayout"))}</button><button class="btn" data-action="close">${escape(t("cancel"))}</button><button class="btn primary" data-action="apply-layout">${escape(t("applyLayout"))}</button></footer>`,
    );
  }
  function sourceError() {
    document.getElementById("layout-error").textContent = t("layoutError");
  }
  function changeSourceFormat(next) {
    try {
      const parsed = formats.parse(
        document.getElementById("layout-source").value,
        sourceFormat,
      );
      document.getElementById("layout-source").value = formats.serialize(
        parsed,
        next,
      );
      sourceFormat = next;
      document.getElementById("layout-error").textContent = "";
    } catch (_) {
      document.getElementById("source-format").value = sourceFormat;
      sourceError();
    }
  }
  function exportEditorSource(format) {
    try {
      downloadSource(
        formats.serialize(
          formats.parse(
            document.getElementById("layout-source").value,
            sourceFormat,
          ),
          format,
        ),
        format,
      );
    } catch (_) {
      sourceError();
    }
  }
  function applyLayout(restore = false) {
    let parsed;
    try {
      parsed = prepareDocument(
        restore
          ? core.parseDocument(localStorage.getItem(layoutBackupKey) || "")
          : formats.parse(
              document.getElementById("layout-source").value,
              sourceFormat,
            ),
      );
    } catch (_) {
      sourceError();
      return;
    }
    const allowed = new Set([
      ...catalog.map((p) => p.id),
      ...parsed.prompts.map((p) => p.id),
    ]);
    const next = {
      ...state,
      prompts: parsed.prompts,
      layout: parsed.layout,
      favorites: parsed.favorites.filter((id) => allowed.has(id)),
      language,
    };
    try {
      localStorage.setItem(layoutBackupKey, JSON.stringify(state));
      if (!store.save(next)) throw new Error("storage");
    } catch (_) {
      document.getElementById("layout-error").textContent = t("storageError");
      return;
    }
    state = next;
    category = "";
    tagFilter = "";
    query = "";
    sort = "recommended";
    dialog.close();
    render();
    notify(t(restore ? "layoutRestored" : "layoutApplied"));
  }
  function sequenceFor(kind, group) {
    if (kind === "category") return categorySequence();
    if (kind === "subtag") return subtagOptions(group).map(([key]) => key);
    if (kind === "editor-tag") return editorTags.map(core.tagIdentity);
    const all = ordered(
      items().map((p) => p.id),
      state.layout.promptOrder,
    );
    if (sort !== "newest") return all;
    const visible = filteredItems().map((p) => p.id),
      included = new Set(visible);
    let index = 0;
    return all.map((id) => (included.has(id) ? visible[index++] : id));
  }
  function moveOrdered(kind, key, target, group = "") {
    const sequence = sequenceFor(kind, group),
      from = sequence.indexOf(key),
      to = sequence.indexOf(target);
    if (from < 0 || to < 0 || from === to) return;
    const moved = core.reorder(sequence, from, to);
    if (kind === "editor-tag") {
      const editing =
        editingTagIndex === null
          ? null
          : core.tagIdentity(editorTags[editingTagIndex]);
      const tags = new Map(
        editorTags.map((tag) => [core.tagIdentity(tag), tag]),
      );
      editorTags = moved.map((id) => tags.get(id));
      editingTagIndex = editing === null ? null : moved.indexOf(editing);
      renderTagEditor();
    } else {
      if (kind === "category") state.layout.categoryOrder = moved;
      if (kind === "prompt") {
        state.layout.promptOrder = moved;
        sort = "recommended";
      }
      if (kind === "subtag")
        state.layout.tagOrder = [
          ...state.layout.tagOrder.filter((row) => row.category !== group),
          { category: group, tags: moved },
        ];
      const ok = persist();
      renderPage();
      if (ok) notify(t("orderSaved"));
    }
    [...document.querySelectorAll("[data-order-kind]")]
      .find(
        (el) =>
          el.dataset.orderKind === kind &&
          el.dataset.orderKey === key &&
          el.dataset.orderGroup === group,
      )
      ?.querySelector("[data-drag-handle]")
      ?.focus({ preventScroll: true });
  }
  function clearDrag() {
    document
      .querySelectorAll(".is-dragging,.drop-target")
      .forEach((el) => el.classList.remove("is-dragging", "drop-target"));
    document.body.classList.remove("reordering");
    drag = null;
  }
  document.addEventListener("pointerdown", (event) => {
    const handle = event.target.closest("[data-drag-handle]");
    if (!handle || event.button !== 0) return;
    const row = handle.closest("[data-order-kind]");
    event.preventDefault();
    handle.focus({ preventScroll: true });
    drag = {
      kind: row.dataset.orderKind,
      key: row.dataset.orderKey,
      group: row.dataset.orderGroup,
      x: event.clientX,
      y: event.clientY,
      pointer: event.pointerId,
      row,
      target: null,
      moved: false,
    };
    handle.setPointerCapture(event.pointerId);
  });
  document.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    if (
      !drag.moved &&
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5
    )
      return;
    drag.moved = true;
    drag.row.classList.add("is-dragging");
    document.body.classList.add("reordering");
    document
      .querySelectorAll(".drop-target")
      .forEach((el) => el.classList.remove("drop-target"));
    const row = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest("[data-order-kind]");
    drag.target =
      row &&
      row.dataset.orderKind === drag.kind &&
      row.dataset.orderGroup === drag.group
        ? row.dataset.orderKey
        : null;
    if (drag.target !== null && drag.target !== drag.key)
      row.classList.add("drop-target");
    const scroller = dialog.open ? dialog : document.scrollingElement;
    const bounds = dialog.open
      ? dialog.getBoundingClientRect()
      : { top: 0, bottom: innerHeight };
    if (drag.target === null && event.clientY < bounds.top + 24)
      scroller.scrollTop -= 15;
    if (drag.target === null && event.clientY > bounds.bottom - 24)
      scroller.scrollTop += 15;
  });
  document.addEventListener("pointerup", (event) => {
    if (!drag || event.pointerId !== drag.pointer) return;
    const current = drag;
    clearDrag();
    if (current.moved && current.target !== null)
      moveOrdered(current.kind, current.key, current.target, current.group);
  });
  document.addEventListener("pointercancel", clearDrag);
  function syncSidebar() {
    const sidebar = document.getElementById("sidebar");
    const hidden = mobileQuery.matches && !sidebar.classList.contains("open");
    sidebar.inert = hidden;
    sidebar.setAttribute("aria-hidden", String(hidden));
    if (!mobileQuery.matches) {
      sidebar.classList.remove("open");
      document.querySelector(".menu-shade")?.remove();
      document.querySelector(".shell").inert = false;
    }
  }
  function toggleMenu(force) {
    if (!mobileQuery.matches) return;
    const sidebar = document.getElementById("sidebar"),
      button = document.querySelector('[data-action="menu"]');
    const open =
      force === undefined ? !sidebar.classList.contains("open") : force;
    const wasOpen = sidebar.classList.contains("open");
    sidebar.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    document.querySelector(".menu-shade")?.remove();
    document.querySelector(".shell").inert = open;
    syncSidebar();
    if (open) {
      const shade = document.createElement("button");
      shade.className = "menu-shade";
      shade.setAttribute("aria-label", t("close"));
      shade.dataset.action = "close-menu";
      app.appendChild(shade);
      sidebar.querySelector("a")?.focus();
    } else if (wasOpen) button.focus();
  }
  mobileQuery.addEventListener("change", syncSidebar);
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button,a");
    if (!target) return;
    if (target.classList.contains("skip")) {
      event.preventDefault();
      document.getElementById("main-content").focus();
      return;
    }
    if (target.dataset.language) {
      language = target.dataset.language;
      persist();
      generated = "";
      render();
      return;
    }
    if (target.hasAttribute("data-drag-handle")) {
      event.preventDefault();
      return;
    }
    if (target.hasAttribute("data-category")) {
      category = target.dataset.category;
      tagFilter = "";
      renderPage();
      return;
    }
    if (target.hasAttribute("data-filter-tag")) {
      tagFilter = target.dataset.filterTag;
      renderPage();
      return;
    }
    if (target.hasAttribute("data-rename-tag")) {
      beginTagEdit(Number(target.dataset.renameTag));
      return;
    }
    if (target.hasAttribute("data-remove-tag")) {
      removeEditorTag(Number(target.dataset.removeTag));
      return;
    }
    if (target.dataset.editPrompt) {
      const p = itemById(target.dataset.editPrompt);
      if (p) openEditor(p, p.builtIn);
      return;
    }
    if (target.dataset.open) {
      openDetail(target.dataset.open);
      return;
    }
    if (target.dataset.favorite) {
      const id = target.dataset.favorite;
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((value) => value !== id)
        : [...state.favorites, id];
      persist();
      renderGrid();
      document
        .querySelector(`[data-favorite="${id}"]`)
        ?.focus({ preventScroll: true });
      const count = document.querySelector('a[href="#favorites"] .count');
      if (count) count.textContent = state.favorites.length;
      return;
    }
    switch (target.dataset.action) {
      case "commit-tag":
        commitTagInput();
        document.getElementById("edit-tags").focus();
        break;
      case "cancel-tag-edit":
        editingTagIndex = null;
        document.getElementById("edit-tags").value = "";
        renderTagEditor();
        document.getElementById("edit-tags").focus();
        break;
      case "layout-editor":
        openLayoutEditor();
        break;
      case "apply-layout":
        applyLayout();
        break;
      case "restore-layout":
        applyLayout(true);
        break;
      case "export-source-json":
        exportEditorSource("json");
        break;
      case "export-source-md":
        exportEditorSource("md");
        break;
      case "new":
        openEditor();
        break;
      case "close":
        dialog.close();
        break;
      case "menu":
        toggleMenu();
        break;
      case "close-menu":
        toggleMenu(false);
        break;
      case "export":
        exportLibrary();
        break;
      case "import":
        document.getElementById("import-file").click();
        break;
      case "reset":
        query = "";
        category = "";
        tagFilter = "";
        sort = "recommended";
        renderPage();
        break;
      case "copy-detail":
        copy(core.fillVariables(selected.body, variables));
        break;
      case "edit":
        openEditor(selected, selected.builtIn);
        break;
      case "duplicate":
        openEditor(
          { ...selected, body: core.fillVariables(selected.body, variables) },
          true,
        );
        break;
      case "delete":
        document.getElementById("delete-confirm").innerHTML =
          `<div class="inline-delete"><span>${escape(t("deleteConfirm"))}</span><button class="btn danger" data-action="confirm-delete">${escape(t("delete"))}</button><button class="btn" data-action="cancel-delete">${escape(t("cancel"))}</button></div>`;
        break;
      case "cancel-delete":
        document.getElementById("delete-confirm").innerHTML = "";
        break;
      case "confirm-delete": {
        deleted = {
          prompt: selected,
          favorite: state.favorites.includes(selected.id),
        };
        state.prompts = state.prompts.filter((p) => p.id !== selected.id);
        state.favorites = state.favorites.filter((id) => id !== selected.id);
        const ok = persist();
        dialog.close();
        render();
        if (ok) notify(t("deleted"), true);
        break;
      }
      case "undo":
        if (deleted) {
          state.prompts = core.mergePrompts(state.prompts, [deleted.prompt]);
          if (deleted.favorite) state.favorites.push(deleted.prompt.id);
          const ok = persist();
          deleted = null;
          render();
          if (ok) notify(t("saved"));
        }
        break;
      case "copy-studio":
        copy(generated);
        break;
      case "save-studio":
        openEditor(
          {
            title: (draft.goal || t("generatedTitle")).slice(0, 160),
            description: "",
            body: generated,
            category: "work",
            tags: [],
          },
          true,
        );
        break;
      case "clear-studio":
        draft = {};
        generated = "";
        try {
          localStorage.removeItem("myprompt.studio");
        } catch (_) {}
        renderPage();
        break;
    }
  });
  document.addEventListener("input", (event) => {
    const el = event.target;
    if (el.id === "search") {
      query = el.value;
      renderGrid();
    }
    if (el.dataset.variable) {
      variables[el.dataset.variable] = el.value;
      updateDetail();
    }
    if (el.dataset.studio) {
      draft[el.dataset.studio] = el.value;
      generated = "";
      try {
        localStorage.setItem("myprompt.studio", JSON.stringify(draft));
        document.getElementById("draft-status").textContent = t("draftSaved");
      } catch (_) {
        document.getElementById("draft-status").textContent = t("storageError");
      }
      updateStudio();
    }
  });
  document.addEventListener("change", (event) => {
    if (event.target.id === "source-format")
      changeSourceFormat(event.target.value);
    if (event.target.id === "sort") {
      sort = event.target.value;
      renderGrid();
    }
    if (event.target.id === "import-file") importLibrary(event.target.files[0]);
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id === "editor-form") {
      event.preventDefault();
      saveEditor(event.target);
    }
    if (event.target.id === "studio-form") {
      event.preventDefault();
      compose();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.target.hasAttribute("data-drag-handle") &&
      event.altKey &&
      ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)
    ) {
      event.preventDefault();
      const row = event.target.closest("[data-order-kind]"),
        { orderKind: kind, orderKey: key, orderGroup: group } = row.dataset;
      const sequence =
          kind === "prompt"
            ? filteredItems().map((p) => p.id)
            : sequenceFor(kind, group),
        index = sequence.indexOf(key),
        step = ["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1;
      if (sequence[index + step] !== undefined)
        moveOrdered(kind, key, sequence[index + step], group);
      return;
    }

    if (
      event.target.id === "edit-tags" &&
      !event.isComposing &&
      event.keyCode !== 229 &&
      ["Enter", ",", "，", "、"].includes(event.key)
    ) {
      event.preventDefault();
      commitTagInput();
      return;
    }
    if (
      event.target.id === "edit-tags" &&
      event.key === "Escape" &&
      editingTagIndex !== null
    ) {
      event.preventDefault();
      editingTagIndex = null;
      event.target.value = "";
      renderTagEditor();
      return;
    }
    if (
      event.key === "/" &&
      !dialog.open &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)
    ) {
      const search = document.getElementById("search");
      if (search) {
        event.preventDefault();
        search.focus();
      }
    }
    if (event.key === "Escape") toggleMenu(false);
  });
  window.addEventListener("hashchange", () => {
    if (location.hash === "#main-content") {
      document.getElementById("main-content").focus();
      return;
    }
    route = readRoute();
    category =
      new URLSearchParams(location.hash.split("?")[1] || "").get("category") ||
      "";
    tagFilter = "";
    query = "";
    if (dialog.open) dialog.close();
    render();
    window.scrollTo(0, 0);
  });
  // Other tabs may add prompts; read their state before subsequent edits.
  window.addEventListener("storage", (event) => {
    if (event.key !== core.storageKey || !event.newValue) return;
    try {
      const fresh = {
        ...JSON.parse(event.newValue),
        ...core.parseDocument(event.newValue),
      };
      if (!Array.isArray(fresh.favorites)) return;
      state = fresh;
      language = locales[fresh.language] ? fresh.language : language;
      if (!dialog.open) render();
    } catch (_) {}
  });
  render();
  if (
    "serviceWorker" in navigator &&
    location.protocol !== "file:" &&
    location.hostname !== "localhost" &&
    location.hostname !== "127.0.0.1"
  )
    navigator.serviceWorker.register("./sw.js").catch(() => {});
})();
