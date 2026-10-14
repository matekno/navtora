import Link from "next/link";
import { FAMILY_NAMES, TRAIN } from "@/lib/blog/training";
import { FontsFigure, LabeledCropsFigure, RealSifreiFigure, ScrollSheetFigure, SynthGalleryFigure, SynthStagesFigure, type RealSefer } from "./Figures";

const GITHUB = "https://github.com/matekno/navtora";
const HOW = "/es/blog/how-it-works";

const SIFREI: RealSefer[] = [
  {
    id: "shannon",
    name: "El sefer de Elihu Shannon",
    detail: "Kibutz Saad, Israel, 2011. Formato estándar.",
    credit: (
      <>
        Foto: Elihu Shannon, <a href="https://commons.wikimedia.org/wiki/File:Sefer-Torah-Elihu-Shannon-2a.pdf">Wikimedia Commons</a>, CC BY-SA 3.0.
      </>
    ),
  },
  {
    id: "kokhav",
    name: "El sefer de David Kokhav",
    detail: "Costumbre yemenita, 226 columnas.",
    credit: (
      <>
        Foto: rabino David Kokhav, <a href="https://commons.wikimedia.org/wiki/File:David-kokhav-sefer-torah.pdf">Wikimedia Commons</a>, CC BY-SA 3.0.
      </>
    ),
  },
  {
    id: "makhonot",
    name: "Un sefer alemán",
    detail: "Alrededor de 1920, restaurado por Makhon Ot. 190 columnas.",
    credit: (
      <>
        Foto: <a href="https://archive.org/details/torah-scroll-germany-ca.-1920s-refurbished-makhon-ot-no.-18157">Internet Archive</a>, CC0.
      </>
    ),
  },
];

const BL_CREDIT = (
  <>
    Foto: British Library, MS Or. 1462, en <a href="https://archive.org/details/sefer-torah-bl-or-1462-images">Internet Archive</a>. Dominio público.
  </>
);

