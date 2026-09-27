/* myprompt — no build step, no API keys, no network calls with prompt content. */
(() => {
  "use strict";
  const core = window.MYPROMPT_CORE;
  const catalog = window.MYPROMPT_PROMPTS;
  const locales = window.MYPROMPT_I18N;
  const store = core.createStore();
  let state = store.load();
  let language = locales[state.language] ? state.language : "ja";
  let route = readRoute();
  let category =
    new URLSearchParams(location.hash.split("?")[1] || "").get("category") ||
    "all";
  let query = "",
    sort = "recommended",
    selected = null,
    variables = Object.create(null),
    deleted = null;
  let toastTimer,
    generated = "",
    draft = loadDraft(),
    editorId = null;
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
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    globe:
      '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18"/>',
  };
  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.writing}</svg>`;
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
      <div class="sidebar-bottom"><div class="storage-card"><strong>${icon("lock")}${escape(t("backup"))}</strong>${escape(t("localNote"))}<div class="backup-actions"><button data-action="export">${escape(t("export"))} ↗</button><button data-action="import">${escape(t("import"))} ↙</button></div></div><div class="sidebar-foot"><span class="live-dot"></span>GPT-6 · 2026 EDITION</div></div></aside>
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
      <div class="filters" role="group" aria-label="${escape(t("categoryLabel"))}">${["all", ...categories].map((cat) => `<button class="filter ${category === cat ? "active" : ""}" data-category="${cat}" aria-pressed="${category === cat}">${escape(t(cat))}</button>`).join("")}</div>
      <div class="result-meta"><span id="result-count" role="status"></span><select class="sort" id="sort" aria-label="${escape(t("sortLabel"))}"><option value="recommended" ${sort === "recommended" ? "selected" : ""}>${escape(t("sortRecommended"))}</option><option value="newest" ${sort === "newest" ? "selected" : ""}>${escape(t("sortNewest"))}</option></select></div><div class="prompt-grid" id="prompt-grid"></div>`,
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
    if (category !== "all") list = list.filter((p) => p.category === category);
    const needle = query.trim().toLocaleLowerCase(language);
    if (needle)
      list = list.filter((p) =>
        [
          p.title,
          p.description,
          p.body,
          categoryName(p.category),
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
    return `<article class="prompt-card"><div class="card-top"><span class="category-icon ${categories.includes(p.category) ? p.category : ""}">${icon(p.category)}</span><button class="favorite-button" data-favorite="${escape(p.id)}" aria-label="${escape(t(favorite ? "unfavorite" : "favorite"))}: ${escape(p.title)}" aria-pressed="${favorite}">${icon("star")}</button></div><h3><button class="card-title" data-open="${escape(p.id)}">${escape(p.title)}</button></h3><p class="card-description">${escape(p.description || p.body.slice(0, 120))}</p><div class="card-bottom"><span class="tag">${escape(categoryName(p.category))} · ${escape(t(p.builtIn ? "curated" : "custom"))}</span><button data-open="${escape(p.id)}">${escape(t("usePrompt"))}${icon("arrow")}</button></div></article>`;
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
    const names = core.extractVariables(selected.body);
    openDialog(
      dialogHeader(selected.title, selected.description) +
        `<div class="dialog-content"><div class="detail-grid ${names.length ? "" : "single"}">${names.length ? `<section><p class="field-label">${escape(t("variables"))}</p><p class="hint" style="margin:8px 0 20px">${escape(t("detailHint"))}</p>${names.map((name, index) => `<div class="field"><label for="var-${index}">${escape(name)}</label><textarea id="var-${index}" data-variable="${escape(name)}" placeholder="${escape(t("variablePlaceholder", { name }))}" maxlength="100000" rows="2"></textarea></div>`).join("")}</section>` : ""}<section><p class="field-label">${escape(t("preview"))}</p><pre class="preview-text" id="detail-preview"></pre><p id="unresolved" class="unresolved"></p><div class="detail-actions"><button class="btn primary" data-action="copy-detail">${icon("copy")}${escape(t("copy"))}</button><a class="btn" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">${escape(t("openChatGPT"))} ↗</a></div><p class="privacy-hint">${escape(t("handoffHint"))}</p></section></div><div id="delete-confirm"></div></div><footer class="dialog-actions"><button class="btn quiet push-left" data-action="edit">${icon("studio")}${escape(t(selected.builtIn ? "duplicate" : "edit"))}</button>${!selected.builtIn ? `<button class="btn quiet danger" data-action="delete">${escape(t("delete"))}</button>` : ""}<button class="btn" data-action="duplicate">${icon("plus")}${escape(t("duplicate"))}</button><button class="btn" data-action="close">${escape(t("close"))}</button></footer>`,
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
      category: "work",
      tags: [],
    };
    editorId = source && !source.builtIn && !duplicate ? source.id : null;
    const catOptions = [...categories];
    if (p.category && !catOptions.includes(p.category))
      catOptions.push(p.category);
    openDialog(
      dialogHeader(t(editorId ? "editTitle" : "newTitle"), t("variablesHint")) +
        `<form id="editor-form"><div class="dialog-content"><div class="field"><label for="edit-title">${escape(t("titleLabel"))}</label><input id="edit-title" name="title" value="${escape(p.title)}" placeholder="${escape(t("titlePlaceholder"))}" maxlength="160" required></div><div class="field"><label for="edit-description">${escape(t("descriptionLabel"))}</label><input id="edit-description" name="description" value="${escape(p.description)}" placeholder="${escape(t("descriptionPlaceholder"))}" maxlength="2000"></div><div class="field-row"><div class="field"><label for="edit-category">${escape(t("categoryLabel"))}</label><select id="edit-category" name="category">${catOptions.map((cat) => `<option value="${escape(cat)}" ${p.category === cat ? "selected" : ""}>${escape(categoryName(cat))}</option>`).join("")}</select></div><div class="field"><label for="edit-tags">${escape(t("tagsLabel"))}</label><input id="edit-tags" name="tags" value="${escape((p.tags || []).join(", "))}" placeholder="${escape(t("tagsPlaceholder"))}" maxlength="1000"></div></div><div class="field"><label for="edit-body">${escape(t("bodyLabel"))}</label><textarea class="code" id="edit-body" name="body" placeholder="${escape(t("bodyPlaceholder"))}" maxlength="100000" required>${escape(p.body)}</textarea><span class="hint">${escape(t("variablesHint"))}</span></div><p class="error-text" id="editor-error" role="alert"></p></div><footer class="dialog-actions"><button class="btn" type="button" data-action="close">${escape(t("cancel"))}</button><button class="btn primary" type="submit">${icon("check")}${escape(t("save"))}</button></footer></form>`,
    );
  }
  function saveEditor(form) {
    const fields = new FormData(form);
    const tags = String(fields.get("tags"))
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    if (
      tags.length > core.limits.tags ||
      tags.some((tag) => tag.length > core.limits.tag)
    ) {
      document.getElementById("editor-error").textContent = t("invalidTags");
      return;
    }
    if (!editorId && state.prompts.length >= core.limits.prompts) {
      document.getElementById("editor-error").textContent = t("limitError");
      return;
    }
    const existing = state.prompts.find((p) => p.id === editorId);
    try {
      const value = core.validatePrompt({
        ...(existing || {}),
        title: fields.get("title"),
        description: fields.get("description"),
        category: fields.get("category"),
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
      category = "all";
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
  function exportLibrary() {
    const blob = new Blob(
      [
        JSON.stringify(
          { ...state, language, exportedAt: new Date().toISOString() },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `myprompt-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(t("exportSuccess"));
  }
  async function importLibrary(file) {
    if (!file) return;
    try {
      if (file.size > core.limits.importBytes) throw new Error("size");
      const text = await file.text();
      const original = core.parseImport(text);
      const reserved = new Map();
      const incoming = original.map((p) => {
        if (!catalog.some((item) => item.id === p.id)) return p;
        const renamed = core.validatePrompt({ ...p, id: undefined });
        reserved.set(p.id, renamed.id);
        return renamed;
      });
      const before = state.prompts.length;
      const merged = core.mergeImport(state.prompts, incoming);
      const raw = JSON.parse(text);
      let favorites = [...state.favorites];
      if (raw.version === 2 && Array.isArray(raw.favorites)) {
        const allowed = new Set([
          ...catalog.map((p) => p.id),
          ...merged.prompts.map((p) => p.id),
        ]);
        const importedFavorites = raw.favorites
          .filter((id) => typeof id === "string")
          .map((id) => {
            const originalId = reserved.get(id) || id;
            return Object.prototype.hasOwnProperty.call(
              merged.idMap,
              originalId,
            )
              ? merged.idMap[originalId]
              : id;
          })
          .filter((id) => allowed.has(id));
        favorites = [...new Set([...favorites, ...importedFavorites])];
      }
      state.prompts = merged.prompts;
      state.favorites = favorites;
      const ok = persist(),
        count = state.prompts.length - before;
      query = "";
      category = "all";
      if (route !== "my") location.hash = "my";
      else render();
      if (ok) notify(t("importSuccess", { count }));
    } catch (_) {
      notify(t("importError"));
    } finally {
      document.getElementById("import-file").value = "";
    }
  }
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
    if (target.dataset.category) {
      category = target.dataset.category;
      document.querySelectorAll("[data-category]").forEach((el) => {
        el.classList.toggle("active", el.dataset.category === category);
        el.setAttribute(
          "aria-pressed",
          String(el.dataset.category === category),
        );
      });
      renderGrid();
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
        category = "all";
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
      "all";
    query = "";
    if (dialog.open) dialog.close();
    render();
    window.scrollTo(0, 0);
  });
  // Other tabs may add prompts; read their state before subsequent edits.
  window.addEventListener("storage", (event) => {
    if (event.key !== core.storageKey || !event.newValue) return;
    try {
      const fresh = JSON.parse(event.newValue);
      fresh.prompts = core.parseImport(event.newValue);
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
