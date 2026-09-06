# kore-kompanion — Etapa 1: escanear el sefer y reconocer qué se está leyendo

## Contexto

Un Sefer Torá no tiene números de página ni marcas. Ubicar en qué libro, parashá y aliá está abierto es una habilidad que hoy sólo tienen quienes conocen el texto de memoria. La etapa 1 resuelve la mitad del problema completo: desde el celular, apuntar la cámara a la columna abierta, capturar, y que la app diga con honestidad qué contiene esa columna. La navegación hacia un objetivo, la línea exacta y las marcas quedan para etapas posteriores, pero el modelo de datos de esta etapa ya las contempla.

La idea técnica central, acordada en la conversación previa: no se reconoce la imagen, se localiza texto. La Torá es un string conocido de ~305 mil letras. Alcanza con transcribir mal unas cuantas palabras y buscarlas en ese string con un matcher tolerante a ruido. La posición se representa como índice de palabra, independiente del layout del sefer.

## Alcance de la etapa 1

Sí:
- PWA web con Next.js que abre la cámara trasera, captura un frame y lo manda al servidor.
- OCR remoto con un modelo de visión de Claude, detrás de una interfaz `OcrProvider` intercambiable.
- Matcher propio que ubica la transcripción en el texto de la Torá y calcula confianza y margen.
- Resultado: libro, parashá, aliot presentes en la columna, rango de versículos, primeras palabras, y si coincide con el layout estándar, número de columna de 245.
- Estado explícito de "no estoy seguro" con motivos y sugerencias. Nunca una posición equivocada con confianza.
- Entrada manual alternativa: tipear las primeras palabras y usar el mismo matcher.
- Pantalla de consentimiento que dice qué se envía y que no se guarda ninguna imagen.
- Harness de evaluación sobre los sifrei digitalizados abiertos que se encontraron.

No:
- Objetivo, dirección de rolado ni cuenta de columnas. Línea exacta con overlay. Marcas guardadas. Calendario. OCR on-device. Modelo HTR propio.

## Decisiones tomadas

- Plataforma: PWA con Next.js App Router, desplegada en Vercel. Elegida por el usuario.
- Validación: primero con escaneos abiertos, protocolo listo para un sefer real después. Elegida por el usuario.
- OCR v1: `@anthropic-ai/sdk`, modelo `claude-opus-5` configurable por env, thinking adaptativo por defecto, `output_config.effort` arrancando en `medium` y ajustado con el eval, salida estructurada con JSON schema vía `output_config.format`.
- El matcher, no el modelo, decide la posición y la confianza. El modelo sólo transcribe lo que ve.
- El matcher corre en el servidor en la etapa 1, dentro de la misma request de escaneo, pero el paquete `core` es TypeScript puro sin dependencias de plataforma para poder moverlo al cliente o a nativo.
- Fuente primaria de texto y layout: el repo de tikkun.io, licencia MIT. Tiene `src/data/pages/torah/1.json` a `245.json`, un JSON por columna con 42 líneas, cada línea con texto, versículos, aliot y flag `isPetucha`. Verificado: la columna 50 arranca con ויאמר אלהם יוסף, igual que la referencia impresa. Más `src/data/tables-of-contents/torah.json` con la estructura de parashot y aliot.
- Cruce de texto: Sefaria, versión "Tanach with Text Only", dominio público, para verificar el texto consonántico.
- Aliot: se toman de los datos de tikkun.io. `@hebcal/leyning` (BSD-2) se usa sólo en el script de build para cruzar. `@hebcal/core` es GPL-2.0, por eso no entra al bundle de la app.

## Estructura del repo

Monorepo con pnpm workspaces, TypeScript estricto, Vitest, Node 24.

