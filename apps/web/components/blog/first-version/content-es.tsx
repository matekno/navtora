import Link from "next/link";
import { CLAUDE_CALL } from "./snippets";

const GITHUB = "https://github.com/matekno/navtora";

export const contentEs = (
  <>
    <p>
      Hoy NavTorá lee cada columna con una red propia, en el teléfono (está contado en <Link href="/es/blog/how-it-works">Cómo NavTorá sabe en qué columna está abierto el sefer</Link>). La primera versión, en septiembre de 2026,
      no tenía esa red. La app sacaba la foto, la achicaba a 1.800 píxeles en el lado más largo y la mandaba al servidor, que se la pasaba a Claude Opus 5 por la API de Anthropic. Claude transcribía los renglones, y desde ahí todo
      seguía como ahora, con la misma búsqueda entre las palabras de la Torá.
    </p>

    <h2>Qué le pedíamos a Claude</h2>
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

    <h2>¿Lee o recita?</h2>
    <p>
      Claude conoce la Torá, así que había que chequear que leyera lo escrito y no lo que recuerda. Para probarlo, armamos una columna con seis palabras cambiadas por otras palabras hebreas reales. Claude transcribió las seis tal
      como estaban escritas, y ninguna volvió al texto original. Cuando la imagen cortaba el principio de los renglones, transcribió solo lo que se veía.
    </p>

    <h2>Cómo le fue</h2>
    <p>
      Leía muy bien. Probamos cuánto podía pensar el modelo (el parámetro <code>effort</code>) y cuántos renglones transcribía, sobre columnas escaneadas del sefer de Elihu Shannon, un sefer de formato estándar que un sofer de
      Israel publicó en Wikimedia Commons. Todas quedaron bien ubicadas.
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
      Con 14 renglones alcanzaba para ubicar la columna, y transcribir menos bajaba mucho el tiempo y el costo. Con Opus 5, esfuerzo bajo y 14 renglones, cada foto costaba unos 3 centavos de dólar. En 78 imágenes escaneadas de 4
      sifrei nunca dio una posición equivocada, y en las pruebas con sifrei de verdad cada escaneo tardó 16 o 17 segundos.
    </p>

    <h2>¿Por qué lo cambiamos?</h2>
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
      <code>?</code>. Como la búsqueda está pensada para lecturas con errores, igual llega a la columna correcta. Cómo entrenamos esa red está en <Link href="/es/blog/training">otro artículo</Link>.
    </p>
  </>
);
