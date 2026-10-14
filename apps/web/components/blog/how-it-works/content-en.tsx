import { FIG } from "@/lib/blog/how-it-works";
import { FAMILY_NAMES, TRAIN } from "@/lib/blog/training";
import { AlignmentFigure, CropsFigure, CtcFigure, MoveFigure, ScoreFigure, VotesFigure } from "./Figures";
import type { PostContent } from "./HowItWorks";
import { CLAUDE_CALL } from "./snippets";
import { FontsFigure, LabeledCropsFigure, SynthGalleryFigure, SynthStagesFigure } from "./Training";

const GITHUB = "https://github.com/matekno/navtora";
const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 });
const r = FIG.result;
const top = FIG.edges[0]!;
const bottom = FIG.edges[FIG.edges.length - 1]!;
const ex = FIG.voteExample;

export function contentEn(): PostContent {
  return {
    labels: {
      photo: "Photo",
      ink: "Ink",
      compare: "Compare the photo with the ink map",
      captions: {
        photo: `A frame from a real test, at ${r.parasha?.en}, column ${r.column} of the standard layout.`,
        ink: "Drag the line to compare the photo with the ink map.",
        column: "In yellow, the column's edges. Below, the ink summed from top to bottom, with the margins as dips.",
        lines: "On the sides, in green, the ink summed row by row in the first and last strips (one peak per line). In yellow, each line's path.",
        crops: "The band cut out around each line.",
        read: "What the network read on each line. In orange, the letters it couldn't read.",
        match: "Each word read, painted where the network read it. Green: same as in the sefer. Yellow: easily confused letters, or ?. Red: different. Gray: extra. Dotted: left out of the comparison.",
      },
    },
    intro: (
      <>
        <p>
          It's Friday, and the sefer has to be ready for Shabbat. It was left open at Masei, at the end of Bamidbar, and tomorrow's reading starts at Deuteronomy 1:1. That is exactly what NavTorah is for. From a photo of the
          open column, it tells you where the sefer is open, how many columns to roll and which way.
        </p>
        <p>
          To find its place, the app <strong>reads</strong> the column (mistakes and all) and <strong>searches</strong> for those words among the Torah's 80,316. It doesn't need to know what each column looks like, so it works
          with any sefer. The photo in this post is a frame from one of the tests we recorded, and what's drawn over it comes from running the app's code on it.
        </p>
      </>
    ),
    steps: [
      {
        stage: "photo",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 1</span>The photo
            </h2>
            <p>
              The photo is a frame from the screen recording of one of our tests, cropped to what the camera showed (we painted out the app's yellow guide). It's {FIG.width} by {FIG.height} pixels, roughly a quarter of the
              resolution the app takes photos at. The parchment is yellowed and stained, the column looks narrower at the top than at the bottom because the phone wasn't parallel to the sefer, and the lines bend a little because the
              parchment isn't flat. Parts of the neighboring columns show at the sides, too.
            </p>
            <p>In the app, everything that follows up to the text being read happens on the phone, and the photo isn't sent anywhere.</p>
          </div>
        ),
      },
      {
        stage: "ink",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 2</span>Separating ink from parchment
            </h2>
            <p>
              The first thing the app does is take the lighting out of the photo. The parchment's brightness changes slowly across the photo (a shadow on one side, a lamp on the other, a stain), while ink changes abruptly, from one
              pixel to the next.
            </p>
            <p>
              To pull them apart, the app makes a tiny copy of the photo, 160 pixels on its long side. In that copy, each point takes the lightest value among its neighbors. Since the letters are thin, they vanish, and only the background is
              left. Then the app divides the photo by that background. That is, where there is parchment the result is white, and where there is ink it stays dark, in shade or in light.
            </p>
            <p>If you drag the line over the photo, you'll see the stains and the yellow go away while the letters stay.</p>
          </div>
        ),
      },
      {
        stage: "column",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 3</span>Finding the column
            </h2>
            <p>
              Parts of three columns show in the photo, and the one we want is the middle one. To find it, the app sums the ink from top to bottom at each horizontal position. That sum is drawn below the photo. It's high where there is
              text and almost zero in the blank margins between columns.
            </p>
            <p>
              The column is the stretch of text that contains the middle of the photo, between two of those dips. Since the phone may be crooked, before summing the app tries tilting the sum a few degrees each way and keeps the angle
              that gives the sharpest edges. It also measures the edges in several horizontal bands separately (in this photo, {FIG.edges.length}), so they follow the perspective. The column is {Math.round(top.x1 - top.x0)} pixels wide at the top and{" "}
              {Math.round(bottom.x1 - bottom.x0)} at the bottom.
            </p>
          </div>
        ),
      },
      {
        stage: "lines",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 4</span>Following each line
            </h2>
            <p>
              In a sefer, the lines hang from the <em>sirtut</em>, the rules the scribe scores before writing. That's why they are parallel and evenly spaced, and the app takes advantage of it.
            </p>
            <p>
              First it measures that spacing. It cuts the column into six narrow strips, sums the ink row by row in each, and looks for how many pixels the pattern takes to repeat. In this photo the lines are{" "}
              {nf.format(FIG.pitch)} pixels apart.
            </p>
            <p>
              Then it cuts the column into wider strips ({FIG.strips.x.length - 1} in this photo). In each, the row-by-row sum makes one peak per line (the sums for the first and last strips are drawn at the sides of the photo). If
              the phone is crooked or the parchment curves, the peaks in one strip don't sit at the same height as those in the next. By comparing neighboring strips, the app measures how much each line rises or falls from one to the
              other, and builds each line's path from that. In this photo it found {FIG.lines.length} lines.
            </p>
          </div>
        ),
      },
      {
        stage: "crops",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 5</span>Cutting and straightening
            </h2>
            <p>
              Each line is cut out along its path, as if the parchment were smoothed flat with your fingers, into a strip {FIG.cropHeight} pixels high. That way the curves are gone.
            </p>
            <p>
              The strip is also mirrored. Why? Because the network that reads it goes left to right, and Hebrew is written right to left. Mirrored, the line's first letter comes first and the text comes out in order.
            </p>
            <CropsFigure lang="en" caption="The photo's first six lines, as cut by the app. On the left, as the network gets them, and on the right, flipped back so we can read them." />
          </div>
        ),
      },
      {
        stage: "read",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 6</span>Reading letter by letter
            </h2>
            <p>
              To read, the app uses a small neural network, 1.8 MB, that runs on the phone (the first version read with Claude, which I tell about in the <a href="#appendix-mvp">second appendix</a>). A few convolutional layers look
              at the shapes of the strokes, and an LSTM that looks both ways along the line adds context. The network moves along the strip 4 pixels at a time and, at each step, says which letter it thinks it sees, or “nothing”.
            </p>
            <p>
              To get from steps to letters, repeats are merged and the “nothings” dropped (this is called CTC decoding). When the most likely letter over a stretch stays below 50%, the app doesn't guess and writes <code>?</code>.
            </p>
            <CtcFigure
              lang="en"
              caption={`The first two words of line ${FIG.ctc.line + 1} of the photo. Under each crop is what the network said at each step, with its probability. Then come the letters that are left and, at the bottom, the sefer's.`}
            />
            <p>
              In the first word, the network read <span className="he">ב</span> where it says <span className="he">מ</span>, and <span className="he">ה</span> where it says <span className="he">ת</span> (two letters that look alike in
              STA&quot;M). It also hesitated on two letters, which became <code>?</code>. In the second word, the <span className="he">א</span> shows up in two steps in a row and counts as one, and the word comes out perfect.
            </p>
            <p>
              The network doesn't know the Torah by heart. <a href="#appendix-training">It was trained only on synthetic photos</a>, made from real columns set in STA&quot;M fonts and aged by computer, with stains, shadows, glare and
              curves. In 30% of those photos the words were shuffled at random. That way the network can't guess the next word from context and has to read each letter. How those photos are made, with examples, is in the{" "}
              <a href="#appendix-training">first appendix</a>, at the end of the post.
            </p>
            <p>
              So it makes plenty of mistakes. Over the photo is what it read on each line, and there's a lot of orange, especially at the bottom, where the photo is blurrier. Still, the next step doesn't need a perfect reading.
            </p>
          </div>
        ),
      },
      {
        stage: "match",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 7</span>Searching 80,316 words
            </h2>
            <p>
              The reading has mistakes, like <span className="he">יהות</span> instead of <span className="he">יהוה</span> or <span className="he">ביואב</span> instead of <span className="he">מואב</span>. So searching for the text as
              read would get nowhere. Instead, every word read votes for where the photo starts. This part happens on the server, which gets the text and not the photo.
            </p>
            <p>
              For example, <span className="he">{ex.word}</span> is word {ex.k + 1} of the reading, and in the Torah it sits at position {nf.format(ex.position)}. So it votes for the photo starting at position{" "}
              {nf.format(ex.origin)}. Rare words weigh more than common ones (<span className="he">{ex.word}</span> appears {ex.count} times in the whole Torah, <span className="he">{ex.common}</span>{" "}
              {nf.format(ex.commonCount)} times), and similar words vote too, a little less. With {FIG.tokens} words voting, the votes pile up in a single place.
            </p>
            <VotesFigure lang="en" caption="The votes of the words read, across the whole Torah. Almost all of them land on one spot, at the end of Bamidbar." />
            <p>
              Around the places with the most votes, the app compares word by word, the way two versions of the same text are compared. That comparison knows that in STA&quot;M script <span className="he">ב</span> is easily confused
              with <span className="he">כ</span>, <span className="he">ד</span> with <span className="he">ר</span>, or <span className="he">ה</span> with <span className="he">ח</span>, and that <code>?</code> can be any letter, so
              those mistakes are cheap.
            </p>
            <AlignmentFigure
              lang="en"
              lines={[2, 3, 4, 5]}
              caption="Four lines of the photo. On top is what the network read, below what the sefer says. Over the photo, the same colors are used for every line."
            />
          </div>
        ),
      },
      {
        stage: "match",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 8</span>Is it sure?
            </h2>
            <p>
              Finding a place isn't enough to give an answer. The app requires a minimum of aligned words over more than one line, and compares the best place with the runner-up. Here the best ({r.parasha?.en}, column {r.column}) scored {nf.format(r.score)} points against{" "}
              {nf.format(r.second ?? 0)} for the runner-up, with {r.alignedTokens} words aligned over {r.linesCovered} lines.
            </p>
            <ScoreFigure lang="en" caption="The alignment score of the best place against the runner-up's." />
            <p>
              When the top two are close, the app doesn't guess. That happens, for example, in Bamidbar 7, where the offering of each of the twelve nesiim is repeated almost word for word. In that case the app shows the options and asks
              for another photo, ideally with the top of the column in view. In 2,000 simulated tests with up to half the letters misread, it never gave a wrong place with confidence.
            </p>
          </div>
        ),
      },
      {
        stage: "none",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Step 9</span>Which way to move the sefer
            </h2>
            <p>
              What comes out of all this is a position in words, which works for any sefer. To count columns, the app uses the standard 245-column layout. This photo is of column {r.column}, and Deuteronomy 1:1 is in{" "}
              {FIG.navigation.targetColumn}.
            </p>
            <p>
              Since the text runs right to left, going toward Devarim means going left, {FIG.navigation.columns} columns here. If the sefer follows the standard layout, the count is exact. If not, it's an approximation, and it's
              worth scanning again when you get there. Once there, the app tells you which line the reading starts on.
            </p>
            <MoveFigure lang="en" caption="The columns around the photo, right to left as in the sefer." />
          </div>
        ),
      },
    ],
    outro: (
      <>
        <h2>What goes to the server?</h2>
        <p>
          The text that was read and a few details of the scan (how long it took, which reading you were looking for, and a random number that identifies the phone). The photo stays on the phone, unless someone sends it on purpose
          to help improve the network.
        </p>
        <h2>What it doesn't do well yet</h2>
        <ul>
          <li>The two songs written as brickwork, Shirat HaYam and Haazinu, because the line finder doesn't follow them.</li>
          <li>Repeated passages, like the nesiim. There the app says there is more than one option instead of picking one.</li>
          <li>Sifrei that don't follow the standard layout, where the column count is approximate.</li>
        </ul>
        <h2>The code</h2>
        <p>
          The code is open and on <a href={GITHUB}>GitHub</a>. The results of every test are in <a href={`${GITHUB}/blob/main/docs/evaluation.md`}>the evaluation</a>, and the script that made this post's figures is in{" "}
          <a href={`${GITHUB}/blob/main/tools/eval/src/blog-figures.ts`}>tools/eval</a>. That script runs on a computer the same code the app runs on the phone. The ink sums in steps 3 and 4, the votes and the word-by-word
          comparison are recomputed with the same method so they can be drawn. The photos in the first appendix come from the <a href={`${GITHUB}/blob/main/tools/train/blog_figures.py`}>same code</a> that made the training photos.
        </p>
      </>
    ),
    appendices: [
      {
        id: "appendix-training",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Appendix 1</span>How we trained the network
            </h2>
            <p>
              For a network to learn to read, it needs lots of lines along with the text they say. No such set of sefer photos exists, so we made one by computer. A script, <code>synth.py</code>, takes a piece of a real column of the
              standard layout, writes it in a Hebrew font and then ages it until it looks like a photo taken with a phone.
            </p>
            <h3>One photo, step by step</h3>
            <p>
              This is one of the first photos of the training set. It's a piece of column {TRAIN.stage.column}, in Vayakhel, written in the {FAMILY_NAMES[TRAIN.stage.family]} font. Each step adds something that happens in a real
              photo.
            </p>
            <SynthStagesFigure lang="en" caption="How a synthetic photo is made, from the clean text to the photo used for training." />
            <ol>
              <li>
                <strong>The text:</strong> the column's lines, justified as in a sefer, with parts of the neighboring columns at the sides.
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
            <p>Each step picks its values at random, so no two photos are alike. In 30% of them, the words of each line are also replaced with Torah words picked at random, as I told in step 6.</p>
            <SynthGalleryFigure lang="en" caption="Six more photos from the training set. The ones marked “shuffled words” have Torah words picked at random." />
            <h3>The fonts</h3>
            <p>
              The fonts come from Culmus, a project of free Hebrew fonts. The two STA&quot;M ones, Stam Ashkenaz and Stam Sefarad, appear in almost two out of three photos. The rest are book fonts, so the network sees other shapes of
              the same letters.
            </p>
            <FontsFigure lang="en" caption="The twelve font families, with the share of photos written in each." />
            <h3>From the photo to the line</h3>
            <p>
              The network reads one line at a time. To cut the lines out of each photo we use the same code the app runs, the one in steps 2 to 5. Since the script knows what text it wrote on each line and where that line ended up
              after the photo was warped, it labels each crop with its text. If a crop doesn't match a line cleanly, it's dropped, so the network doesn't learn from a wrong label.
            </p>
            <LabeledCropsFigure
              lang="en"
              caption="Four cropped lines, flipped back for reading, with the text used for training. The first three are from the photo above, and the last one from a photo with shuffled words."
            />
            <h3>The training</h3>
            <p>
              We made 4,000 photos for training and 300 to keep measuring how it was learning. Another 200, all with real text, were kept aside for the final test. The network is small (about 450,000 parameters) and was trained on a
              computer's processor, without a graphics card. The version the app uses went 5 times through all the training lines.
            </p>
            <p>
              Training uses the CTC loss, which goes hand in hand with the decoding in step 6. That is, the network only needs the text of each line, without knowing where in the strip each letter is.
            </p>
            <h3>How it did</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Test</th>
                    <th className="num">Placed with confidence</th>
                    <th className="num">Wrong</th>
                    <th className="num">Letter error rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>200 synthetic photos not used for training</td>
                    <td className="num">95.5%</td>
                    <td className="num">0</td>
                    <td className="num">14.9%</td>
                  </tr>
                  <tr>
                    <td>10 frames from two recorded tests, on a worn sefer and on a printed tikkun</td>
                    <td className="num">10 of 10</td>
                    <td className="num">0</td>
                    <td className="num">30.6%</td>
                  </tr>
                  <tr>
                    <td>246 scanned columns of Elihu Shannon&apos;s sefer</td>
                    <td className="num">241</td>
                    <td className="num">0</td>
                    <td className="num"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              The network gets many letters wrong, around 30% on the test frames if every <code>?</code> counts as an error. Still, as steps 7 and 8 show, it's enough to place the column, and in none of these tests did it give a wrong
              place with confidence.
            </p>
            <p>
              What can improve it most is real photos. That's why, when a scan doesn't go well, the app offers to send the photo to add it to the training. It's only sent if the person ticks the box.
            </p>
          </div>
        ),
      },
      {
        id: "appendix-mvp",
        content: (
          <div className="prose-blog">
            <h2>
              <span className="step">Appendix 2</span>The MVP, with the Anthropic API
            </h2>
            <p>
              The first version of NavTorah, in September 2026, had no network of its own. The app took the photo, shrank it to 1,800 pixels on the long side and sent it to the server, which passed it to Claude Opus 5 through the
              Anthropic API. Claude transcribed the lines, and from there everything went on as it does now, with the same search as in steps 7 and 8.
            </p>
            <p>
              From the start, the idea was for the model only to read. The position and the confidence are decided by the search, which can be tested and measured without spending anything. So what we asked of Claude was quite narrow:
            </p>
            <ul>
              <li>Transcribe the first 14 lines, letters only, without nikkud, cantillation or punctuation.</li>
              <li>Keep the final letter forms and the spaces between words.</li>
              <li>
                Write <code>?</code> for each letter that can't be read.
              </li>
              <li>Count every visible line, even the ones it doesn't transcribe.</li>
              <li>Read the ink and don't fill in from memory. If the parchment says something other than what's expected, write what the parchment says.</li>
            </ul>
            <p>
              The answer came in a fixed format (structured output, with a JSON schema). It held the lines, which ones were doubtful, where there were blank spaces and how many lines were visible. This is the call, shortened.
            </p>
            <pre>
              <code>{CLAUDE_CALL}</code>
            </pre>
            <p>
              The full code is still in <a href={`${GITHUB}/blob/main/tools/eval/src/claude-ocr.ts`}>tools/eval</a>, where we use it to compare both ways of reading on the same photos.
            </p>
            <h3>Does it read or recite?</h3>
            <p>
              Claude knows the Torah, so we had to check that it read what was written and not what it remembers. To test it, we made a column with six words swapped for other real Hebrew words. Claude transcribed all six as written,
              and none went back to the original text. When the image cut off the start of the lines, it transcribed only what was visible.
            </p>
            <h3>How it did</h3>
            <p>
              It read very well. We tried how much the model could think (the <code>effort</code> parameter) and how many lines it transcribed, on scanned columns of the Shannon sefer. All of them were placed correctly.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Configuration</th>
                    <th className="num">Time per photo</th>
                    <th className="num">Letter error rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Opus 5, full column, medium effort</td>
                    <td className="num">52 s</td>
                    <td className="num">0.19%</td>
                  </tr>
                  <tr>
                    <td>Opus 5, 14 lines, low effort</td>
                    <td className="num">15 s</td>
                    <td className="num">0.38%</td>
                  </tr>
                  <tr>
                    <td>Sonnet 5, 14 lines, low effort</td>
                    <td className="num">12 s</td>
                    <td className="num">0.60%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              14 lines were enough to place the column, and transcribing less cut the time and the cost a lot. With Opus 5, low effort and 14 lines, each photo cost about 3 US cents. On 78 scanned images from 4 sifrei it never gave a
              wrong position, and in the tests on real sifrei each scan took 16 or 17 seconds.
            </p>
            <h3>Why did we change it?</h3>
            <p>The MVP worked, but it had three problems for use in a congregation:</p>
            <ul>
              <li>
                <strong>Time:</strong> 16 seconds with the phone pointed at the sefer is a lot, especially if you have to scan more than once.
              </li>
              <li>
                <strong>Cost:</strong> every photo cost money, so the app couldn't be opened to anyone.
              </li>
              <li>
                <strong>The photo:</strong> it had to leave the phone and go through a server.
              </li>
            </ul>
            <p>
              With our own network, in the tests on a sefer each scan took 1 or 2 seconds. It costs nothing per scan and the photo doesn't leave the phone. In exchange, it reads quite a bit worse, with many more wrong letters or{" "}
              <code>?</code>. Since the search is designed for readings with mistakes, it still gets to the right column.
            </p>
          </div>
        ),
      },
    ],
  };
}
