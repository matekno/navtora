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
pnpm --filter @navtora/eval pipeline -- --set shannon --provider claude --limit 20 # real OCR, cached by image hash
```

Scans and the OCR cache live in `tools/eval/data/`, which is not committed. Other scripts in `tools/eval` measure letter error rate (`cer`), consistency on scrolls without ground truth (`consistency`), column cropping (`crop`) and the read-or-recite test (`autocomplete`).
