import Link from "next/link";
import type { HalachaContent } from "./Halacha";

const SRL_HALAJA = "https://www.seminariorabinico.org/halaja/";

export const contentEn: HalachaContent = {
  intro: (
    <>
      <p>
        Finding someone who can read Torah is a challenge for many communities, especially in the diaspora, where most people don&apos;t know enough Hebrew. In May 2026, the Rabbinical Assembly&apos;s Committee on Jewish Law and
        Standards (CJLS) approved a responsum on what to do when there is no one who can read. Its answer is that the reading isn&apos;t dropped, and that everything possible should be done to read from the scroll.
      </p>
      <p>
        I designed NavTorah to help in that situation. I&apos;m in it myself, and I know many people who are too (I tell about it in <Link href="/en/blog/story">Why I made NavTorah</Link>).
      </p>
    </>
  ),
  sections: [
    {
      id: "the-responsum",
      text: (
        <>
          <h2>The CJLS responsum</h2>
          <p>
            The responsum is by Rabbi David J. Fine and is called “When No One Can Read Torah” (OH 142:2.2026a). It asks what options a community has when no one can read from the Torah scroll properly, and whether a printed
            chumash may be used.
          </p>
          <p>
            Its ruling is that reading from a chumash <strong>doesn&apos;t fulfill the obligation of the public reading</strong>, which is done from the handwritten scroll. From there, it ranks these options from best to least
            good:
          </p>
          <ol>
            <li>A capable reader reads from the scroll in the traditional way. Each community must encourage its readers and encourage more people to learn to read Torah, or hire a capable reader.</li>
            <li>A capable minor reads, while someone else says the blessings.</li>
            <li>The reader glances at a chumash now and then, between phrases, but reads every word from the Torah scroll.</li>
            <li>The gabbaim help the reader, whispering each phrase into their ear for them to repeat aloud, gently correcting, or giving hand signals.</li>
            <li>In a pressing situation (she&apos;at hadechak), some would have someone read aloud from a chumash while the reader follows each word in the scroll, mouthing it.</li>
          </ol>
          <p>
            Fine also rules out reading without the cantillation, because it is a halachic requirement and a tradition worth every effort to keep. If the lack of a reader is permanent, he suggests reading straight from the chumash,
            without opening the Torah scroll and without blessings, so no one thinks it replaces reading from the scroll. He also notes that the scroll isn&apos;t marked, not in pencil and not with transparent sheets over it.
          </p>
          <p>
            The responsum was approved with 7 votes in favor, 11 against and 5 abstentions. In the CJLS, a responsum with 6 or more votes in favor is an official position of the Committee, even if more vote against it. Among those
            who voted in favor is Rabbi Marcelo Polakoff, of Córdoba, Argentina.
          </p>
          <p>The responsum explains in detail the sources it rests on, so for those it&apos;s best to read it in full.</p>
        </>
      ),
      sources: ["fine-2026"],
    },
    {
      id: "where-it-helps",
      text: (
        <>
          <h2>Where NavTorah helps</h2>
          <p>
            The first four options have something in common. In all of them the Torah is read from the scroll, and for that the scroll has to be at the right place and the reader has to know where their aliyah starts. In a community
            without a regular reader, whoever prepares the scroll often doesn&apos;t know the text by heart. That&apos;s where the app helps:
          </p>
          <ul>
            <li>
              <strong>Preparing the scroll:</strong> the day before, the gabbai picks the reading and scans the open column, and the app says how many columns to roll and on which line each aliyah starts. There&apos;s no need to
              know the text by heart.
            </li>
            <li>
              <strong>Getting more people to read:</strong> someone who is learning can go to their community&apos;s sefer during the week and find in the scroll the aliyah they prepared from a chumash or a tikkun. That&apos;s
              the responsum&apos;s first option, more people learning to read.
            </li>
            <li>
              <strong>Without touching the scroll:</strong> the app doesn&apos;t mark the scroll or put anything on it, so it respects what the responsum asks.
            </li>
          </ul>
          <p>Personally, I think this is where the app helps most. A person still does the reading, from the scroll and with the cantillation, and the app makes sure that person finds their place.</p>
        </>
      ),
      sources: [],
    },
    {
      id: "ask",
      text: (
        <>
          <h2>Where to ask</h2>
          <p>
            This is not a halachic ruling. If you have questions about your own case or your community&apos;s, ask your rabbi. The <a href={SRL_HALAJA}>Center for Halakhic Studies</a> of the Seminario Rabínico Latinoamericano takes
            questions too (in Spanish).
          </p>
        </>
      ),
      sources: [],
    },
  ],
};
