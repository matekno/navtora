import { describe, expect, it } from "vitest";
import { ctcDecode, LOCAL_ALPHABET, packCrops, unpackLogits } from "../src/local";

/** Log-probabilities for a path of class indices, with `p` on the chosen class. */
function logits(path: number[], p = 0.9) {
  const classes = LOCAL_ALPHABET.length + 1;
  const data = new Float32Array(path.length * classes);
  path.forEach((c, t) => {
    for (let k = 0; k < classes; k++) data[t * classes + k] = Math.log(k === c ? p : (1 - p) / (classes - 1));
  });
  return { data, steps: path.length, classes };
}
const id = (ch: string) => LOCAL_ALPHABET.indexOf(ch) + 1;

describe("ctcDecode", () => {
  it("collapses repeats and drops blanks", () => {
    const path = [id("ב"), id("ב"), 0, id("ר"), id("א"), 0, id(" "), id(" "), id("א"), 0, id("ת")];
    expect(ctcDecode(logits(path)).text).toBe("ברא את");
  });

  it("keeps doubled letters separated by a blank", () => {
    expect(ctcDecode(logits([id("ה"), 0, id("ה")])).text).toBe("הה");
  });

  it("writes ? for letters below the confidence threshold", () => {
    const sure = logits([id("ש"), 0, id("ם")], 0.95);
    const unsure = logits([id("ש"), 0, id("ם")], 0.3);
    expect(ctcDecode(sure).text).toBe("שם");
    expect(ctcDecode(unsure, LOCAL_ALPHABET, 0.5).text).toBe("??");
  });

  it("trims leading and trailing spaces", () => {
    expect(ctcDecode(logits([id(" "), id("ו"), id(" ")])).text).toBe("ו");
  });
});

describe("packCrops / unpackLogits", () => {
  it("pads to a common width and splits back without padded steps", () => {
    const a = { width: 10, height: 2, data: new Float32Array(20).fill(1) };
    const b = { width: 17, height: 2, data: new Float32Array(34).fill(2) };
    const packed = packCrops([a, b]);
    expect(packed.dims).toEqual([2, 1, 2, 20]);
    expect(packed.data[0]).toBe(1);
    expect(packed.data[10]).toBe(0); // padding
    expect(packed.data[40]).toBe(2);
    const steps = 5;
    const classes = 3;
    const out = unpackLogits(new Float32Array(2 * steps * classes).map((_, i) => i), [2, steps, classes], [a, b]);
    expect(out[0]!.steps).toBe(2); // floor(10 / 4)
    expect(out[1]!.steps).toBe(4);
    expect(out[1]!.data[0]).toBe(steps * classes);
  });
});
