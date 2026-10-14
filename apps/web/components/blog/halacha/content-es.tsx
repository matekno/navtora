import type { HalachaContent } from "./Halacha";

const SRL_HALAJA = "https://www.seminariorabinico.org/halaja/";

export const contentEs: HalachaContent = {
  intro: (
    <>
      <p>
        NavTorá se usa para dejar el Séfer Torá listo antes de Shabat y de Iom Tov. El viernes, o la víspera de la fiesta, el gabai elige en la app la lectura del día siguiente, escanea la columna abierta y enrolla hasta donde le
        indica. A la mañana siguiente, el rollo ya está en su lugar.
      </p>
      <p>En Shabat y en Iom Tov la app no se usa, porque el celular no se usa.</p>
    </>
  ),
  sections: [
    {
      id: "para-quien",
      text: (
        <>
          <h2>Para quién es</h2>
          <p>
            Soy del movimiento conservador, y pensé NavTorá para quienes guardan el Shabat y necesitan dejar el rollo preparado antes. Para ellos, no tener el teléfono es una limitación más del día, y
            la app ayuda a que esa limitación no se note en la lectura. La víspera, cada rollo queda en su lugar, y a la mañana nadie tiene que buscar.
          </p>
        </>
      ),
      sources: [],
    },
    {
      id: "como-se-usa",
      text: (
        <>
          <h2>Cómo se usa para preparar</h2>
          <ul>
            <li>
              <strong>La víspera:</strong> el viernes, o la víspera de Iom Tov, elegís la lectura del día siguiente, escaneás la columna abierta y enrollás hasta donde te indica la app. Así, el rollo queda listo antes de que empiece la
              fiesta.
            </li>
            <li>
              <strong>Varios rollos:</strong> en los días con dos o tres lecturas (Rosh Jódesh, Janucá, las cuatro parashiot, Iom Tov), preparás cada rollo en su lugar.
            </li>
            <li>
              <strong>Marcadores:</strong> si cada aliá la lee alguien distinto, se pueden pegar notas adhesivas entre las columnas en el comienzo de cada aliá, sin tocar las letras, como recomienda una guía del movimiento. Los lugares
              los encontrás con la app la víspera.
            </li>
            <li>
              <strong>Días de semana:</strong> los lunes, los jueves y Rosh Jódesh en día de semana no tienen el problema del Shabat, así que la app se puede usar ese mismo día. También sirve para practicar.
            </li>
          </ul>
        </>
      ),
      sources: [],
    },
    {
      id: "por-que-preparar",
      text: (
        <>
          <h2>Por qué preparar el rollo antes</h2>
          <p>Estas fuentes no hablan de teléfonos. Explican por qué hacer esperar a la kehilá mientras se enrolla el sefer es un problema en sí mismo, y de quién es la tarea de evitarlo.</p>
        </>
      ),
      sources: ["yoma-mishnah", "yoma-70a", "sa-144-3", "mb-144", "ahs-144-6", "magen-avraham-144", "several-scrolls", "berakhot-12b", "cjls-torah-reading-2020"],
    },
    {
      id: "por-que-no-en-shabat",
      text: (
        <>
          <h2>Por qué no en Shabat ni en Iom Tov</h2>
          <p>
            Usar la app implica levantar el teléfono y llevarlo hasta el rollo, prender la pantalla, usar la cámara y mandar datos a un servidor. En 1950, el movimiento conservador permitió usar luces eléctricas en Shabat. Sin embargo,
            su posición vigente sobre aparatos electrónicos, de 2012, prohíbe el teléfono celular y la cámara. Fuera del movimiento, la gran mayoría de los poskim prohíben usar aparatos eléctricos en Shabat.
          </p>
          <h3>Dentro del movimiento conservador</h3>
        </>
      ),
      sources: ["nevins-2012", "schwartz-weiner-2023", "levin-2020", "reisner-2012", "photography-1984", "golinkin-2020"],
    },
    {
      id: "fuera-del-movimiento",
      text: (
        <>
          <h3>Fuera del movimiento</h3>
          <p>
            En el mundo ortodoxo, lo que se discute es sobre todo por qué está prohibido (si es construir, crear algo nuevo, una costumbre que hay que mantener o el espíritu del día). Además del aparato en sí, están las leyes de
            escribir, muktzé y transportar.
          </p>
        </>
      ),
      sources: ["chazon-ish", "beit-yitzchak", "auerbach", "feinstein", "pninei-halacha", "bleich-cameras", "melachot", "uvdin-dechol"],
    },
    {
      id: "consultar",
      text: (
        <>
          <h2>Para consultar</h2>
          <p>
            Esto no es un psak halajá. Si tenés dudas sobre tu caso o el de tu kehilá, preguntale a tu rab. El <a href={SRL_HALAJA}>Centro de Estudios de la Halajá</a> del Seminario Rabínico Latinoamericano también recibe preguntas.
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
