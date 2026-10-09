# Evaluation

## Matcher on simulated noise

2,000 random windows of 6 to 10 lines from the standard layout, with OCR errors simulated at the given rate per letter. No OCR involved.

| Letter error rate | Top-1 | Confident, right | Confident, wrong | Abstained |
|---|---|---|---|---|
| 10% | 99.9% | 97.5% | 0 | 2.5% |
| 20% | 99.9% | 98.3% | 0 | 1.7% |
| 30% | 99.9% | 97.8% | 0 | 2.2% |
| 40% | 99.8% | 97.9% | 0 | 2.2% |
| 50% | 99.6% | 93.0% | 0 | 6.9% |

## Real OCR, standard layout

Elihu Shannon's sefer (Kibbutz Sa'ad, 2011), columns at 1800 px on the long edge. Every column was located with confidence and none was wrong.

| Configuration | Columns | Mean latency | Output tokens | Letter error rate |
|---|---|---|---|---|
| Opus 5, full column, effort medium | 19 | 52 s | 3,500 | 0.19% |
| Opus 5, 14 lines, effort medium | 5 | 24 s | 1,100 | |
| Opus 5, 14 lines, effort low | 5 | 15 s | 450 | 0.38% |
| Sonnet 5, 14 lines, effort low | 5 | 12 s | 420 | 0.60% |

## Real OCR, non-standard or worn scrolls

There is no manual ground truth for these. Instead the check is that predicted positions advance from one column to the next, and that no confident answer contradicts its neighbors.

| Sefer | Columns | Confident | Abstained | Inconsistent |
|---|---|---|---|---|
| Makhon Ot, Germany 1920, 190 columns of ~50 lines | 8 | 8 | 0 | 0 |
| Kokhav, modern, Yemenite conventions, 226 columns | 8 | 8 | 0 | 0 |
| British Library Or. 1462, 15th century, full sheets with 5–7 columns | 8 | 6 | 2, no legible text | 0 |
| British Library Or. 1462, single columns cropped from those sheets | 20 | 17 | 3, crops without text | 0 |

In the 15th-century scroll, columns that appear twice because consecutive photos overlap were placed 1 and 9 words apart.

## Local reader (on the phone, no API)

The local reader (`packages/vision` plus a 0.45M-parameter CRNN; see [tools/train](../tools/train/README.md)) was trained only on synthetic photos; none of the scans below were used to train it.

**Scanned sifrei** (`pipeline --provider local`), every column of each set that could be fetched:

| Sefer | Columns | Confident | Wrong | Abstained | Notes |
|---|---|---|---|---|---|
| Elihu Shannon, standard layout | 246 | 241, 240 with the exact column number | 0 | 2 ambiguous, 3 insufficient | The ambiguous pair is Bamidbar 7, the offerings of the nesiim. The insufficient ones are the songs in brick layout, which the line finder doesn't follow: Shirat HaYam (column 78) and Haazinu (columns 242 and 243). |
| David Kokhav, Yemenite conventions, 226 columns | 226 | 225 | 0 inconsistent | 1 ambiguous | Every confident placement comes after the previous one. |
| Makhon Ot, Germany ca. 1920, 190 columns | 190 | 189 | 0 inconsistent | 1 ambiguous | Every confident placement comes after the previous one. |
| British Library Or. 1462, 15th century, single columns cropped from 55 sheets | 233 | 187 | 0 inconsistent | 45 insufficient, 1 ambiguous | 21 placements go back, all at the first column of a new photo: 16 land on a column already placed (consecutive photos overlap) and 5 fill gaps between columns placed before. |

Reading takes about 0.35 to 0.4 s per column on a CPU in Node. The Shannon and Kokhav pages come from Commons thumbnails 1920 px wide (`download --pages`), scaled to 1800 px on the long edge like the scans used for Claude.

With the column taken from the span's first word, 15 of the 241 Shannon placements came out one column early. The span was right, but a noisy reading had aligned the photo's first word or two to the last words of the previous column. Words from the bottom of another column can't open a photo of this one, so when a span starts within the last 3 words of a column and runs on into the next, those words are now ignored. 240 of 241 come out exact; the one left (column 97) starts 5 words early, and allowing more words would also move text typed from the true end of a column.