```
kore-kompanion/
  package.json, pnpm-workspace.yaml, tsconfig.base.json
  packages/data/          scripts de build → JSON commiteados en dist/
    scripts/fetch-tikkun.ts     baja los 245 JSON y el ToC a un commit fijo
    scripts/build.ts            genera torah.json, layout-245.json, parashot.json
    dist/                       salida commiteada, ~2 MB
    NOTICE.md                   atribución tikkun.io MIT, Sefaria
  packages/core/          motor puro, sin DOM ni Node APIs
    src/normalize.ts            strip nikud/taamim, split por maqaf, formas finales
    src/text.ts                 TorahText: words, wordVerse, verses, petucha por línea
    src/index.ts                NGramIndex: exact map + trigramas → posting lists, IDF
    src/distance.ts             Levenshtein ponderado con confusiones de STA"M
    src/match.ts                votación diagonal + alineamiento en banda + confianza
    src/resolve.ts              span de palabras → libro, parashá, aliot, versículos, columna 245
    src/layout.ts               LayoutEstimate a partir de líneas y palabras observadas
    src/types.ts                OcrResult, LocateResult, Confidence
    test/                       vitest
  apps/web/               Next.js App Router, Tailwind
    app/page.tsx                cámara + captura + resultado
    app/consent/page.tsx        primera vez: qué se envía, qué no se guarda
    app/api/scan/route.ts       imagen → OcrProvider → core.locate → LocateResult
    app/api/locate/route.ts     texto tipeado → core.locate
    lib/ocr/provider.ts         interfaz OcrProvider
    lib/ocr/claude.ts           ClaudeVisionOcr
    lib/image.ts                downscale y JPEG en el cliente
    components/Camera.tsx, ResultCard.tsx, UncertainCard.tsx, ManualInput.tsx
    public/manifest.webmanifest, íconos
  tools/eval/
    download.ts                 baja los escaneos abiertos a data/scans/ (gitignored)
    split.ts                    pdftoppm → una imagen por columna
    truth/                      ground truth por set, JSON commiteado
    noise.ts                    simulador de ruido de OCR sobre texto
    run.ts                      corre pipeline, cachea OCR por hash, reporta métricas
```

## Datos: `packages/data`

`build.ts` produce tres archivos a partir de tikkun.io:

- `torah.json`: `words: string[]` consonánticas tal como están escritas en el rollo, `wordVerse: number[]` con id de versículo por palabra, `verses: {book, chapter, verse, startWord}[]`, `petuchaBeforeWord: number[]`.
- `layout-245.json`: por columna, `startWord` y `lineStartWords[42]`. Deriva directamente de la estructura por líneas de tikkun.io.
- `parashot.json`: 54 parashot con rango de versículos y las 7 aliot del ciclo anual más maftir, con `startWord` y `endWord`. Se cruza contra `@hebcal/leyning` en el build y el script falla si hay discrepancia.

Normalización, en `core/normalize.ts` para reutilizarla sobre la salida del OCR: quitar U+0591 a U+05BD, U+05BF, U+05C1, U+05C2, U+05C4, U+05C5, U+05C7; reemplazar maqaf U+05BE por espacio; quitar sof pasuk U+05C3 y paseq; colapsar espacios. Las palabras unidas por maqaf en el rollo se escriben separadas, así que se indexan como palabras distintas.

## Motor: `packages/core`

`locate(ocr: OcrResult): LocateResult`, en cinco pasos:

1. Tokens. Cada línea del OCR se normaliza y se parte en palabras, guardando índice de línea y posición en la línea.
2. Candidatos por token. Coincidencia exacta en el mapa de palabras, más candidatos difusos por solapamiento de trigramas filtrados con distancia de edición ponderada. La matriz de confusión pesa barato los pares que se confunden en escritura STA"M: ב/כ, ד/ר, ה/ח/ת, ו/ז/י/ן, ם/ס, ג/נ, צ/ץ, y letra faltante o partida. Tokens muy frecuentes se pesan por IDF para que את, אל o יהוה no dominen.
3. Votación diagonal. Cada candidato en posición p para el token k vota el origen p − k, en bins de ancho 4 con suavizado a vecinos. Es la técnica de fingerprinting de audio aplicada a texto: tolera tokens perdidos o inventados sin alineamiento previo.
4. Alineamiento fino. Los cinco mejores bins se refinan con un DP en banda entre la secuencia de tokens y la ventana de texto. Devuelve `startWord`, `endWord`, score y cobertura.
5. Confianza. `confident` si el score supera el umbral y el margen sobre el segundo candidato es amplio y hay al menos N tokens alineados en al menos 3 líneas. `ambiguous` si dos candidatos quedan cerca: devuelve ambos con sus pasajes, típico de los nesiim de Bamidbar 7 o del Mishkán ordenado y construido. `insufficient` si no hay señal. Los umbrales se fijan con el eval, no a mano.

