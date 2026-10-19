// HABITAT.CAT — monta el kit. Sin dependencias: `node build.mjs`
//  1. Convierte el catálogo extraído (../Web actual/07-catalogo.json) al modelo
//     de data/property.schema.json → data/catalogo.js (datos de muestra).
//  2. Monta las páginas: src/pages/*.html + src/partials/*.html → paginas/*.html,
//     y src/guia.html → guia.html.
//
// Sintaxis de las plantillas:
//   Primera línea  <!--meta {"title": "...", "description": "...", "route": "/for-sale", "nav": "venta", "header": "overlay"} -->
//   Inclusión      <!-- @include nombre -->      (src/partials/nombre.html)
//   Variables      {{title}} {{description}} {{route}} {{root}} {{pages}} {{headerClass}}
//   Menú activo    los enlaces con data-nav="<nav>" reciben aria-current="page"

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const p = (...a) => join(here, ...a);

/* ---------- 1. Catálogo ---------- */
const catalogSrc = p("..", "Web actual", "07-catalogo.json");
const dictSrc = readFileSync(p("data", "tipos.js"), "utf8");
const dict = Function("window", dictSrc + "; return window.HABITAT_DICT;")({});
const groupOf = {};
for (const g of dict.typeGroups) for (const [key] of g.types) groupOf[key] = g.key;

const num = (s) => {
  if (s == null || s === "") return null;
  const n = Number(String(s).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
};

function parsePrice(raw, op) {
  const operations = {};
  let consultPrice = false;
  const parts = raw.split(/\s+-\s+|^-\s+/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    if (/consult/i.test(part)) { consultPrice = true; continue; }
    if (/^transfer/i.test(part)) { operations.transfer = { amount: num(part), period: "once", currency: "EUR" }; continue; }
    if (/\/daily/i.test(part)) { operations.shortTerm = { amount: num(part), period: "day", currency: "EUR" }; continue; }
    if (/\/month/i.test(part)) { operations.rent = { amount: num(part), period: "month", currency: "EUR" }; continue; }
    const key = op === "Alquiler" ? "rent" : "sale";
    operations[key] = { amount: num(part), period: key === "rent" ? "month" : "once", currency: "EUR" };
  }
  if (consultPrice && !Object.keys(operations).length) {
    operations[op === "Alquiler" ? "rent" : "sale"] = { amount: null, period: "once", currency: "EUR" };
  }
  return { operations, consultPrice };
}

import { readdirSync as _rd } from "node:fs";
function photosOf(x) {
  const m = x.url.match(/ficha\/([^/]+)\/([^/]+)\//);
  if (!m) return [];
  const rel = `propiedades/${m[2]}/${String(x.ref).replace(/\//g, "-")}_${m[1]}`;
  const dir = p("..", "Web actual", "imagenes", rel);
  if (!existsSync(dir)) return [];
  return _rd(dir).filter((f) => f.endsWith(".jpg")).sort().map((f) => ({ src: `img/${rel}/${f}` }));
}

if (existsSync(catalogSrc)) {
  const raw = JSON.parse(readFileSync(catalogSrc, "utf8"));
  const items = raw.map((x) => {
    const m = x.url.match(/\/ficha\/[^/]+\/[^/]+\/[^/]+\/(\d+)\/(\d+)\//) || [];
    const { operations, consultPrice } = parsePrice(x.price, x.op);
    const disc = x.disc ? Math.abs(num(x.disc)) : null;
    return {
      id: m[2] || x.ref,
      agencyId: m[1] || null,
      ref: x.ref,
      operations,
      consultPrice,
      discountPct: disc,
      status: x.res ? "reserved" : "available",
      isNewBuild: false,
      type: x.typ,
      typeGroup: groupOf[x.typ] || "other",
      municipality: dict.municipalities[x.mun] || x.mun,
      zone: x.zona || null,
      bedrooms: num(x.hab),
      bathrooms: num(x.ban),
      surface: num(x.m2),
      photos: photosOf(x),
      sourceUrl: x.url
    };
  });
  const banner = "/* Generado por build.mjs a partir de «Web actual/07-catalogo.json» (extracción del 17 oct 2026).\n   Solo es la fuente de MUESTRA: en producción, data-source.js lee de Inmovilla. No editar a mano. */\n";
  writeFileSync(p("data", "catalogo.js"), banner + "window.HABITAT_CATALOGO = " + JSON.stringify(items) + ";\n");
  console.log(`catálogo: ${items.length} inmuebles → data/catalogo.js`);
} else {
  console.warn("! no encuentro " + catalogSrc + " — se conserva data/catalogo.js");
}

/* ---------- 2. Páginas ---------- */
const partial = (name) => {
  const f = p("src", "partials", name + ".html");
  if (!existsSync(f)) throw new Error("falta el parcial " + name);
  return readFileSync(f, "utf8");
};

function render(src, vars) {
  let meta = {};
  src = src.replace(/^<!--meta\s+([\s\S]*?)-->\s*/, (_, json) => { meta = JSON.parse(json); return ""; });
  const v = { headerClass: meta.header === "overlay" ? "site-header--overlay" : "", ...vars, ...meta };
  for (let i = 0; i < 5 && /<!--\s*@include\s+[\w-]+\s*-->/.test(src); i++) {
    src = src.replace(/<!--\s*@include\s+([\w-]+)\s*-->/g, (_, n) => partial(n));
  }
  src = src.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in v ? v[k] : ""));
  if (meta.nav) {
    src = src.replace(new RegExp(`data-nav="${meta.nav}"`, "g"), `data-nav="${meta.nav}" aria-current="page"`);
  }
  return src;
}

mkdirSync(p("paginas"), { recursive: true });
let n = 0;
for (const f of readdirSync(p("src", "pages")).filter((f) => f.endsWith(".html"))) {
  const out = render(readFileSync(p("src", "pages", f), "utf8"), { root: "../", pages: "" });
  writeFileSync(p("paginas", f), out);
  n++;
}
if (existsSync(p("src", "guia.html"))) {
  writeFileSync(p("guia.html"), render(readFileSync(p("src", "guia.html"), "utf8"), { root: "", pages: "paginas/" }));
  n++;
}
console.log(`páginas: ${n} montadas`);
