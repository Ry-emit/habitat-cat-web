/* HABITAT.CAT — diccionarios compartidos (tipos, operaciones, extras, municipios).
   La clave es el nombre que manda Inmovilla (en inglés, como sale hoy en su feed);
   el valor, la etiqueta en cada idioma. Para añadir un idioma, añade su columna. */
window.HABITAT_DICT = {
  langs: ["ca", "es", "en"],

  operations: {
    sale:        { ca: "Venda",            es: "Venta",               en: "For sale" },
    rent:        { ca: "Lloguer",          es: "Alquiler",            en: "For rent" },
    optionToBuy: { ca: "Opció de compra",  es: "Opción a compra",     en: "Option to buy" },
    shortTerm:   { ca: "Lloguer temporal", es: "Alquiler temporal",   en: "Short-term rental" },
    transfer:    { ca: "Traspàs",          es: "Traspaso",            en: "Transfer" }
  },

  typeGroups: [
    { key: "apartment", label: { ca: "Pis", es: "Piso", en: "Apartment" }, types: [
      ["Flat", "Pis", "Piso", "Flat"],
      ["Apartment", "Apartament", "Apartamento", "Apartment"],
      ["Penthouse", "Àtic", "Ático", "Penthouse"],
      ["Duplex", "Dúplex", "Dúplex", "Duplex"],
      ["Triplex", "Tríplex", "Tríplex", "Triplex"],
      ["Studio", "Estudi", "Estudio", "Studio"],
      ["Loft", "Loft", "Loft", "Loft"],
      ["Ground floor apartment", "Planta baixa", "Planta baja", "Ground-floor apartment"],
      ["Attic", "Golfes", "Buhardilla", "Attic"],
      ["Semi Attic", "Sobreàtic", "Sobreático", "Semi-attic"],
      ["Mezzanine", "Entresòl", "Entresuelo", "Mezzanine"],
      ["Duplex Penthouse", "Àtic dúplex", "Ático dúplex", "Duplex penthouse"]
    ]},
    { key: "house", label: { ca: "Casa / xalet", es: "Casa / chalet", en: "House / villa" }, types: [
      ["House", "Casa", "Casa", "House"],
      ["Single family house", "Casa unifamiliar", "Casa unifamiliar", "Single-family house"],
      ["Semi-detached house", "Casa aparellada", "Casa pareada", "Semi-detached house"],
      ["Terraced house", "Casa adossada", "Casa adosada", "Terraced house"],
      ["Villa", "Xalet", "Chalet", "Villa"],
      ["Luxury Villa", "Xalet de luxe", "Chalet de lujo", "Luxury villa"],
      ["Bungalow", "Bungalou", "Bungalow", "Bungalow"],
      ["Bungalow Ground Floor", "Bungalou planta baixa", "Bungalow planta baja", "Ground-floor bungalow"],
      ["Duplex House", "Casa dúplex", "Casa dúplex", "Duplex house"],
      ["Unique property", "Propietat singular", "Propiedad singular", "Unique property"],
      ["Solar house", "Casa solar", "Casa solariega", "Manor house"],
      ["Urban property", "Finca urbana", "Finca urbana", "Urban property"]
    ]},
    { key: "rustic", label: { ca: "Casa rústica", es: "Casa rústica", en: "Rustic house" }, types: [
      ["Village house", "Casa de poble", "Casa de pueblo", "Village house"],
      ["Agricultural house", "Casa agrícola", "Casa agrícola", "Agricultural house"],
      ["Farmhouse", "Masia", "Masía", "Farmhouse"],
      ["Ranch", "Ranxo", "Rancho", "Ranch"],
      ["Stone house", "Casa de pedra", "Casa de piedra", "Stone house"],
      ["Cabin", "Cabana", "Cabaña", "Cabin"],
      ["House with land", "Casa amb terreny", "Casa con terreno", "House with land"],
      ["Rustic property", "Finca rústica", "Finca rústica", "Rustic property"],
      ["Country House", "Casa de camp", "Casa de campo", "Country house"],
      ["Farm with orchard", "Finca amb hort", "Finca con huerto", "Farm with orchard"],
      ["Mansion", "Mansió", "Mansión", "Mansion"],
      ["Country manor", "Casa senyorial", "Casa señorial", "Country manor"]
    ]},
    { key: "building", label: { ca: "Edifici", es: "Edificio", en: "Building" }, types: [
      ["Building", "Edifici", "Edificio", "Building"],
      ["Hostel", "Hostal", "Hostal", "Hostel"],
      ["Hotel", "Hotel", "Hotel", "Hotel"]
    ]},
    { key: "garage", label: { ca: "Garatge", es: "Garaje", en: "Garage" }, types: [
      ["Garage", "Garatge", "Garaje", "Garage"],
      ["Parking", "Plaça d'aparcament", "Plaza de parking", "Parking space"],
      ["Motorcycle parking", "Plaça de moto", "Plaza de moto", "Motorcycle parking"]
    ]},
    { key: "commercial", label: { ca: "Local / nau", es: "Local / nave", en: "Premises / warehouse" }, types: [
      ["Business Premise", "Local comercial", "Local comercial", "Commercial premises"],
      ["Industrial Unit", "Nau industrial", "Nave industrial", "Industrial unit"],
      ["Business", "Negoci", "Negocio", "Business"],
      ["Pub", "Pub", "Pub", "Pub"],
      ["Restaurant", "Restaurant", "Restaurante", "Restaurant"],
      ["Warehouse", "Magatzem", "Almacén", "Warehouse"]
    ]},
    { key: "office", label: { ca: "Oficina", es: "Oficina", en: "Office" }, types: [
      ["Office", "Oficina", "Oficina", "Office"]
    ]},
    { key: "land", label: { ca: "Terreny", es: "Terreno", en: "Land" }, types: [
      ["Plot of land", "Parcel·la", "Parcela", "Plot of land"],
      ["Urban Plot of land", "Parcel·la urbana", "Parcela urbana", "Urban plot"],
      ["Building Site", "Solar", "Solar", "Building site"],
      ["Urbanizable land", "Terreny urbanitzable", "Terreno urbanizable", "Urbanizable land"],
      ["Rustic Land", "Terreny rústic", "Terreno rústico", "Rustic land"],
      ["Rural Land", "Terreny rural", "Terreno rural", "Rural land"],
      ["Industrial Land", "Terreny industrial", "Terreno industrial", "Industrial land"],
      ["Mountain", "Muntanya", "Monte", "Mountain"]
    ]},
    { key: "other", label: { ca: "Altres", es: "Otros", en: "Other" }, types: [
      ["Room", "Habitació", "Habitación", "Room"],
      ["Camping", "Càmping", "Camping", "Camping"],
      ["Storage room", "Traster", "Trastero", "Storage room"]
    ]}
  ],

  extras: {
    pool:         { ca: "Piscina",            es: "Piscina",        en: "Pool" },
    parking:      { ca: "Aparcament",         es: "Parking",        en: "Parking" },
    lift:         { ca: "Ascensor",           es: "Ascensor",       en: "Lift" },
    terrace:      { ca: "Terrassa",           es: "Terraza",        en: "Terrace" },
    furnished:    { ca: "Moblat",             es: "Amueblado",      en: "Furnished" },
    urbanization: { ca: "Urbanització",       es: "Urbanización",   en: "Urbanization" },
    newBuild:     { ca: "Obra nova",          es: "Obra nueva",     en: "New build" },
    seaView:      { ca: "Vistes al mar",      es: "Vistas al mar",  en: "Sea view" }
  },

  /* El feed actual trae los nombres sin acentos; aquí se corrigen para mostrarlos. */
  municipalities: {
    "Vilanova i la Geltru": "Vilanova i la Geltrú",
    "Vilafranca del Penedes": "Vilafranca del Penedès",
    "Sant Sadurni d'Anoia": "Sant Sadurní d'Anoia",
    "Sant Quinti de Mediona": "Sant Quintí de Mediona",
    "Sant Llorenç dHortons": "Sant Llorenç d'Hortons",
    "El Pont de Suert": "El Pont de Suert"
  }
};
