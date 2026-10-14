import { FIG } from "@/lib/blog/how-it-works";
import { AlignmentFigure, CropsFigure, CtcFigure, MoveFigure, ScoreFigure, VotesFigure } from "./Figures";
import type { PostContent } from "./HowItWorks";

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
        match: "Verde: igual que en el sefer. Amarillo: letras que se confunden, o ?. Rojo: distinta. Gris: no se usó.",
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
          cualquier sefer. La foto de este artículo es un cuadro real de una de las pruebas que grabamos, y todo lo que está dibujado encima salió de correr la app sobre ella.
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
              Esta es la foto tal cual la sacó la cámara, de {FIG.width} por {FIG.height} píxeles. El pergamino está amarillento y tiene manchas, la columna se ve más angosta arriba que abajo porque el teléfono no estaba paralelo al
              sefer, y los renglones se curvan un poco porque el pergamino no está plano. A los costados, además, se ven partes de las columnas vecinas.
            </p>
            <p>Todo lo que sigue, hasta tener el texto leído, pasa en el teléfono. La foto no se manda a ningún lado.</p>
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
              Para separarlas, la app achica la foto a 160 píxeles de lado. En esa copia chiquita, cada punto toma el valor más claro de sus vecinos. Como las letras son finitas, desaparecen, y queda solo el fondo. Después, la app
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
              ángulo que deja los bordes más nítidos. Además, mide los bordes en cinco franjas de altura por separado, para que sigan la perspectiva. En esta foto, la columna mide {Math.round(top.x1 - top.x0)} píxeles de ancho
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
              Primero corta la columna en {FIG.strips.x.length - 1} tiras verticales y, en cada tira, suma la tinta fila por fila. Cada renglón da un pico (a los costados de la foto están esas sumas para la primera y la última tira).
              La distancia entre un pico y el siguiente es el paso de los renglones, que en esta foto es de {nf.format(FIG.pitch)} píxeles.
            </p>
            <p>
              Si el teléfono está torcido o el pergamino se curva, los picos de una tira no caen a la misma altura que los de la tira de al lado. Comparando tiras vecinas, la app mide cuánto sube o baja cada renglón de una a otra y con
              eso arma el camino de cada uno. En esta foto encontró {FIG.lines.length} renglones.
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
              Para leer, la app usa una red neuronal chica, de 1,8 MB, que corre en el teléfono. Unas capas convolucionales miran la forma de los trazos, y una LSTM, que mira hacia los dos lados del renglón, suma el contexto. La red
              avanza por la tira de a 4 píxeles y en cada paso dice qué letra cree ver, o «nada».
            </p>
            <p>
              Para pasar de pasos a letras, se juntan las repeticiones y se borran los «nada» (esto se llama decodificación CTC). Si en un tramo la letra más probable no llega al 50 %, la app no se la juega y escribe <code>?</code>.
            </p>
            <CtcFigure
              lang="es"
              caption={`El comienzo del renglón ${FIG.ctc.line + 1} de la foto. Abajo de la tira está lo que dijo la red en cada paso. Las letras en naranja no llegaron al 50 % y quedaron como ?, y dos pasos seguidos con la misma letra cuentan como una sola.`}
            />
            <p>
              La red no se sabe la Torá de memoria. Se entrenó solo con fotos sintéticas, armadas con columnas reales escritas con fuentes STA&quot;M y envejecidas por computadora, con manchas, sombras, reflejos y curvas. En un 30 % de
              esas fotos las palabras estaban mezcladas al azar. De esa forma, la red no puede adivinar la palabra siguiente por el contexto y tiene que leer cada letra.
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
              no serviría. En cambio, cada palabra leída vota dónde empieza la foto.
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
              Encontrar un lugar no alcanza para dar una respuesta. La app compara el mejor lugar con el segundo, y acá el mejor ({r.parasha?.es}, columna {r.column}) sacó {nf.format(r.score)} puntos contra{" "}
              {nf.format(r.second ?? 0)} del segundo, con {r.alignedTokens} palabras alineadas en {r.linesCovered} renglones.
            </p>
            <ScoreFigure lang="es" caption="El puntaje de la alineación del mejor lugar contra el del segundo." />
            <p>
              Cuando los dos primeros se parecen, la app no adivina. Esto pasa, por ejemplo, en Bamidbar 7, donde la ofrenda de cada uno de los doce nesiim se repite casi igual. En ese caso, la app muestra las opciones y pide otra
              foto, mejor si se ve el principio de la columna. En 2.000 pruebas con hasta la mitad de las letras mal leídas, nunca dio un lugar equivocado con confianza.
            </p>
          </div>
        ),
      },
      {
        stage: "photo",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Paso 9</span>Para qué lado mover el sefer
            </h2>
            <p>
              El resultado de todo esto es una posición en palabras. Como no depende de cómo está armado el sefer, sirve para cualquiera. En los sifrei que siguen el formato estándar de 245 columnas, además, se sabe la columna exacta.
              Esta foto es de la columna {r.column}, y Devarim 1:1 está en la {FIG.navigation.targetColumn}.
            </p>
            <p>
              Como el texto va de derecha a izquierda, ir hacia Devarim es ir hacia la izquierda, en este caso {FIG.navigation.columns} columnas. Si el sefer tiene otro formato, la app estima cuántas columnas faltan con las palabras
              por columna que midió en la foto, y la cuenta mejora con cada foto nueva. Cuando llegás, te dice en qué renglón empieza la lectura.
            </p>
            <MoveFigure lang="es" caption="Las columnas alrededor de la foto, de derecha a izquierda como en el sefer." />
          </div>
        ),
      },
    ],
    outro: (
      <>
        <h2>¿Qué se manda al servidor?</h2>
        <p>Solo el texto leído. La foto se queda en el teléfono, salvo que alguien la mande a propósito para ayudar a mejorar la red.</p>
        <h2>Lo que todavía no hace bien</h2>
        <ul>
          <li>Las dos canciones escritas en forma de ladrillos, Shirat HaIam y Haazinu, porque el buscador de renglones no las sigue.</li>
          <li>Los pasajes que se repiten, como el de los nesiim. Ahí la app avisa que hay más de una opción en lugar de elegir una.</li>
        </ul>
        <h2>El código</h2>
        <p>
          El código es abierto y está en <a href={GITHUB}>GitHub</a>. Los resultados de cada prueba están en <a href={`${GITHUB}/blob/main/docs/evaluation.md`}>la evaluación</a>, y el script que generó las figuras de este
          artículo está en <a href={`${GITHUB}/blob/main/tools/eval/src/blog-figures.ts`}>tools/eval</a>.
        </p>
      </>
    ),
  };
}
