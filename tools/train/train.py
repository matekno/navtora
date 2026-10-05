"""
Trains the line recognizer: a small CNN + BiLSTM with CTC, over line crops cut
by @navtora/vision (crops.ts). Runs on CPU.

    python train.py --train data/crops/train --val data/crops/val --out runs/v1 --minutes 120

Exports ONNX with export.py. The alphabet is fixed: blank, space and the 27
Hebrew letters (22 plus 5 final forms), so the model never outputs anything
the matcher cannot use.
"""

from __future__ import annotations

import argparse
import json
import math
import random
import time
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image

ALPHABET = " אבגדהוזחטיכךלמםנןסעפףצץקרשת"  # index + 1; 0 is the CTC blank
CHAR_TO_ID = {c: i + 1 for i, c in enumerate(ALPHABET)}
NUM_CLASSES = len(ALPHABET) + 1
HEIGHT = 32


class CRNN(nn.Module):
    def __init__(self, width: float = 1.5, hidden: int = 96) -> None:
        super().__init__()
        c = [int(round(k * width)) for k in (16, 32, 48, 64, 96)]

        def block(cin: int, cout: int) -> list[nn.Module]:
            return [nn.Conv2d(cin, cout, 3, padding=1, bias=False), nn.BatchNorm2d(cout), nn.ReLU(inplace=True)]

        self.cnn = nn.Sequential(
            *block(1, c[0]), nn.MaxPool2d(2, 2),  # 16 x W/2
            *block(c[0], c[1]), nn.MaxPool2d(2, 2),  # 8 x W/4
            *block(c[1], c[2]), *block(c[2], c[2]), nn.MaxPool2d((2, 1), (2, 1)),  # 4 x W/4
            *block(c[2], c[3]), *block(c[3], c[3]), nn.MaxPool2d((2, 1), (2, 1)),  # 2 x W/4
            nn.Conv2d(c[3], c[4], (2, 1), bias=False), nn.BatchNorm2d(c[4]), nn.ReLU(inplace=True),  # 1 x W/4
        )
        self.rnn = nn.LSTM(c[4], hidden, num_layers=1, bidirectional=True, batch_first=True)
        self.fc = nn.Linear(hidden * 2, NUM_CLASSES)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """x: (N, 1, 32, W) ink in [0, 1]. Returns log-probabilities (N, W/4, classes)."""
        f = self.cnn(x).squeeze(2).permute(0, 2, 1)  # N, T, C
        f, _ = self.rnn(f)
        return F.log_softmax(self.fc(f), dim=-1)


def encode(text: str) -> list[int]:
    return [CHAR_TO_ID[c] for c in text if c in CHAR_TO_ID]


def decode(ids: list[int]) -> str:
    out = []
    prev = 0
    for i in ids:
        if i != prev and i != 0:
            out.append(ALPHABET[i - 1])
        prev = i
    return "".join(out)


def load_set(dirs: list[str], limit: int | None = None) -> list[tuple[np.ndarray, str]]:
    items: list[tuple[np.ndarray, str]] = []
    for d in dirs:
        for tsv in sorted(Path(d).glob("labels-*.tsv")):
            for line in tsv.read_text().splitlines():
                if not line.strip():
                    continue
                name, text = line.split("\t", 1)
                img = np.asarray(Image.open(Path(d) / name).convert("L"), dtype=np.uint8)
                if img.shape[0] != HEIGHT:
                    continue
                # CTC needs at least one frame per label (plus blanks between repeats)
                if img.shape[1] // 4 < len(text) + 2:
                    continue
                items.append((img, text))
                if limit and len(items) >= limit:
                    return items
    return items


def augment(img: np.ndarray, rng: random.Random) -> np.ndarray:
    x = img.astype(np.float32) / 255.0
    h, w = x.shape
    # width jitter (letter spacing, stretched letters)
    s = rng.uniform(0.85, 1.15)
    nw = max(8, int(round(w * s)))
    x = np.asarray(Image.fromarray((x * 255).astype(np.uint8)).resize((nw, h), Image.BILINEAR), dtype=np.float32) / 255.0
    # vertical shift of a pixel or two (line center estimates are not exact)
    dy = rng.randint(-2, 2)
    if dy:
        x = np.roll(x, dy, axis=0)
        if dy > 0:
            x[:dy] = 0
        else:
            x[dy:] = 0
    # ink strength and contrast
    x = np.clip(x ** rng.uniform(0.6, 1.5) * rng.uniform(0.7, 1.2), 0, 1)
    if rng.random() < 0.5:
        x = np.clip(x + np.random.normal(0, rng.uniform(0.0, 0.08), x.shape), 0, 1)
    # erase a few small patches (glare, flaking)
    for _ in range(rng.randint(0, 3)):
        pw, ph = rng.randint(2, 12), rng.randint(4, 20)
        px, py = rng.randint(0, max(0, x.shape[1] - pw)), rng.randint(0, max(0, h - ph))
        x[py : py + ph, px : px + pw] *= rng.uniform(0, 0.4)
    return x.astype(np.float32)