`resolve.ts` convierte el span en libro, parashá, aliot que intersectan, versículo inicial y final, primeras palabras de la primera línea alineada, y `standardColumn` si `startWord` cae a ±2 palabras del inicio de una columna de `layout-245.json` y el OCR reportó cerca de 42 líneas.

`layout.ts` calcula líneas observadas y palabras por línea para estimar palabras por columna, dato que la etapa 2 necesitará para contar columnas en sifrei no estándar.

## OCR: `apps/web/lib/ocr`

Interfaz:

```ts
interface OcrProvider { recognize(img: { bytes: Uint8Array; mime: string }): Promise<OcrResult> }
type OcrResult = { lines: { text: string; uncertain: boolean; gapBefore: "none" | "partial" | "full" }[]; lineCountVisible: number }
```

`ClaudeVisionOcr` usa `client.messages.create` con la imagen en base64, modelo desde `OCR_MODEL` (default `claude-opus-5`), `output_config: { effort: process.env.OCR_EFFORT ?? "medium", format: <JSON schema de OcrResult> }`, `max_tokens` 4000. El prompt del sistema exige: transcribir sólo lo visible, línea por línea en el orden visual, sólo consonantes sin nikud, marcar letras ilegibles con `?`, no completar desde la memoria del texto bíblico, reportar espacios en blanco antes de una línea. Se verifica `stop_reason` antes de leer contenido. No se loguea ni persiste la imagen; sólo hash, latencia, tokens y resultado del matcher. Sigue el README de TypeScript del skill `claude-api` para la forma exacta de la llamada.

El cliente reduce la foto a 1800 px de lado largo y JPEG 0.85 antes de enviar, para acotar latencia en 4G y costo.

## App: `apps/web`

- `Camera.tsx`: `getUserMedia` con `facingMode: "environment"`, preview en `<video>`, botón grande de captura, indicador de luz insuficiente por luminancia media del frame. La cámara exige contexto seguro: en desarrollo se usa `next dev --experimental-https` o la URL de preview de Vercel.
- Flujo: consentimiento en la primera visita → cámara → captura → spinner con "leyendo la columna" → `ResultCard` o `UncertainCard`.
- `ResultCard`: Libro, Parashá, Aliot, Versículos, Primeras palabras en hebreo grande, chip de confianza, "Columna N de 245, layout estándar" cuando aplica, botón "Escanear de nuevo".
- `UncertainCard`: motivo en lenguaje llano y sugerencia concreta: más luz, más cerca, mostrar el principio de la columna, o elegir entre dos pasajes candidatos.
- `ManualInput.tsx`: campo hebreo para tipear las primeras palabras; llama a `/api/locate`.
- UI oscura, alto contraste, controles de 44 px o más, texto en español rioplatense.
- PWA: `manifest.webmanifest` con íconos y `display: standalone`. Service worker mínimo para el shell, sin cachear resultados.

## Evaluación: `tools/eval`

Sets de imágenes, bajados por `download.ts` a `data/scans/`, fuera de git:

| Set | Fuente | Layout | Uso |
|---|---|---|---|
| shannon | Commons, PDFs 2a/2b, CC BY-SA | 245 estándar | ground truth directo: página N = columna N |
| kokhav | Commons, PDF, CC BY-SA | 226, yemenita | no estándar, alta resolución |
| makhonot | archive.org, PDF, CC0 | 190, Alemania 1920 | sefer viejo restaurado, no estándar |
| bl1462 | archive.org, ZIP, dominio público | siglo XV | desgaste real |

`split.ts` usa `pdftoppm -r 150`, que ya está instalado. Ground truth de kokhav, makhonot y bl1462: se corre el pipeline, se toman sólo los resultados `confident`, se revisan a mano 20 columnas por set, y se guarda `truth/<set>.json`.