export const contentEs = (
  <>
    <p>
      NavTorá lee cada columna con una red neuronal chica que corre en el teléfono (cómo la usa, paso a paso, está en <Link href={HOW}>Cómo NavTorá sabe en qué columna está abierto el sefer</Link>). Para que una red aprenda a
      leer, hacen falta muchos renglones junto con el texto que dicen. No existe un conjunto así de fotos de sifrei, así que lo armamos por computadora.
    </p>
    <p>
      Un script, <code>synth.py</code>, toma un pedazo de una columna real del formato estándar, lo escribe con una fuente hebrea y después lo envejece hasta que parece una foto sacada con el teléfono.
    </p>

    <h2>Una foto, paso a paso</h2>
    <p>
      Esta es una de las primeras fotos del set de entrenamiento. Es un pedazo de la columna {TRAIN.stage.column}, en Vaiakhel, escrito con la fuente {FAMILY_NAMES[TRAIN.stage.family]}. Cada paso le suma algo que pasa en una foto
      real.
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
    <p>
      Cada paso elige sus valores al azar, así que no hay dos fotos iguales. En un 30 % de ellas, además, las palabras de cada renglón se cambian por palabras de la Torá elegidas al azar. Así, la red no puede adivinar una palabra
      por las anteriores y tiene que leer cada letra.
    </p>
    <SynthGalleryFigure lang="es" caption="Seis fotos más del set de entrenamiento. Las que dicen «palabras mezcladas» tienen palabras de la Torá elegidas al azar." />

    <h2>Las fuentes</h2>
    <p>
      Las fuentes son de Culmus, un proyecto de fuentes hebreas libres. Las dos de STA&quot;M, Stam Ashkenaz y Stam Sefarad, aparecen en casi dos de cada tres fotos. El resto son fuentes de libros, para que la red vea otras formas de
      las mismas letras.
    </p>
    <FontsFigure lang="es" caption="Las doce familias de fuentes, con la proporción de fotos que se escribe con cada una." />

    <h2>De la foto al renglón</h2>
    <p>
      La red lee de a un renglón. Para cortar los renglones de cada foto usamos el mismo código que corre en la app (son los <Link href={HOW}>pasos 2 a 5</Link> del artículo sobre cómo funciona). Como el script sabe qué texto
      escribió en cada renglón y dónde quedó ese renglón después de deformar la foto, a cada recorte le pone su texto. Si un recorte no coincide bien con un renglón, se descarta, para que la red no aprenda de una etiqueta equivocada.
    </p>
    <LabeledCropsFigure
      lang="es"
      caption="Cuatro renglones recortados, dados vuelta para leerlos, con el texto que se usó para entrenar. Los tres primeros son de la foto de arriba, y el último, de una foto con las palabras mezcladas."
    />

    <h2>El entrenamiento</h2>
    <p>
      Armamos 4.000 fotos para entrenar y 300 para ir midiendo cómo aprendía. La red es chica (unos 450.000 parámetros) y se entrenó en el procesador de una computadora, sin placa de video. La versión que usa la app recorrió 5
      veces todos los renglones de entrenamiento.
    </p>
    <p>Para entrenar se usa la pérdida CTC. Es decir, a la red solo le hace falta el texto de cada renglón, sin saber en qué lugar de la tira está cada letra.</p>

    <h2>Cómo medimos si aprendió</h2>
    <p>Para medir usamos tres tipos de fotos, y ninguna se usó para entrenar:</p>
    <ul>
      <li>
        <strong>Fotos sintéticas nuevas:</strong> 200, armadas igual que las de entrenamiento pero aparte, todas con texto real.
      </li>
      <li>
        <strong>Sifrei escaneados:</strong> cuatro sifrei completos, publicados con licencias libres.
      </li>
      <li>
        <strong>Fotos sacadas con el teléfono:</strong> 10 cuadros de dos pruebas que grabamos, en un sefer gastado y en un tikún impreso.
      </li>
    </ul>
    <p>
      Con las fotos sintéticas, la app ubicó con confianza el 95,5 % y nunca dio un lugar equivocado. La red se equivocó en el 14,9 % de las letras.
    </p>

    <h2>Los sifrei reales</h2>
    <p>Las fotos sintéticas no alcanzan para saber cómo le va a la red con un sefer de verdad. Por eso la probamos con escaneos completos de cuatro sifrei:</p>
    <ul>
      <li>
        <strong>El sefer de Elihu Shannon:</strong> Elihu Shannon es un sofer del kibutz Saad, en Israel. En 2011 mandó las fotos de todas las columnas de su segundo sefer Torá para publicarlas en Wikimedia Commons, con permiso para
        usarlas libremente. Ese sefer sigue el formato estándar de 245 columnas de 42 renglones, así que para cada foto sabemos exactamente qué columna es. Es decir, es una prueba con las respuestas.
      </li>
      <li>
        <strong>El sefer de David Kokhav:</strong> lo encargó el rabino David Kokhav. Está escrito sobre guevil y sigue la costumbre de los sifrei yemenitas, en 226 columnas.
      </li>
      <li>
        <strong>Un sefer alemán de alrededor de 1920:</strong> restaurado por Makhon Ot, con 190 columnas que no siguen el formato de hoy.
      </li>
      <li>
        <strong>El manuscrito Or. 1462 de la British Library:</strong> un sefer del siglo XV, escrito en letra oriental por un sofer del que no se sabe el nombre. Las fotos muestran hojas enteras, con cinco a siete columnas cada
        una, así que las cortamos en columnas sueltas.
      </li>
    </ul>
    <p>
      Con los tres últimos no sabemos de antemano qué columna es cada foto, pero sí sabemos que las columnas van en orden. Por eso, la prueba es que cada columna que la app ubica con confianza quede después de la anterior.
    </p>
    <RealSifreiFigure
      lang="es"
      sifrei={SIFREI}
      withColumn={["shannon"]}
      caption="Una columna de tres de estos sifrei, tal como la leyó la app. En amarillo, el borde de la columna que encontró. Cada palabra leída está pintada según cómo se compara con el texto de la Torá en el lugar donde la ubicó. Tocá una foto para verla sin los dibujos. Las fotos de Shannon y de Kokhav tienen licencia CC BY-SA 3.0, y acá se publican con los dibujos bajo la misma licencia."
    />
    <p>
      En el sefer de la British Library se ve bien la prueba del orden. Abajo hay una hoja entera y sus siete columnas, recortadas una por una. La app ubicó las siete con confianza, una después de la otra, de Terumá a Ki Tisá.
    </p>
    <ScrollSheetFigure
      lang="es"
      ids={["bl1", "bl2", "bl3", "bl4", "bl5", "bl6", "bl7"]}
      credit={BL_CREDIT}
      caption="Una hoja del sefer de la British Library y sus siete columnas, de derecha a izquierda, con la parashá y el versículo de Shemot donde la app ubicó cada una. Tocá una columna para verla sin los dibujos."
    />

    <h3>Los resultados</h3>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Sefer</th>
            <th className="num">Fotos</th>
            <th className="num">Ubicadas con confianza</th>
            <th className="num">Equivocadas o fuera de orden</th>
            <th className="num">Sin respuesta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Elihu Shannon</td>
            <td className="num">246</td>
            <td className="num">241</td>
            <td className="num">0</td>
            <td className="num">5</td>
          </tr>
          <tr>
            <td>David Kokhav</td>
            <td className="num">226</td>
            <td className="num">225</td>
            <td className="num">0</td>
            <td className="num">1</td>
          </tr>
          <tr>
            <td>Makhon Ot, Alemania</td>
            <td className="num">190</td>
            <td className="num">189</td>
            <td className="num">0</td>
            <td className="num">1</td>
          </tr>
          <tr>
            <td>British Library, siglo XV</td>
            <td className="num">233</td>
            <td className="num">187</td>
            <td className="num">0</td>
            <td className="num">46</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      En el sefer de Shannon, 240 de las 241 dieron además el número de columna exacto. Las que quedaron sin respuesta son las dos canciones escritas en forma de ladrillos (Shirat HaIam y Haazinu), que el buscador de renglones no
      sigue, y los nesiim de Bamidbar 7, donde dos columnas se parecen demasiado.
    </p>
    <p>
      En el de la British Library hay 21 columnas que quedan antes de la anterior, pero todas son la primera columna de una foto nueva. 16 caen sobre una columna que ya estaba, porque una foto repite el final de la anterior, y 5
      completan huecos que habían quedado. Ninguna contradice a sus vecinas.
    </p>

    <h3>Las fotos sacadas con el teléfono</h3>
    <p>
      Por último, probamos con 10 cuadros de dos pruebas grabadas con el teléfono, en un sefer gastado y en un tikún impreso. Son grabaciones de pantalla de baja resolución, con renglones de unos 17 a 23 píxeles de alto. La app
      ubicó los 10 sin ningún error, aunque la red se equivocó en cerca del 30 % de las letras (contando cada <code>?</code> como error).
    </p>
    <p>
      Es decir, la red se equivoca en muchas letras, pero para ubicar la columna alcanza. Lo que más la puede mejorar son fotos reales. Por eso, cuando un escaneo no sale bien, la app ofrece mandar la foto para sumarla al
      entrenamiento. Solo se manda si la persona lo marca.
    </p>

    <h2>El código</h2>
    <p>
      Las fotos sintéticas de este artículo salen del mismo código que armó el set de entrenamiento (<a href={`${GITHUB}/blob/main/tools/train/blog_figures.py`}>tools/train</a>), y los dibujos sobre los sifrei reales salen de
      correr la app sobre cada foto (<a href={`${GITHUB}/blob/main/tools/eval/src/blog-real.ts`}>tools/eval</a>). Los resultados completos están en <a href={`${GITHUB}/blob/main/docs/evaluation.md`}>la evaluación</a>.
    </p>
  </>
);