Against the previous rule, compared on everything that has an answer: 2,358 simulated noisy readings inside one column and 388 typed passages across a column boundary give the same column as before; on Shannon, 14 placements and 84 navigations get right and none get worse. On the Kokhav sefer nothing changes. On Makhon Ot 2 of 189 placements change, with 8 navigations better, 8 worse and the same mean error; in a sefer with another layout the standard column is only an estimate either way. Taking the column that holds most of the span was also tried: it fixed all 15, but cut exact navigation on the Kokhav sefer from 74% to 56%.

**Synthetic photos**: 200 windows of 8 to 42 lines from real standard-layout columns, rendered and degraded like phone photos (parchment, stains, uneven light, glare, perspective, curvature, blur, JPEG), with the neighboring columns at the sides.

| Model | Confident, right | Confident, wrong | Abstained | Letter error rate |
|---|---|---|---|---|
| Early checkpoint (1/3 epoch) | 95.0% | 0 | 5.0% | 22.9% |
| Released (5 epochs) | 95.5% | 0 | 4.5% | 14.9% |

Most of the remaining failures come from finding the column, not from reading it.

**Real photos**: the only real photos available were the two field-test recordings below. These are screen recordings at 480 px wide, so a line is about 17 to 23 px high, roughly a quarter of the resolution the app captures. From them come 10 frames: the frozen photo of each test, plus frames from the moments before capture with the camera guide painted out. The letter error rate counts every `?` as an error and compares against the standard layout's text, which the printed tikkun sometimes breaks a word earlier or later, so it is an upper bound.

| Model | Placed (column 132 or 181) | Wrong | Letter error rate | Letters read as `?` |
|---|---|---|---|---|
| Early checkpoint | 9 of 10 | 0 | 44.2% | 23.1% |
| Released | **10 of 10** | 0 | 30.6% | 10.1% |

On the frozen photos the released model's letter error rate is 29.6% for the worn sefer and 18.6% for the printed tikkun. Frames with no scroll in view (the floor, the app's own screens) produce no confident answer.

The threshold below which a letter becomes `?` was swept over these 210 photos: 0.35 gave 94.8% placed, 0.5 and 0.65 gave 95.7%, with no wrong answer at any setting. The app uses 0.5, which keeps more letters for the matcher.

In Chromium, with a fake camera streaming the worn-sefer frame, the app reads the photo in a worker in about 1.2 s and shows the result about 2.8 s after the tap, against about 17 s with Claude Opus 5.

## Field tests

Two recordings on physical scrolls, both with the default configuration (Opus 5, effort low, 14 lines). The videos are in `apps/web/public/demo/`.

| Scroll | Target | Placed at | Instruction | Scan time |
|---|---|---|---|---|
| Worn sefer, stained and faded parchment | Yom Kippur, first aliyah (Vayikra 16:1, column 131) | Acharei Mot, Vayikra 16:8-15, column 132 | 1 column to the right | 17 s |
| Printed tikkun | Rosh Hashanah maftir (Bamidbar 29:1, column 190) | Balak, Bamidbar 22:4-10, column 181 | 9 columns to the left | 16 s |

Both placements and column counts match the standard layout data.

## Does the model read or recite?

A synthetic column had six words replaced by other real Hebrew words. The model transcribed all six as written; none reverted to the biblical text. When the image cut off the start of the lines, it transcribed only what was visible.

## Reproducing

```bash
pnpm --filter @navtora/eval noise -- --windows 2000 --cer 0.1,0.2,0.3,0.4        # matcher only, simulated noise
pnpm --filter @navtora/eval download -- all                                       # scans into tools/eval/data/scans
pnpm --filter @navtora/eval split -- all                                          # one image per column, 1800 px long edge
pnpm --filter @navtora/eval pipeline -- --set shannon --provider oracle           # full pipeline without spending on OCR
pnpm --filter @navtora/eval pipeline -- --set shannon --provider claude --limit 20 # Claude OCR for comparison, cached by image hash
pnpm --filter @navtora/eval local -- --synth ../train/data/synth/eval --real photo.png:132   # local reader, no API
```

The Claude provider is only in `tools/eval`, to compare readers; the app doesn't use it. It reads `ANTHROPIC_API_KEY` from the environment or from `tools/eval/.env.local`. Scans and the OCR cache live in `tools/eval/data/`, which is not committed. Other scripts in `tools/eval` measure letter error rate (`cer`), consistency on scrolls without ground truth (`consistency`), column cropping (`crop`) and the read-or-recite test (`autocomplete`).
