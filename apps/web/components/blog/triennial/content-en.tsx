import type { SourcedContent } from "../SourcedArticle";
import { SelectorFigure } from "./SelectorFigure";

export const contentEn: SourcedContent = {
  intro: (
    <>
      <p>
        Most communities read the whole Torah every year, one parashah per Shabbat, from Bereshit to Vezot Haberakhah. Some, mostly in the Conservative movement, follow the triennial cycle. That is, each Shabbat they read
        the same parashah as everyone else, but only a third of it, and they complete the Torah in three years.
      </p>
      <p>NavTorah lets you choose either cycle. Here I tell in a few words where the triennial cycle comes from and how it is read today. To understand it well, I recommend reading the sources I leave in each part.</p>
    </>
  ),
  sections: [
    {
      id: "where-it-comes-from",
      text: (
        <>
          <h2>Where it comes from</h2>
          <p>
            The triennial cycle isn&apos;t new. The Gemara, in Megillah 29b, tells that in the Land of Israel the Torah reading was completed in three years rather than one. Over time, the annual cycle became the one used in
            almost every community.
          </p>
          <p>Maimonides mentions it too. In the Laws of Prayer (13:1) he explains the annual cycle and adds that some complete the Torah in three years, though it isn&apos;t a widespread custom.</p>
        </>
      ),
      sources: ["meguila-29b", "rambam"],
    },
    {
      id: "the-rabbinical-assembly",
      text: (
        <>
          <h2>How the Rabbinical Assembly brought it to today</h2>
          <p>
            In the 1980s, many Conservative congregations in the United States already read a triennial cycle, but each in its own way. That is why the Rabbinical Assembly&apos;s Committee on Jewish Law and Standards (CJLS)
            studied the question, and there were two proposals.
          </p>
          <ul>
            <li>
              <strong>Lionel Moses</strong> proposed going back to the ancient cycle of the Land of Israel, with the Torah divided into 154 sedarim read one after another over three years. The Committee did not accept it.
            </li>
            <li>
              <strong>Elliot Dorff</strong> proposed keeping each week&apos;s parashah and reading the first third in the first year, the second third in the second year and the last third in the third year. The Committee
              approved it in 1987.
            </li>
          </ul>
          <p>
            On that model, Rabbi Richard Eisenberg built the complete system, which the CJLS adopted in 1988. He divided each parashah into three parts, and each part into seven aliyot and maftir. Two changes came later, one in
            2012 for a rare case and one in 2020 for some parashot that are sometimes read together.
          </p>
        </>
      ),
      sources: ["dorff-1987", "moses", "eisenberg-1988"],
    },
    {
      id: "monday-and-thursday",
      text: (
        <>
          <h2>Monday and Thursday</h2>
          <p>
            On weekdays there are two customs, and Dorff&apos;s responsum lets a community choose either. Some read on Monday and Thursday the start of the parashah, as in the annual cycle. Others read the start of what will be
            read on Shabbat. For example, in 5787 the parashah Vayeshev starts at Genesis 37:1, but on Shabbat it is read from 38:1.
          </p>
          <p>
            The Gemara (Megillah 21b) and the Shulchan Arukh (Orach Chaim 137:1) speak of reading at least ten verses when three people are called up. Some weeks, the first three triennial aliyot come to fewer (in Ki Teitzei of
            5788, for example, they come to nine). In those cases the app warns about it, and it is best to ask the community&apos;s rabbi or gabbai what to do.
          </p>
        </>
      ),
      sources: ["diez-pesukim"],
    },
    {
      id: "in-navtorah",
      text: (
        <>
          <h2>How to choose it in NavTorah</h2>
          <p>
            On the “Where to?” screen, tick “Triennial cycle”. The Date tab then shows the option for Monday and Thursday, and on the Parashah tab you choose the year of the cycle. The choice is kept on the phone.
          </p>
          <SelectorFigure
            lang="en"
            alts={["The Date tab with the triennial cycle ticked and the option for Monday and Thursday", "The Parashah tab with the year of the cycle to choose, from 1 to 3"]}
            caption="On the left, a Monday with the triennial option, which shows the first three aliyot of Shabbat. On the right, the parashah Vayakhel in year 1, when it is read together with Pekudei."
          />
          <p>
            To know what is read each Shabbat, NavTorah uses hebcal&apos;s triennial library, which follows Eisenberg&apos;s system with the 2012 and 2020 changes. That system counts the years from 5744, so 5787 is the second
            year of the cycle. If your community started the cycle in another year or follows another triennial system, the years won&apos;t match.
          </p>
        </>
      ),
      sources: ["hebcal"],
    },
  ],
  outro: <p className="text-[15px] text-muted">This isn&apos;t a halachic ruling. I only tell what the triennial cycle is and where to read more.</p>,
};
