/** What to say aloud for a navigation result. */
import type { Navigation } from "@navtora/core";
import type { Dictionary } from "./i18n";
import { forHebrewSpeech, type SpeechSegment } from "./speech";

export function speechForNavigation(nav: Navigation, label: string, t: Dictionary, tag: string): SpeechSegment[] {
  if (nav.status === "here" && nav.line) {
    return [
      { text: t.voice.here(label, nav.line.line, nav.line.exact, nav.line.atLineStart), lang: tag },
      { text: forHebrewSpeech(nav.line.firstWordsVocalized ?? nav.line.firstWords), lang: "he-IL" },
    ];
  }
  return [{ text: t.voice.move(nav.columns, nav.columnsExact, nav.direction === "towards-bereshit"), lang: tag }];
}
