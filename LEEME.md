# HABITAT.CAT — sistema de diseño (v1, 17 oct 2026)

Estilo y estructura de la web nueva de HABITAT.CAT, en local. Sin fotos: donde irá una foto hay un **hueco** con su etiqueta.

**Empieza por `guia.html`**: colores, tipografía, espacios y todos los componentes, con enlaces a las 12 páginas.

## Cómo abrirlo

- **Con servidor (así se ha revisado):** en el panel del navegador de Claude, servidor «habitat-ds» → `http://localhost:8241/guia.html`. O en una terminal, dentro de esta carpeta: `python3 -m http.server 8241` y abrir esa dirección.
- Con doble clic en `guia.html` también se abre, pero algunos navegadores (Chrome) no cargan las tipografías desde archivo y enseñan la de reserva. No se ha comprobado.

## De dónde sale el estilo

Tres referencias que pasó Alex el 17 oct 2026:

| Referencia | Qué se ha tomado |
|---|---|
| **Vista** | Portada a sangre con foto, titular enorme en sans geométrica, botón blanco + botón de contorno, cifras en fila abajo, menú en mayúsculas pequeñas |
| **NORD** | Secciones blancas y limpias, bloque texto + foto, enlace con flecha y raya, pie con columnas y **el nombre gigante** al final |
| **Real Estate** | Fotos con esquinas redondeadas, fichas de cifras en gris claro, «¿Por qué elegirnos?», tarjetas de proyecto con iconos de habitaciones y m², botón negro en píldora |

Resultado: **monocromo** (tinta #0F0F0E, papel #FFFFFF, niebla #F2F2F0), **Urbanist** para titulares y **Inter** para texto (las dos libres, en `fonts/`), botones píldora y radios de 8 a 28 px.

## Qué hay

| Ruta | Qué es |
|---|---|
| `guia.html` | Guía de estilo con todos los componentes |
| `paginas/` | Las 12 páginas montadas: inicio, venta, alquiler, obra nueva, inmueble, empresa, alertas, publica tu inmueble, mis inmuebles, privacidad, aviso legal, cookies |
| `css/tokens.css` | **Todas las decisiones de diseño** (color, tipos, espacios, radios). Cambia aquí y cambia todo |
| `css/base.css` · `css/components.css` | Reset y maquetación · componentes. Se enlaza solo `css/habitat.css` |
| `js/data-source.js` | Fuente de datos: hoy la muestra local, mañana Inmovilla (adaptador preparado) |
| `js/habitat.js` | Comportamiento: fichas, listado, buscador, favoritos, hipoteca, cookies, menú, flotantes |
| `data/property.schema.json` | **Modelo de datos de un inmueble** |
| `data/tipos.js` | Tipos de inmueble (9 grupos, como Inmovilla), operaciones, extras y municipios con acentos, en ca/es/en |
| `data/catalogo.js` | Muestra generada desde `../Web actual/07-catalogo.json` (463 inmuebles). No editar a mano |
| `src/` | Fuentes de las páginas: `pages/` y `partials/` (cabecera, buscador, pie, flotantes, textos legales…) |
| `build.mjs` | `node build.mjs` regenera `data/catalogo.js`, `paginas/` y `guia.html` desde `src/` |

**Se edita `src/`, nunca `paginas/` ni `guia.html`**: se sobrescriben al montar.

## Cómo poner una foto

```html
<div class="media ratio-4x3" data-label="Foto · fachada">
  <img src="fachada.jpg" alt="Fachada del edificio">
</div>
```

Con el `<img>` dentro, la etiqueta desaparece sola. Las fotos de los inmuebles llegan por datos (`photos` del modelo).

## Datos e Inmovilla

- Ningún componente lleva inmuebles escritos a mano: todos piden a `HabitatData` (`query`, `get`, `related`, `areas`).
- Para conectar Inmovilla: rellenar `inmovillaAdapter` en `js/data-source.js` (endpoint propio en el servidor + `toProperty()` que traduce al modelo) y llamar `HabitatData.use("inmovilla")`. Las credenciales nunca van en el navegador.
- Los formularios validan y muestran «Formulario de muestra»: falta enviarlos a Inmovilla con reCAPTCHA (punto marcado en `initForm` de `habitat.js`).
- Rutas limpias de producción: `/for-sale`, `/for-rent`, `/promotions`, `/company`, `/alerts`, `/list-your-property`, `/property/{tipo}/{municipio}/{zona}/{id}`, con carpeta de idioma (`/ca`, `/es`, `/en`). Cada ficha ya calcula la suya (`data-route` en el enlace).

## Decisiones tomadas por defecto (cámbialas si no encajan)

- **Idioma de los textos: castellano.** La estructura (hreflang, selector, diccionarios) está lista para ca/es/en.
- **Logo:** texto provisional «habitat.cat / consultors immobiliaris» en Urbanist. Hueco marcado en `src/partials/header.html`.
- **Sin rojo.** `--color-accent` vale tinta; para recuperar el rojo del tejado del logo actual, cambiar esa línea en `tokens.css`.
- **Cifras de la portada:** 463 inmuebles, 405 en venta, 58 en alquiler (catálogo del 17 oct 2026) y «100 % financiación» (texto de la empresa). Hay que actualizarlas o leerlas del catálogo.
- **Rebajas:** el catálogo solo trae el porcentaje; el precio anterior tachado sale cuando Inmovilla lo dé (`previous` en el modelo).
- **Precios por días** se tratan como «alquiler temporal» (`shortTerm`).
- **Simulador de hipoteca:** impuestos al 10 % tal como en la web actual; cuota con la fórmula francesa.

## Pendiente

- Textos legales completos (privacidad, aviso legal, cookies): hay estructura y los datos que se conocen; el resto está marcado `[pendiente]`.
- Obra nueva: el catálogo actual no marca qué inmuebles son obra nueva, así que el listado de promociones sale vacío y las tarjetas de promoción llevan `[Nombre de la promoción]`.
- Empresa: huecos para equipo, historia y opiniones.
- Mapas: huecos; falta elegir proveedor (Google Maps, Mapbox o el mapa de Inmovilla).
