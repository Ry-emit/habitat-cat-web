/* =========================================================
   HABITAT.CAT — comportamiento de los componentes
   Sin dependencias. Cada bloque se activa por su data-component
   o data-* y no hace nada si el bloque no está en la página.
   ========================================================= */
(function () {
  "use strict";

  const LANG = document.documentElement.lang || "es";
  const DICT = window.HABITAT_DICT || { typeGroups: [], operations: {}, extras: {} };
  const Data = window.HabitatData;
  const PAGES = document.body.dataset.pages || "";
  const IMG = (src) => (/^(https?:|\/)/.test(src) ? src : (location.pathname.includes("/paginas/") ? "../" : "") + src);
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- Textos ---------- */
  const T = {
    es: {
      bed: (n) => `${n} hab.`, bath: (n) => `${n} ${n === 1 ? "baño" : "baños"}`,
      reserved: "Reservado", newBuild: "Obra nueva", consult: "Consultar precio",
      perMonth: "/mes", perDay: "/día", transfer: "Traspaso", alsoRent: "o alquiler",
      photo: (i, n) => `Foto ${i} de ${n}`, ref: "Ref.",
      count: (p, pages, total) => `Página <strong>${p}/${pages}</strong> · <strong>${fmtInt(total)}</strong> ${total === 1 ? "inmueble" : "inmuebles"}`,
      empty: "No hay inmuebles con estos filtros.",
      formOk: "Formulario de muestra: aquí se conectará con Inmovilla. Datos no enviados.",
      formError: "Revisa los campos marcados.",
      favAdd: "Guardar en favoritos", favRemove: "Quitar de favoritos",
      discard: "Descartar", undiscard: "Recuperar"
    }
  };
  const t = T[LANG] || T.es;

  /* ---------- Formatos ---------- */
  const nf = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 0, useGrouping: "always" });
  function fmtInt(n) { return nf.format(n); }
  function eur(n) { return n == null ? "" : nf.format(n) + " €"; }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
  function slug(s) { return Data ? Data.norm(s).replace(/ /g, "-") : String(s); }

  const typeIndex = {};
  for (const g of DICT.typeGroups) for (const row of g.types) typeIndex[row[0]] = { ca: row[1], es: row[2], en: row[3], group: g.key };
  function typeLabel(key) { return (typeIndex[key] && typeIndex[key][LANG]) || key; }
  function opLabel(key) { return (DICT.operations[key] && DICT.operations[key][LANG]) || key; }

  function titleOf(p) {
    if (p.title && p.title[LANG]) return p.title[LANG];
    return `${typeLabel(p.type)} – ${p.municipality}${p.zone ? ` (${p.zone})` : ""}`;
  }
  function detailHref(p) { return `${PAGES}inmueble.html?id=${encodeURIComponent(p.id)}`; }
  /* Ruta limpia en producción: /property/{tipo}/{municipio}/{zona}/{id} */
  function prettyRoute(p) { return `/property/${slug(p.type)}/${slug(p.municipality)}/${slug(p.zone || "")}/${p.id}`; }

  /* ---------- Precio ---------- */
  function priceHTML(p, { op } = {}) {
    const ops = p.operations || {};
    op = op && ops[op] ? op : Data.mainOperation(p);
    const o = ops[op] || {};
    if (p.consultPrice || o.amount == null) {
      return `<span class="price__now">${t.consult}</span>`;
    }
    const period = o.period === "month" ? t.perMonth : o.period === "day" ? t.perDay : "";
    let html = `<span class="price__now">${eur(o.amount)}${period ? `<span class="price__period"> ${period}</span>` : ""}</span>`;
    if (o.previous) html += `<s class="price__old"><span class="visually-hidden">Antes </span>${eur(o.previous)}</s>`;
    if (p.discountPct) html += `<span class="price__discount">−${p.discountPct} %</span>`;
    const extra = [];
    if (op === "sale" && ops.rent && ops.rent.amount) extra.push(`${t.alsoRent} ${eur(ops.rent.amount)}${t.perMonth}`);
    if (ops.transfer && ops.transfer.amount && op !== "transfer") extra.push(`${t.transfer} ${eur(ops.transfer.amount)}`);
    if (extra.length) html += `<span class="price__extra">${extra.join(" · ")}</span>`;
    return html;
  }

  /* ---------- Favoritos / vistos / descartados (solo en este navegador) ---------- */
  const Store = {
    key: "habitat-lists",
    read() { try { return JSON.parse(localStorage.getItem(this.key)) || {}; } catch (e) { return {}; } },
    write(v) { try { localStorage.setItem(this.key, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } },
    list(name) { return this.read()[name] || []; },
    has(name, id) { return this.list(name).includes(id); },
    toggle(name, id) {
      const all = this.read(); const l = all[name] || [];
      const i = l.indexOf(id);
      if (i >= 0) l.splice(i, 1); else l.unshift(id);
      all[name] = l; this.write(all); updateCounts();
      return i < 0;
    },
    add(name, id, max = 60) {
      const all = this.read(); const l = (all[name] || []).filter((x) => x !== id);
      l.unshift(id); all[name] = l.slice(0, max); this.write(all); updateCounts();
    }
  };
  function updateCounts() {
    for (const el of $$("[data-count]")) {
      const name = el.dataset.count;
      if (!["favorites", "viewed", "discarded"].includes(name)) continue;
      const n = Store.list(name).length;
      el.textContent = el.classList.contains("shortcuts__n") ? n : n ? `(${n})` : "";
    }
  }

  /* ---------- Ficha de inmueble ---------- */
  function slidesFor(p, n = 5) {
    const photos = p.photos || [];
    const total = photos.length || n;
    return Array.from({ length: total }, (_, i) => {
      const ph = photos[i];
      return `<div class="media"${i === 0 ? " data-active" : ""}${ph ? "" : ` data-label="${esc(t.photo(i + 1, total))}"`}>${ph ? `<img src="${esc(IMG(ph.src))}" alt="${esc((ph.alt && ph.alt[LANG]) || titleOf(p))}" loading="lazy">` : ""}</div>`;
    }).join("");
  }

  function renderCard(p) {
    const tpl = $("#tpl-property-card");
    const node = tpl.content.firstElementChild.cloneNode(true);
    node.dataset.id = p.id;
    const slides = $("[data-slides]", node);
    slides.innerHTML = slidesFor(p);
    const count = slides.children.length;
    $("[data-count]", node).textContent = `1/${count}`;
    if (count < 2) $(".property-card__nav", node).hidden = true;

    const badges = [`<span class="badge badge--dark">${esc(opLabel(Data.mainOperation(p)))}</span>`];
    if (p.status === "reserved") badges.push(`<span class="badge">${t.reserved}</span>`);
    if (p.isNewBuild) badges.push(`<span class="badge">${t.newBuild}</span>`);
    $("[data-badges]", node).innerHTML = badges.join("");

    $("[data-price]", node).innerHTML = priceHTML(p);
    if (p.consultPrice) $("[data-price]", node).classList.add("price--consult");
    const link = $("[data-link]", node);
    link.textContent = titleOf(p);
    link.href = detailHref(p);
    link.dataset.route = prettyRoute(p);
    const more = $("[data-more]", node);
    more.href = detailHref(p);
    more.setAttribute("aria-label", `Más información: ${titleOf(p)}`);

    const meta = [];
    if (p.bedrooms) meta.push(`<li><svg class="icon" aria-hidden="true"><use href="#i-bed"/></svg>${t.bed(p.bedrooms)}</li>`);
    if (p.bathrooms) meta.push(`<li><svg class="icon" aria-hidden="true"><use href="#i-bath"/></svg>${t.bath(p.bathrooms)}</li>`);
    if (p.surface) meta.push(`<li><svg class="icon" aria-hidden="true"><use href="#i-area"/></svg>${fmtInt(p.surface)} m²</li>`);
    $("[data-meta]", node).innerHTML = meta.join("");
    $("[data-ref]", node).textContent = `${t.ref} ${p.ref}`;

    syncCardState(node);
    return node;
  }

  function syncCardState(card) {
    const id = card.dataset.id;
    const fav = Store.has("favorites", id);
    const dis = Store.has("discarded", id);
    const fb = $('[data-action="favorite"]', card);
    const db = $('[data-action="discard"]', card);
    if (fb) { fb.setAttribute("aria-pressed", fav); fb.setAttribute("aria-label", fav ? t.favRemove : t.favAdd); }
    if (db) { db.setAttribute("aria-pressed", dis); db.setAttribute("aria-label", dis ? t.undiscard : t.discard); }
    card.classList.toggle("property-card--discarded", dis);
  }

  function stepPhoto(card, dir) {
    const slides = $$("[data-slides] .media", card);
    const i = slides.findIndex((s) => s.hasAttribute("data-active"));
    const next = (i + dir + slides.length) % slides.length;
    slides[i].removeAttribute("data-active");
    slides[next].setAttribute("data-active", "");
    const c = $("[data-count]", card);
    if (c) c.textContent = `${next + 1}/${slides.length}`;
  }

  /* ---------- Parámetros de búsqueda ---------- */
  function filtersFromURL(base = {}) {
    const q = new URLSearchParams(location.search);
    const n = (k) => (q.get(k) ? Number(q.get(k)) : undefined);
    return {
      ...base,
      operation: base.operation || q.get("op") || undefined,
      type: q.get("tipo") || undefined,
      area: q.get("zona") || undefined,
      priceMin: n("desde"), priceMax: n("hasta"),
      ref: q.get("ref") || undefined,
      bedrooms: n("hab"), bathrooms: n("ban"),
      surfaceMin: n("m2min"), surfaceMax: n("m2max"),
      extras: q.getAll("extra")
    };
  }
  function urlWith(changes) {
    const q = new URLSearchParams(location.search);
    for (const [k, v] of Object.entries(changes)) { if (v == null || v === "") q.delete(k); else q.set(k, v); }
    return "?" + q.toString();
  }

  /* ---------- Listado ---------- */
  async function initListing(root) {
    const q = new URLSearchParams(location.search);
    const base = {};
    if (root.dataset.operation) base.operation = root.dataset.operation;
    if (root.dataset.newBuild) base.newBuild = true;
    const size = Number(q.get("res")) || Number(root.dataset.size) || 12;
    const sort = q.get("orden") || root.dataset.sort || "recientes";
    const page = Number(q.get("pag")) || 1;
    const res = await Data.query(filtersFromURL(base), { page, size, sort });

    const grid = $("[data-grid]", root);
    grid.replaceChildren(...res.items.map(renderCard));
    const empty = $("[data-empty]", root);
    if (empty) empty.hidden = res.total > 0;

    const count = $("[data-result-count]", root);
    if (count) count.innerHTML = t.count(res.page, res.pages, res.total);

    const sortSel = $("[data-sort]", root);
    if (sortSel) {
      fillSort(sortSel, sort);
      sortSel.addEventListener("change", () => { location.search = urlWith({ orden: sortSel.value, pag: null }); });
    }
    for (const r of $$("[data-page-size] input", root)) {
      r.checked = Number(r.value) === size;
      r.addEventListener("change", () => { location.search = urlWith({ res: r.value, pag: null }); });
    }
    const pag = $("[data-pagination]", root);
    if (pag) pag.innerHTML = paginationHTML(res.page, res.pages);

    const mapToggle = $("[data-action='toggle-map']", root);
    const map = $("[data-map-view]", root);
    if (mapToggle && map) {
      const show = q.get("mapa") === "1";
      map.hidden = !show; mapToggle.setAttribute("aria-pressed", show);
      mapToggle.addEventListener("click", () => {
        const on = map.hidden; map.hidden = !on; mapToggle.setAttribute("aria-pressed", on);
      });
    }
  }

  function paginationHTML(page, pages) {
    const link = (p, label, attrs = "") => `<li><a href="${urlWith({ pag: p })}" ${attrs}>${label}</a></li>`;
    const out = [];
    out.push(page > 1 ? link(page - 1, `<svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg><span class="visually-hidden">Anterior</span>`, 'rel="prev"')
                      : `<li><span aria-disabled="true"><svg class="icon" aria-hidden="true"><use href="#i-chevron-left"/></svg></span></li>`);
    const nums = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
    let prev = 0;
    for (const n of [...nums].sort((a, b) => a - b)) {
      if (n - prev > 1) out.push(`<li><span aria-hidden="true">…</span></li>`);
      out.push(n === page ? `<li><span aria-current="page">${n}</span></li>` : link(n, n));
      prev = n;
    }
    out.push(page < pages ? link(page + 1, `<svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg><span class="visually-hidden">Siguiente</span>`, 'rel="next"')
                          : `<li><span aria-disabled="true"><svg class="icon" aria-hidden="true"><use href="#i-chevron-right"/></svg></span></li>`);
    return out.join("");
  }

  function fillSort(sel, current) {
    if (!sel.options.length) {
      sel.innerHTML = (sel.dataset.fill === "sort" ? `<option value="">Por defecto</option>` : "") + Object.entries(Data.sorts).map(([k, v]) => `<option value="${k}">${esc(v[LANG] || v.es)}</option>`).join("");
    }
    if (current) sel.value = current;
  }

  /* ---------- Listas personales ---------- */
  async function initPersonal(root) {
    const q = new URLSearchParams(location.search);
    const list = q.get("lista") || "favorites";
    for (const tab of $$("[data-list-tab]", root)) {
      if (tab.dataset.listTab === list) tab.setAttribute("aria-current", "page"); else tab.removeAttribute("aria-current");
    }
    const ids = Store.list(list);
    const res = await Data.query({ ids }, { size: 48 });
    $("[data-grid]", root).replaceChildren(...res.items.map(renderCard));
    $("[data-empty]", root).hidden = res.total > 0;
  }

  /* ---------- Bloques de inmuebles sueltos (portada, guía) ---------- */
  async function initPropertyBlock(root) {
    const n = Number(root.dataset.limit) || 3;
    let items;
    if (root.dataset.ids) items = (await Data.query({ ids: root.dataset.ids.split(",") }, { size: n })).items;
    else items = (await Data.query({ operation: root.dataset.operation }, { size: n, sort: root.dataset.sort || "precio-venta-desc" })).items;
    root.replaceChildren(...items.map(renderCard));
  }

  /* Ejemplos fijos de la guía: variantes de la ficha */
  function initCardSamples(root) {
    const samples = JSON.parse(root.dataset.cardSamples);
    root.replaceChildren(...samples.map(renderCard));
  }

  /* ---------- Buscador ---------- */
  function fillTypes(sel) {
    if (sel.options.length > 1) return;
    sel.insertAdjacentHTML("beforeend", DICT.typeGroups.map((g) =>
      `<optgroup label="${esc(g.label[LANG])}"><option value="${g.key}">${esc(g.label[LANG])}: todos</option>${g.types.map((r) => `<option value="${esc(r[0])}">${esc(typeIndex[r[0]][LANG])}</option>`).join("")}</optgroup>`
    ).join(""));
  }

  function initSearch(form) {
    const sortSel = $('[data-fill="sort"]', form);
    if (sortSel) fillSort(sortSel);

    // Rellena con lo que ya se buscó
    const q = new URLSearchParams(location.search);
    for (const el of form.elements) {
      if (!el.name || !q.has(el.name)) continue;
      if (el.type === "checkbox") el.checked = q.getAll(el.name).includes(el.value);
      else if (el.type === "radio") el.checked = q.get("op") === el.value;
      else el.value = q.get(el.name);
    }
    const page = document.body.dataset.page;
    if (!q.has("op") && page === "alquiler") { const r = $('input[name="op"][value="rent"]', form); if (r) r.checked = true; }
    if ([...q.keys()].some((k) => ["m2min", "m2max", "hab", "ban", "extra", "orden"].includes(k))) {
      const adv = $(".search__advanced", form); if (adv) adv.open = true;
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const op = fd.get("op") || "sale";
      const target = ["rent", "shortTerm"].includes(op) ? "alquiler.html" : "venta.html";
      const params = new URLSearchParams();
      for (const [k, v] of fd) if (v !== "" && !(k === "op" && ["sale", "rent"].includes(v))) params.append(k, v);
      if (op !== "sale" && op !== "rent") params.set("op", op);
      location.href = `${PAGES}${target}${params.toString() ? "?" + params : ""}`;
    });
  }

  async function fillAreas() {
    const dl = $('[data-fill="areas"]');
    if (!dl || !Data) return;
    dl.innerHTML = (await Data.areas()).map((a) => `<option value="${esc(a)}">`).join("");
  }

  /* ---------- Página de inmueble ---------- */
  async function initDetail(root) {
    const id = new URLSearchParams(location.search).get("id");
    let p = id ? await Data.get(id) : null;
    if (!p) p = (await Data.query({ operation: "sale", bedrooms: 3, bathrooms: 2 }, { size: 1, sort: "precio-venta-desc" })).items[0];
    if (!p) return;
    Store.add("viewed", p.id);
    root.dataset.id = p.id;

    const title = titleOf(p);
    document.title = `${title} · Ref. ${p.ref} · HABITAT.CAT`;
    const md = $('meta[name="description"]');
    if (md) md.content = `${typeLabel(p.type)} en ${p.municipality}${p.zone ? ", " + p.zone : ""}: ${[p.bedrooms && t.bed(p.bedrooms), p.bathrooms && t.bath(p.bathrooms), p.surface && p.surface + " m²"].filter(Boolean).join(", ")}. Ref. ${p.ref}. HABITAT.CAT, 938 147 330.`;

    const bind = (name, html) => { for (const el of $$(`[data-bind="${name}"]`, root)) el.innerHTML = html; };
    bind("title", esc(title));
    bind("crumb-op", esc(opLabel(Data.mainOperation(p))));
    bind("ref", esc(p.ref));
    if (p.description && p.description[LANG]) bind("description", p.description[LANG].split(/\n{2,}/).map((x) => `<p>${esc(x)}</p>`).join(""));
    bind("price", priceHTML(p));
    bind("op", esc(opLabel(Data.mainOperation(p))));
    for (const a of $$("[data-bind-href='op']", root)) a.href = PAGES + (["rent", "shortTerm"].includes(Data.mainOperation(p)) ? "alquiler.html" : "venta.html");
    const badges = [];
    if (p.status === "reserved") badges.push(`<span class="badge badge--dark">${t.reserved}</span>`);
    if (p.isNewBuild) badges.push(`<span class="badge badge--dark">${t.newBuild}</span>`);
    bind("badges", badges.join(""));

    // Datos clave
    const facts = [];
    if (p.bedrooms) facts.push(["i-bed", p.bedrooms, "Habitaciones"]);
    if (p.bathrooms) facts.push(["i-bath", p.bathrooms, "Baños"]);
    if (p.surface) facts.push(["i-area", fmtInt(p.surface) + " m²", "Superficie"]);
    facts.push(["i-tag", esc(typeLabel(p.type)), "Tipo"]);
    bind("facts", facts.map(([i, v, l]) => `<li><svg class="icon" aria-hidden="true"><use href="#${i}"/></svg><strong>${v}</strong><span>${l}</span></li>`).join(""));

    // Características: solo los campos que existen
    const ops = Object.keys(p.operations || {}).map(opLabel).join(" · ");
    const rows = [
      ["Referencia", p.ref], ["Operación", ops], ["Tipo de inmueble", typeLabel(p.type)],
      ["Zona / municipio", [p.zone, p.municipality].filter(Boolean).join(" / ")],
      ["Estado", p.condition], ["Año de construcción", p.yearBuilt],
      ["Gastos de comunidad", p.communityFees && p.communityFees.amount != null ? `${eur(p.communityFees.amount)}/${p.communityFees.period === "year" ? "año" : "mes"}` : null],
      ["IBI", p.propertyTax != null ? eur(p.propertyTax) + "/año" : null], ["Régimen", p.regime],
      ["Superficie", p.surface ? fmtInt(p.surface) + " m²" : null], ["Parcela", p.plotSurface ? fmtInt(p.plotSurface) + " m²" : null],
      ["Habitaciones", p.bedrooms], ["Baños", p.bathrooms]
    ].filter(([, v]) => v != null && v !== "");
    bind("features", rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join(""));
    bind("extras", (p.extras || []).map((e) => `<li class="badge badge--mist"><svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>${esc(DICT.extras[e] ? DICT.extras[e][LANG] : e)}</li>`).join(""));

    // Certificado energético
    const en = $("[data-energy]", root);
    if (en) renderEnergy(en, p.energy);

    // Galería
    const gal = $("[data-gallery]", root);
    if (gal) {
      const photos = p.photos || [];
      const n = Math.max(photos.length, 5);
      for (const [i, slot] of $$(".media", gal).entries()) {
        if (photos[i]) slot.innerHTML = `<img src="${esc(IMG(photos[i].src))}" alt="${esc(title)}">`;
        else slot.dataset.label = t.photo(i + 1, n);
      }
      const all = $("[data-photo-total]", gal); if (all) all.textContent = n;
    }

    // Favorito
    const fav = $("[data-action='favorite-detail']", root);
    if (fav) {
      const sync = () => { const on = Store.has("favorites", p.id); fav.setAttribute("aria-pressed", on); $("span", fav).textContent = on ? "Guardado" : "Guardar"; };
      sync(); fav.addEventListener("click", () => { Store.toggle("favorites", p.id); sync(); });
    }

    // Formularios con la referencia
    for (const h of $$('input[name="ref"][type="hidden"]', root)) h.value = p.ref;

    // Simulador
    const mort = $("[data-mortgage]", root);
    const sale = p.operations && p.operations.sale && p.operations.sale.amount;
    if (mort && sale) { $('[name="price"]', mort).value = sale; $('[name="saved"]', mort).value = Math.round(sale * 0.3 / 1000) * 1000; mort.dispatchEvent(new Event("input")); }

    // Parecidos
    const rel = $("[data-related]", root);
    if (rel) rel.replaceChildren(...(await Data.related(p, 4)).map(renderCard));
  }

  function renderEnergy(root, energy) {
    const letters = ["A", "B", "C", "D", "E", "F", "G"];
    const rating = energy && energy.rating;
    root.classList.toggle("energy--exempt", !rating || rating === "exempt" || rating === "pending");
    $("[data-energy-scale]", root).innerHTML = letters.map((l) =>
      `<li${rating === l ? ` data-active="${energy.consumption != null ? energy.consumption + " kWh" : "Actual"}"` : ""}><span class="energy__bar">${l}</span></li>`).join("");
    const label = !rating ? "Pendiente de datos" : rating === "exempt" ? "Exento" : rating === "pending" ? "En trámite" : rating;
    $("[data-energy-rating]", root).textContent = label;
    $("[data-energy-consumption]", root).textContent = energy && energy.consumption != null ? `${fmtInt(energy.consumption)} kWh/m² año` : "—";
    $("[data-energy-emissions]", root).textContent = energy && energy.emissions != null ? `${fmtInt(energy.emissions)} kg CO₂/m² año` : "—";
  }

  /* ---------- Simulador de hipoteca ---------- */
  function initMortgage(form) {
    const out = (k) => $(`[data-out="${k}"]`, form);
    const calc = () => {
      const v = (k) => Number($(`[name="${k}"]`, form).value) || 0;
      const price = v("price"), saved = v("saved"), years = v("years") || 1, rate = v("rate") / 100;
      const taxes = price * 0.10;           // estimación del 10 % (ITP o IVA + AJD según caso)
      const total = price + taxes;
      const loan = Math.max(0, total - saved);
      const n = years * 12, r = rate / 12;
      const monthly = loan === 0 ? 0 : r === 0 ? loan / n : (loan * r) / (1 - Math.pow(1 + r, -n));
      out("taxes").textContent = eur(Math.round(taxes));
      out("total").textContent = eur(Math.round(total));
      out("loan").textContent = eur(Math.round(loan));
      out("monthly").textContent = eur(Math.round(monthly));
    };
    form.addEventListener("input", calc);
    form.addEventListener("submit", (e) => { e.preventDefault(); calc(); });
    calc();
  }

  /* ---------- Formularios (muestra) ---------- */
  function initForm(form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const status = $(".form__status", form);
      for (const el of form.elements) if (el.willValidate) el.setAttribute("aria-invalid", !el.checkValidity());
      if (!form.checkValidity()) {
        if (status) { status.dataset.state = "error"; status.textContent = t.formError; }
        const first = $("[aria-invalid='true']", form); if (first) first.focus();
        return;
      }
      // Aquí: token de reCAPTCHA + envío a Inmovilla (alertas, contacto, publica, valoración…)
      if (status) { status.dataset.state = "ok"; status.textContent = t.formOk; }
    });
  }

  /* ---------- Menú móvil, ventanas flotantes, cookies, modales ---------- */
  function initChrome() {
    const menu = $("#menu-movil");
    const toggle = $("[data-action='open-menu']");
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-action]");
      if (!a) return;
      const act = a.dataset.action;
      const card = a.closest(".property-card");
      if (act === "open-menu" && menu) { menu.hidden = false; toggle.setAttribute("aria-expanded", "true"); document.body.style.overflow = "hidden"; $("[data-action='close-menu']", menu).focus(); }
      if (act === "close-menu" && menu) { menu.hidden = true; toggle && toggle.setAttribute("aria-expanded", "false"); document.body.style.overflow = ""; }
      if (act === "toggle-popover") {
        const pop = document.getElementById(a.getAttribute("aria-controls"));
        const open = pop.hidden;
        for (const b of $$("[data-action='toggle-popover']")) { const p = document.getElementById(b.getAttribute("aria-controls")); p.hidden = true; b.setAttribute("aria-expanded", "false"); }
        pop.hidden = !open; a.setAttribute("aria-expanded", open);
      }
      if (act === "close-popover") {
        const pop = a.closest(".popover"); pop.hidden = true;
        const b = $(`[aria-controls="${pop.id}"]`); if (b) { b.setAttribute("aria-expanded", "false"); b.focus(); }
      }
      if (act === "favorite" && card) { Store.toggle("favorites", card.dataset.id); syncCardState(card); }
      if (act === "discard" && card) { Store.toggle("discarded", card.dataset.id); syncCardState(card); }
      if (act === "prev-photo" && card) stepPhoto(card, -1);
      if (act === "next-photo" && card) stepPhoto(card, 1);
      if (act === "open-modal") { const d = document.getElementById(a.dataset.target); if (d && d.showModal) d.showModal(); }
      if (act === "close-modal") { const d = a.closest("dialog"); if (d) d.close(); }
      if (act === "open-cookies") showCookies(true);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (menu && !menu.hidden) $("[data-action='close-menu']", menu).click();
      for (const p of $$(".popover:not([hidden])")) $("[data-action='close-popover']", p).click();
    });

    // Cookies
    const banner = $(".cookie-banner");
    const KEY = "habitat-cookies";
    let saved = null; try { saved = JSON.parse(localStorage.getItem(KEY)); } catch (e) { saved = null; }
    function showCookies(prefs) {
      if (!banner) return;
      banner.hidden = false;
      $("[data-cookie-prefs]", banner).hidden = !prefs;
      $("[data-cookies='save']", banner).hidden = !prefs;
      $("[data-cookies='manage']", banner).hidden = !!prefs;
    }
    function store(v) { try { localStorage.setItem(KEY, JSON.stringify({ ...v, at: new Date().toISOString() })); } catch (e) { /* nada */ } banner.hidden = true; }
    if (banner) {
      if (!saved && !document.body.hasAttribute("data-no-cookie-banner")) showCookies(false);
      banner.addEventListener("click", (e) => {
        const b = e.target.closest("[data-cookies]"); if (!b) return;
        const v = b.dataset.cookies;
        if (v === "accept") store({ analytics: true, ads: true });
        if (v === "reject") store({ analytics: false, ads: false });
        if (v === "manage") showCookies(true);
        if (v === "save") store({ analytics: $('[name="analytics"]', banner).checked, ads: $('[name="ads"]', banner).checked });
      });
    }
    for (const y of $$("[data-year]")) y.textContent = new Date().getFullYear();
  }

  /* ---------- Arranque ---------- */
  initChrome();
  updateCounts();
  for (const f of $$("[data-form]")) initForm(f);
  for (const f of $$("[data-mortgage]")) initMortgage(f);
  for (const s of $$('[data-fill="types"]')) fillTypes(s);
  if (Data) {
    fillAreas();
    for (const f of $$("[data-component='search-form']")) initSearch(f);
    for (const r of $$("[data-listing]")) initListing(r);
    for (const r of $$("[data-personal-list]")) initPersonal(r);
    for (const r of $$("[data-property-block]")) initPropertyBlock(r);
    for (const r of $$("[data-card-samples]")) initCardSamples(r);
    for (const r of $$("[data-detail]")) initDetail(r);
    for (const r of $$("[data-energy-sample]")) renderEnergy(r, JSON.parse(r.dataset.energySample));
  }

  window.Habitat = { renderCard, priceHTML, titleOf, prettyRoute, Store, eur };
})();