`noise.ts` simula OCR sobre ventanas de 6 a 12 líneas del texto real: sustituciones según la matriz de confusión, letras perdidas, palabras partidas o pegadas, líneas faltantes. Permite medir el matcher sin gastar en OCR y trazar la curva exactitud vs. tasa de error.

`run.ts` reporta por set: exactitud top-1 de columna, tasa de abstención, cantidad de `confident` equivocados, latencia p50 y p95, costo por escaneo. Cachea la respuesta del OCR por hash de imagen en `data/ocr-cache/`. Flag `--degrade blur|dark|perspective` aplica degradación sintética a las imágenes antes del OCR.

## Orden de implementación

1. **M1, motor sin UI.** Scaffold del monorepo, `packages/data` con build y tests de integridad (245 columnas, 42 líneas, conteo de palabras estable, aliot cruzadas con hebcal), `packages/core` completo con tests, `noise.ts`. Criterio de salida: al 20 % de error simulado por letra, top-1 ≥ 99 % y cero `confident` equivocados en 2000 ventanas aleatorias.
2. **M2, OCR y eval sobre escaneos.** `ClaudeVisionOcr`, caché, `download.ts`, `split.ts`, `run.ts`. Correr sobre las 245 columnas de shannon y 50 columnas de cada otro set. Criterio de salida: top-1 ≥ 95 % en shannon, cero `confident` equivocados en todos los sets, informe de qué pasa con los sifrei viejos. Ajustar prompt, effort y umbrales acá.
3. **M3, PWA.** Cámara, captura, rutas API, tarjetas de resultado, entrada manual, consentimiento, manifest. Deploy a preview de Vercel. Probar en iPhone Safari y Android Chrome fotografiando una columna de shannon en pantalla y en papel.
4. **M4, protocolo para sefer real.** Checklist de sesión en una kehilá con consentimiento, y un modo de la app que guarda localmente la foto y el resultado sólo cuando la persona lo activa, para etiquetar y sumar al eval.

## Verificación

- `pnpm -r test`: tests de core y de integridad de datos.
- `pnpm --filter data build`: regenera `dist/` y falla si hay discrepancia con hebcal.
- `pnpm --filter eval run -- --set shannon`: imprime la tabla de métricas. Repetir con `--set makhonot --degrade dark`.
- `curl -X POST localhost:3000/api/locate -d '{"text":"ויאמר אלהם יוסף הוא אשר דברתי"}'` devuelve Bereshit, Mikets, columna 50.
- Con `pnpm --filter web dev --experimental-https`, abrir desde el celular en la misma red, escanear una columna de shannon mostrada en un monitor, verificar que el resultado coincide con la página del PDF.
- Revisar en el dashboard de la API que el costo por escaneo queda en el orden de centavos y la latencia bajo 15 s.

## Riesgos y mitigaciones

- Calidad de transcripción del modelo de visión sobre STA"M, sobre todo en pergamino degradado. Es el riesgo central. Se mide en M2 antes de construir UI. Si no alcanza, la interfaz `OcrProvider` permite sumar otro proveedor o, en etapas siguientes, un modelo HTR propio con Kraken.
- El modelo puede "completar" el texto desde su memoria. Por eso la confianza sale del matcher y el prompt prohíbe completar. En M2 se agrega una prueba con imágenes de columnas alteradas para detectar autocompletado.
- Pasajes repetidos. El estado `ambiguous` con dos candidatos y sus palabras distintivas es el comportamiento correcto, no un fallo.
- iOS Safari no permite encender la linterna desde la web. Se indica en pantalla cuando la luminancia es baja. Si se vuelve bloqueante, la misma app se envuelve con Capacitor o Expo más adelante.
- Privacidad y respeto por el objeto. Pantalla de consentimiento clara, sin persistencia de imágenes, sin logs de imagen, downscale antes de enviar.

## Licencias

- tikkun.io: MIT, atribución en `packages/data/NOTICE.md`, commit fijado.
- Sefaria "Tanach with Text Only": dominio público.
- `@hebcal/leyning`: BSD-2, sólo en build. `@hebcal/core`: GPL-2.0, sólo en build, nunca en el bundle.
- Escaneos: CC BY-SA, CC0 y dominio público, sólo para evaluación local, no se distribuyen con la app.
