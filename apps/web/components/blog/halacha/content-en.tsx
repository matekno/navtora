import type { HalachaContent } from "./Halacha";

const SRL_HALAJA = "https://www.seminariorabinico.org/halaja/";

export const contentEn: HalachaContent = {
  intro: (
    <>
      <p>
        NavTorah is for getting the Torah scroll ready before Shabbat and Yom Tov. On Friday, or the day before the holiday, the gabbai picks the next day's reading in the app, scans the open column and rolls the scroll to where it
        says. In the morning the scroll is already at its place. On Shabbat and Yom Tov the app isn't used, because phones aren't.
      </p>
      <p>This page explains why it makes sense to prepare the scroll beforehand and why the phone stays out of Shabbat, with the sources for each and a link to read them.</p>
      <h2>In short</h2>
      <ul>
        <li>NavTorah is for preparing the Torah scroll before Shabbat and Yom Tov. It isn't used on Shabbat or Yom Tov.</li>
        <li>
          A Torah scroll isn't rolled in front of the congregation, out of respect for it (Yoma 70a, Shulchan Aruch 144:3), and preparing it before the service is the job of the shamash or the reader (Aruch HaShulchan 144:6).
        </li>
        <li>Using a phone on Shabbat and Yom Tov is forbidden. So holds the Conservative movement's current position on electronic devices, from 2012, which forbids the cellular phone and the camera.</li>
      </ul>
    </>
  ),
  sections: [
    {
      id: "who-for",
      text: (
        <>
          <h2>Who it's for</h2>
          <p>
            I'm from the Conservative movement, and phones aren't used on Shabbat. NavTorah isn't meant to be used on Shabbat or Yom Tov: it's meant for preparing them. For those who keep Shabbat, not having the phone is one more
            limit of the day, and the app helps keep that limit from showing in the reading: the day before, each scroll is set at its place, and in the morning nobody has to search.
          </p>
        </>
      ),
      sources: [],
    },
    {
      id: "how-to-prepare",
      text: (
        <>
          <h2>How to use it to prepare</h2>
          <ul>
            <li>
              <strong>The day before.</strong> On Friday, or the day before Yom Tov, you pick the next day's reading, scan the open column and roll to where the app says. The scroll is ready before the holiday begins.
            </li>
            <li>
              <strong>Several scrolls.</strong> On days with two or three readings (Rosh Chodesh, Chanukah, the four parashiyot, Yom Tov), you prepare each scroll at its place.
            </li>
            <li>
              <strong>Markers.</strong> If each aliyah is read by someone else, sticky notes can go between the columns, not touching the letters, at the start of each aliyah, as a guidance from the movement recommends: you find the
              places with the app the day before.
            </li>
            <li>
              <strong>Weekdays.</strong> Mondays, Thursdays and Rosh Chodesh on a weekday don't have the Shabbat problem: the app can be used that same day, and for practice too.
            </li>
          </ul>
        </>
      ),
      sources: [],
    },
    {
      id: "why-prepare",
      text: (
        <>
          <h2>Why prepare the scroll beforehand</h2>
          <p>These sources say nothing about phones. They explain why keeping the community waiting while the sefer is rolled is a problem in itself, and whose job it is to avoid it.</p>
        </>
      ),
      sources: ["yoma-mishnah", "yoma-70a", "sa-144-3", "mb-144", "ahs-144-6", "magen-avraham-144", "several-scrolls", "berakhot-12b", "cjls-torah-reading-2020"],
    },
    {
      id: "why-not-on-shabbat",
      text: (
        <>
          <h2>Why not on Shabbat or Yom Tov</h2>
          <p>
            Using the app means picking up the phone and bringing it to the scroll, turning on the screen, using the camera and sending data to a server. In 1950 the Conservative movement allowed electric lights on Shabbat, but its
            current position on electronic devices forbids the cellular phone and the camera, and outside the movement the great majority of poskim forbid using electrical devices on Shabbat. These are the sources.
          </p>
          <h3>Within the Conservative movement</h3>
        </>
      ),
      sources: ["nevins-2012", "schwartz-weiner-2023", "levin-2020", "reisner-2012", "photography-1984", "golinkin-2020"],
    },
    {
      id: "outside-the-movement",
      text: (
        <>
          <h3>Outside the movement</h3>
          <p>
            In the Orthodox world, the debate is mostly over why it's forbidden: building, creating something new, a custom to uphold, or the spirit of the day. Beyond the device itself, there are writing, muktzeh and
            carrying.
          </p>
        </>
      ),
      sources: ["chazon-ish", "beit-yitzchak", "auerbach", "feinstein", "pninei-halacha", "bleich-cameras", "melachot", "uvdin-dechol"],
    },
    {
      id: "ask",
      text: (
        <>
          <h2>Where to ask</h2>
          <p>
            This is not a halachic ruling. If you have questions about your own case or your community's, ask your rabbi. The <a href={SRL_HALAJA}>Center for Halakhic Studies</a> of the Seminario Rabínico Latinoamericano takes
            questions too (in Spanish).
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
