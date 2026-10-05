"""
Synthetic photos of Sefer Torah columns, for training the local recognizer.

Each sample renders a window of a real standard-layout column (or, for some
samples, lines of shuffled Torah words so the model learns to read rather than
recite) in a STA"M font, with the neighboring columns at the sides, then
degrades it the way a phone photo of a scroll does: parchment color and
texture, faded and cracked ink, stains, uneven light, glare, perspective,
curvature, blur, noise and JPEG compression.

Writes <out>/<id>.jpg plus <out>/<id>.json with the text of every line of the
middle column and its center line in image coordinates, so the line crops cut
by @navtora/vision can be labeled.

    python synth.py --out data/synth/train --count 3000 --seed 1
"""

from __future__ import annotations

import argparse
import json
import math
import os
import re
from multiprocessing import Pool
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
LAYOUT = ROOT / "../../packages/data/dist/layout-245.json"
FONTS = ROOT / "fonts"

# STA"M fonts dominate; book faces add variety in letter shapes
FONT_WEIGHTS = {
    "StamAshkenazCLM.ttf": 10,
    "StamSefaradCLM.ttf": 7,
    "KeterYG-Medium.ttf": 1.5,
    "KeterYG-Bold.ttf": 1.5,
    "FrankRuehlCLM-Medium.otf": 1,
    "FrankRuehlCLM-Bold.otf": 1,
    "DavidCLM-Medium.otf": 0.7,
    "DrugulinCLM-Bold.otf": 1,
    "HadasimCLM-Regular.otf": 0.5,
    "HadasimCLM-Bold.otf": 0.5,
    "ShofarRegular.ttf": 0.5,
    "ShofarDemi-Bold.ttf": 0.5,
    "SimpleCLM-Medium.ttf": 0.3,
    "MiriamCLM-Book.otf": 0.3,
    "NachlieliCLM-Bold.otf": 0.3,
    "YehudaCLM-Bold.otf": 0.3,
}


def consonantal(text: str) -> str:
    """Written (ketiv) consonantal text of a layout line."""
    text = re.sub(r"#\[[^\]]*\]", "", text)  # qere
    text = text.replace("#(פ)", "")
    # same rules as normalizeHebrew in @navtora/core: marks are dropped, maqaf splits words
    text = re.sub("[֑-ֽֿ-ׇ​-‏‪-‮⁠﻿]", "", text)
    text = re.sub("[־‐-―-]", " ", text)
    text = re.sub("[^א-ת]+", " ", text)
    return text.strip()


def load_columns() -> list[list[dict]]:
    data = json.loads(LAYOUT.read_text())
    cols = []
    for col in data["columns"]:
        lines = []
        for li, line in enumerate(col["lines"]):
            lines.append({"text": consonantal(line["text"]), "petucha": bool(line["petucha"]), "index": li})
        cols.append(lines)
    return cols


COLUMNS: list[list[dict]] = []
VOCAB: list[str] = []


def check_raqm() -> None:
    from PIL import features

    if not features.check("raqm"):
        raise SystemExit("Pillow was built without raqm; Hebrew would be drawn left to right. Install Pillow from PyPI wheels.")


def init_worker() -> None:
    global COLUMNS, VOCAB
    COLUMNS = load_columns()
    VOCAB = [w for col in COLUMNS for line in col for w in line["text"].split()]


# ---------------------------------------------------------------- rendering


class FontCache:
    def __init__(self) -> None:
        self.cache: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}

    def get(self, name: str, size: int) -> ImageFont.FreeTypeFont:
        key = (name, size)
        if key not in self.cache:
            self.cache[key] = ImageFont.truetype(str(FONTS / name), size)
        return self.cache[key]


FONT_CACHE = FontCache()


def letter_height(font: ImageFont.FreeTypeFont) -> float:
    b = font.getbbox("ה", anchor="ls")
    return b[3] - b[1]


