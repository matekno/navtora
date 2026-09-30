/** Scroll length and where each book starts, for the scroll map. */
import "server-only";
import { getLocator } from "./locator";
import type { ScrollInfo } from "./target-types";

let cached: ScrollInfo | null = null;

export function getScrollInfo(): ScrollInfo {
  if (!cached) {
    const text = getLocator().text;
    const bookStarts: number[] = [];
    for (const v of text.verses) if (v.chapter === 1 && v.verse === 1) bookStarts[v.book - 1] = v.start;
    cached = { totalWords: text.length, bookStarts };
  }
  return cached;
}
