import Link from "next/link";
import { FAMILY_NAMES, TRAIN } from "@/lib/blog/training";
import { FontsFigure, LabeledCropsFigure, RealSifreiFigure, ScrollSheetFigure, SynthGalleryFigure, SynthStagesFigure, type RealSefer } from "./Figures";

const GITHUB = "https://github.com/matekno/navtora";
const HOW = "/en/blog/how-it-works";

const SIFREI: RealSefer[] = [
  {
    id: "shannon",
    name: "Elihu Shannon's sefer",
    detail: "Kibbutz Sa'ad, Israel, 2011. Standard layout.",
    credit: (
      <>
        Photo: Elihu Shannon, <a href="https://commons.wikimedia.org/wiki/File:Sefer-Torah-Elihu-Shannon-2a.pdf">Wikimedia Commons</a>, CC BY-SA 3.0.
      </>
    ),
  },
  {
    id: "kokhav",
    name: "David Kokhav's sefer",
    detail: "Yemenite custom, 226 columns.",
    credit: (
      <>
        Photo: Rabbi David Kokhav, <a href="https://commons.wikimedia.org/wiki/File:David-kokhav-sefer-torah.pdf">Wikimedia Commons</a>, CC BY-SA 3.0.
      </>
    ),
  },
  {
    id: "makhonot",
    name: "A German sefer",
    detail: "Around 1920, restored by Makhon Ot. 190 columns.",
    credit: (
      <>
        Photo: <a href="https://archive.org/details/torah-scroll-germany-ca.-1920s-refurbished-makhon-ot-no.-18157">Internet Archive</a>, CC0.
      </>
    ),
  },
];

const BL_CREDIT = (
  <>
    Photo: British Library, MS Or. 1462, on <a href="https://archive.org/details/sefer-torah-bl-or-1462-images">Internet Archive</a>. Public domain.
  </>
);

