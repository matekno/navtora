/** Real columns of the standard scroll for the landing page animation. Runs at build time. */
import "server-only";
import type { StoryData } from "@/components/landing/ScrollStory";
import { getLayout, getParashot } from "./locator";

// The story: the target is the first aliyah of Lech-Lecha, and the scroll is open 6 columns further on.
const TARGET_PARASHA = 3;
const DISTANCE = 6;
const LINES = 18;

/** Consonantal text as written in the scroll: no nikkud, cantillation or maqaf. */
function scrollLine(text: string): { text: string; open: boolean } {
  return {
    // a petuchah: the line ends early
    open: text.includes("#(פ)"),
    text: text
      .replace(/#\(ס\)/g, "  ")
      .replace(/#\(פ\)/g, "")
      .replace(/־/g, " ")
      .replace(/[֑-ׇ]/g, "")
      .replace(/ +/g, " ")
      .trim(),
  };
}

export function landingStory(): StoryData {
  const layout = getLayout();
  const parashot = getParashot();
  const target = parashot[TARGET_PARASHA - 1]!;
  const word = target.aliyot[0]!.startWord;
  const targetCol = layout.columns.find((c) => word >= c.startWord && word <= c.endWord)!;
  const targetLine = targetCol.lines.findIndex((l) => word >= l.start && word <= l.end) + 1;
  const current = targetCol.n + DISTANCE;
  const currentWord = layout.columns[current - 1]!.startWord;
  const currentParasha = parashot.find((p) => currentWord >= p.startWord && currentWord <= p.endWord)!;
  return {
    columns: layout.columns
      .slice(targetCol.n - 2, current + 1)
      .map((c) => ({ n: c.n, lines: c.lines.slice(0, LINES).map((l) => scrollLine(l.text)) })),
    current,
    target: targetCol.n,
    targetLine,
    currentParasha: { es: currentParasha.name.es, en: currentParasha.name.en },
    targetParasha: { es: target.name.es, en: target.name.en },
  };
}
