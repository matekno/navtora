# Local recognizer

The local OCR reads a column on the phone, with no API and no cost. It has two parts:

- `packages/vision` (TypeScript, no dependencies) turns a photo into line crops: it flattens the lighting, finds the column between its blank margins, follows each line across the column (tilt and curvature included), and cuts a 32-pixel-high strip per line.
- A small CRNN (CNN + bidirectional LSTM, about 0.3M parameters) reads each strip into letter probabilities, trained with CTC. Greedy decoding turns them into text, and letters the model is unsure of become `?`, which the matcher treats as a cheap wildcard.

The model is `apps/web/public/models/stam-crnn.onnx`. The app runs it with ONNX Runtime Web; the eval runs it with ONNX Runtime for Node.

## Training data

There is no labeled set of scroll photos, so the training data is synthetic:

1. `synth.py` renders windows of real standard-layout columns (the written text, ketiv) in the Culmus STA"M fonts plus a few book faces, with the neighboring columns at the sides, and degrades them like a phone photo of a scroll: parchment color and texture, faded and cracked ink, stains, uneven light, shadows, glare, perspective, curvature, blur, noise and JPEG compression. 30% of the samples use shuffled Torah words so the model learns to read rather than recite.
2. `src/crops.ts` cuts the line crops with `@navtora/vision`, the same code the app runs, and labels each one with the line it covers. Crops whose line can't be matched cleanly are skipped.

## Reproducing

Requires Python 3.10+ with `pip install -r requirements.txt` (Pillow must have raqm, which the PyPI wheels do).

```bash
cd tools/train
./fetch-fonts.sh                                                       # Culmus fonts into fonts/
python synth.py --out data/synth/train --count 4000 --seed 11
python synth.py --out data/synth/val --count 300 --seed 23
python synth.py --out data/synth/eval --count 200 --seed 37 --no-shuffle
for i in 0 1 2 3; do pnpm crops --in data/synth/train --out data/crops/train --shard $i/4 & done; wait
pnpm crops --in data/synth/val --out data/crops/val
python train.py --train data/crops/train --val data/crops/val --out runs/v1 --minutes 150
python export.py --weights runs/v1/best.pt --out ../../apps/web/public/models/stam-crnn.onnx --val data/crops/val
pnpm --filter @navtora/eval local -- --synth ../train/data/synth/eval
```

Everything under `data/`, `fonts/` and `runs/` is generated and not committed.

## Next steps

Real photos are what will improve the model most. Line crops from scans with a known layout (the Shannon sefer in `tools/eval`) can be labeled exactly the same way: the layout says what each line says. Photos read by the Claude fallback can be labeled too, since once the matcher places a column the true text of every line is known.