export const contentEn = (
  <>
    <p>
      NavTorah reads each column with a small neural network that runs on the phone (how it uses it, step by step, is in <Link href={HOW}>How NavTorah knows which column the sefer is open at</Link>). For a network to learn to
      read, it needs lots of lines along with the text they say. No such set of sefer photos exists, so we made one by computer.
    </p>
    <p>
      A script, <code>synth.py</code>, takes a piece of a real column of the standard layout, writes it in a Hebrew font and then ages it until it looks like a photo taken with a phone.
    </p>

    <h2>One photo, step by step</h2>
    <p>
      This is one of the first photos of the training set. It&apos;s a piece of column {TRAIN.stage.column}, in Vayakhel, written in the {FAMILY_NAMES[TRAIN.stage.family]} font. Each step adds something that happens in a real
      photo.
    </p>
    <SynthStagesFigure lang="en" caption="How a synthetic photo is made, from the clean text to the photo used for training." />
    <ol>
      <li>
        <strong>The text:</strong> the column&apos;s lines, justified as in a sefer, with parts of the neighboring columns at the sides.
      </li>
      <li>
        <strong>The ink:</strong> thicker or thinner strokes, faded patches and small cracks in the letters.
      </li>
      <li>
        <strong>The parchment:</strong> one of seven background colors, with texture and stains, and one of five ink colors. Sometimes a dark band is added at the top or bottom, like the edge of the scroll or the table.
      </li>
      <li>
        <strong>The camera:</strong> perspective, a small turn and the curve of the parchment. The photo is also shrunk, so that lines end up 14 to 48 pixels apart.
      </li>
      <li>
        <strong>The light:</strong> one side darker than the other, sometimes the shadow of a hand or the phone, and sometimes glare.
      </li>
      <li>
        <strong>The final photo:</strong> blur, sometimes motion, noise and JPEG compression.
      </li>
    </ol>
    <p>
      Each step picks its values at random, so no two photos are alike. In 30% of them, the words of each line are also replaced with Torah words picked at random. That way the network can&apos;t guess a word from the ones before
      it and has to read each letter.
    </p>
    <SynthGalleryFigure lang="en" caption="Six more photos from the training set. The ones marked “shuffled words” have Torah words picked at random." />

    <h2>The fonts</h2>
    <p>
      The fonts come from Culmus, a project of free Hebrew fonts. The two STA&quot;M ones, Stam Ashkenaz and Stam Sefarad, appear in almost two out of three photos. The rest are book fonts, so the network sees other shapes of the
      same letters.
    </p>
    <FontsFigure lang="en" caption="The twelve font families, with the share of photos written in each." />

    <h2>From the photo to the line</h2>
    <p>
      The network reads one line at a time. To cut the lines out of each photo we use the same code the app runs (<Link href={HOW}>steps 2 to 5</Link> of the post on how it works). Since the script knows what text it wrote on each
      line and where that line ended up after the photo was warped, it labels each crop with its text. If a crop doesn&apos;t match a line cleanly, it&apos;s dropped, so the network doesn&apos;t learn from a wrong label.
    </p>
    <LabeledCropsFigure
      lang="en"
      caption="Four cropped lines, flipped back for reading, with the text used for training. The first three are from the photo above, and the last one from a photo with shuffled words."
    />

    <h2>The training</h2>
    <p>
      We made 4,000 photos for training and 300 to keep measuring how it was learning. The network is small (about 450,000 parameters) and was trained on a computer&apos;s processor, without a graphics card. The version the app
      uses went 5 times through all the training lines.
    </p>
    <p>Training uses the CTC loss. That is, the network only needs the text of each line, without knowing where in the strip each letter is.</p>

    <h2>How we measured whether it learned</h2>
    <p>To measure it we used three kinds of photos, none of them used for training:</p>
    <ul>
      <li>
        <strong>New synthetic photos:</strong> 200, made like the training ones but kept apart, all with real text.
      </li>
      <li>
        <strong>Scanned sifrei:</strong> four complete sifrei, published under free licenses.
      </li>
      <li>
        <strong>Photos taken with a phone:</strong> 10 frames from two tests we recorded, on a worn sefer and on a printed tikkun.
      </li>
    </ul>
    <p>On the synthetic photos, the app placed 95.5% with confidence and never gave a wrong place. The network got 14.9% of the letters wrong.</p>

    <h2>The real sifrei</h2>
    <p>Synthetic photos aren&apos;t enough to know how the network does with a real sefer. So we tested it on complete scans of four sifrei:</p>
    <ul>
      <li>
        <strong>Elihu Shannon&apos;s sefer:</strong> Elihu Shannon is a sofer from Kibbutz Sa&apos;ad, in Israel. In 2011 he sent photos of every column of his second sefer Torah to be published on Wikimedia Commons, with
        permission to use them freely. That sefer follows the standard layout of 245 columns of 42 lines, so for each photo we know exactly which column it is. That is, it&apos;s a test with the answers.
      </li>
      <li>
        <strong>David Kokhav&apos;s sefer:</strong> commissioned by Rabbi David Kokhav. It&apos;s written on gevil and follows the custom of Yemenite sifrei, in 226 columns.
      </li>
      <li>
        <strong>A German sefer from around 1920:</strong> restored by Makhon Ot, with 190 columns that don&apos;t follow today&apos;s layout.
      </li>
      <li>
        <strong>British Library manuscript Or. 1462:</strong> a 15th-century sefer, written in Oriental script by a sofer whose name isn&apos;t known. The photos show whole sheets, with five to seven columns each, so we cut them
        into single columns.
      </li>
    </ul>
    <p>
      For the last three we don&apos;t know in advance which column each photo is, but we do know the columns come in order. So the test is that every column the app places with confidence lands after the previous one.
    </p>
    <RealSifreiFigure
      lang="en"
      sifrei={SIFREI}
      withColumn={["shannon"]}
      caption="One column from three of these sifrei, as the app read it. In yellow, the edge of the column it found. Each word read is painted by how it compares to the Torah's text where the app placed it. Tap a photo to see it without the drawing. The Shannon and Kokhav photos are licensed CC BY-SA 3.0, and are published here with the drawing under the same license."
    />
    <p>
      The British Library sefer shows the order test well. Below is a whole sheet and its seven columns, cut out one by one. The app placed all seven with confidence, one after the other, from Terumah to Ki Tisa.
    </p>
    <ScrollSheetFigure
      lang="en"
      ids={["bl1", "bl2", "bl3", "bl4", "bl5", "bl6", "bl7"]}
      credit={BL_CREDIT}
      caption="A sheet of the British Library sefer and its seven columns, right to left, with the parasha and the verse of Exodus where the app placed each one. Tap a column to see it without the drawing."
    />

    <h3>The results</h3>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Sefer</th>
            <th className="num">Photos</th>
            <th className="num">Placed with confidence</th>
            <th className="num">Wrong or out of order</th>
            <th className="num">No answer</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Elihu Shannon</td>
            <td className="num">246</td>
            <td className="num">241</td>
            <td className="num">0</td>
            <td className="num">5</td>
          </tr>
          <tr>
            <td>David Kokhav</td>
            <td className="num">226</td>
            <td className="num">225</td>
            <td className="num">0</td>
            <td className="num">1</td>
          </tr>
          <tr>
            <td>Makhon Ot, Germany</td>
            <td className="num">190</td>
            <td className="num">189</td>
            <td className="num">0</td>
            <td className="num">1</td>
          </tr>
          <tr>
            <td>British Library, 15th century</td>
            <td className="num">233</td>
            <td className="num">187</td>
            <td className="num">0</td>
            <td className="num">46</td>
          </tr>
        </tbody>
      </table>
    </div>
    <p>
      In Shannon&apos;s sefer, 240 of the 241 also gave the exact column number. The ones left without an answer are the two songs written as brickwork (Shirat HaYam and Haazinu), which the line finder doesn&apos;t follow, and the
      nesiim of Bamidbar 7, where two columns look too much alike.
    </p>
    <p>
      In the British Library one, 21 columns land before the previous one, but all of them are the first column of a new photo. 16 fall on a column that was already there, because a photo repeats the end of the one before, and 5
      fill gaps that had been left. None contradicts its neighbors.
    </p>

    <h3>The photos taken with a phone</h3>
    <p>
      Last, we tested 10 frames from two tests recorded with a phone, on a worn sefer and on a printed tikkun. They are low-resolution screen recordings, with lines about 17 to 23 pixels high. The app placed all 10 without a
      single mistake, even though the network got about 30% of the letters wrong (counting every <code>?</code> as an error).
    </p>
    <p>
      That is, the network gets many letters wrong, but it&apos;s enough to place the column. What can improve it most is real photos. That&apos;s why, when a scan doesn&apos;t go well, the app offers to send the photo to add it to
      the training. It&apos;s only sent if the person ticks the box.
    </p>

    <h2>The code</h2>
    <p>
      The synthetic photos in this post come from the same code that made the training set (<a href={`${GITHUB}/blob/main/tools/train/blog_figures.py`}>tools/train</a>), and the drawings over the real sifrei come from running the
      app on each photo (<a href={`${GITHUB}/blob/main/tools/eval/src/blog-real.ts`}>tools/eval</a>). The full results are in <a href={`${GITHUB}/blob/main/docs/evaluation.md`}>the evaluation</a>.
    </p>
  </>
);