def word_image(word: str, font: ImageFont.FreeTypeFont, asc: int, desc: int) -> np.ndarray:
    """Ink mask (float 0..1) of a word, baseline at row `asc`, total height asc + desc."""
    # Pillow's raqm layout handles right-to-left order; check_raqm() fails early without it
    vis = word
    b = font.getbbox(vis, anchor="ls")
    w = max(1, b[2] - min(0, b[0]) + 2)
    img = Image.new("L", (w, asc + desc), 0)
    ImageDraw.Draw(img).text((-min(0, b[0]) + 1, asc), vis, font=font, fill=255, anchor="ls")
    return np.asarray(img, dtype=np.float32) / 255.0


def render_lines(rng: np.random.Generator, lines: list[dict], font_name: str, pitch: int, col_width: int | None):
    """Renders lines into an ink mask. Returns (mask, col_width, centers) where centers[i] is the
    y of line i's letter body center and lines are justified to col_width."""
    target_h = pitch * rng.uniform(0.36, 0.5)
    size = 40
    probe = FONT_CACHE.get(font_name, size)
    size = max(8, int(round(size * target_h / max(1.0, letter_height(probe)))))
    font = FONT_CACHE.get(font_name, size)
    lh = letter_height(font)
    asc = int(math.ceil(pitch * 0.85))
    desc = int(math.ceil(pitch * 0.6))
    space = size * rng.uniform(0.28, 0.45)

    rendered = []
    for line in lines:
        words = [word_image(w, font, asc, desc) for w in line["text"].split()]
        rendered.append(words)
    natural = [sum(w.shape[1] for w in ws) + space * max(0, len(ws) - 1) for ws in rendered]
    full = [n for n, line in zip(natural, lines) if not line["petucha"] and n > 0]
    if col_width is None:
        base = float(np.median(full)) if full else max(natural + [pitch * 10])
        col_width = int(base * rng.uniform(0.97, 1.06))

    height = int(pitch * len(lines) + asc + desc)
    mask = np.zeros((height, col_width), np.float32)
    centers = []
    for i, (ws, line) in enumerate(zip(rendered, lines)):
        baseline = int(asc + i * pitch)
        centers.append(baseline - lh * 0.5)
        if not ws:
            continue
        widths = [w.shape[1] for w in ws]
        total_words = sum(widths)
        n_gaps = max(1, len(ws) - 1)
        gap = space
        stretch = 1.0
        if not line["petucha"]:
            gap = (col_width - total_words) / n_gaps
            lo, hi = size * 0.15, size * 0.9
            if gap > hi:
                stretch = min(1.3, (col_width - hi * n_gaps) / total_words)
                gap = (col_width - total_words * stretch) / n_gaps
            elif gap < lo:
                stretch = max(0.8, (col_width - lo * n_gaps) / total_words)
                gap = (col_width - total_words * stretch) / n_gaps
            gap = max(gap, size * 0.1)
        x = float(col_width)  # right edge; Hebrew starts on the right
        for w in ws:
            ww = max(1, int(round(w.shape[1] * stretch * rng.uniform(0.97, 1.03))))
            wimg = cv2.resize(w, (ww, w.shape[0]), interpolation=cv2.INTER_AREA) if ww != w.shape[1] else w
            x1 = int(round(x))
            x0 = x1 - ww
            top = baseline - asc
            sx0 = max(0, -x0)
            dx0 = max(0, x0)
            dx1 = min(col_width, x1)
            if dx1 > dx0:
                region = mask[top : top + wimg.shape[0], dx0:dx1]
                np.maximum(region, wimg[: region.shape[0], sx0 : sx0 + (dx1 - dx0)], out=region)
            x = x0 - gap
    return mask, col_width, centers


def shuffled_lines(rng: np.random.Generator, lines: list[dict]) -> list[dict]:
    out = []
    for line in lines:
        n = len(line["text"].split())
        words = [VOCAB[int(rng.integers(len(VOCAB)))] for _ in range(n)]
        out.append({**line, "text": " ".join(words)})
    return out


# ---------------------------------------------------------------- degradation


def smooth_noise(rng: np.random.Generator, h: int, w: int, scale: float) -> np.ndarray:
    """Low-frequency noise in [0, 1]."""
    sh, sw = max(2, int(h / scale)), max(2, int(w / scale))
    small = rng.random((sh, sw)).astype(np.float32)
    big = cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)
    big -= big.min()
    return big / max(1e-6, big.max())


