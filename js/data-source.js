/* =========================================================
   HABITAT.CAT — fuente de datos
   Los componentes NUNCA leen inmuebles directamente: piden a
   HabitatData. Hoy responde con la muestra local (data/catalogo.js);
   para producción se cambia el adaptador por el de Inmovilla y
   nada más del kit cambia.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- Adaptador local (muestra) ---------- */
  const localAdapter = {
    name: "local",
    async all() { return window.HABITAT_CATALOGO || []; }
  };

  /* ---------- Adaptador Inmovilla (por conectar) ----------
     Inmovilla da acceso a su catálogo por API web y por feed XML.
     Rellena endpoint y credenciales con la documentación que
     entregue Inmovilla a la agencia, y traduce cada registro a
     data/property.schema.json en toProperty(). Las credenciales
     van en el servidor, nunca en este archivo del navegador. */
  const inmovillaAdapter = {
    name: "inmovilla",
    endpoint: "/api/inmuebles",            // proxy propio en el servidor
    async all() {
      const res = await fetch(this.endpoint, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Inmovilla: " + res.status);
      const raw = await res.json();
      return raw.map(this.toProperty);
    },
    toProperty(r) {
      // Mapear aquí los campos de Inmovilla al modelo del kit.
      return r;
    }
  };

  const SORTS = {
    "precio-venta-desc": { es: "Precio de venta más alto", fn: (a, b) => amount(b, "sale") - amount(a, "sale") },
    "precio-venta-asc":  { es: "Precio de venta más bajo", fn: (a, b) => amount(a, "sale", Infinity) - amount(b, "sale", Infinity) },
    "precio-alq-desc":   { es: "Precio de alquiler más alto", fn: (a, b) => amount(b, "rent") - amount(a, "rent") },
    "precio-alq-asc":    { es: "Precio de alquiler más bajo", fn: (a, b) => amount(a, "rent", Infinity) - amount(b, "rent", Infinity) },
    "recientes":         { es: "Más recientes", fn: (a, b) => Number(b.id) - Number(a.id) },
    "antiguos":          { es: "Más antiguos", fn: (a, b) => Number(a.id) - Number(b.id) }
  };

  function amount(p, op, fallback = -1) {
    const o = p.operations && p.operations[op === "rent" ? (p.operations.rent ? "rent" : "shortTerm") : op];
    return o && o.amount != null ? o.amount : fallback;
  }

  function mainOperation(p) {
    const o = p.operations || {};
    return ["sale", "rent", "shortTerm", "optionToBuy", "transfer"].find((k) => o[k]) || "sale";
  }

  function matches(p, f) {
    const ops = p.operations || {};
    if (f.operation === "sale" && !ops.sale) return false;
    if (f.operation === "rent" && !(ops.rent || ops.shortTerm)) return false;
    if (f.operation && !["sale", "rent"].includes(f.operation) && !ops[f.operation]) return false;
    if (f.newBuild && !p.isNewBuild) return false;
    if (f.type && p.type !== f.type && p.typeGroup !== f.type) return false;
    if (f.area) {
      const hay = norm(p.municipality + " " + (p.zone || ""));
      if (!norm(f.area).split(" ").every((t) => hay.includes(t))) return false;
    }
    if (f.ref && !norm(p.ref).includes(norm(f.ref))) return false;
    const price = amount(p, f.operation === "rent" ? "rent" : mainOperation(p), null);
    if (f.priceMin && (price == null || price < f.priceMin)) return false;
    if (f.priceMax && (price == null || price > f.priceMax)) return false;
    if (f.surfaceMin && !(p.surface >= f.surfaceMin)) return false;
    if (f.surfaceMax && !(p.surface <= f.surfaceMax)) return false;
    if (f.bedrooms && !(p.bedrooms >= f.bedrooms)) return false;
    if (f.bathrooms && !(p.bathrooms >= f.bathrooms)) return false;
    if (f.extras && f.extras.length && !f.extras.every((e) => (p.extras || []).includes(e))) return false;
    if (f.ids && !f.ids.includes(p.id)) return false;
    if (f.excludeIds && f.excludeIds.includes(p.id)) return false;
    return true;
  }

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  }

  let cache = null;

  window.HabitatData = {
    adapter: localAdapter,
    adapters: { local: localAdapter, inmovilla: inmovillaAdapter },
    sorts: SORTS,
    mainOperation,
    norm,

    use(name) { this.adapter = this.adapters[name]; cache = null; },

    async all() {
      if (!cache) cache = await this.adapter.all();
      return cache;
    },

    /* filters: { operation, newBuild, type, area, priceMin, priceMax, ref, surfaceMin, surfaceMax,
                  bedrooms, bathrooms, extras[], ids[], excludeIds[] }
       → { items, total, page, pages, size } */
    async query(filters = {}, { page = 1, size = 12, sort = "recientes" } = {}) {
      let list = (await this.all()).filter((p) => matches(p, filters));
      if (filters.ids) list.sort((a, b) => filters.ids.indexOf(a.id) - filters.ids.indexOf(b.id));
      else if (SORTS[sort]) list = list.slice().sort(SORTS[sort].fn);
      const total = list.length;
      const pages = Math.max(1, Math.ceil(total / size));
      page = Math.min(Math.max(1, page), pages);
      return { items: list.slice((page - 1) * size, page * size), total, page, pages, size };
    },

    async get(id) {
      return (await this.all()).find((p) => p.id === String(id)) || null;
    },

    /* Parecidos: misma operación y grupo de tipo; primero el mismo municipio. */
    async related(p, n = 4) {
      const op = mainOperation(p);
      const all = (await this.all()).filter((x) => x.id !== p.id && x.operations && x.operations[op]);
      const score = (x) => (x.typeGroup === p.typeGroup ? 2 : 0) + (x.municipality === p.municipality ? 1 : 0);
      return all.sort((a, b) => score(b) - score(a)).slice(0, n);
    },

    async areas() {
      const set = new Set();
      for (const p of await this.all()) {
        set.add(p.municipality);
        if (p.zone) set.add(p.zone + " · " + p.municipality);
      }
      return [...set].sort((a, b) => a.localeCompare(b, "es"));
    }
  };
})();
