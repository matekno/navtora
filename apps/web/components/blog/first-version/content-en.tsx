import Link from "next/link";
import { CLAUDE_CALL } from "./snippets";

const GITHUB = "https://github.com/matekno/navtora";

export const contentEn = (
  <>
    <p>
      Today NavTorah reads each column with its own network, on the phone (that&apos;s told in <Link href="/en/blog/how-it-works">How NavTorah knows which column the sefer is open at</Link>). The first version, in September
      2026, didn&apos;t have that network. The app took the photo, shrank it to 1,800 pixels on the long side and sent it to the server, which passed it to Claude Opus 5 through the Anthropic API. Claude transcribed the lines, and
      from there everything went on as it does now, with the same search among the words of the Torah.
    </p>

    <h2>What we asked of Claude</h2>
    <p>
      From the start, the idea was for the model only to read. The position and the confidence are decided by the search, which can be tested and measured without spending anything. So what we asked of Claude was quite narrow:
    </p>
    <ul>
      <li>Transcribe the first 14 lines, letters only, without nikkud, cantillation or punctuation.</li>
      <li>Keep the final letter forms and the spaces between words.</li>
      <li>
        Write <code>?</code> for each letter that can&apos;t be read.
      </li>
      <li>Count every visible line, even the ones it doesn&apos;t transcribe.</li>
      <li>Read the ink and don&apos;t fill in from memory. If the parchment says something other than what&apos;s expected, write what the parchment says.</li>
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

    <h2>Does it read or recite?</h2>
    <p>
      Claude knows the Torah, so we had to check that it read what was written and not what it remembers. To test it, we made a column with six words swapped for other real Hebrew words. Claude transcribed all six as written, and
      none went back to the original text. When the image cut off the start of the lines, it transcribed only what was visible.
    </p>

    <h2>How it did</h2>
    <p>
      It read very well. We tried how much the model could think (the <code>effort</code> parameter) and how many lines it transcribed, on scanned columns of Elihu Shannon&apos;s sefer, a standard-layout sefer that a sofer in
      Israel published on Wikimedia Commons. All of them were placed correctly.
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
      14 lines were enough to place the column, and transcribing less cut the time and the cost a lot. With Opus 5, low effort and 14 lines, each photo cost about 3 US cents. On 78 scanned images from 4 sifrei it never gave a wrong
      position, and in the tests on real sifrei each scan took 16 or 17 seconds.
    </p>

    <h2>Why did we change it?</h2>
    <p>The MVP worked, but it had three problems for use in a congregation:</p>
    <ul>
      <li>
        <strong>Time:</strong> 16 seconds with the phone pointed at the sefer is a lot, especially if you have to scan more than once.
      </li>
      <li>
        <strong>Cost:</strong> every photo cost money, so the app couldn&apos;t be opened to anyone.
      </li>
      <li>
        <strong>The photo:</strong> it had to leave the phone and go through a server.
      </li>
    </ul>
    <p>
      With our own network, in the tests on a sefer each scan took 1 or 2 seconds. It costs nothing per scan and the photo doesn&apos;t leave the phone. In exchange, it reads quite a bit worse, with many more wrong letters or{" "}
      <code>?</code>. Since the search is designed for readings with mistakes, it still gets to the right column. How we trained that network is in <Link href="/en/blog/training">another post</Link>.
    </p>
  </>
);