def degrade_ink(rng: np.random.Generator, mask: np.ndarray, pitch: int) -> np.ndarray:
    m = mask
    r = rng.random()
    k = max(1, int(round(pitch * rng.uniform(0.02, 0.06))))
    kernel = np.ones((k, k), np.uint8)
    if r < 0.3:
        m = cv2.dilate(m, kernel)
    elif r < 0.5:
        m = cv2.erode(m, kernel)
    # fading over regions, sometimes strong
    fade = 1.0 - rng.uniform(0.0, 0.7) * smooth_noise(rng, *m.shape, scale=pitch * rng.uniform(1, 6))
    m = m * fade
    # cracks and flaking: small holes in strokes
    if rng.random() < 0.6:
        holes = rng.random(m.shape).astype(np.float32)
        holes = cv2.GaussianBlur(holes, (0, 0), max(0.6, pitch * 0.03))
        thr = np.quantile(holes, rng.uniform(0.02, 0.2))
        m = m * (holes > thr)
    return np.clip(m, 0, 1)


PARCHMENT = [(238, 228, 205), (230, 214, 178), (216, 196, 158), (245, 242, 232), (205, 190, 165), (225, 220, 210), (240, 225, 190)]
INK = [(18, 16, 14), (35, 28, 22), (60, 42, 28), (85, 65, 45), (25, 25, 35)]


