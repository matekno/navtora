"""
Images for the training appendix of the blog post on how the reader works:
one synthetic photo step by step, a few finished ones, the fonts, and line
crops with their labels. Everything comes from the same code as the training
set; the samples are the first ones of the training set itself (seed 11).

    python synth.py --out data/blog --count 24 --seed 11
    pnpm crops --in data/blog --out data/blog-crops
    python blog_figures.py --samples data/blog --crops data/blog-crops

Writes images to apps/web/public/blog/how-it-works/training/ and what the post
says about them to apps/web/lib/blog/training-figures.json.
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

import synth

ROOT = Path(__file__).resolve().parent
WEB = ROOT / "../../apps/web"

STAGES = ["text", "ink", "parchment", "camera", "light", "final"]
SPECIMEN = "בראשית ברא אלהים"
# one face per family for the specimens
FAMILY_FACE = {
    "StamAshkenaz": "StamAshkenazCLM.ttf",
    "StamSefarad": "StamSefaradCLM.ttf",
    "KeterYG": "KeterYG-Medium.ttf",
    "FrankRuehl": "FrankRuehlCLM-Medium.otf",
    "Drugulin": "DrugulinCLM-Bold.otf",
    "Hadasim": "HadasimCLM-Regular.otf",
    "Shofar": "ShofarRegular.ttf",
    "David": "DavidCLM-Medium.otf",
    "Simple": "SimpleCLM-Medium.ttf",
    "Miriam": "MiriamCLM-Book.otf",
    "Nachlieli": "NachlieliCLM-Bold.otf",
    "Yehuda": "YehudaCLM-Bold.otf",
}
PARCHMENT = (238, 228, 205)
INK = (35, 28, 22)


def family(font_file: str) -> str:
    """StamAshkenazCLM.ttf -> StamAshkenaz, KeterYG-Medium.ttf -> KeterYG, ShofarDemi-Bold.ttf -> Shofar."""
    name = Path(font_file).stem.split("-")[0]
    return re.sub(r"(Regular|Demi)$", "", re.sub(r"CLM$", "", name))


def to_rgb(a: np.ndarray) -> Image.Image:
    """Ink masks (2D, 1 = ink) as dark on white; images as they are."""
    if a.ndim == 2:
        a = 255 * (1 - a)
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).convert("RGB")


def save(img: Image.Image, path: Path, max_w: int, max_h: int) -> tuple[int, int]:
    img = img.copy()
    img.thumbnail((max_w, max_h), Image.LANCZOS)
    img.save(path, quality=82, method=6)
    return img.size


def specimens(out: Path, row_h: int = 72, width: int = 560) -> dict:
    """One row per font family, the specimen right-aligned on parchment."""
    names = list(FAMILY_FACE)
    sheet = Image.new("RGB", (width, row_h * len(names)), PARCHMENT)
    draw = ImageDraw.Draw(sheet)
    for i, fam in enumerate(names):
        probe = synth.FONT_CACHE.get(FAMILY_FACE[fam], 40)
        b = probe.getbbox(SPECIMEN, anchor="rs")
        # the same width for every face, as long as it fits the row
        size = round(40 * min(width * 0.6 / (b[2] - b[0]), row_h * 0.8 / (b[3] - b[1])))
        font = synth.FONT_CACHE.get(FAMILY_FACE[fam], size)
        draw.text((width - 16, i * row_h + row_h * 0.7), SPECIMEN, font=font, fill=INK, anchor="rs")
    sheet.save(out / "fonts.webp", quality=88, method=6)
    weights = synth.FONT_WEIGHTS
    total = sum(weights.values())
    share = {fam: sum(w for f, w in weights.items() if family(f) == fam) / total for fam in names}
    assert abs(sum(share.values()) - 1) < 1e-9, share
    return {"width": width, "rowHeight": row_h, "rows": [{"family": fam, "share": round(share[fam], 3)} for fam in names]}


def crop_strip(crops_dir: Path, names: list[str], labels: dict[str, str], out: Path) -> dict:
    """The chosen line crops stacked, flipped back to reading order and drawn dark on white."""
    ims = [Image.open(crops_dir / n).convert("L") for n in names]
    w = max(i.width for i in ims)
    h = ims[0].height
    sheet = Image.new("L", (w, h * len(ims)), 255)
    rows = []
    for k, (n, im) in enumerate(zip(names, ims)):
        flipped = Image.eval(im.transpose(Image.FLIP_LEFT_RIGHT), lambda v: 255 - v)
        sheet.paste(flipped, (w - im.width, k * h))
        rows.append({"label": labels[n], "width": im.width, "top": k * h})
    sheet.save(out / "crops.webp", quality=90, method=6)
    return {"width": w, "height": h, "rows": rows}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--samples", required=True, help="output of synth.py --count 24 --seed 11")
    ap.add_argument("--crops", required=True, help="output of pnpm crops on those samples")
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--stage", type=int, default=21, help="sample shown step by step")
    ap.add_argument("--gallery", default="4,8,16,19,23,1")
    ap.add_argument("--lines", default="000021_02.png,000021_11.png,000021_15.png,000004_03.png")
    ap.add_argument("--out-public", default=str(WEB / "public/blog/how-it-works/training"))
    ap.add_argument("--out-data", default=str(WEB / "lib/blog/training-figures.json"))
    args = ap.parse_args()
    synth.check_raqm()
    synth.init_worker()
    samples = Path(args.samples)
    out = Path(args.out_public)
    out.mkdir(parents=True, exist_ok=True)

    # the stage sample, rebuilt with its own seed so every intermediate image is kept
    rng = np.random.default_rng(args.seed * 1_000_003 + args.stage)
    stages: dict[str, np.ndarray] = {}
    _, meta = synth.render_sample(rng, True, stages)
    saved = json.loads((samples / f"{args.stage:06d}.json").read_text())
    assert saved["lines"] == meta["lines"], "the samples were not made with this seed"
    stage_sizes = {}
    for name in STAGES:
        # the last step is the photo exactly as saved for training, JPEG included
        img = Image.open(samples / f"{args.stage:06d}.jpg").convert("RGB") if name == "final" else to_rgb(stages[name])
        stage_sizes[name] = save(img, out / f"stage-{name}.webp", 420, 560)

    gallery = []
    for idx in [int(x) for x in args.gallery.split(",")]:
        m = json.loads((samples / f"{idx:06d}.json").read_text())
        size = save(Image.open(samples / f"{idx:06d}.jpg").convert("RGB"), out / f"sample-{idx}.webp", 420, 600)
        gallery.append({"file": f"sample-{idx}.webp", "width": size[0], "height": size[1], "column": m["column"], "family": family(m["font"]), "shuffled": m["shuffled"], "lines": len(m["lines"])})

    labels = {}
    for tsv in Path(args.crops).glob("labels-*.tsv"):
        for row in tsv.read_text().splitlines():
            if row.strip():
                name, text = row.split("\t", 1)
                labels[name] = text
    shuffled = {f"{i:06d}": json.loads((samples / f"{i:06d}.json").read_text())["shuffled"] for i in range(24) if (samples / f"{i:06d}.json").exists()}
    lines = args.lines.split(",")
    crops = crop_strip(Path(args.crops), lines, labels, out)
    for row, name in zip(crops["rows"], lines):
        row["shuffled"] = shuffled[name.split("_")[0]]

    data = {
        "stage": {"index": args.stage, "column": meta["column"], "family": family(meta["font"]), "lines": len(meta["lines"]), "sizes": stage_sizes},
        "gallery": gallery,
        "fonts": specimens(out),
        "crops": crops,
    }
    Path(args.out_data).write_text(json.dumps(data, ensure_ascii=False) + "\n")
    print(json.dumps(data, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
