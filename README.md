# NavTorah

Find your place in a Sefer Torah with your phone. Point the camera at the open column and NavTorah tells you the book, parashah, aliyah and verses, and how many columns to move to reach the reading you want. When it isn't sure, it says so instead of guessing.

The app is free, with no ads and no sign-up, and available in English and Spanish. The phone reads the photo itself; only the text goes to the server.

## Demo

Two real tests, recorded with an earlier, Spanish-only version of the app. The previews play at 3x; click one for the full video.

| A worn sefer | A printed tikkun |
|---|---|
| [![A worn sefer being scanned](apps/web/public/demo/worn-sefer-preview.webp)](apps/web/public/demo/worn-sefer.mp4) | [![A printed tikkun being scanned](apps/web/public/demo/printed-tikkun-preview.webp)](apps/web/public/demo/printed-tikkun.mp4) |
| Target: the first aliyah of Yom Kippur. The scroll is open at Acharei Mot, column 132, and the app says 1 column to the right. | Target: the maftir of Rosh Hashanah. The book is open at Balak, column 181, and the app says 9 columns to the left. |

## How it works

NavTorah doesn't recognize the image; it locates text. First the column is transcribed, errors and all. A matcher then finds that transcription in the full Torah text (80,316 words) using diagonal voting and banded alignment, with an edit distance that treats common STA"M letter confusions (ב/כ, ד/ר, ה/ח/ת…) as cheap.

The matcher decides, not the model. Confidence comes from the margin between the best and second-best candidate. Repeated passages, like the offerings of the nesiim in Bamidbar 7, come back as ambiguous with both candidates.

Positions are word indexes, so any layout works. On scrolls with the standard 245-column, 42-line layout it also gives the exact column and line.

### Reading on the phone

By default the phone reads the photo itself, with no API and no cost, and sends only the text. Classical image processing (`packages/vision`) flattens the lighting, finds the column between its blank margins and follows each line across it, through tilt and curvature. A small neural network (a CRNN of 0.45M parameters, run with ONNX Runtime Web) then reads each line. It reads worse than a large vision model, but the matcher doesn't need a perfect reading: letters the network is unsure of come out as `?`, which the matcher treats as a wildcard, so it still places the column or says it can't.

The network was trained on synthetic photos of real columns in STA"M fonts, aged and photographed in software; see [tools/train](tools/train/README.md). When a scan fails, the app asks whether the person wants to send that photo to improve the reader: real photos are what will help the model most.

## Navigation

Pick a target: the reading for a date, a holiday or special day, a parashah and aliyah, or a verse. The calendar comes from [hebcal](https://github.com/hebcal) and handles each year's variants: Rosh Hashanah on Shabbat, chol hamoed, fast days, Rosh Chodesh, and special Shabbatot with a maftir from a second sefer.

After each scan NavTorah says how many columns to move and which way. The count is exact on standard-layout scrolls and estimated on others, getting better with each scan. Once you're there, it tells you the line and the first words. Instructions can be read aloud.

## Feedback and dedications

After each result the app asks "Did it help?". A "no" asks what went wrong and offers to send the photo, unticked by default; after a scan it couldn't place, it offers to send the photo too. A "yes" shows how to support the app: dedicating a week (shown with that Shabbat's parashah) or a jag (shown the week before and during it). People get in touch through the contact you configure, and you add the dedication in the admin panel; the app and the landing page then show who the week is dedicated by.

## Admin panel

At `/es/admin` or `/en/admin`, with `ADMIN_PASSWORD`. It shows people and scans per day, how many were placed, ambiguous or not placed, the 👍 and 👎 with their comments and photos, the latest scans with the text that was read, and the dedications, where you add and remove them. Each phone gets a random anonymous id to count people; there are no accounts and no IP addresses are stored.

## Running it on a server

Requires Docker with Compose. The app, its SQLite database and the photos sent with feedback run in one container, with the data in a volume.

```bash
cp .env.example .env    # set ADMIN_PASSWORD, CONTACT_EMAIL, CONTACT_WHATSAPP, TZ
docker compose up -d --build
```

It listens on `127.0.0.1:3000` (`BIND_ADDRESS` and `PORT` in `.env`). Point your reverse proxy there, for example with nginx:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The proxy must serve HTTPS: phones only open the camera on a secure page. If the proxy runs in another container, set `BIND_ADDRESS=0.0.0.0` or put both on the same Docker network. The app limits requests per IP using `X-Forwarded-For`, so don't expose its port directly to the internet.