def compose(rng: np.random.Generator, ink: np.ndarray, pitch: int) -> np.ndarray:
    h, w = ink.shape
    base = np.array(PARCHMENT[int(rng.integers(len(PARCHMENT)))], np.float32) * rng.uniform(0.85, 1.05)
    tex = 1.0 + (smooth_noise(rng, h, w, pitch * 4) - 0.5) * rng.uniform(0.02, 0.12)
    tex *= 1.0 + (rng.random((h, w)).astype(np.float32) - 0.5) * rng.uniform(0.0, 0.08)
    img = base[None, None, :] * tex[..., None]
    # stains: soft blobs darker than the parchment
    for _ in range(int(rng.integers(0, 4))):
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        rx, ry = rng.uniform(0.5, 4) * pitch, rng.uniform(0.5, 4) * pitch
        yy, xx = np.ogrid[:h, :w]
        blob = np.exp(-(((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2))
        img *= (1 - rng.uniform(0.05, 0.35) * blob)[..., None]
    color = np.array(INK[int(rng.integers(len(INK)))], np.float32)
    alpha = ink[..., None] * rng.uniform(0.75, 1.0)
    return img * (1 - alpha) + color[None, None, :] * alpha


def camera(rng: np.random.Generator, img: np.ndarray, points: list[np.ndarray], out_pitch_scale: float):
    """Perspective, curvature and scale. Returns the warped image and the points mapped forward."""
    h, w = img.shape[:2]
    # curvature: rows bend by c(x), a parabola plus a gentle slope
    amp = rng.normal(0, 0.012) * h
    tilt = rng.normal(0, 0.02)
    xc = w * rng.uniform(0.3, 0.7)

    def curve(x):
        return amp * ((x - xc) / w) ** 2 * 4 + tilt * (x - xc)

    # perspective: jitter the corners
    j = rng.uniform(0.0, 0.07)
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = src + rng.uniform(-j, j, (4, 2)).astype(np.float32) * np.float32([w, h])
    ang = math.radians(rng.normal(0, 1.5))
    rot = np.float32([[math.cos(ang), -math.sin(ang)], [math.sin(ang), math.cos(ang)]])
    dst = (dst - [w / 2, h / 2]) @ rot.T + [w / 2, h / 2]
    dst *= out_pitch_scale
    dst -= dst.min(axis=0)
    H = cv2.getPerspectiveTransform(src, dst.astype(np.float32))
    ow, oh = int(math.ceil(dst[:, 0].max())), int(math.ceil(dst[:, 1].max()))
    Hinv = np.linalg.inv(H)
    gx, gy = np.meshgrid(np.arange(ow, dtype=np.float32), np.arange(oh, dtype=np.float32))
    den = Hinv[2, 0] * gx + Hinv[2, 1] * gy + Hinv[2, 2]
    sx = (Hinv[0, 0] * gx + Hinv[0, 1] * gy + Hinv[0, 2]) / den
    sy = (Hinv[1, 0] * gx + Hinv[1, 1] * gy + Hinv[1, 2]) / den
    sy = sy - curve(sx)
    # prefilter when shrinking a lot, to avoid aliasing
    if out_pitch_scale < 0.7:
        img = cv2.GaussianBlur(img, (0, 0), 0.45 / out_pitch_scale)
    warped = cv2.remap(img.astype(np.float32), sx.astype(np.float32), sy.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    mapped = []
    for pts in points:
        p = np.stack([pts[:, 0], pts[:, 1] + curve(pts[:, 0]), np.ones(len(pts))], axis=1) @ H.T
        mapped.append(p[:, :2] / p[:, 2:3])
    return warped, mapped


def light(rng: np.random.Generator, img: np.ndarray, pitch: float) -> np.ndarray:
    h, w = img.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ang = rng.uniform(0, 2 * math.pi)
    grad = ((xx - w / 2) * math.cos(ang) + (yy - h / 2) * math.sin(ang)) / max(w, h)
    field = 1.0 + grad * rng.uniform(0, 0.8)
    field *= rng.uniform(0.55, 1.1)
    if rng.random() < 0.35:  # a shadow (hand, phone) with a soft edge
        nx, ny = math.cos(rng.uniform(0, 2 * math.pi)), math.sin(rng.uniform(0, 2 * math.pi))
        d = (xx - rng.uniform(0, w)) * nx + (yy - rng.uniform(0, h)) * ny
        soft = 1 / (1 + np.exp(-d / (pitch * rng.uniform(0.5, 4))))
        field *= 1 - rng.uniform(0.2, 0.6) * soft
    img = img * field[..., None]
    if rng.random() < 0.3:  # glare
        cx, cy = rng.uniform(0, w), rng.uniform(0, h)
        r = rng.uniform(1, 6) * pitch
        blob = np.exp(-(((xx - cx) ** 2 + (yy - cy) ** 2) / (2 * r * r)))
        img = img + rng.uniform(60, 220) * blob[..., None]
    return img


def finish(rng: np.random.Generator, img: np.ndarray, pitch: float) -> np.ndarray:
    s = rng.uniform(0, 1.0) * max(0.5, pitch / 30)
    if s > 0.3:
        img = cv2.GaussianBlur(img, (0, 0), s)
    if rng.random() < 0.15:  # motion blur
        k = int(rng.integers(3, max(4, int(pitch * 0.25))))
        kernel = np.zeros((k, k), np.float32)
        kernel[k // 2, :] = 1.0 / k
        rot = cv2.getRotationMatrix2D((k / 2 - 0.5, k / 2 - 0.5), rng.uniform(0, 180), 1)
        kernel = cv2.warpAffine(kernel, rot, (k, k))
        img = cv2.filter2D(img, -1, kernel / max(1e-6, kernel.sum()))
    img = img + rng.normal(0, rng.uniform(1, 8), img.shape)
    return np.clip(img, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- one sample


def make_sample(args: tuple[int, int, str, bool]) -> dict | None:
    idx, seed, out, shuffle_ok = args
    rng = np.random.default_rng(seed)
    ncols = len(COLUMNS)
    c = int(rng.integers(ncols))
    col = COLUMNS[c]
    k = int(rng.integers(8, len(col) + 1)) if rng.random() < 0.6 else len(col)
    a = int(rng.integers(0, len(col) - k + 1))
    lines = col[a : a + k]
    shuffled = shuffle_ok and rng.random() < 0.3
    if shuffled:
        lines = shuffled_lines(rng, lines)

    names = list(FONT_WEIGHTS)
    weights = np.array([FONT_WEIGHTS[n] for n in names], np.float64)
    font = names[int(rng.choice(len(names), p=weights / weights.sum()))]
    pitch = int(rng.integers(40, 58))

    mask, cw, centers = render_lines(rng, lines, font, pitch, None)
    # neighbors: other columns' text at the same pitch and width
    gap = int(pitch * rng.uniform(0.7, 2.2))
    left_lines = COLUMNS[(c + 1) % ncols][a : a + k]
    right_lines = COLUMNS[(c - 1) % ncols][a : a + k]
    lm, _, _ = render_lines(rng, left_lines, font, pitch, cw)
    rm, _, _ = render_lines(rng, right_lines, font, pitch, cw)
    hmax = max(mask.shape[0], lm.shape[0], rm.shape[0])
    pad = lambda m: np.pad(m, ((0, hmax - m.shape[0]), (0, 0)))
    sheet = np.concatenate([pad(lm), np.zeros((hmax, gap), np.float32), pad(mask), np.zeros((hmax, gap), np.float32), pad(rm)], axis=1)
    x_col = lm.shape[1] + gap

    # camera window: the column plus part of its neighbors and some margin above and below
    x0 = int(x_col - cw * rng.uniform(0.03, 0.45))
    x1 = int(x_col + cw + cw * rng.uniform(0.03, 0.45))
    y0 = int(max(0, centers[0] - pitch * rng.uniform(0.3, 2.0)))
    y1 = int(min(hmax, centers[-1] + pitch * rng.uniform(0.3, 2.0)))
    if rng.random() < 0.25:  # cut lines at the top or bottom
        y0 = int(max(0, centers[0] - pitch * rng.uniform(0.0, 0.4)))
    sheet = np.pad(sheet, ((pitch * 2, pitch * 2), (0, 0)))
    y0 += pitch * 2
    y1 += pitch * 2
    ink = degrade_ink(rng, sheet[y0:y1, max(0, x0) : x1], pitch)
    # centerline points of each line of the middle column, in window coordinates
    xs = np.linspace(x_col, x_col + cw, 9)
    pts = [np.stack([xs - max(0, x0), np.full(9, cy + pitch * 2 - y0)], axis=1) for cy in centers]

    img = compose(rng, ink, pitch)
    if rng.random() < 0.2:  # the edge of the scroll or a table at the top or bottom
        band = int(rng.uniform(0.5, 3) * pitch)
        dark = np.array([rng.uniform(20, 90)] * 3, np.float32)
        if rng.random() < 0.5:
            img[:band] = dark
        else:
            img[-band:] = dark

    out_pitch = math.exp(rng.uniform(math.log(14), math.log(48)))
    warped, mapped = camera(rng, img, pts, out_pitch / pitch)
    warped = light(rng, warped, out_pitch)
    final = finish(rng, warped, out_pitch)

    name = f"{idx:06d}"
    q = int(rng.integers(35, 95))
    Image.fromarray(final).save(Path(out) / f"{name}.jpg", quality=q)
    meta = {
        "column": c + 1,
        "font": font,
        "shuffled": shuffled,
        "pitch": out_pitch,
        "lines": [
            {"index": line["index"], "text": line["text"], "points": [[round(float(x), 1), round(float(y), 1)] for x, y in p]}
            for line, p in zip(lines, mapped)
        ],
    }
    (Path(out) / f"{name}.json").write_text(json.dumps(meta, ensure_ascii=False))
    return meta


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--count", type=int, default=100)
    ap.add_argument("--seed", type=int, default=1)
    ap.add_argument("--start", type=int, default=0)
    ap.add_argument("--no-shuffle", action="store_true", help="only real text (for evaluation sets)")
    ap.add_argument("--workers", type=int, default=os.cpu_count() or 1)
    args = ap.parse_args()
    check_raqm()
    Path(args.out).mkdir(parents=True, exist_ok=True)
    jobs = [(args.start + i, args.seed * 1_000_003 + args.start + i, args.out, not args.no_shuffle) for i in range(args.count)]
    with Pool(args.workers, initializer=init_worker) as pool:
        for n, _ in enumerate(pool.imap_unordered(make_sample, jobs, chunksize=4), 1):
            if n % 100 == 0:
                print(f"{n}/{args.count}", flush=True)


if __name__ == "__main__":
    main()
