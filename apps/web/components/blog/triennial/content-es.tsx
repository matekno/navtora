import type { SourcedContent } from "../SourcedArticle";
import { SelectorFigure } from "./SelectorFigure";

export const contentEs: SourcedContent = {
  intro: (
    <>
      <p>
        La mayoría de las kehilot lee la Torá completa cada año, con una parashá por Shabat, desde Bereshit hasta Vezot Haberajá. Algunas, sobre todo en el movimiento conservador, siguen el ciclo trienal. Es decir, cada Shabat
        leen la misma parashá que todos, pero solo un tercio, y completan la Torá en tres años.
      </p>
      <p>
        NavTorá permite elegir cualquiera de los dos ciclos. Acá cuento en pocas palabras de dónde viene el trienal y cómo se lee hoy. Para entenderlo bien, recomiendo leer las fuentes que dejo en cada parte.
      </p>
    </>
  ),
  sections: [
    {
      id: "de-donde-viene",
      text: (
        <>
          <h2>De dónde viene</h2>
          <p>
            El ciclo trienal no es algo nuevo. La Guemará, en Meguilá 29b, cuenta que en Eretz Israel la lectura de la Torá se completaba en tres años y no en uno. Con el tiempo, el ciclo anual fue el que quedó en casi todas
            las comunidades.
          </p>
          <p>El Rambam también lo menciona. En Hiljot Tefilá (13:1) explica el ciclo anual y agrega que hay quienes completan la Torá en tres años, aunque no es una costumbre difundida.</p>
        </>
      ),
      sources: ["meguila-29b", "rambam"],
    },
    {
      id: "asamblea-rabinica",
      text: (
        <>
          <h2>Cómo lo pensó la Asamblea Rabínica para hoy</h2>
          <p>
            En los años ochenta, muchas kehilot conservadoras de Estados Unidos ya leían con un ciclo trienal, pero cada una a su manera. Es por eso que el Comité de Leyes y Estándares (CJLS) de la Asamblea Rabínica estudió el
            tema, y hubo dos propuestas.
          </p>
          <ul>
            <li>
              <strong>Lionel Moses</strong> propuso volver al ciclo antiguo de Eretz Israel, con la Torá dividida en 154 sedarim que se leen uno detrás del otro durante tres años. El Comité no la aceptó.
            </li>
            <li>
              <strong>Elliot Dorff</strong> propuso mantener la parashá de cada semana y leer el primer tercio el primer año, el segundo tercio el segundo año y el último tercio el tercer año. El Comité la aprobó en 1987.
            </li>
          </ul>
          <p>
            Sobre ese modelo, el rabino Richard Eisenberg armó el sistema completo, que el CJLS adoptó en 1988. Dividió cada parashá en tres partes, y cada parte en siete aliot y maftir. Después hubo dos ajustes, uno en 2012
            para un caso poco común y otro en 2020 para algunas parashot que a veces se leen juntas.
          </p>
        </>
      ),
      sources: ["dorff-1987", "moses", "eisenberg-1988"],
    },
    {
      id: "lunes-y-jueves",
      text: (
        <>
          <h2>Lunes y jueves</h2>
          <p>
            Entre semana hay dos costumbres, y la responsa de Dorff deja elegir cualquiera de las dos. Algunas kehilot leen el lunes y el jueves el comienzo de la parashá, igual que en el ciclo anual. Otras leen el comienzo de
            lo que se va a leer el Shabat. Por ejemplo, en 5787 la parashá Vaieshev empieza en Bereshit 37:1, pero el Shabat se lee desde 38:1.
          </p>
          <p>
            La Guemará (Meguilá 21b) y el Shulján Aruj (Óraj Jaim 137:1) hablan de leer por lo menos diez pesukim cuando suben tres personas. Algunas semanas, las tres primeras aliot del trienal suman menos (en Ki Tetzé de
            5788, por ejemplo, suman nueve). En esos casos la app lo avisa, y lo mejor es consultar con el rabino o el gabai de la kehilá qué hacer.
          </p>
        </>
      ),
      sources: ["diez-pesukim"],
    },
    {
      id: "en-navtora",
      text: (
        <>
          <h2>Cómo se elige en NavTorá</h2>
          <p>
            En la pantalla «¿A dónde vamos?» se tilda «Ciclo trienal». En la pestaña Fecha aparece la opción para lunes y jueves, y en la pestaña Parashá se elige el año del ciclo. La elección queda guardada en el teléfono.
          </p>
          <SelectorFigure
            lang="es"
            alts={[
              "La pestaña Fecha con el ciclo trienal tildado y la opción para lunes y jueves",
              "La pestaña Parashá con el año del ciclo para elegir, del 1 al 3",
            ]}
            caption="A la izquierda, un lunes con la opción trienal, que muestra las tres primeras aliot del Shabat. A la derecha, la parashá Vaiakhel en el año 1, cuando se lee junto con Pekudei."
          />
          <p>
            Para saber qué se lee cada Shabat, NavTorá usa la librería trienal de hebcal, que sigue el sistema de Eisenberg con los ajustes de 2012 y 2020. Ese sistema cuenta los años desde 5744, así que 5787 es el segundo año
            del ciclo. Si tu kehilá empezó el ciclo en otro año o sigue otro sistema trienal, los años no van a coincidir.
          </p>
        </>
      ),
      sources: ["hebcal"],
    },
  ],
  outro: <p className="text-[15px] text-muted">Esto no es un psak halajá. Solo cuento qué es el ciclo trienal y dónde leer más.</p>,
};
