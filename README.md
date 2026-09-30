# NavTorah

Find your place in a Sefer Torah with your phone. Point the camera at the open column and NavTorah tells you the book, parashah, aliyah and verses, and how many columns to move to reach the reading you want. When it isn't sure, it says so instead of guessing.

The app is available in English and Spanish.

## How it works

NavTorah doesn't recognize the image; it locates text. A vision model (Claude) transcribes the top lines of the column, errors and all. A matcher then finds that transcription in the full Torah text (80,316 words) using diagonal voting and banded alignment, with an edit distance that treats common STA"M letter confusions (ב/כ, ד/ר, ה/ח/ת…) as cheap.

The matcher decides, not the model. Confidence comes from the margin between the best and second-best candidate. Repeated passages, like the offerings of the nesiim in Bamidbar 7, come back as ambiguous with both candidates.

Positions are word indexes, so any layout works. On scrolls with the standard 245-column, 42-line layout it also gives the exact column and line.

## Navigation

Pick a target: the reading for a date, a holiday or special day, a parashah and aliyah, or a verse. The calendar comes from [hebcal](https://github.com/hebcal) and handles each year's variants: Rosh Hashanah on Shabbat, chol hamoed, fast days, Rosh Chodesh, and special Shabbatot with a maftir from a second sefer.

After each scan NavTorah says how many columns to move and which way. The count is exact on standard-layout scrolls and estimated on others, getting better with each scan. Once you're there, it tells you the line and the first words. Instructions can be read aloud.

## Running it

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm test
```

Copy `apps/web/.env.example` to `apps/web/.env.local` and set `ANTHROPIC_API_KEY`. To try the whole UI without a key, use the oracle provider, which returns the real text of a column with simulated OCR noise:

```bash
OCR_PROVIDER=oracle OCR_ORACLE_COLUMN=50 pnpm --filter @navtora/web dev:http
```

The camera only works in a secure context. To test from a phone on the same network, `pnpm dev` runs Next.js with local HTTPS.

The site has a public landing page at `/en` and `/es`; the app itself is at `/en/app` and `/es/app`. If you host a copy, set `ADMIN_PASSWORD` to require a password for the app and its API, so strangers can't spend your API credits. Without it, the app is open.

With the defaults (Claude Opus 5, effort low, 14 lines) a scan takes about 15 seconds and costs about 3 US cents. `OCR_MODEL=claude-sonnet-5` brings it to about 1 cent with similar accuracy on clean scrolls.

## Repository layout

| Path | What it does |
|---|---|
| `packages/core` | The engine, in plain TypeScript: normalization, index, STA"M-aware distance, matcher, navigation. |
| `packages/data` | Torah text, the standard 245-column layout, and parashot with aliyot, built from tikkun.io. |
| `packages/ocr` | OCR providers: Claude vision, an oracle for testing without a key, and a disk cache for evaluation. |
| `apps/web` | The Next.js PWA: camera, results, navigation, target picker, manual entry. |
| `tools/eval` | Evaluation on openly licensed scanned sifrei and on simulated noise. |

`packages/data/dist` is committed. `pnpm build:data` regenerates it from `packages/data/raw`.

## Evaluation

On a scanned standard-layout sefer with known positions, every column was placed correctly. On three older or non-standard scrolls, one of them from the 15th century, every confident answer was consistent with the neighboring columns, and the app abstained on crops without readable text. With up to 50% of letters wrong in simulated OCR output, the matcher never placed a passage wrongly with confidence. Details and how to reproduce them are in [docs/evaluation.md](docs/evaluation.md).

It has not yet been tested on a real sefer in a synagogue.

## Privacy

A photo leaves the phone only when you tap the read button. It goes to the server and to the Anthropic API for transcription. NavTorah never stores images. The server logs only timings, token counts and the result status.

## License

The code is [MIT](LICENSE).

- The Torah text and standard layout come from [tikkun.io](https://github.com/akivajgordon/tikkun.io) (MIT). See [packages/data/NOTICE.md](packages/data/NOTICE.md).
- The web app uses `@hebcal/core` (GPL-2.0) and `@hebcal/leyning` (BSD-2-Clause) for the reading calendar. If you distribute a build of `apps/web`, the GPL applies to that combined work.
- The scans used for evaluation are not in this repository. `tools/eval/src/download.ts` lists their sources and licenses.
