import { FIG } from "@/lib/blog/how-it-works";
import { AlignmentFigure, CropsFigure, CtcFigure, MoveFigure, ScoreFigure, VotesFigure } from "./Figures";
import type { PostContent } from "./HowItWorks";

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
        match: "Green: same as in the sefer. Yellow: easily confused letters, or ?. Red: different. Gray: not used.",
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
              To read, the app uses a small neural network, 1.8 MB, that runs on the phone. A few convolutional layers look at the shapes of the strokes, and an LSTM that looks both ways along the line adds context. The network moves
              along the strip 4 pixels at a time and, at each step, says which letter it thinks it sees, or “nothing”.
            </p>
            <p>
              To get from steps to letters, repeats are merged and the “nothings” dropped (this is called CTC decoding). When the most likely letter over a stretch stays below 50%, the app doesn't guess and writes <code>?</code>.
            </p>
            <CtcFigure
              lang="en"
              caption={`The start of line ${FIG.ctc.line + 1} of the photo. Under the strip is what the network said at each step. The letters in orange stayed below 50% and became ?, and two steps in a row with the same letter count as one.`}
            />
            <p>
              The network doesn't know the Torah by heart. It was trained only on synthetic photos, made from real columns set in STA&quot;M fonts and aged by computer, with stains, shadows, glare and curves. In 30% of those photos the
              words were shuffled at random. That way the network can't guess the next word from context and has to read each letter.
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
        stage: "photo",
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
          comparison are recomputed with the same method so they can be drawn.
        </p>
      </>
    ),
  };
}
