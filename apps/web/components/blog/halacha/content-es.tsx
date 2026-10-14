import type { HalachaContent } from "./Halacha";

const SRL_HALAJA = "https://www.seminariorabinico.org/halaja/";

export const contentEs: HalachaContent = {
  intro: (
    <>
      <p>
        NavTorá se usa justo cuando más hace falta: Shabat y Iom Tov a la mañana, cuando hay que dejar el sefer en el lugar de la lectura. Y eso trae una pregunta halájica real: ¿se puede usar un teléfono para eso?
      </p>
      <p>
        Esta página no es un psak. Cuenta desde dónde pensé la app y reúne las fuentes que encontramos, las que la apoyan y las que no, con un resumen de cada una y el enlace para leerla entera. La idea es que cada persona y cada
        kehilá decida con su rab.
      </p>
      <h2>En corto</h2>
      <ul>
        <li>La app está pensada desde la línea del movimiento conservador que, desde 1950, no considera la electricidad en sí misma una melajá.</li>
        <li>Dentro del mismo movimiento hay posiciones más estrictas: la posición oficial vigente sobre aparatos, de 2012, prohíbe usar el celular y la cámara en Shabat.</li>
        <li>Fuera del movimiento, la gran mayoría de los poskim prohíben usar aparatos eléctricos en Shabat.</li>
        <li>El propósito de la app, que el público no espere mientras se enrolla el rollo, tiene apoyo directo en la Guemará y en el Shulján Aruj.</li>
        <li>Usarla el día anterior, en Jol HaMoed o en un día de semana no genera ninguna discusión.</li>
      </ul>
    </>
  ),
  sections: [
    {
      id: "desde-donde",
      text: (
        <>
          <h2>Desde dónde la pensé</h2>
          <p>
            Soy del movimiento conservador. Pensé NavTorá desde su línea sobre el Shabat, que arranca con la responsa de 1950 de los rabinos Adler, Agus y Friedman: la electricidad en sí no es una melajá, y se puede usar para
            disfrutar el Shabat o para ayudar a cumplir una mitzvá. Leer la Torá en público es una mitzvá de toda la kehilá, y lo que hace la app es ayudar a que esa lectura no se trabe. Uno de los autores de esa responsa, Theodore
            Friedman, enseñó después en el Seminario Rabínico Latinoamericano, que además publicó en castellano los textos del Comité de Leyes y Estándares de la Asamblea Rabínica sobre la tecnología en Shabat y sobre la lectura de la
            Torá que están más abajo.
          </p>
          <p>
            NavTorá está pensada para quienes viven el Shabat dentro de ese marco: para quienes el teléfono en Shabat no es un tabú absoluto sino una limitación más, que se maneja con criterio. Para ellos la propongo como una ayuda:
            para que el gabai encuentre el lugar en un segundo, para que el público no espere en silencio mientras se enrolla el rollo y para que quien lee no pase vergüenza.
          </p>
          <p>No es una posición unánime, ni siquiera dentro del movimiento, y no quiero presentarla como si lo fuera. Por eso, abajo, todas las fuentes.</p>
        </>
      ),
      sources: ["responsum-1950"],
    },
    {
      id: "que-hace",
      text: (
        <>
          <h2>Qué hace la app, en concreto</h2>
          <p>Las preguntas halájicas dependen de los detalles. Estos son los de NavTorá:</p>
          <ul>
            <li>Hay que tener el teléfono en la mano y llevarlo hasta el rollo.</li>
            <li>La pantalla está prendida y muestra lo que ve la cámara.</li>
            <li>Para escanear se toca un botón. La foto se lee en el teléfono y no se guarda en la galería ni en ningún otro lugar.</li>
            <li>Al servidor va solo el texto leído, y el servidor guarda un registro de cada escaneo: el resultado y ese texto, sin la foto.</li>
            <li>La respuesta aparece en la pantalla, y la app puede leerla en voz alta.</li>
            <li>Opcionalmente, se puede prender la linterna del teléfono o escribir unas palabras con el teclado en lugar de escanear.</li>
          </ul>
          <p>No encontramos ninguna fuente que hable de una app que lee una imagen sin guardarla. Las que hablan de pantallas, cámaras y registros de datos están más abajo.</p>
        </>
      ),
      sources: [],
    },
    {
      id: "kavod-hatzibur",
      text: (
        <>
          <h2>Por qué importa: el respeto al público</h2>
          <p>
            Estas fuentes no hablan de teléfonos. Explican por qué hacer esperar a la kehilá mientras se enrolla el sefer es un problema en sí mismo, y de quién es la tarea de evitarlo.
          </p>
        </>
      ),
      sources: ["yoma-mishnah", "yoma-70a", "sa-144-3", "mb-144", "ahs-144-6", "magen-avraham-144", "several-scrolls", "berakhot-12b", "cjls-torah-reading-2020"],
    },
    {
      id: "permiten",
      text: (
        <>
          <h2>Las que permiten, con condiciones</h2>
          <p>Dentro del movimiento conservador hay varias posiciones que no consideran la electricidad en sí misma una melajá. Ninguna habla de una app como esta; cada una dice hasta dónde llega.</p>
        </>
      ),
      sources: ["neulander-1950", "fine-leff-2023", "spitz-2012", "heller-2020"],
    },
    {
      id: "restringen-movimiento",
      text: (
        <>
          <h2>Las que prohíben o restringen, dentro del movimiento</h2>
          <p>La posición oficial vigente sobre aparatos es más estricta que la de 1950, y en 2023 el Comité aprobó, el mismo día, una posición permisiva y otra restrictiva sobre la electricidad.</p>
        </>
      ),
      sources: ["nevins-2012", "schwartz-weiner-2023", "levin-2020", "reisner-2012", "photography-1984", "golinkin-2020"],
    },
    {
      id: "prohiben",
      text: (
        <>
          <h2>Las que prohíben, fuera del movimiento</h2>
          <p>
            En el mundo ortodoxo, la gran mayoría de los poskim prohíben usar aparatos eléctricos en Shabat. Lo que discuten es por qué: si es construir, crear algo nuevo, una costumbre que hay que mantener o una cuestión del
            espíritu del día. Además del aparato, están las preguntas de siempre: escribir, muktzé y transportar.
          </p>
        </>
      ),
      sources: ["chazon-ish", "beit-yitzchak", "auerbach", "feinstein", "pninei-halacha", "bleich-cameras", "melachot", "uvdin-dechol"],
    },
    {
      id: "sin-telefono",
      text: (
        <>
          <h2>Si preferís no usar el teléfono en Shabat</h2>
          <p>Todo lo anterior se refiere a usar la app en Shabat o en Iom Tov. Hay maneras de aprovecharla sin eso:</p>
          <ul>
            <li>
              <strong>Preparar el rollo antes.</strong> La app sirve cualquier día: el viernes elegís la lectura del Shabat y dejás el sefer en el lugar. El Aruj HaShulján pone esta tarea «antes de la tefilá», y Golinkin propone la
              misma lógica para todo: hacer las cosas antes de que empiece el Shabat.
            </li>
            <li>
              <strong>Dejar marcadores.</strong> Si hay varias aliot o varios rollos, se pueden pegar notas adhesivas entre las columnas, sin tocar las letras, como recomienda la guía del Comité: ubicás cada lugar con la app el viernes
              y lo marcás.
            </li>
            <li>
              <strong>Preparar cada rollo.</strong> En los días con dos o tres lecturas, cada rollo puede quedar abierto en su lugar desde antes, como hace el Shulján Aruj.
            </li>
            <li>
              <strong>Practicar en la semana.</strong> Lunes y jueves, Rosh Jódesh, Jol HaMoed: en los días de semana el uso de la tecnología en la tefilá tiene pocas barreras, como señala Heller.
            </li>
          </ul>
          <p>Para quien sí la usa en Shabat, estas son ideas que aparecen en las fuentes para hacerlo con más cuidado. Ninguna es un permiso:</p>
        </>
      ),
      sources: ["before-shabbat", "kevod-habriyot", "kelachar-yad"],
    },
    {
      id: "preguntar",
      text: (
        <>
          <h2>Para preguntar</h2>
          <p>
            Esto no es un psak halajá. Si tenés dudas sobre tu caso o el de tu kehilá, preguntale a tu rab. El <a href={SRL_HALAJA}>Centro de Estudios de la Halajá</a> del Seminario también recibe preguntas.
          </p>
        </>
      ),
      sources: ["srl-halacha"],
    },
  ],
  outro: (
    <p>
      ¿Falta una fuente, o hay algo mal citado? Las fuentes de esta página están en el <a href="https://github.com/matekno/navtora/blob/main/apps/web/components/blog/halacha/sources.ts">código</a>, y se pueden corregir como
      cualquier otra parte de la app.
    </p>
  ),
};
