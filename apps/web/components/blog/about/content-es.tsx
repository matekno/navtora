import Link from "next/link";
import { Photo, PhotoPair } from "../Prints";
import { ABOUT } from "./Photos";

export const contentEs = (
  <>
    <Photo side="right" tilt={2} photo={ABOUT.retrato} alt="Matías Kahan Rapoport" caption="Matías Kahan Rapoport." />
    <p>Soy Matías Kahan Rapoport. Estudio Ingeniería Informática y trabajo en retak® como analista de sistemas y líder de proyectos de mejora continua.</p>
    <p>
      En mi trabajo estudiamos procesos que tienen problemas, diseñamos una solución y armamos los sistemas que soportan esos cambios. Acompaño a los usuarios de punta a punta, desde que relevamos el problema hasta que la solución
      se usa en el día a día.
    </p>

    <h2>Bet Hilel</h2>
    <Photo side="left" tilt={-2} photo={ABOUT.servicio} alt="Un grupo de jóvenes con instrumentos en un servicio de juventud" caption="Un servicio de juventud." />
    <p>
      Hace 11 años participo en mi comunidad, Bet Hilel, y pasé por todos los roles. Fui janij, madrij y moré de Talmud Torá. Hoy soy mejanej en Majón Guesher, la escuela de líderes y madrijim de la kehilá. Ahí acompaño a mis
      talmidim durante tres años, para educarlos de forma transversal en los valores de nuestro pueblo.
    </p>
    <PhotoPair
      prints={[
        { photo: ABOUT.caja, tilt: -3, alt: "Mati sosteniendo una caja de cartón en una actividad", caption: "En la hadrajá." },
        { photo: ABOUT.campo, tilt: 2.5, alt: "Un grupo acostado en el pasto formando una figura, visto desde un dron", caption: "Una actividad, vista desde arriba." },
      ]}
    />

    <h2>Con o sin software</h2>
    <p>
      En todos los puestos de liderazgo que tuve en la comunidad, siempre busqué entender y mejorar los procesos de los que yo mismo era parte. En Majón Guesher armé Ani-Mejanej, una app para llevar la asistencia, el seguimiento,
      las prácticas y las vacaciones, entre muchas otras cosas (el código está en <a href="https://github.com/matekno/presentismo-majon">GitHub</a>). Hoy se usa en todo el departamento y en otras comunidades de la ciudad.
    </p>
    <p>Intento llevar la misma forma de trabajar de mi profesión a todas las actividades comunitarias que hago, con o sin software.</p>

    <h2>La Ieshive</h2>
    <Photo side="right" tilt={2} photo={ABOUT.rab} alt="Mati con el rab Meir Szames en su oficina" caption="Con el rab Meir Szames, en su oficina." />
    <p>
      Después del 7 de octubre, y de vivir el Simjat Torá más oscuro de nuestra vida y de nuestra generación, empecé a estudiar en <a href="https://www.instagram.com/la_ieshive/">La Ieshive</a> con el rab Meir Szames. Así empecé a
      darle más contenido a algo que siempre supe que me interesaba.
    </p>
    <p>Hoy sigo estudiando, y este año tuvimos la oportunidad de viajar a Formosa para compartir nuestra Torá y oficiar Iamim Noraim en la kehilá local.</p>
    <p>
      Seguí leyendo en <Link href="/es/blog/story">Por qué hice NavTorá</Link>.
    </p>
  </>
);
