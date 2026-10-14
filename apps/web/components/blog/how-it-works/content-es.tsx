import { FIG } from "@/lib/blog/how-it-works";
import { FAMILY_NAMES, TRAIN } from "@/lib/blog/training";
import { AlignmentFigure, CropsFigure, CtcFigure, MoveFigure, ScoreFigure, VotesFigure } from "./Figures";
import type { PostContent } from "./HowItWorks";
import { CLAUDE_CALL } from "./snippets";
import { FontsFigure, LabeledCropsFigure, SynthGalleryFigure, SynthStagesFigure } from "./Training";

const GITHUB = "https://github.com/matekno/navtora";
const nf = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 });
const r = FIG.result;
const top = FIG.edges[0]!;
const bottom = FIG.edges[FIG.edges.length - 1]!;
const ex = FIG.voteExample;

export function contentEs(): PostContent {
  return {
    labels: {
      photo: "Foto",
      ink: "Tinta",
      compare: "Comparar la foto con el mapa de tinta",
      captions: {
        photo: `Un cuadro de una prueba real, en ${r.parasha?.es}, columna ${r.column} del formato estándar.`,
        ink: "Arrastrá la línea para comparar la foto con el mapa de tinta.",
        column: "En amarillo, los bordes de la columna. Abajo, la tinta sumada de arriba a abajo, con los márgenes como huecos.",
        lines: "A los costados, en verde, la tinta sumada fila por fila en la primera y la última tira (un pico por renglón). En amarillo, el camino de cada renglón.",
        crops: "La franja que se recorta alrededor de cada renglón.",
        read: "Lo que leyó la red en cada renglón. En naranja, las letras que no pudo leer.",
        match: "Cada palabra leída, pintada donde la leyó la red. Verde: igual que en el sefer. Amarillo: letras que se confunden, o con ?. Rojo: distinta. Gris: sobra. Punteado: quedó afuera de la comparación.",
      },
    },
    intro: (
      <>
        <p>
          Es viernes y hay que dejar el sefer listo para Shabat. Quedó abierto en Masei, al final de Bamidbar, y mañana se lee desde Devarim 1:1. NavTorá resuelve justamente eso. Con una foto de la columna abierta, te dice dónde
          está el sefer, cuántas columnas hay que enrollar y para qué lado.
        </p>
        <p>
          Para ubicarse, la app <strong>lee</strong> la columna (con errores y todo) y <strong>busca</strong> esas palabras entre las 80.316 de la Torá. No necesita tener guardado cómo se ve cada columna, así que sirve para
          cualquier sefer. La foto de este artículo es un cuadro real de una de las pruebas que grabamos, y lo que está dibujado encima sale de correr el código de la app sobre ella.
        </p>
      </>
    ),
    steps: [
      {
        stage: "photo",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 1</span>La foto
            </h2>
            <p>
              La foto es un cuadro de la grabación de pantalla de una de nuestras pruebas, recortado a lo que mostraba la cámara (le borramos la guía amarilla de la app). Tiene {FIG.width} por {FIG.height} píxeles, más o menos la
              cuarta parte de la resolución con la que la app saca las fotos. El pergamino está amarillento y tiene manchas, la columna se ve más angosta arriba que abajo porque el teléfono no estaba paralelo al sefer, y los renglones
              se curvan un poco porque el pergamino no está plano. A los costados, además, se ven partes de las columnas vecinas.
            </p>
            <p>En la app, todo lo que sigue hasta tener el texto leído pasa en el teléfono, y la foto no se manda a ningún lado.</p>
          </div>
        ),
      },
      {
        stage: "ink",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 2</span>Separar la tinta del pergamino
            </h2>
            <p>
              Lo primero que hace la app es sacarle a la foto el efecto de la luz. El brillo del pergamino cambia despacio a lo largo de la foto (una sombra de un lado, una lámpara del otro, una mancha), mientras que la tinta cambia de
              golpe, de un píxel al siguiente.
            </p>
            <p>
              Para separarlas, la app hace una copia chiquita de la foto, de 160 píxeles de lado. En esa copia, cada punto toma el valor más claro de sus vecinos. Como las letras son finitas, desaparecen, y queda solo el fondo. Después, la app
              divide la foto por ese fondo. Es decir, donde hay pergamino el resultado queda blanco y donde hay tinta queda oscuro, esté a la sombra o al sol.
            </p>
            <p>Si arrastrás la línea sobre la foto, vas a ver que las manchas y el amarillo desaparecen y las letras quedan.</p>
          </div>
        ),
      },
      {
        stage: "column",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 3</span>Encontrar la columna
            </h2>
            <p>
              En la foto se ven partes de tres columnas, y la que nos interesa es la del medio. Para encontrarla, la app suma la tinta de arriba a abajo en cada posición horizontal. Esa suma está dibujada abajo de la foto. Donde hay
              texto es alta, y en los márgenes en blanco que separan las columnas es casi cero.
            </p>
            <p>
              La columna es el tramo con texto que contiene el centro de la foto, entre dos de esos huecos. Como el teléfono puede estar torcido, antes de sumar la app prueba inclinar la suma unos grados para cada lado y se queda con el
              ángulo que deja los bordes más nítidos. Además, mide los bordes en varias franjas de altura por separado (en esta foto, {FIG.edges.length}), para que sigan la perspectiva. La columna mide {Math.round(top.x1 - top.x0)} píxeles de ancho
              arriba y {Math.round(bottom.x1 - bottom.x0)} abajo.
            </p>
          </div>
        ),
      },
      {
        stage: "lines",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 4</span>Seguir cada renglón
            </h2>
            <p>
              En un sefer, los renglones se apoyan en el <em>sirtut</em>, las rayas que el sofer marca antes de escribir. Por eso son paralelos y están a la misma distancia, y la app aprovecha eso.
            </p>
            <p>
              Primero mide esa distancia. Corta la columna en seis tiras angostas, suma la tinta fila por fila en cada una y busca cada cuántos píxeles se repite el patrón. En esta foto, los renglones están cada{" "}
              {nf.format(FIG.pitch)} píxeles.
            </p>
            <p>
              Después corta la columna en tiras más anchas (en esta foto, {FIG.strips.x.length - 1}). En cada una, la suma fila por fila da un pico por renglón (a los costados de la foto están esas sumas para la primera y la última
              tira). Si el teléfono está torcido o el pergamino se curva, los picos de una tira no caen a la misma altura que los de la tira de al lado. Comparando tiras vecinas, la app mide cuánto sube o baja cada renglón de una a otra
              y con eso arma el camino de cada uno. En esta foto encontró {FIG.lines.length} renglones.
            </p>
          </div>
        ),
      },
      {
        stage: "crops",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 5</span>Recortar y enderezar
            </h2>
            <p>
              Cada renglón se recorta siguiendo su camino, como si se estirara el pergamino con los dedos, y queda en una tira de {FIG.cropHeight} píxeles de alto. Así, las curvas desaparecen.
            </p>
            <p>
              Además, la tira se da vuelta como en un espejo. ¿Por qué? Porque la red que lee recorre la tira de izquierda a derecha, y el hebreo se escribe de derecha a izquierda. Dada vuelta, la primera letra del renglón queda primera
              y el texto sale en orden.
            </p>
            <CropsFigure lang="es" caption="Los primeros seis renglones de la foto, recortados por la app. A la izquierda están tal como los recibe la red, y a la derecha, dados vuelta para leerlos nosotros." />
          </div>
        ),
      },
      {
        stage: "read",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 6</span>Leer letra por letra
            </h2>
            <p>
              Para leer, la app usa una red neuronal chica, de 1,8 MB, que corre en el teléfono (la primera versión leía con Claude, y lo cuento en el <a href="#anexo-mvp">segundo anexo</a>). Unas capas convolucionales miran la
              forma de los trazos, y una LSTM, que mira hacia los dos lados del renglón, suma el contexto. La red avanza por la tira de a 4 píxeles y en cada paso dice qué letra cree ver, o «nada».
            </p>
            <p>
              Para pasar de pasos a letras, se juntan las repeticiones y se borran los «nada» (esto se llama decodificación CTC). Si en un tramo la letra más probable no llega al 50 %, la app no se la juega y escribe <code>?</code>.
            </p>
            <CtcFigure
              lang="es"
              caption={`Las dos primeras palabras del renglón ${FIG.ctc.line + 1} de la foto. Abajo de cada recorte está lo que dijo la red en cada paso, con su probabilidad. Después vienen las letras que quedan y, abajo de todo, las del sefer.`}
            />
            <p>
              En la primera palabra, la red leyó <span className="he">ב</span> donde dice <span className="he">מ</span>, y <span className="he">ה</span> donde dice <span className="he">ת</span> (dos letras que en STA&quot;M se
              parecen). Además, dudó en dos letras, que quedaron como <code>?</code>. En la segunda palabra, la <span className="he">א</span> aparece en dos pasos seguidos y cuenta como una sola, y la palabra sale perfecta.
            </p>
            <p>
              La red no se sabe la Torá de memoria. <a href="#anexo-entrenamiento">Se entrenó solo con fotos sintéticas</a>, armadas con columnas reales escritas con fuentes STA&quot;M y envejecidas por computadora, con manchas,
              sombras, reflejos y curvas. En un 30 % de esas fotos las palabras estaban mezcladas al azar. De esa forma, la red no puede adivinar la palabra siguiente por el contexto y tiene que leer cada letra. Cómo se arman esas
              fotos, con ejemplos, está en el <a href="#anexo-entrenamiento">primer anexo</a>, al final del artículo.
            </p>
            <p>
              Por eso se equivoca bastante. Sobre la foto está lo que leyó en cada renglón, y hay mucho naranja, sobre todo abajo, donde la foto está más borrosa. Sin embargo, para el paso siguiente no hace falta una lectura perfecta.
            </p>
          </div>
        ),
      },
      {
        stage: "match",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 7</span>Buscar entre 80.316 palabras
            </h2>
            <p>
              Lo leído tiene errores, como <span className="he">יהות</span> en vez de <span className="he">יהוה</span> o <span className="he">ביואב</span> en vez de <span className="he">מואב</span>. Por eso, buscar el texto tal cual
              no serviría. En cambio, cada palabra leída vota dónde empieza la foto. Esta parte ya pasa en el servidor, que recibe el texto y no la foto.
            </p>
            <p>
              Por ejemplo, <span className="he">{ex.word}</span> es la palabra {ex.k + 1} de lo leído, y en la Torá está en la posición {nf.format(ex.position)}. Entonces vota que la foto empieza en la posición{" "}
              {nf.format(ex.origin)}. Las palabras raras pesan más que las comunes (<span className="he">{ex.word}</span> aparece {ex.count} veces en toda la Torá, y <span className="he">{ex.common}</span>,{" "}
              {nf.format(ex.commonCount)} veces), y las palabras parecidas también votan, un poco menos. Con {FIG.tokens} palabras votando, los votos se amontonan en un solo lugar.
            </p>
            <VotesFigure lang="es" caption="Los votos de las palabras leídas, a lo largo de toda la Torá. Casi todos caen en un solo punto, al final de Bamidbar." />
            <p>
              Alrededor de los lugares más votados, la app compara palabra por palabra, como cuando se comparan dos versiones de un mismo texto. Esa comparación tiene en cuenta que en letra STA&quot;M es fácil confundir{" "}
              <span className="he">ב</span> con <span className="he">כ</span>, <span className="he">ד</span> con <span className="he">ר</span> o <span className="he">ה</span> con <span className="he">ח</span>, y que <code>?</code>{" "}
              puede ser cualquier letra, así que esos errores cuestan poco.
            </p>
            <AlignmentFigure
              lang="es"
              lines={[2, 3, 4, 5]}
              caption="Cuatro renglones de la foto. Arriba está lo que leyó la red y abajo, lo que dice el sefer. Sobre la foto se usan los mismos colores para todos los renglones."
            />
          </div>
        ),
      },
      {
        stage: "match",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 8</span>¿Está segura?
            </h2>
            <p>
              Encontrar un lugar no alcanza para dar una respuesta. La app pide un mínimo de palabras alineadas en más de un renglón y compara el mejor lugar con el segundo. Acá el mejor ({r.parasha?.es}, columna {r.column}) sacó {nf.format(r.score)} puntos contra{" "}
              {nf.format(r.second ?? 0)} del segundo, con {r.alignedTokens} palabras alineadas en {r.linesCovered} renglones.
            </p>
            <ScoreFigure lang="es" caption="El puntaje de la alineación del mejor lugar contra el del segundo." />
            <p>
              Cuando los dos primeros se parecen, la app no adivina. Esto pasa, por ejemplo, en Bamidbar 7, donde la ofrenda de cada uno de los doce nesiim se repite casi igual. En ese caso, la app muestra las opciones y pide otra
              foto, mejor si se ve el principio de la columna. En 2.000 pruebas simuladas con hasta la mitad de las letras mal leídas, nunca dio un lugar equivocado con confianza.
            </p>
          </div>
        ),
      },
      {
        stage: "none",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 9</span>Para qué lado mover el sefer
            </h2>
            <p>
              El resultado de todo esto es una posición en palabras, que sirve para cualquier sefer. Para contar columnas, la app usa el formato estándar de 245 columnas. Esta foto es de la columna {r.column}, y Devarim 1:1 está en la{" "}
              {FIG.navigation.targetColumn}.
            </p>
            <p>
              Como el texto va de derecha a izquierda, ir hacia Devarim es ir hacia la izquierda, en este caso {FIG.navigation.columns} columnas. Si el sefer sigue el formato estándar, la cuenta es exacta. Si no, es una aproximación,
              y conviene escanear de nuevo cuando llegás. Al llegar, la app te dice en qué renglón empieza la lectura.
            </p>
            <MoveFigure lang="es" caption="Las columnas alrededor de la foto, de derecha a izquierda como en el sefer." />
          </div>
        ),
      },
    ],
    outro: (
      <>
        <h2>¿Qué se manda al servidor?</h2>
        <p>
          El texto leído y algunos datos del escaneo (cuánto tardó, qué lectura buscabas y un número al azar que identifica al teléfono). La foto se queda en el teléfono, salvo que alguien la mande a propósito para ayudar a
          mejorar la red.
        </p>
        <h2>Lo que todavía no hace bien</h2>
        <ul>
          <li>Las dos canciones escritas en forma de ladrillos, Shirat HaIam y Haazinu, porque el buscador de renglones no las sigue.</li>
          <li>Los pasajes que se repiten, como el de los nesiim. Ahí la app avisa que hay más de una opción en lugar de elegir una.</li>
          <li>
            Los sifrei que no siguen el formato estándar. La app cuenta las columnas siempre con el formato estándar de 245 columnas, y todavía no detecta cuando un sefer tiene otro. En esos sifrei la cuenta puede no
            coincidir, así que conviene escanear de nuevo cuando llegás.
          </li>
        </ul>
        <h2>El código</h2>
        <p>
          El código es abierto y está en <a href={GITHUB}>GitHub</a>. Los resultados de cada prueba están en <a href={`${GITHUB}/blob/main/docs/evaluation.md`}>la evaluación</a>, y el script que generó las figuras de este
          artículo está en <a href={`${GITHUB}/blob/main/tools/eval/src/blog-figures.ts`}>tools/eval</a>. Ese script corre en una computadora el mismo código que la app corre en el teléfono. Las sumas de tinta de los
          pasos 3 y 4, los votos y la comparación palabra por palabra están recalculados con el mismo método para poder dibujarlos. Las fotos del primer anexo salen del <a href={`${GITHUB}/blob/main/tools/train/blog_figures.py`}>mismo
          código</a> que armó las fotos de entrenamiento.
        </p>
      </>
    ),
    appendices: [
      {
        id: "anexo-entrenamiento",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Anexo 1</span>Cómo entrenamos la red
            </h2>
            <p>
              Para que una red aprenda a leer, hacen falta muchos renglones junto con el texto que dicen. No existe un conjunto así de fotos de sifrei, así que lo armamos por computadora. Un script, <code>synth.py</code>, toma un
              pedazo de una columna real del formato estándar, lo escribe con una fuente hebrea y después lo envejece hasta que parece una foto sacada con el teléfono.
            </p>
            <h3>Una foto, paso a paso</h3>
            <p>
              Esta es una de las primeras fotos del set de entrenamiento. Es un pedazo de la columna {TRAIN.stage.column}, en Vaiakhel, escrito con la fuente {FAMILY_NAMES[TRAIN.stage.family]}. Cada paso le suma algo que pasa en una
              foto real.
            </p>
            <SynthStagesFigure lang="es" caption="Cómo se arma una foto sintética, desde el texto limpio hasta la foto que se usó para entrenar." />
            <ol>
              <li>
                <strong>El texto:</strong> los renglones de la columna, justificados como en un sefer, con partes de las columnas vecinas a los costados.
              </li>
              <li>
                <strong>La tinta:</strong> trazos más gruesos o más finos, partes desteñidas y pequeñas grietas en las letras.
              </li>
              <li>
                <strong>El pergamino:</strong> uno de siete colores de fondo, con textura y manchas, y uno de cinco colores de tinta. A veces se suma una franja oscura arriba o abajo, como el borde del rollo o la mesa.
              </li>
              <li>
                <strong>La cámara:</strong> perspectiva, un giro chico y la curva del pergamino. También se achica la foto, para que los renglones queden a entre 14 y 48 píxeles de distancia.
              </li>
              <li>
                <strong>La luz:</strong> un lado más oscuro que el otro, a veces la sombra de una mano o del teléfono y a veces un reflejo.
              </li>
              <li>
                <strong>La foto final:</strong> desenfoque, a veces movimiento, ruido y compresión JPEG.
              </li>
            </ol>
            <p>Cada paso elige sus valores al azar, así que no hay dos fotos iguales. En un 30 % de ellas, además, las palabras de cada renglón se cambian por palabras de la Torá elegidas al azar, como conté en el paso 6.</p>
            <SynthGalleryFigure lang="es" caption="Seis fotos más del set de entrenamiento. Las que dicen «palabras mezcladas» tienen palabras de la Torá elegidas al azar." />
            <h3>Las fuentes</h3>
            <p>
              Las fuentes son de Culmus, un proyecto de fuentes hebreas libres. Las dos de STA&quot;M, Stam Ashkenaz y Stam Sefarad, aparecen en casi dos de cada tres fotos. El resto son fuentes de libros, para que la red vea otras
              formas de las mismas letras.
            </p>
            <FontsFigure lang="es" caption="Las doce familias de fuentes, con la proporción de fotos que se escribe con cada una." />
            <h3>De la foto al renglón</h3>
            <p>
              La red lee de a un renglón. Para cortar los renglones de cada foto usamos el mismo código que corre en la app, el de los pasos 2 a 5. Como el script sabe qué texto escribió en cada renglón y dónde quedó ese renglón
              después de deformar la foto, a cada recorte le pone su texto. Si un recorte no coincide bien con un renglón, se descarta, para que la red no aprenda de una etiqueta equivocada.
            </p>
            <LabeledCropsFigure
              lang="es"
              caption="Cuatro renglones recortados, dados vuelta para leerlos, con el texto que se usó para entrenar. Los tres primeros son de la foto de arriba, y el último, de una foto con las palabras mezcladas."
            />
            <h3>El entrenamiento</h3>
            <p>
              Armamos 4.000 fotos para entrenar y 300 para ir midiendo cómo aprendía. Otras 200, todas con texto real, quedaron aparte para la prueba final. La red es chica (unos 450.000 parámetros) y se entrenó en el procesador de
              una computadora, sin placa de video. La versión que usa la app recorrió 5 veces todos los renglones de entrenamiento.
            </p>
            <p>
              Para entrenar se usa la pérdida CTC, que va de la mano con la decodificación del paso 6. Es decir, a la red solo le hace falta el texto de cada renglón, sin saber en qué lugar de la tira está cada letra.
            </p>
            <h3>Cómo le fue</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Prueba</th>
                    <th className="num">Ubicadas con confianza</th>
                    <th className="num">Equivocadas</th>
                    <th className="num">Error por letra</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>200 fotos sintéticas que no se usaron para entrenar</td>
                    <td className="num">95,5 %</td>
                    <td className="num">0</td>
                    <td className="num">14,9 %</td>
                  </tr>
                  <tr>
                    <td>10 cuadros de dos pruebas grabadas, en un sefer gastado y en un tikún impreso</td>
                    <td className="num">10 de 10</td>
                    <td className="num">0</td>
                    <td className="num">30,6 %</td>
                  </tr>
                  <tr>
                    <td>246 columnas escaneadas del sefer de Elihu Shannon</td>
                    <td className="num">241</td>
                    <td className="num">0</td>
                    <td className="num"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              La red se equivoca en muchas letras, cerca de un 30 % en los cuadros de las pruebas si se cuenta cada <code>?</code> como error. Sin embargo, como se ve en los pasos 7 y 8, para ubicar la columna alcanza, y en ninguna de
              estas pruebas dio un lugar equivocado con confianza.
            </p>
            <p>
              Lo que más la puede mejorar son fotos reales. Por eso, cuando un escaneo no sale bien, la app ofrece mandar la foto para sumarla al entrenamiento. Solo se manda si la persona lo marca.
            </p>
          </div>
        ),
      },
      {
        id: "anexo-mvp",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Anexo 2</span>El MVP, con la API de Anthropic
            </h2>
            <p>
              La primera versión de NavTorá, en septiembre de 2026, no tenía una red propia. La app sacaba la foto, la achicaba a 1.800 píxeles en el lado más largo y la mandaba al servidor, que se la pasaba a Claude Opus 5 por la API
              de Anthropic. Claude transcribía los renglones, y desde ahí todo seguía como ahora, con la misma búsqueda de los pasos 7 y 8.
            </p>
            <p>
              Desde el principio, la idea fue que el modelo solo lea. La posición y la confianza las decide la búsqueda, que se puede probar y medir sin gastar nada. Por eso, lo que le pedíamos a Claude era bastante acotado:
            </p>
            <ul>
              <li>Transcribir los primeros 14 renglones, solo con letras, sin nikud, teamim ni puntuación.</li>
              <li>Respetar las letras finales y los espacios entre palabras.</li>
              <li>
                Escribir <code>?</code> en cada letra que no se puede leer.
              </li>
              <li>Contar todos los renglones que se ven, aunque no los transcriba.</li>
              <li>Leer la tinta y no completar de memoria. Si el pergamino dice algo distinto de lo esperado, escribir lo que dice el pergamino.</li>
            </ul>
            <p>
              La respuesta venía con un formato fijo (salida estructurada, con un esquema JSON). Traía los renglones, cuáles eran dudosos, dónde había espacios en blanco y cuántos renglones se veían. Esta es la llamada, simplificada.
            </p>
            <pre>
              <code>{CLAUDE_CALL}</code>
            </pre>
            <p>
              El código completo sigue en <a href={`${GITHUB}/blob/main/tools/eval/src/claude-ocr.ts`}>tools/eval</a>, donde lo usamos para comparar las dos formas de leer sobre las mismas fotos.
            </p>
            <h3>¿Lee o recita?</h3>
            <p>
              Claude conoce la Torá, así que había que chequear que leyera lo escrito y no lo que recuerda. Para probarlo, armamos una columna con seis palabras cambiadas por otras palabras hebreas reales. Claude transcribió las seis
              tal como estaban escritas, y ninguna volvió al texto original. Cuando la imagen cortaba el principio de los renglones, transcribió solo lo que se veía.
            </p>
            <h3>Cómo le fue</h3>
            <p>
              Leía muy bien. Probamos cuánto podía pensar el modelo (el parámetro <code>effort</code>) y cuántos renglones transcribía, sobre columnas escaneadas del sefer de Shannon. Todas quedaron bien ubicadas.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Configuración</th>
                    <th className="num">Tiempo por foto</th>
                    <th className="num">Error por letra</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Opus 5, columna completa, esfuerzo medio</td>
                    <td className="num">52 s</td>
                    <td className="num">0,19 %</td>
                  </tr>
                  <tr>
                    <td>Opus 5, 14 renglones, esfuerzo bajo</td>
                    <td className="num">15 s</td>
                    <td className="num">0,38 %</td>
                  </tr>
                  <tr>
                    <td>Sonnet 5, 14 renglones, esfuerzo bajo</td>
                    <td className="num">12 s</td>
                    <td className="num">0,60 %</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              Con 14 renglones alcanzaba para ubicar la columna, y transcribir menos bajaba mucho el tiempo y el costo. Con Opus 5, esfuerzo bajo y 14 renglones, cada foto costaba unos 3 centavos de dólar. En 78 imágenes escaneadas de
              4 sifrei nunca dio una posición equivocada, y en las pruebas con sifrei de verdad cada escaneo tardó 16 o 17 segundos.
            </p>
            <h3>¿Por qué lo cambiamos?</h3>
            <p>El MVP funcionaba, pero tenía tres problemas para usarlo en una kehilá:</p>
            <ul>
              <li>
                <strong>El tiempo:</strong> 16 segundos con el teléfono apuntando al sefer es mucho, sobre todo si hay que escanear más de una vez.
              </li>
              <li>
                <strong>El costo:</strong> cada foto costaba plata, así que no se podía abrir la app a cualquiera.
              </li>
              <li>
                <strong>La foto:</strong> tenía que salir del teléfono y pasar por un servidor.
              </li>
            </ul>
            <p>
              Con la red propia, en las pruebas con un sefer cada escaneo tardó 1 o 2 segundos. No cuesta nada por escaneo y la foto no sale del teléfono. A cambio, lee bastante peor, con muchas más letras equivocadas o con{" "}
              <code>?</code>. Como la búsqueda está pensada para lecturas con errores, igual llega a la columna correcta.
            </p>
          </div>
        ),
      },
    ],
  };
}
