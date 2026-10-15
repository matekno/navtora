import Link from "next/link";
import { Photo, PhotoPair } from "./Photos";

export const contentEn = (
  <>
    <p>
      At my Bar Mitzvah, as in almost every Conservative congregation, I got a very good education, but I wasn&apos;t taught to read Torah. I was taught to read my aliyah.
    </p>
    <p>
      From my formal education, I can read a text in Hebrew, though my spoken Hebrew isn&apos;t very good. If I prepare the text and go over the words with a teacher, I can read aliyot. Not long ago I learned taamei hamikra,
      the cantillation, and it helps me a lot to prepare an aliyah to read myself.
    </p>

    <h2>The High Holidays in Formosa</h2>
    <p>
      I&apos;ve been studying with Rabbi Meir Szames at <a href="https://www.instagram.com/la_ieshive/">La Ieshive</a>, and he offered me the chance to lead the High Holiday services at the Jewish community of Formosa, in
      northern Argentina.
    </p>
    <Photo side="right" tilt={2.5} id="bima" alt="Mati and Bet Fleischer wearing tallitot, seated in front of the ark" caption="With Bet Fleischer, in Formosa." />
    <p>
      I have a community background, and I had led youth services at my own community, Bet Hilel. Still, I had never led so much, or so far from home. I was scared on several fronts: reading so many aliyot, blowing the shofar,
      answering questions and learning the prayers.
    </p>
    <p>
      I could prepare for all of that. For several months I met every week to study with Bet Fleischer, who led the services with me, by video call, in person and in prayer. I studied the aliyot and prepared on lots of fronts.
    </p>

    <h2>The fear of not finding the aliyot</h2>
    <p>
      But one of my biggest worries was getting there and not being able to find the aliyot in the sefer. Nobody there could read from the sefer, and I was afraid I wouldn&apos;t have signal to call my rabbi. I talked to friends
      and mentors, and each one gave me a very different tip. That only worried me more, and the trip kept getting closer.
    </p>
    <p>
      So I started studying how a sefer works, how standard the way it&apos;s written is, and how the columns are laid out. And that&apos;s how I started programming. The first MVP used the Anthropic API to read the column (I
      tell about it in <Link href="/en/blog/first-version">NavTorah&apos;s first version</Link>).
    </p>

    <h2>At the synagogue</h2>
    <Photo side="left" tilt={-2} id="puerta" alt="Mati and Bet Fleischer at the door of the Sociedad Israelita" caption="At the door of the Sociedad Israelita." />
    <p>
      When I got to Formosa and we went to the synagogue, one of the first things we did was put the sefer in place. Quite naturally, the kids who were helping their parents get everything ready for the first night of Rosh
      Hashanah started coming over. They wanted to see and understand that parchment I was using (which belongs to them too!).
    </p>
    <p>
      It&apos;s a heavy parchment, which even I find intimidating, for the words and teachings it holds, and also for its script, which they had seen very few times. Even so, it has the magic of drawing them in and making them
      want to know what it&apos;s about. The sefer feels familiar to them because it&apos;s our age-old tradition, even though they&apos;re seeing it almost for the first time.
    </p>
    <p>
      With that same curiosity, I tried to hide my fear. And there, the MVP of this app, which I had made for myself, worked. The kids helped me roll the scroll, and we turned it into a very valuable moment of learning.
    </p>
    <PhotoPair
      prints={[
        { id: "telefono", tilt: -3, alt: "Mati with his phone in front of the open sefer on the bimah", caption: "Finding the place in the sefer." },
        { id: "chicos", tilt: 2.5, alt: "Mati showing the open sefer to two kids", caption: "The kids, looking at the sefer." },
      ]}
    />

    <h2>NavTorah today</h2>
    <p>
      Since then I&apos;ve improved NavTorah, so it&apos;s accessible to anyone and doesn&apos;t depend on AI providers. Today it reads the sefer with its own network, right on the phone. It was also a beautiful technical
      challenge (I tell about it in <Link href="/en/blog/how-it-works">How NavTorah knows which column the sefer is open at</Link>).
    </p>

    <h2>Reading from the sefer</h2>
    <p>
      All Jews have a love for the Torah, but there are barriers that make it hard to reach. The internet let us reach ancient sources, with translations, explanations, commentaries, discussions and essays from every stream and
      movement.
    </p>
    <p>
      The Conservative movement wrote a very interesting responsum about this (I summarize it in <Link href="/en/blog/halacha">What to do when no one can read Torah</Link>). Basically, it says that if no one can read the Torah,
      that doesn&apos;t make it fine to read from a chumash, and that everything possible should be done to read from the sefer. It makes sense, because the whole ritual of the Torah reading is unique and beautiful, even from the
      preparation the day before.
    </p>
    <p>I hope NavTorah serves other communities and other people in my same situation, and that everyone can keep up the tradition of reading straight from the Torah.</p>

    <h2>Thanks</h2>
    <p>
      Special thanks to my rabbi, Meir Szames, who offered me this opportunity. Thanks also to La Ieshive, to Bet Fleischer, with whom I prepared everything and shared the work, and to the whole Sociedad Israelita of Formosa.
    </p>
  </>
);
