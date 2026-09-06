# kore-kompanion

App para ubicarse en un Sefer Torá desde el celular: apuntás la cámara a la columna abierta y te dice libro, parashá, aliá y versículos. Nunca afirma una posición de la que no está segura.

Etapa 1, en curso: escanear y reconocer. El plan completo está en [docs/plan-etapa-1.md](docs/plan-etapa-1.md).

## Cómo funciona

No se reconoce la imagen, se localiza texto. Un modelo de visión transcribe la columna letra por letra, con ruido, y un matcher propio ubica esa transcripción dentro del texto completo de la Torá con votación diagonal y alineamiento local. La confianza sale del margen entre el mejor candidato y el segundo. Si dos pasajes quedan cerca, por ejemplo las ofrendas repetidas de los nesiim, la app lo dice.

## Estructura

| Paquete | Qué hace |
|---|---|
| `packages/data` | Genera `dist/torah.json`, `dist/layout-245.json` y `dist/parashot.json` a partir de tikkun.io (MIT) y cruza aliot con hebcal. |
| `packages/core` | Motor puro en TypeScript: normalización, índice, distancia con confusiones de STA"M, matcher, resolución y simulador de ruido. |
| `packages/ocr` | Proveedores de OCR: Claude vision, oráculo para pruebas sin clave, caché en disco para eval. |
| `apps/web` | PWA con Next.js: cámara, captura, resultado, entrada manual, consentimiento. |
| `tools/eval` | Descarga de sifrei digitalizados abiertos, corte por columna, barrido con ruido y corrida del pipeline. |

## Puesta en marcha

```bash
pnpm install
pnpm build:data
pnpm test
```

Para la app hace falta una clave de la API de Anthropic. Copiá `apps/web/.env.example` a `apps/web/.env.local` y completá `ANTHROPIC_API_KEY`. Sin clave se puede probar toda la interfaz con el proveedor oráculo, que devuelve el texto real de una columna con ruido simulado:

```bash
OCR_PROVIDER=oracle OCR_ORACLE_COLUMN=50 pnpm --filter @kore/web dev:http
```

La cámara sólo funciona en contexto seguro. Para probar desde el teléfono en la misma red usá `pnpm dev`, que levanta Next con HTTPS local, o una URL de preview de Vercel.

## Evaluación

```bash
pnpm --filter @kore/eval noise -- --windows 2000 --cer 0.1,0.2,0.3,0.4   # matcher solo, ruido simulado
pnpm --filter @kore/eval download -- all                                  # baja los escaneos a tools/eval/data/scans
pnpm --filter @kore/eval split -- all                                     # una imagen por columna, lado mayor 1800 px
pnpm --filter @kore/eval pipeline -- --set shannon --provider oracle           # cañería completa sin gastar en OCR
pnpm --filter @kore/eval pipeline -- --set shannon --provider claude --limit 20  # OCR real, cacheado por hash de imagen
```

Los escaneos y la caché de OCR viven en `tools/eval/data/`, fuera del repo. Las fuentes y licencias quedan en `tools/eval/data/scans/SOURCES.md` y en `packages/data/NOTICE.md`.

## Resultado del barrido con ruido

Matcher solo, 2000 ventanas aleatorias de 6 a 10 líneas, layout estándar:

| error por letra | top-1 | afirma bien | afirma mal | se abstiene |
|---|---|---|---|---|
| 10 % | 99,9 % | 97,5 % | 0 | 2,5 % |
| 20 % | 99,9 % | 98,3 % | 0 | 1,7 % |
| 30 % | 99,9 % | 97,8 % | 0 | 2,2 % |
| 40 % | 99,8 % | 97,9 % | 0 | 2,2 % |
| 50 % | 99,6 % | 93,0 % | 0 | 6,9 % |

## Resultado del OCR real

Sefer de Shannon, columnas fotografiadas a 1800 px de lado mayor, todas ubicadas con confianza y ninguna equivocada:

| configuración | columnas | latencia media | tokens salida | error por letra |
|---|---|---|---|---|
| Opus 5, columna completa, esfuerzo medium | 19 | 52 s | 3500 | 0,19 % |
| Opus 5, 14 líneas, esfuerzo medium | 5 | 24 s | 1100 | |
| Opus 5, 14 líneas, esfuerzo low | 5 | 15 s | 450 | 0,38 % |
| Sonnet 5, 14 líneas, esfuerzo low | 5 | 12 s | 420 | 0,60 % |

Con la configuración por defecto, Opus 5, esfuerzo low y 14 líneas, un escaneo cuesta unos 3 centavos de dólar. Sonnet 5 baja a poco más de 1 centavo con precisión similar en sifrei limpios; se elige con `OCR_MODEL`.

Sifrei con layout no estándar o en mal estado, sin verdad manual: se verifica que la posición predicha avance de una columna a la siguiente, y que en ninguna columna con texto el sistema afirme algo incoherente con sus vecinas.

| sefer | columnas | con confianza | se abstuvo | incoherencias |
|---|---|---|---|---|
| Makhon Ot, Alemania 1920, 190 columnas de ~50 líneas | 8 | 8 | 0 | 0 |
| Kokhav, moderno, convenciones yemenitas, 226 columnas | 8 | 8 | 0 | 0 |
| British Library Or. 1462, siglo XV, hojas enteras con 5 a 7 columnas | 8 | 6 | 2, sin texto legible | 0 |
| British Library Or. 1462, columnas recortadas de esas hojas | 20 | 17 | 3, recortes sin texto | 0 |

En el sefer del siglo XV las columnas repetidas entre hojas consecutivas, por el solapamiento de las fotos, cayeron en la misma posición con 1 y 9 palabras de diferencia.

Prueba de autocompletado: en una columna sintética con seis palabras reemplazadas por otras palabras reales, el modelo transcribió las seis tal como estaban impresas y ninguna volvió al texto bíblico original. Cuando la imagen recortaba el principio de las líneas, transcribió sólo lo visible. La transcripción se comporta como lectura, no como recitado.

## Privacidad

La foto se envía al servidor y al servicio de lectura sólo cuando la persona aprieta Leer. No se guarda ninguna imagen en ningún lado. El servidor registra únicamente tiempos, tokens y estado del resultado.
