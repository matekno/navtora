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
        photo: `Un cuadro de una prueba real: ${r.parasha?.es}, columna ${r.column} del formato estándar.`,
        ink: "Arrastrá la línea para comparar la foto con el mapa de tinta.",
        column: "En amarillo, los bordes de la columna. Abajo, la tinta sumada de arriba a abajo: los huecos son los márgenes.",
        lines: "A los costados, en verde, la tinta sumada fila por fila en la primera y la última tira: un pico por renglón. En amarillo, el camino de cada renglón.",
        crops: "La franja que se recorta alrededor de cada renglón.",
        read: "Lo que leyó la red en cada renglón. En naranja, las letras que no pudo leer.",
        match: "Verde: igual que en el sefer. Amarillo: letras que se confunden, o ?. Rojo: distinta. Gris: no se usó.",
      },
    },
    intro: (
      <>
        <p>
          Es Shabat a la mañana. El sefer quedó abierto en Masei, al final de Bamidbar, y hoy hay que leer desde Devarim 1:1. ¿Cuánto hay que enrollar, y para qué lado? Vamos a seguir una foto real, tomada con la app sobre un sefer, desde
          que sale de la cámara hasta que la app dice «2 columnas a la izquierda».
        </p>
        <p>
          Una aclaración antes de empezar: NavTorá no «reconoce» la imagen ni sabe cómo se ve cada columna. Hace algo más simple y más robusto: <strong>lee</strong> la columna, con errores y todo, y después <strong>busca</strong> esas
          palabras entre las 80.316 de la Torá. Todo lo que ves dibujado sobre la foto salió de correr la app sobre ella; no hay nada hecho a mano.
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
              Esta es la foto tal cual llegó: {FIG.width} por {FIG.height} píxeles, un cuadro de una de nuestras grabaciones de prueba. No es una foto de estudio. El pergamino está amarillento y tiene manchas, la columna se ve más angosta
              arriba que abajo porque el teléfono no estaba paralelo al sefer, y los renglones se curvan un poco porque el pergamino no está plano. A los costados se asoman las columnas vecinas.
            </p>
            <p>La foto no sale del teléfono. Todo lo que sigue, hasta tener el texto leído, pasa ahí.</p>
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
              Lo primero es sacarse de encima la luz. El brillo del pergamino cambia despacio a lo largo de la foto (una sombra de un lado, una lámpara del otro, una mancha), mientras que la tinta cambia de golpe, de un píxel al
              siguiente.
            </p>
            <p>
              Para separar una cosa de la otra, la app achica la foto a 160 píxeles de lado. En esa copia chiquita, cada punto toma el valor más claro de sus vecinos: las letras, que son finitas, desaparecen, y queda solo el fondo. Después
              divide la foto por ese fondo. Donde hay pergamino el resultado es blanco; donde hay tinta queda oscuro, esté a la sombra o al sol.
            </p>
            <p>Arrastrá la línea sobre la foto para comparar: las manchas y el amarillo se van, las letras quedan.</p>
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
              En la foto se ven partes de tres columnas, y la que importa es la del medio. Para encontrarla, la app suma la tinta de arriba a abajo para cada posición horizontal. Abajo de la foto ves esa suma: alta donde hay texto, casi cero en los
              márgenes en blanco que separan las columnas.
            </p>
            <p>
              La columna es el tramo con texto que contiene el centro de la foto, entre dos de esos huecos. Antes de sumar, la app prueba inclinar la suma unos grados para cada lado, por si el teléfono estaba torcido, y se queda con el
              ángulo que deja los bordes más nítidos. Además mide los bordes en cinco franjas de altura por separado, así siguen la perspectiva: en esta foto la columna mide {Math.round(top.x1 - top.x0)} píxeles de ancho arriba y{" "}
              {Math.round(bottom.x1 - bottom.x0)} abajo.
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
              En un sefer los renglones se apoyan en el <em>sirtut</em>, las rayas que el sofer marca antes de escribir: son paralelos y están a la misma distancia. La app aprovecha eso.
            </p>
            <p>
              Corta la columna en {FIG.strips.x.length - 1} tiras verticales y, en cada tira, suma la tinta fila por fila. Cada renglón da un pico; a los costados de la foto ves esas sumas para la primera y la última tira. La distancia
              entre picos es el paso de los renglones: en esta foto, {nf.format(FIG.pitch)} píxeles.
            </p>
            <p>
              Si el teléfono está torcido o el pergamino se curva, los picos de una tira no caen a la misma altura que los de la tira de al lado. Comparando tiras vecinas, la app mide cuánto sube o baja cada renglón de una a otra, y con eso
              arma el camino de cada uno. En esta foto encontró {FIG.lines.length} renglones.
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
              Cada renglón se recorta siguiendo su camino, como si se estirara el pergamino con los dedos, y queda en una tira de {FIG.cropHeight} píxeles de alto. Las curvas desaparecen.
            </p>
            <p>
              Hay un detalle: la tira se da vuelta como en un espejo. La red que lee recorre la tira de izquierda a derecha, y el hebreo se escribe de derecha a izquierda; dada vuelta, la primera letra del renglón queda primera y el
              texto sale en orden.
            </p>
            <CropsFigure lang="es" caption="Los primeros seis renglones de la foto, recortados por la app. A la izquierda, tal como los recibe la red; a la derecha, dados vuelta para leerlos nosotros." />
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
              Ahora sí, a leer. Lo hace una red neuronal chica, de 1,8 MB, que corre en el teléfono. Unas capas convolucionales miran la forma de los trazos, y una LSTM, que mira hacia los dos lados del renglón, suma el contexto. La red
              avanza por la tira de a 4 píxeles y en cada paso dice qué letra cree ver, o «nada».
            </p>
            <p>
              Para pasar de pasos a letras se juntan las repeticiones y se borran los «nada»: es lo que se llama decodificación CTC. Si en un tramo la letra más probable no llega al 50 %, en vez de jugársela la app escribe <code>?</code>.
            </p>
            <CtcFigure
              lang="es"
              caption={`El comienzo del renglón ${FIG.ctc.line + 1} de la foto. Abajo de la tira, lo que dijo la red en cada paso; las letras en naranja no llegaron al 50 % y quedaron como ?. Dos pasos seguidos con la misma letra cuentan como una sola.`}
            />
            <p>
              La red no se sabe la Torá de memoria: se entrenó solo con fotos sintéticas, columnas reales escritas con fuentes STA&quot;M y envejecidas por computadora, con manchas, sombras, reflejos y curvas. En un 30 % de esas
              fotos las palabras estaban mezcladas al azar, para que aprendiera a leer lo que ve y no a recitar lo que espera.
            </p>
            <p>
              Por eso se equivoca. Sobre la foto ves lo que leyó en cada renglón, y hay bastante naranja, sobre todo abajo, donde la foto está más borrosa. Está bien: el paso siguiente no necesita una lectura perfecta.
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
              Lo leído tiene errores: <span className="he">יהות</span> en vez de <span className="he">יהוה</span>, <span className="he">ביואב</span> en vez de <span className="he">מואב</span>. Buscar el texto tal cual no serviría.
              Entonces cada palabra leída vota.
            </p>
            <p>
              <span className="he">{ex.word}</span> es la palabra {ex.k + 1} de lo leído, y en la Torá está en la posición {nf.format(ex.position)}. Entonces vota que la foto empieza en la {nf.format(ex.origin)}. Las palabras raras
              pesan más: <span className="he">{ex.word}</span> aparece {ex.count} veces en toda la Torá, y <span className="he">{ex.common}</span>, {nf.format(ex.commonCount)}. Las palabras parecidas también votan, un poco menos. Con{" "}
              {FIG.tokens} palabras votando, los votos se amontonan en un solo lugar.
            </p>
            <VotesFigure lang="es" caption="Los votos de las palabras leídas, repartidos a lo largo de toda la Torá. Casi todo cae en un solo punto, al final de Bamidbar." />
            <p>
              Alrededor de los lugares más votados, la app compara palabra por palabra, como un corrector que compara dos versiones de un texto. La comparación sabe que en letra STA&quot;M es fácil confundir <span className="he">ב</span> con{" "}
              <span className="he">כ</span>, <span className="he">ד</span> con <span className="he">ר</span> o <span className="he">ה</span> con <span className="he">ח</span>, y que <code>?</code> puede ser cualquier letra: esos errores cuestan
              poco.
            </p>
            <AlignmentFigure
              lang="es"
              lines={[2, 3, 4, 5]}
              caption="Cuatro renglones de la foto: arriba lo que leyó la red, abajo lo que dice el sefer. Sobre la foto, los mismos colores en todos los renglones."
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
              Encontrar un lugar no alcanza para dar una respuesta: la app compara el mejor lugar con el segundo. Acá el mejor, {r.parasha?.es} en la columna {r.column}, sacó {nf.format(r.score)} puntos, y el segundo,{" "}
              {nf.format(r.second ?? 0)}. Ganó por lejos, con {r.alignedTokens} palabras alineadas en {r.linesCovered} renglones.
            </p>
            <ScoreFigure lang="es" caption="El puntaje de la alineación del mejor lugar contra el del segundo." />
            <p>
              Cuando los dos primeros se parecen, la app no adivina. Pasa, por ejemplo, en Bamidbar 7, donde la ofrenda de cada uno de los doce nesiim se repite casi igual: la app muestra las opciones y pide otra foto, mejor si se ve el
              principio de la columna. En 2.000 pruebas con hasta la mitad de las letras mal leídas, nunca dio un lugar equivocado con confianza.
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
              Lo que sale de todo esto es una posición en palabras, no una columna, así que sirve para cualquier sefer, tenga el formato que tenga. En los sifrei que siguen el formato estándar de 245 columnas, además se sabe la columna
              exacta: esta es la {r.column}. Devarim 1:1 está en la {FIG.navigation.targetColumn}.
            </p>
            <p>
              Como el texto va de derecha a izquierda, ir hacia Devarim es ir hacia la izquierda: {FIG.navigation.columns} columnas. Si el sefer tiene otro formato, la app estima cuántas faltan con las palabras por columna que midió en la
              foto, y la cuenta mejora con cada foto nueva. Cuando llegás, te dice en qué renglón empieza la lectura.
            </p>
            <MoveFigure lang="es" caption="Las columnas alrededor de la foto, de derecha a izquierda como en el sefer." />
          </div>
        ),
      },
    ],
    outro: (
      <>
        <h2>En resumen</h2>
        <p>
          Una foto, uno o dos segundos en el teléfono, y la respuesta. Al servidor solo va el texto leído; la foto no, salvo que alguien la mande a propósito para ayudar a mejorar la red.
        </p>
        <p>
          Lo que todavía no hace bien: las dos canciones escritas en forma de ladrillos, Shirat HaIam y Haazinu, porque el buscador de renglones no las sigue; y los pasajes repetidos, como el de los nesiim, donde avisa que hay más de
          una opción en lugar de elegir una.
        </p>
        <p>
          El código es abierto y está en <a href={GITHUB}>GitHub</a>. Los resultados de cada prueba están en <a href={`${GITHUB}/blob/main/docs/evaluation.md`}>la evaluación</a>, y el script que generó las figuras de este artículo, en{" "}
          <a href={`${GITHUB}/blob/main/tools/eval/src/blog-figures.ts`}>tools/eval</a>.
        </p>
      </>
    ),
  };
}
