import Link from "next/link";
import type { HalachaContent } from "./Halacha";

const SRL_HALAJA = "https://www.seminariorabinico.org/halaja/";

export const contentEs: HalachaContent = {
  intro: (
    <>
      <p>
        Encontrar a alguien que sepa leer la Torá es un desafío para muchas kehilot, sobre todo en la diáspora, donde la mayoría no sabe suficiente hebreo. En mayo de 2026, el Comité de Leyes y Estándares de la Asamblea
        Rabínica (CJLS) aprobó una responsa sobre qué hacer cuando no hay nadie que sepa leer. Su respuesta es que la lectura no se deja, y que hay que hacer todo lo posible para leer del rollo.
      </p>
      <p>
        Pensé NavTorá para ayudar en esa situación. Yo estoy en ella, y conozco a muchos que también (lo cuento en <Link href="/es/blog/story">Por qué hice NavTorá</Link>).
      </p>
    </>
  ),
  sections: [
    {
      id: "la-responsa",
      text: (
        <>
          <h2>La responsa del CJLS</h2>
          <p>
            La responsa es del rabino David J. Fine y se llama «Cuando nadie puede leer la Torá» (OH 142:2.2026a). Pregunta qué opciones tiene una kehilá cuando nadie puede leer del Séfer Torá como corresponde, y si se puede leer
            de un jumash impreso.
          </p>
          <p>
            Su psak es que leer de un jumash <strong>no cumple la obligación de la lectura pública</strong>, que se hace del rollo escrito a mano. A partir de ahí, ordena estas opciones de la mejor a la menos buena:
          </p>
          <ol>
            <li>
              Que lea del rollo, de la forma tradicional, alguien que sepa hacerlo. Cada kehilá tiene que alentar a sus lectores y a que más gente aprenda a leer Torá, o contratar a un lector.
            </li>
            <li>Que lea un menor que sepa leer, y otra persona diga las brajot.</li>
            <li>Que el lector mire un jumash de vez en cuando, entre frase y frase, pero lea cada palabra del Séfer Torá.</li>
            <li>Que los gabaim ayuden al lector, susurrándole cada frase al oído para que la repita en voz alta, corrigiéndolo con suavidad o haciéndole señas.</li>
            <li>
              En una situación apremiante (shaat hadejak), algunos permitirían que alguien lea en voz alta de un jumash mientras el lector sigue cada palabra en el rollo moviendo los labios.
            </li>
          </ol>
          <p>
            Fine también descarta leer sin las teamim, porque son un requisito de la halajá y una tradición que hay que hacer todo lo posible por mantener. Si la falta de lector es permanente, propone leer directamente del jumash,
            sin abrir el Séfer Torá y sin brajot, para que nadie piense que eso reemplaza la lectura del rollo. Además, aclara que el rollo no se marca, ni con lápiz ni con láminas transparentes encima.
          </p>
          <p>
            La responsa se aprobó con 7 votos a favor, 11 en contra y 5 abstenciones. En el CJLS, una responsa con 6 votos a favor o más es una posición oficial del Comité, aunque haya más votos en contra. Entre quienes votaron a
            favor está el rabino Marcelo Polakoff, de Córdoba.
          </p>
          <p>La responsa explica en detalle las fuentes en las que se apoya, así que para eso lo mejor es leerla completa.</p>
        </>
      ),
      sources: ["fine-2026"],
    },
    {
      id: "donde-ayuda",
      text: (
        <>
          <h2>Dónde ayuda NavTorá</h2>
          <p>
            Las cuatro primeras opciones tienen algo en común. En todas se lee del rollo, y para eso el rollo tiene que estar en el lugar correcto y quien lee tiene que saber dónde empieza su aliá. En una kehilá sin un lector fijo,
            el que prepara el rollo muchas veces no se sabe el texto de memoria. Ahí es donde ayuda la app:
          </p>
          <ul>
            <li>
              <strong>Preparar el rollo:</strong> la víspera, el gabai elige la lectura y escanea la columna abierta, y la app le dice cuántas columnas enrollar y en qué renglón empieza cada aliá. No hace falta saberse el texto de
              memoria.
            </li>
            <li>
              <strong>Que más gente se anime a leer:</strong> quien está aprendiendo puede ir en la semana al sefer de su kehilá y encontrar en el rollo la aliá que preparó con un jumash o un tikún. Es la primera opción de la
              responsa, que más gente aprenda a leer.
            </li>
            <li>
              <strong>Sin tocar el rollo:</strong> la app no marca el rollo ni pone nada encima, así que respeta lo que pide la responsa.
            </li>
          </ul>
          <p>
            Personalmente, creo que acá es donde la app más ayuda. La lectura la sigue haciendo una persona, del rollo y con las teamim, y la app se ocupa de que esa persona encuentre su lugar.
          </p>
        </>
      ),
      sources: [],
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
      sources: [],
    },
  ],
};