def batches(items, batch_size: int, rng: random.Random, train: bool):
    """Batches of similar width to keep padding low."""
    order = sorted(range(len(items)), key=lambda i: items[i][0].shape[1] + (rng.random() * 40 if train else 0))
    groups = [order[i : i + batch_size] for i in range(0, len(order), batch_size)]
    if train:
        rng.shuffle(groups)
    for g in groups:
        imgs = [augment(items[i][0], rng) if train else items[i][0].astype(np.float32) / 255.0 for i in g]
        maxw = max(im.shape[1] for im in imgs)
        maxw = int(math.ceil(maxw / 4) * 4)
        x = np.zeros((len(g), 1, HEIGHT, maxw), np.float32)
        for j, im in enumerate(imgs):
            x[j, 0, :, : im.shape[1]] = im
        targets = [encode(items[i][1]) for i in g]
        widths = [im.shape[1] // 4 for im in imgs]
        yield torch.from_numpy(x), targets, widths, [items[i][1] for i in g]


def edit_distance(a: str, b: str) -> int:
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cur = [i]
        for j, cb in enumerate(b, 1):
            cur.append(min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (ca != cb)))
        prev = cur
    return prev[-1]


def evaluate(model: CRNN, items, rng: random.Random, limit: int = 2000) -> float:
    model.eval()
    errs = 0
    total = 0
    with torch.no_grad():
        for x, _, widths, texts in batches(items[:limit], 64, rng, train=False):
            lp = model(x)
            best = lp.argmax(-1).numpy()
            for k, t in enumerate(texts):
                pred = decode(list(best[k, : widths[k]]))
                errs += edit_distance(pred, t)
                total += len(t)
    model.train()
    return errs / max(1, total)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--train", nargs="+", required=True)
    ap.add_argument("--val", nargs="+", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--minutes", type=float, default=60)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=2e-3)
    ap.add_argument("--resume", default=None)
    ap.add_argument("--threads", type=int, default=4)
    ap.add_argument("--width", type=float, default=1.5, help="channel multiplier of the CNN")
    args = ap.parse_args()
    torch.set_num_threads(args.threads)
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    train = load_set(args.train)
    val = load_set(args.val)
    random.Random(0).shuffle(val)
    print(f"train {len(train)} lines, val {len(val)} lines", flush=True)

    model = CRNN(width=args.width)
    if args.resume:
        model.load_state_dict(torch.load(args.resume, map_location="cpu"))
    print(f"{sum(p.numel() for p in model.parameters()) / 1e6:.2f}M parameters", flush=True)
    opt = torch.optim.AdamW(model.parameters(), lr=args.lr, weight_decay=1e-4)
    ctc = nn.CTCLoss(blank=0, zero_infinity=True)
    rng = random.Random(1)

    deadline = time.time() + args.minutes * 60
    total_steps_est = None
    step = 0
    best_cer = float("inf")
    t_start = time.time()
    epoch = 0
    log = []
    while time.time() < deadline:
        epoch += 1
        seen = 0
        t_epoch = time.time()
        for x, targets, widths, _ in batches(train, args.batch, rng, train=True):
            # cosine decay over the time budget
            frac = min(1.0, (time.time() - t_start) / (args.minutes * 60))
            for g in opt.param_groups:
                g["lr"] = args.lr * (0.05 + 0.95 * 0.5 * (1 + math.cos(math.pi * frac))) * min(1.0, (step + 1) / 300)
            lp = model(x).permute(1, 0, 2)  # T, N, C
            flat = torch.tensor([i for t in targets for i in t], dtype=torch.long)
            lens = torch.tensor([len(t) for t in targets], dtype=torch.long)
            loss = ctc(lp, flat, torch.tensor(widths, dtype=torch.long), lens)
            opt.zero_grad()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 5.0)
            opt.step()
            step += 1
            seen += len(targets)
            if step % 100 == 0:
                rate = seen / (time.time() - t_epoch)
                print(f"epoch {epoch} step {step} loss {loss.item():.3f} lr {opt.param_groups[0]['lr']:.5f} {rate:.0f} lines/s", flush=True)
            if step % 1000 == 0 or time.time() >= deadline:
                cer = evaluate(model, val, rng)
                log.append({"step": step, "epoch": epoch, "cer": cer, "minutes": (time.time() - t_start) / 60})
                print(f"== step {step} val CER {cer:.4f}", flush=True)
                torch.save(model.state_dict(), out / "last.pt")
                if cer < best_cer:
                    best_cer = cer
                    torch.save(model.state_dict(), out / "best.pt")
                (out / "log.json").write_text(json.dumps(log, indent=1))
            if time.time() >= deadline:
                break
    cer = evaluate(model, val, rng)
    if cer < best_cer:
        best_cer = cer
        torch.save(model.state_dict(), out / "best.pt")
    print(f"done: best val CER {best_cer:.4f}", flush=True)


if __name__ == "__main__":
    main()
