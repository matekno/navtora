/**
 * Spanish (Rioplatense) dictionary. Its shape defines the Dictionary type;
 * en.ts must match it key by key.
 */
import type { LocateReason, LocateSuggestion } from "@navtora/core";

const ORDINALS = ["", "primera", "segunda", "tercera", "cuarta", "quinta", "sexta", "séptima"];

export const es = {
  lang: "es" as const,
  app: {
    name: "NavTorá",
    tagline: "Ubicarse en el sefer sin saber el texto de memoria.",
    description: "Apuntá la cámara al sefer y te dice dónde está abierto y cuántas columnas faltan para la lectura.",
    switchTo: "English",
    switchLabel: "Cambiar el idioma a inglés",
  },
  consent: {
    heading: "Antes de empezar",
    bullets: [
      "La foto sale del teléfono sólo cuando tocás el botón de leer. La lee Claude, un modelo de Anthropic.",
      "**NavTorá no guarda fotos.** Sólo registra tiempos y cantidad de líneas.",
      "Si no está segura de dónde estás, te lo dice en vez de adivinar.",
      "Es una ayuda. La última palabra la tienen el sofer y el rav.",
    ],
    accept: "Empezar",
  },
  camera: {
    modelGroup: "Modelo de lectura",
    targetPrefix: "Objetivo: ",
    change: "Cambiar",
    removeTarget: "Quitar objetivo",
    pickTarget: "Elegir a dónde ir",
    starting: "Abriendo la cámara…",
    denied: "Sin permiso para la cámara. Habilitalo en el navegador o tipeá las palabras.",
    unavailable: "La cámara no está disponible en este navegador. Probá con Safari o Chrome, o tipeá las palabras.",
    lowLight: "Poca luz. Acercá una lámpara o prendé la linterna.",
    type: "Tipear",
    capture: "Leer la columna",
    torch: "Linterna",
  },
  progress: {
    sending: "Enviando…",
    reading: (model: string) => `Leyendo con ${model}…`,
    searching: "Buscando en la Torá…",
    slow: "Tarda más de lo normal…",
    note: "La foto no se guarda.",
  },
  result: {
    badge: "Ubicado con seguridad",
    matchStat: (words: number, lines: number) => `${words} palabras en ${lines} líneas`,
    book: "Libro",
    parasha: "Parashá",
    parashot: "Parashot",
    aliyah: "Aliá",
    verses: "Versículos",
    column: "Columna",
    columnValue: (col: number, firstLine: number | null) => `${col} de 245${firstLine ? `, desde la línea ${firstLine}` : ""}`,
    columnHint: "layout estándar de 42 líneas",
    startsWith: "Empieza con",
    aliyahStartsHere: "En esta columna empieza una aliá.",
    ocrSummary: (n: number) => `Texto leído (${n} líneas)`,
    goTo: "Ir a…",
    scanAgain: "Escanear de nuevo",
    mapTitle: "Dónde estás en el rollo",
  },
  meta: {
    readWith: (label: string, secs: number | null) => `Leído con ${label}${secs !== null ? ` en ${secs} s` : ""}`,
  },
  uncertain: {
    error: "No se pudo leer",
    ambiguous: "Más de un lugar posible",
    insufficient: "No pude ubicarlo con seguridad",
    whatHappened: "Qué pasó",
    whatToTry: "Qué probar",
    candidates: "Candidatos",
    closest: "Lo más parecido, sin garantía",
    typeWords: "Tipear palabras",
    rescan: "Volver a escanear",
    reasons: {
      "few-words": "Se leyeron muy pocas palabras.",
      "no-match": "Lo leído no coincide con ningún lugar de la Torá.",
      "few-aligned": "Coinciden pocas palabras.",
      "single-line": "Coincide una sola línea; no alcanza.",
      "low-coverage": "La lectura salió con mucho ruido.",
      "similar-passages": "El texto se parece a más de un pasaje.",
    } satisfies Record<LocateReason, string>,
    suggestions: {
      "move-closer": "Acercate para que entren varias líneas enteras.",
      "check-photo": "Fijate que se vea texto del rollo, nítido y sin reflejos.",
      "more-light": "Más luz, y la cámara paralela al pergamino.",
      "include-gap": "Si hay un espacio en blanco cerca, incluilo: ayuda a ubicarse.",
      "show-column-start": "Mostrá el principio de la columna o la columna de al lado.",
    } satisfies Record<LocateSuggestion, string>,
  },
  manual: {
    title: "Tipear palabras",
    help: "Las primeras palabras de dos o tres líneas, una por renglón. Sin nikud. Si una letra no se lee, poné ?.",
    wordCount: (n: number) => `${n} ${n === 1 ? "palabra" : "palabras"}`,
    camera: "Cámara",
    searching: "Buscando…",
    locate: "Ubicar",
  },
  target: {
    title: "¿A dónde vamos?",
    cancel: "Cancelar",
    tabs: { today: "Fecha", holidays: "Jaguim", aliyah: "Parashá", verse: "Pasuk" },
    israelCalendar: "Calendario de Israel",
    loadError: "No pude cargar la lista de parashot.",
    dateLabel: "Fecha",
    consulting: "Consultando el calendario…",
    noReading: "Ese día no hay lectura de la Torá.",
    nextReading: (date: string) => `La próxima es el ${date}: `,
    building: "Armando el calendario…",
    loading: "Cargando…",
    parashaLabel: "Parashá",
    wholeParasha: "Toda la parashá, aliá por aliá",
    bookLabel: "Libro",
    chapter: "Capítulo",
    verseLabel: "Versículo",
    goToVerse: "Ir a este pasuk",
    multipleBooks: "Lecturas en más de un libro: seguramente se usan dos sifrei.",
    special: (n: number | "M", reason: string, ref: string) =>
      `${n === "M" ? "Maftir especial" : `${n}ª aliá especial`}: ${reason}, ${ref}. Suele leerse de un segundo sefer.`,
    startFromFirst: "Empezar por la primera aliá",
  },
  aliyah: {
    /** "tercera aliá", "maftir" */
    label: (n: number | "M"): string => (n === "M" ? "maftir" : `${ORDINALS[n] ?? String(n)} aliá`),
    /** "Tercera", "Maftir" */
    button: (n: number | "M"): string => (n === "M" ? "Maftir" : capitalize(ORDINALS[n] ?? String(n))),
    /** "3ª", "maftir" */
    short: (n: number | "M"): string => (n === "M" ? "maftir" : `${n}ª`),
    none: "sin aliá identificada",
    /** "tercera aliá de Miketz" */
    ofParasha: (label: string, parasha: string) => `${label} de ${parasha}`,
    /** "Miketz, tercera aliá" */
    withParasha: (parasha: string, label: string) => `${parasha}, ${label}`,
  },
  format: {
    verseRange: (book: string, c1: number, v1: number, c2: number, v2: number): string =>
      c1 === c2 && v1 === v2 ? `${book} ${c1}:${v1}` : c1 === c2 ? `${book} ${c1}:${v1} a ${v2}` : `${book} ${c1}:${v1} a ${c2}:${v2}`,
    list: (items: string[]): string => (items.length <= 1 ? (items[0] ?? "") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`),
  },
  nav: {
    objective: "Objetivo",
    change: "Cambiar",
    arrived: "Llegaste",
    startsAt: (exact: boolean): string => (exact ? "Empieza en la" : "Empieza cerca de la"),
    lineN: (n: number) => `línea ${n}`,
    atLineStart: ", al principio de la línea.",
    midLine: ", en el medio de la línea.",
    withWords: "Con las palabras",
    gapPetucha: "Antes hay un espacio hasta el final de la línea anterior.",
    gapSetuma: "Antes hay un espacio dentro de la línea.",
    columnsUnit: (n: number, exact: boolean): string => `${n === 1 ? "columna" : "columnas"}${exact ? "" : " aprox."}`,
    toTheRight: "a la derecha",
    toTheLeft: "a la izquierda",
    towardsBereshit: "Hacia el principio del sefer (Bereshit)",
    towardsDevarim: "Hacia el final del sefer (Devarim)",
    noEstimate: (side: string) => `Movete unas columnas ${side}`,
    noEstimateHint: "Todavía no sé cuántas faltan. Escaneá de nuevo después de moverte.",
    nonStandard: "Este sefer no sigue el layout estándar: la cuenta mejora con cada escaneo.",
    nowAt: "Ahora estás en",
    column: (n: number) => `columna ${n}`,
    targetIn: "Objetivo en",
    nextAliyah: "Siguiente aliá",
    verifyAgain: "Volver a verificar",
    movedScanAgain: "Ya lo moví, escanear de nuevo",
    map: { here: "Estás acá", target: "Objetivo", start: "Bereshit", end: "Devarim" },
  },
  voice: {
    listen: "Escuchar",
    auto: "Leer siempre en voz alta",
    autoShort: "Leer siempre",
    move: (n: number | null, exact: boolean, right: boolean): string => {
      const side = right ? "a la derecha, hacia el principio del sefer" : "a la izquierda, hacia el final del sefer";
      if (n === null) return `Todavía no sé cuántas columnas faltan. Movete ${right ? "a la derecha" : "a la izquierda"} y escaneá de nuevo.`;
      if (n === 1) return `${exact ? "Una columna" : "Cerca de una columna"} ${side}.`;
      return `${exact ? "" : "Unas "}${n} columnas ${side}.`;
    },
    here: (label: string, line: number, exact: boolean, atLineStart: boolean) =>
      `Llegaste. ${label} empieza en esta columna, ${exact ? "en la" : "cerca de la"} línea ${line}${atLineStart ? ", al principio de la línea" : ""}. Las primeras palabras son:`,
  },
  errors: {
    connect: (msg: string) => `No se pudo conectar con el servidor: ${msg}`,
    http: (status: number) => `Error ${status}`,
  },
  api: {
    tooLarge: "La imagen supera los 6 MB.",
    unsupported: (type: string) => `Formato de imagen no soportado: ${type || "desconocido"}.`,
    ocrRefusal: (detail: string | undefined) => `El modelo se negó a leer la imagen${detail ? `: ${detail}` : ""}.`,
    ocrTruncated: "La transcripción quedó cortada por el límite de tokens.",
    ocrBadFormat: "El modelo no devolvió la transcripción con el formato esperado.",
    missingKey: "Falta ANTHROPIC_API_KEY en el servidor.",
    unknown: "Error desconocido",
    tooLong: "El texto es demasiado largo.",
    unauthorized: "Hay que iniciar sesión para usar la app.",
    aliyahNotFound: "No encontré esa parashá o aliá.",
    verseNotFound: "Ese versículo no existe en la Torá.",
  },
  links: { sefaria: "Sefaria ↗", tikkun: "tikkun.io ↗" },
  login: {
    title: "Acceso de administración",
    password: "Contraseña",
    submit: "Entrar",
    wrong: "Contraseña incorrecta.",
    back: "Volver",
  },
  landing: {
    headline: "Ubicarse en el Sefer Torá desde el celular",
    lead: "Apuntás la cámara a la columna abierta y NavTorá te dice libro, parashá y aliá, y cuántas columnas faltan para llegar a la lectura.",
    steps: [
      { title: "Elegí la lectura", text: "La de hoy, un jag, una parashá y aliá, o cualquier pasuk." },
      { title: "Escaneá la columna", text: "La cámara lee unas líneas y las ubica en la Torá. Si no está segura, te lo dice." },
      { title: "Mové y volvé a escanear", text: "Te dice cuántas columnas mover y para qué lado. Al llegar, en qué línea empieza la lectura." },
    ],
    status: "NavTorá está en prueba y todavía no está abierta al público. El código es abierto: podés correr tu propia copia.",
    github: "Ver en GitHub",
    screenshotAlt: "La app indicando 47 columnas a la derecha, hacia Bereshit",
    admin: "Admin",
    license: "Código abierto, licencia MIT",
    demoTitle: "Probada con sifrei reales",
    demoNote: "Grabados con una versión anterior de la app, sólo en español.",
    demos: [
      {
        title: "Un sefer gastado",
        caption: "Objetivo: la primera aliá de Yom Kipur. El sefer está abierto en Ajarei Mot, columna 132, y la app indica 1 columna a la derecha.",
      },
      {
        title: "Un tikún impreso",
        caption: "Objetivo: el maftir de Rosh Hashaná. El tikún está abierto en Balak, columna 181, y la app indica 9 columnas a la izquierda.",
      },
    ],
  },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