| Variable | What it does |
|---|---|
| `ADMIN_PASSWORD` | Password for the admin panel. Without it the panel is disabled. |
| `CONTACT_EMAIL`, `CONTACT_WHATSAPP` | How people reach you to dedicate a week or a jag. WhatsApp in international format, e.g. `5491112345678`. |
| `DONATE_URL` | Optional https link to a donation page (Buy Me a Coffee, Mercado Pago…). |
| `TZ` | Time zone for the daily stats and for when a week starts, e.g. `America/Argentina/Buenos_Aires`. |

Updating: `git pull && docker compose up -d --build`. Logs: `docker compose logs -f`. The data is in the `navtora-data` volume (`navtora.db` and `photos/`). To back up the database while the app runs:

```bash
docker compose exec navtora node -e "require('fs').rmSync('/data/backup.db', { force: true }); new (require('node:sqlite').DatabaseSync)('/data/navtora.db').exec(\"VACUUM INTO '/data/backup.db'\")"
docker compose cp navtora:/data/backup.db ./navtora-backup.db
```

## Developing

Requires Node 22.13+ and pnpm.

```bash
pnpm install
pnpm test
pnpm dev     # Next.js with local HTTPS, to test the camera from a phone on the same network
```

The reader needs no configuration. For the admin panel and the support options, copy `apps/web/.env.example` to `apps/web/.env.local`. The database goes to `apps/web/data/` unless `DATA_DIR` says otherwise.

The site has a public landing page at `/en` and `/es`; the app itself is at `/en/app` and `/es/app`. A scan takes a second or two and costs nothing.

## Repository layout

| Path | What it does |
|---|---|
| `packages/core` | The engine, in plain TypeScript: normalization, index, STA"M-aware distance, matcher, navigation. |
| `packages/data` | Torah text, the standard 245-column layout, and parashot with aliyot, built from tikkun.io. |
| `packages/vision` | Image processing for the local reader: lighting, column and line detection, line crops. No dependencies. |
| `packages/ocr` | OCR providers: local (vision + CRNN, with the model runner injected), an oracle that simulates OCR noise, and a disk cache for evaluation. |
| `apps/web` | The Next.js PWA: camera, results, navigation, target picker, manual entry, feedback, dedications and the admin panel. |
| `tools/eval` | Evaluation on openly licensed scanned sifrei, on simulated noise, and of the local reader; also a Claude vision reader, only to compare against. |
| `tools/train` | Synthetic training data and training of the local reader. |

`packages/data/dist` is committed. `pnpm build:data` regenerates it from `packages/data/raw`.

## Evaluation

On a scanned standard-layout sefer with known positions, every column was placed correctly. On three older or non-standard scrolls, one of them from the 15th century, every confident answer was consistent with the neighboring columns, and the app abstained on crops without readable text. With up to 50% of letters wrong in simulated OCR output, the matcher never placed a passage wrongly with confidence. Details and how to reproduce them are in [docs/evaluation.md](docs/evaluation.md).

It has also been used on a worn sefer and on a printed tikkun; see the [demo](#demo).

The local reader, trained only on synthetic photos, placed 241 of the 246 columns of the Shannon sefer, 240 of them with the exact column number (the rest are the nesiim and the two songs in brick layout), 225 of 226 of the Kokhav sefer, 189 of 190 of Makhon Ot and 187 of 233 British Library crops, with no wrong or out-of-order answer. It also placed all 10 real frames from the two recordings.

## Privacy

The photo never leaves the phone: only the transcribed text goes to the server. There are no accounts. To know whether the app works, the server keeps each scan's result, timing and transcribed text, with a random id the phone makes up; it stores no IP addresses. A photo is sent and kept only when the person ticks the box to send it with feedback, to train the reader.

## License

The code is [MIT](LICENSE).

- The Torah text and standard layout come from [tikkun.io](https://github.com/akivajgordon/tikkun.io) (MIT). See [packages/data/NOTICE.md](packages/data/NOTICE.md).
- The local reader runs on [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) (MIT). Its training images are rendered with the [Culmus](https://culmus.sourceforge.io) fonts (GPL-2.0 with a font exception); the fonts are not distributed here.
- The web app uses `@hebcal/core` (GPL-2.0) and `@hebcal/leyning` (BSD-2-Clause) for the reading calendar. If you distribute a build of `apps/web`, the GPL applies to that combined work.
- The scans used for evaluation are not in this repository. `tools/eval/src/download.ts` lists their sources and licenses.
