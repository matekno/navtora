import type { HalachaContent } from "./Halacha";

const SRL_HALAJA = "https://www.seminariorabinico.org/halaja/";

export const contentEn: HalachaContent = {
  intro: (
    <>
      <p>
        NavTorah gets used exactly when it's needed most: on Shabbat and Yom Tov mornings, when the sefer has to be set to the day's reading. That raises a real halachic question: can a phone be used for it?
      </p>
      <p>
        This page is not a ruling. It explains where I'm coming from with the app and gathers the sources we found, those that support it and those that don't, with a summary of each and a link to read it in full. The idea is
        that each person and each community decides with their rabbi.
      </p>
      <h2>In short</h2>
      <ul>
        <li>The app is designed within the Conservative movement's line that, since 1950, doesn't consider electricity in itself a melachah.</li>
        <li>Within the same movement there are stricter positions: the current official position on devices, from 2012, forbids using a phone or a camera on Shabbat.</li>
        <li>Outside the movement, the great majority of poskim forbid using electrical devices on Shabbat.</li>
        <li>The app's purpose, sparing the congregation a wait while the scroll is rolled, has direct support in the Talmud and the Shulchan Aruch.</li>
        <li>Using it the day before, on Chol HaMoed or on a weekday raises no question at all.</li>
      </ul>
    </>
  ),
  sections: [
    {
      id: "where-from",
      text: (
        <>
          <h2>Where I'm coming from</h2>
          <p>
            I'm from the Conservative movement. I designed NavTorah within its line on Shabbat, which starts with the 1950 responsum by Rabbis Adler, Agus and Friedman: electricity in itself is not a melachah, and it may be used to
            enjoy Shabbat or to help in the performance of a mitzvah. Reading the Torah in public is a mitzvah of the whole community, and what the app does is help that reading run smoothly. One of that responsum's authors, Theodore
            Friedman, later taught at the Seminario Rabínico Latinoamericano in Buenos Aires, which also published in Spanish the texts of the Rabbinical Assembly's Committee on Jewish Law and Standards on technology on Shabbat and on
            the Torah reading that appear below.
          </p>
          <p>
            NavTorah is meant for people who live Shabbat within that framework: people for whom a phone on Shabbat isn't an absolute taboo but one more limit, handled with judgment. For them I offer it as a help: so the gabbai finds
            the place in a second, so the congregation doesn't wait in silence while the scroll is rolled, and so whoever reads isn't embarrassed.
          </p>
          <p>It isn't a unanimous position, not even within the movement, and I don't want to present it as one. So below are all the sources.</p>
        </>
      ),
      sources: ["responsum-1950"],
    },
    {
      id: "what-it-does",
      text: (
        <>
          <h2>What the app actually does</h2>
          <p>Halachic questions turn on details. These are NavTorah's:</p>
          <ul>
            <li>You hold the phone and bring it to the scroll.</li>
            <li>The screen is on and shows what the camera sees.</li>
            <li>To scan, you tap a button. The photo is read on the phone and isn't saved to the gallery or anywhere else.</li>
            <li>Only the text that was read goes to the server, and the server keeps a record of each scan: the result and that text, without the photo.</li>
            <li>The answer shows on the screen, and the app can read it aloud.</li>
            <li>Optionally, you can turn on the phone's flashlight, or type a few words instead of scanning.</li>
          </ul>
          <p>We found no source that deals with an app that reads an image without saving it. The ones that deal with screens, cameras and data records are below.</p>
        </>
      ),
      sources: [],
    },
    {
      id: "kavod-hatzibur",
      text: (
        <>
          <h2>Why it matters: respect for the congregation</h2>
          <p>These sources say nothing about phones. They explain why keeping the community waiting while the sefer is rolled is a problem in itself, and whose job it is to avoid it.</p>
        </>
      ),
      sources: ["yoma-mishnah", "yoma-70a", "sa-144-3", "mb-144", "ahs-144-6", "magen-avraham-144", "several-scrolls", "berakhot-12b", "cjls-torah-reading-2020"],
    },
    {
      id: "permit",
      text: (
        <>
          <h2>Those that permit, with conditions</h2>
          <p>Within the Conservative movement there are several positions that don't consider electricity in itself a melachah. None deals with an app like this one; each says how far it goes.</p>
        </>
      ),
      sources: ["neulander-1950", "fine-leff-2023", "spitz-2012", "heller-2020"],
    },
    {
      id: "restrict-movement",
      text: (
        <>
          <h2>Those that forbid or restrict, within the movement</h2>
          <p>The current official position on devices is stricter than 1950's, and in 2023 the Committee approved, on the same day, a permissive position and a restrictive one on electricity.</p>
        </>
      ),
      sources: ["nevins-2012", "schwartz-weiner-2023", "levin-2020", "reisner-2012", "photography-1984", "golinkin-2020"],
    },
    {
      id: "forbid",
      text: (
        <>
          <h2>Those that forbid, outside the movement</h2>
          <p>
            In the Orthodox world, the great majority of poskim forbid using electrical devices on Shabbat. What they debate is why: whether it's building, creating something new, a custom to uphold, or a matter of the spirit of
            the day. Besides the device itself, there are the usual questions: writing, muktzeh and carrying.
          </p>
        </>
      ),
      sources: ["chazon-ish", "beit-yitzchak", "auerbach", "feinstein", "pninei-halacha", "bleich-cameras", "melachot", "uvdin-dechol"],
    },
    {
      id: "without-phone",
      text: (
        <>
          <h2>If you'd rather not use a phone on Shabbat</h2>
          <p>Everything above is about using the app on Shabbat or Yom Tov. There are ways to make use of it without that:</p>
          <ul>
            <li>
              <strong>Prepare the scroll beforehand.</strong> The app works any day: on Friday you pick Shabbat's reading and leave the sefer at the place. The Aruch HaShulchan puts this task “before the service”, and Golinkin applies
              the same logic to everything: do it before Shabbat begins.
            </li>
            <li>
              <strong>Leave markers.</strong> With several aliyot or several scrolls, sticky notes can go between the columns, not touching the letters, as the Committee's guidance recommends: find each place with the app on Friday
              and mark it.
            </li>
            <li>
              <strong>Prepare each scroll.</strong> On days with two or three readings, each scroll can be left open at its place beforehand, as the Shulchan Aruch does.
            </li>
            <li>
              <strong>Practice on weekdays.</strong> Mondays and Thursdays, Rosh Chodesh, Chol HaMoed: on weekdays there are few barriers to technology in the service, as Heller notes.
            </li>
          </ul>
          <p>For those who do use it on Shabbat, these are ideas found in the sources for doing so with more care. None of them is a permission:</p>
        </>
      ),
      sources: ["before-shabbat", "kevod-habriyot", "kelachar-yad"],
    },
    {
      id: "ask",
      text: (
        <>
          <h2>Where to ask</h2>
          <p>
            This is not a halachic ruling. If you have questions about your own case or your community's, ask your rabbi. The Seminario's <a href={SRL_HALAJA}>Center for Halakhic Studies</a> takes questions too (in Spanish).
          </p>
        </>
      ),
      sources: ["srl-halacha"],
    },
  ],
  outro: (
    <p>
      Is a source missing, or something misquoted? The sources on this page live in the <a href="https://github.com/matekno/navtora/blob/main/apps/web/components/blog/halacha/sources.ts">code</a>, and can be corrected like any other
      part of the app.
    </p>
  ),
};
