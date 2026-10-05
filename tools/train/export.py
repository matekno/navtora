"""
Exports a trained recognizer to ONNX for onnxruntime (web and node), and
checks that ONNX and PyTorch agree on a few validation crops.

    python export.py --weights runs/v1/best.pt --out ../../apps/web/public/models/stam-crnn.onnx --val data/crops/val
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import onnxruntime as ort
import torch

from train import ALPHABET, HEIGHT, CRNN, decode, load_set


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--weights", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--val", nargs="*", default=[])
    ap.add_argument("--width", type=float, default=1.5)
    args = ap.parse_args()

    model = CRNN(width=args.width)
    model.load_state_dict(torch.load(args.weights, map_location="cpu"))
    model.eval()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    dummy = torch.zeros(1, 1, HEIGHT, 256)
    torch.onnx.export(
        model,
        (dummy,),
        str(out),
        input_names=["ink"],
        output_names=["logprobs"],
        dynamic_axes={"ink": {0: "batch", 3: "width"}, "logprobs": {0: "batch", 1: "steps"}},
        opset_version=17,
        dynamo=False,
    )
    meta = {"alphabet": ALPHABET, "height": HEIGHT, "downsample": 4, "input": "ink", "output": "logprobs"}
    out.with_suffix(".json").write_text(json.dumps(meta, ensure_ascii=False, indent=1) + "\n")
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")

    if args.val:
        sess = ort.InferenceSession(str(out))
        items = load_set(args.val, limit=20)
        worst = 0.0
        same = 0
        for img, text in items:
            x = (img.astype(np.float32) / 255.0)[None, None]
            with torch.no_grad():
                a = model(torch.from_numpy(x)).numpy()
            b = sess.run(None, {"ink": x})[0]
            worst = max(worst, float(np.abs(a - b).max()))
            same += decode(list(a[0].argmax(-1))) == decode(list(b[0].argmax(-1)))
        print(f"onnx vs torch: max abs diff {worst:.2e}, same decoding on {same}/{len(items)}")


if __name__ == "__main__":
    main()
