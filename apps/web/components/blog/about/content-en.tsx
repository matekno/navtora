import Link from "next/link";
import { Photo, PhotoPair } from "../Prints";
import { ABOUT } from "./Photos";

export const contentEn = (
  <>
    <Photo side="right" tilt={2} photo={ABOUT.retrato} alt="Matías Kahan Rapoport" caption="Matías Kahan Rapoport." />
    <p>I&apos;m Matías Kahan Rapoport. I study Computer Engineering and work at retak® as a systems analyst and continuous improvement project lead.</p>
    <p>
      At work we study processes that have problems, design a solution and build the systems that support those changes. I work with the users from end to end, from the moment we map out the problem until the solution is used
      every day.
    </p>

    <h2>Bet Hilel</h2>
    <Photo side="left" tilt={-2} photo={ABOUT.servicio} alt="A group of young people with instruments at a youth service" caption="A youth service." />
    <p>
      For 11 years I&apos;ve been part of my community, Bet Hilel, and I&apos;ve been through every role. I was a janij, a madrij and a Talmud Torah teacher. Today I&apos;m a mejanej at Majon Guesher, the community&apos;s school for
      leaders and madrijim. There I accompany my students over three years, to educate them across the board in the values of our people.
    </p>
    <PhotoPair
      prints={[
        { photo: ABOUT.caja, tilt: -3, alt: "Mati holding a cardboard box at an activity", caption: "At the hadrajá." },
        { photo: ABOUT.campo, tilt: 2.5, alt: "A group lying on the grass forming a shape, seen from a drone", caption: "An activity, seen from above." },
      ]}
    />

    <h2>With or without software</h2>
    <p>
      In every leadership role I&apos;ve had in the community, I&apos;ve tried to understand and improve the processes I was part of. At Majon Guesher I built Ani-Mejanej, an app to keep attendance, follow-up, practicums and
      vacations, among many other things (the code is on <a href="https://github.com/matekno/presentismo-majon">GitHub</a>). Today it&apos;s used across the department and in other communities in the city.
    </p>
    <p>I try to bring the same way of working from my profession to every community activity I do, with or without software.</p>

    <h2>La Ieshive</h2>
    <Photo side="right" tilt={2} photo={ABOUT.rab} alt="Mati with Rabbi Meir Szames in his office" caption="With Rabbi Meir Szames, in his office." />
    <p>
      After October 7, and after living through the darkest Simchat Torah of our lives and our generation, I started studying at <a href="https://www.instagram.com/la_ieshive/">La Ieshive</a> with Rabbi Meir Szames. That&apos;s how
      I started giving more substance to something I always knew interested me.
    </p>
    <p>I&apos;m still studying, and this year we had the chance to travel to Formosa to share our Torah and lead the High Holiday services for the local community.</p>
    <p>
      Keep reading in <Link href="/en/blog/story">Why I made NavTorah</Link>.
    </p>
  </>
);
