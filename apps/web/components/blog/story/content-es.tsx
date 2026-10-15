import Link from "next/link";
import { Photo, PhotoPair } from "./Photos";

export const contentEs = (
  <>
    <p>
      En mi Bar Mitzvá, como en casi todas las kehilot conservadoras, tuve una formación muy buena, pero no me enseñaron a leer Torá. Me enseñaron a leer mi aliá.
    </p>
    <p>
      Por mi educación formal, puedo leer un texto en hebreo, aunque para hablar mi nivel no es muy alto. Si preparo el texto y repaso las palabras con un moré, puedo leer aliot. Hace poco aprendí taamei hamikrá, y me ayuda
      muchísimo a preparar una aliá para leerla yo.
    </p>

    <h2>Iamim Noraim en Formosa</h2>
    <p>
      Vengo estudiando con el rab Meir Szames en <a href="https://www.instagram.com/la_ieshive/">La Ieshive</a>, y él me presentó la oportunidad de ir a oficiar Iamim Noraim en la kehilá de Formosa.
    </p>
    <Photo side="right" tilt={2.5} id="bima" alt="Mati y Bet Fleischer con talit, sentados frente al arón hakódesh" caption="Con Bet Fleischer, en Formosa." />
    <p>
      Tengo formación comunitaria y ya había oficiado servicios de juventud en mi comunidad, Bet Hilel. Sin embargo, nunca había oficiado tanto, ni lejos de casa. Me daba mucho miedo por varios lados: leer tantas aliot, tocar
      el shofar, responder preguntas y aprender la tefilá.
    </p>
    <p>
      Para todo eso me pude ir preparando. Durante varios meses me junté todas las semanas a estudiar con Bet Fleischer, con quien compartimos la tarea de oficiar, por videollamada, en persona y en tefilot. Estudié las aliot y me
      preparé en un montón de frentes.
    </p>

    <h2>El miedo a no encontrar las aliot</h2>
    <p>
      Pero una de mis mayores ansiedades era llegar y no poder encontrar las aliot en el sefer. Allá nadie sabía leer del sefer, y me daba miedo no tener señal para llamar a mi rab. Hablé con amigos y referentes, y cada uno me
      daba un consejo muy distinto. Eso solo me generaba más preocupación, y cada vez faltaba menos para el viaje.
    </p>
    <p>
      Así que empecé a estudiar cómo funciona un sefer, qué tan estándar es la forma de escribirlo y cómo se arman las columnas. Y así empecé a programar. El primer MVP usaba la API de Anthropic para leer la columna (lo cuento en{" "}
      <Link href="/es/blog/first-version">La primera versión de NavTorá</Link>).
    </p>

    <h2>En el Beit HaKneset</h2>
    <Photo side="left" tilt={-2} id="puerta" alt="Mati y Bet Fleischer en la puerta de la Sociedad Israelita" caption="En la puerta de la Sociedad Israelita." />
    <p>
      Cuando llegué a Formosa y fuimos al Beit HaKneset, una de las primeras cosas que hicimos fue poner el sefer en su lugar. De forma totalmente orgánica, se empezaron a acercar los chicos que estaban ayudando a sus padres a
      preparar todo para la primera noche de Rosh Hashaná. Querían ver y entender ese pergamino que yo estaba usando (¡y que también les pertenece!).
    </p>
    <p>
      Es un pergamino pesado, que hasta a mí me intimida por las palabras y las enseñanzas que tiene, y también por su letra, que ellos vieron poquísimas veces. Aun así, tiene la magia de atraerlos y de que quieran conocer de qué
      se trata. El sefer les resulta familiar porque es nuestra tradición milenaria, aunque lo estén viendo casi por primera vez.
    </p>
    <p>
      Con esa misma curiosidad, yo intentaba disimular mi miedo. En eso, el MVP de esta app, que había hecho para mí, me dio resultado. Los chicos me ayudaron a enrollar, y lo convertimos en un momento educativo muy valioso.
    </p>
    <PhotoPair
      prints={[
        { id: "telefono", tilt: -3, alt: "Mati con el teléfono frente al sefer abierto sobre la bimá", caption: "Buscando el lugar en el sefer." },
        { id: "chicos", tilt: 2.5, alt: "Mati mostrándoles el sefer abierto a dos chicos", caption: "Los chicos, mirando el sefer." },
      ]}
    />

    <h2>NavTorá hoy</h2>
    <p>
      Desde entonces mejoré NavTorá, para que sea accesible para cualquiera y no dependa de proveedores de IA. Hoy lee el sefer con una red propia, directamente en el teléfono. Además, fue un desafío tecnológico hermoso (lo cuento
      en <Link href="/es/blog/how-it-works">Cómo NavTorá sabe en qué columna está abierto el sefer</Link>).
    </p>

    <h2>Leer del sefer</h2>
    <p>
      Todos los judíos tenemos amor por la Torá, pero hay barreras que hacen difícil el acceso. Internet nos permitió llegar a fuentes ancestrales, con traducciones, explicaciones, comentarios, discusiones y ensayos de todas las
      corrientes y movimientos.
    </p>
    <p>
      El movimiento conservador hizo una responsa muy interesante sobre esto (la resumo en <Link href="/es/blog/halacha">Qué hacer cuando nadie sabe leer la Torá</Link>). Básicamente, dice que si nadie sabe leer la Torá, eso no
      habilita a leer de un jumash, y que hay que hacer todo lo posible para leer del sefer. Tiene sentido, porque todo el ritual de la lectura de la Torá es único y hermoso, incluso desde la preparación del día anterior.
    </p>
    <p>Espero que NavTorá les sirva a otras kehilot y a otras personas en mi misma situación, y que todos puedan seguir manteniendo la tradición de leer directamente de la Torá.</p>

    <h2>Agradecimientos</h2>
    <p>
      Gracias especialmente a mi rab, Meir Szames, que me presentó esta oportunidad. Gracias también a La Ieshive, a Bet Fleischer, con quien preparamos todo y compartimos la tarea, y a toda la Sociedad Israelita de Formosa.
    </p>
  </>
);
