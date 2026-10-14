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
        photo: `A frame from a real test: ${r.parasha?.en}, column ${r.column} of the standard layout.`,
        ink: "Drag the line to compare the photo with the ink map.",
        column: "In yellow, the column's edges. Below, the ink summed from top to bottom: the dips are the margins.",
        lines: "On the sides, in green, the ink summed row by row in the first and last strips: one peak per line. In yellow, each line's path.",
        crops: "The band cut out around each line.",
        read: "What the network read on each line. In orange, the letters it couldn't read.",
        match: "Green: same as in the sefer. Yellow: easily confused letters, or ?. Red: different. Gray: not used.",
      },
    },
    intro: (
      <>
        <p>
          It's Shabbat morning. The sefer was left open at Masei, at the end of Bamidbar, and today's reading starts at Deuteronomy 1:1. How far do you roll it, and which way? Let's follow one real photo, taken with the app over a
          sefer, from the moment it leaves the camera until the app says “2 columns to the left”.
        </p>
        <p>
          One thing first: NavTorah doesn't “recognize” the image, and it doesn't know what each column looks like. It does something simpler and sturdier: it <strong>reads</strong> the column, mistakes and all, and then{" "}
          <strong>searches</strong> for those words among the Torah's 80,316. Everything drawn over the photo below came from running the app on it; none of it is drawn by hand.
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
              This is the photo as it arrived: {FIG.width} by {FIG.height} pixels, a frame from one of our test recordings. It isn't a studio shot. The parchment is yellowed and stained, the column looks narrower at the top than at the
              bottom because the phone wasn't parallel to the sefer, and the lines bend a little because the parchment isn't flat. The neighboring columns peek in at the sides.
            </p>
            <p>The photo doesn't leave the phone. Everything that follows, up to the text being read, happens there.</p>
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
              The first job is getting rid of the lighting. The parchment's brightness changes slowly across the photo (a shadow on one side, a lamp on the other, a stain), while ink changes abruptly, from one pixel to the next.
            </p>
            <p>
              To pull the two apart, the app shrinks the photo to 160 pixels on its long side. In that tiny copy, each point takes the lightest value among its neighbors: the letters, being thin, vanish, and only the background is
              left. Then it divides the photo by that background. Where there is parchment the result is white; where there is ink it stays dark, in shade or in light.
            </p>
            <p>Drag the line over the photo to compare: the stains and the yellow go away, the letters stay.</p>
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
              Parts of three columns show in the photo, and the one that matters is the middle one. To find it, the app sums the ink from top to bottom at each horizontal position. Below the photo you can see that sum: high where there
              is text, almost zero in the blank margins between columns.
            </p>
            <p>
              The column is the stretch of text that contains the middle of the photo, between two of those dips. Before summing, the app tries tilting the sum a few degrees each way, in case the phone was crooked, and keeps the angle
              that gives the sharpest edges. It also measures the edges in five horizontal bands separately, so they follow the perspective: in this photo the column is {nf.format(Math.round(top.x1 - top.x0))} pixels wide at the top and{" "}
              {nf.format(Math.round(bottom.x1 - bottom.x0))} at the bottom.
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
              In a sefer the lines hang from the <em>sirtut</em>, the rules the scribe scores before writing: they are parallel and evenly spaced. The app takes advantage of that.
            </p>
            <p>
              It cuts the column into {FIG.strips.x.length - 1} vertical strips and, in each strip, sums the ink row by row. Each line makes a peak; at the sides of the photo you can see those sums for the first and last strips. The
              distance between peaks is the line pitch: {nf.format(FIG.pitch)} pixels in this photo.
            </p>
            <p>
              If the phone is crooked or the parchment curves, the peaks in one strip don't sit at the same height as those in the next. By comparing neighboring strips, the app measures how much each line rises or falls from one to
              the other, and builds each line's path from that. In this photo it found {FIG.lines.length} lines.
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
              Each line is cut out along its path, as if the parchment were smoothed flat with your fingers, into a strip {FIG.cropHeight} pixels high. The curves are gone.
            </p>
            <p>
              One detail: the strip is mirrored. The network that reads it goes through it left to right, and Hebrew is written right to left; mirrored, the line's first letter comes first and the text comes out in order.
            </p>
            <CropsFigure lang="en" caption="The photo's first six lines, as cut by the app. On the left, as the network gets them; on the right, flipped back so we can read them." />
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
              Now for the reading. It's done by a small neural network, 1.8 MB, that runs on the phone. A few convolutional layers look at the shapes of the strokes, and an LSTM that looks both ways along the line adds context. The
              network moves along the strip 4 pixels at a time and, at each step, says which letter it thinks it sees, or “nothing”.
            </p>
            <p>
              To get from steps to letters, repeats are merged and the “nothings” dropped: this is called CTC decoding. When the most likely letter over a stretch stays below 50%, the app writes <code>?</code> instead of guessing.
            </p>
            <CtcFigure
              lang="en"
              caption={`The start of line ${FIG.ctc.line + 1} of the photo. Under the strip, what the network said at each step; the letters in orange stayed below 50% and became ?. Two steps in a row with the same letter count as one.`}
            />
            <p>
              The network doesn't know the Torah by heart: it was trained only on synthetic photos, real columns set in STA&quot;M fonts and aged by computer, with stains, shadows, glare and curves. In 30% of those photos the words
              were shuffled at random, so that it would learn to read what it sees rather than recite what it expects.
            </p>
            <p>
              So it makes mistakes. Over the photo you can see what it read on each line, and there's plenty of orange, especially at the bottom, where the photo is blurrier. That's fine: the next step doesn't need a perfect reading.
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
              The reading has mistakes: <span className="he">יהות</span> instead of <span className="he">יהוה</span>, <span className="he">ביואב</span> instead of <span className="he">מואב</span>. Searching for the text as read would get
              nowhere. So every word read casts a vote.
            </p>
            <p>
              <span className="he">{ex.word}</span> is word {ex.k + 1} of the reading, and in the Torah it sits at position {nf.format(ex.position)}. So it votes for the photo starting at {nf.format(ex.origin)}. Rare words weigh more:{" "}
              <span className="he">{ex.word}</span> appears {ex.count} times in the whole Torah, <span className="he">{ex.common}</span> {nf.format(ex.commonCount)} times. Similar words vote too, a little less. With {FIG.tokens} words
              voting, the votes pile up in a single place.
            </p>
            <VotesFigure lang="en" caption="The votes of the words read, spread across the whole Torah. Almost all of them land on one spot, at the end of Bamidbar." />
            <p>
              Around the places with the most votes, the app compares word by word, like a tool that compares two versions of a text. The comparison knows that in STA&quot;M script <span className="he">ב</span> is easily confused with{" "}
              <span className="he">כ</span>, <span className="he">ד</span> with <span className="he">ר</span>, or <span className="he">ה</span> with <span className="he">ח</span>, and that <code>?</code> can be any letter: those mistakes are cheap.
            </p>
            <AlignmentFigure
              lang="en"
              lines={[2, 3, 4, 5]}
              caption="Four lines of the photo: on top what the network read, below what the sefer says. Over the photo, the same colors for every line."
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
              Finding a place isn't enough to give an answer: the app compares the best place with the runner-up. Here the best, {r.parasha?.en} at column {r.column}, scored {nf.format(r.score)} points and the runner-up{" "}
              {nf.format(r.second ?? 0)}. It won by a mile, with {r.alignedTokens} words aligned over {r.linesCovered} lines.
            </p>
            <ScoreFigure lang="en" caption="The alignment score of the best place against the runner-up's." />
            <p>
              When the top two are close, the app doesn't guess. That happens, for example, in Bamidbar 7, where the offering of each of the twelve nesiim is repeated almost word for word: the app shows the options and asks for another
              photo, ideally with the top of the column in view. In 2,000 tests with up to half the letters misread, it never gave a wrong place with confidence.
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
              What comes out of all this is a position in words, not a column, so it works for any sefer, whatever its layout. In sifrei that follow the standard 245-column layout, the exact column is known too: this one is{" "}
              {r.column}. Deuteronomy 1:1 is in {FIG.navigation.targetColumn}.
            </p>
            <p>
              Since the text runs right to left, going toward Devarim means going left: {FIG.navigation.columns} columns. If the sefer has another layout, the app estimates how many are left from the words per column it measured in the
              photo, and the count improves with every new photo. Once you're there, it tells you which line the reading starts on.
            </p>
            <MoveFigure lang="en" caption="The columns around the photo, right to left as in the sefer." />
          </div>
        ),
      },
    ],
    outro: (
      <>
        <h2>In short</h2>
        <p>
          One photo, a second or two on the phone, and the answer. Only the text that was read goes to the server; the photo doesn't, unless someone sends it on purpose to help improve the network.
        </p>
        <p>
          What it doesn't do well yet: the two songs written as brickwork, Shirat HaYam and Haazinu, because the line finder doesn't follow them; and repeated passages like the nesiim, where it says there is more than one option
          instead of picking one.
        </p>
        <p>
          The code is open and on <a href={GITHUB}>GitHub</a>. The results of every test are in <a href={`${GITHUB}/blob/main/docs/evaluation.md`}>the evaluation</a>, and the script that made this post's figures is in{" "}
          <a href={`${GITHUB}/blob/main/tools/eval/src/blog-figures.ts`}>tools/eval</a>.
        </p>
      </>
    ),
  };
}
