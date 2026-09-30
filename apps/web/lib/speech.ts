/**
 * Text to speech with the browser's synthesizer. An instruction is a list of
 * segments, each in its own language: the sentence in the app's language and,
 * for words from the sefer, a Hebrew segment. Without a Hebrew voice on the
 * device, the Hebrew segment is skipped rather than mangled by another voice.
 */

export interface SpeechSegment {
  text: string;
  /** BCP 47 tag: es-AR, en-US, he-IL */
  lang: string;
}

export function speechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
}

/** iOS loads voices asynchronously; wait for the event once. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const synth = window.speechSynthesis;
  const now = synth.getVoices();
  if (now.length > 0) return Promise.resolve(now);
  return new Promise((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      synth.removeEventListener("voiceschanged", finish);
      resolve(synth.getVoices());
    };
    synth.addEventListener("voiceschanged", finish);
    window.setTimeout(finish, 800);
  });
}

/** Preferred regional variants per language, best first. */
const PREFERRED: Record<string, string[]> = {
  es: ["es-AR", "es-MX", "es-US", "es-419", "es-ES"],
  en: ["en-US", "en-GB", "en-AU"],
  he: ["he-IL", "he"],
};

export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const primary = lang.toLowerCase().split("-")[0] ?? lang;
  const candidates = voices.filter((v) => v.lang.toLowerCase().replace("_", "-").split("-")[0] === primary);
  if (candidates.length === 0) return null;
  const order = PREFERRED[primary] ?? [lang];
  const score = (v: SpeechSynthesisVoice): number => {
    const tag = v.lang.replace("_", "-");
    const idx = order.findIndex((o) => o.toLowerCase() === tag.toLowerCase());
    // regional match first, then local voices (no network delay), then default voice
    return (idx >= 0 ? (order.length - idx) * 10 : 0) + (v.localService ? 3 : 0) + (v.default ? 1 : 0);
  };
  return [...candidates].sort((a, b) => score(b) - score(a))[0] ?? null;
}

let voicesPromise: Promise<SpeechSynthesisVoice[]> | null = null;

/** Stops any current speech and reads the segments in order. */
export async function speak(segments: SpeechSegment[]): Promise<void> {
  if (!speechAvailable()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  voicesPromise ??= loadVoices();
  const voices = await voicesPromise;
  for (const seg of segments) {
    if (!seg.text.trim()) continue;
    const voice = pickVoice(voices, seg.lang);
    if (!voice && voices.length > 0 && seg.lang.startsWith("he")) continue;
    const u = new SpeechSynthesisUtterance(seg.text);
    u.lang = voice?.lang ?? seg.lang;
    if (voice) u.voice = voice;
    u.rate = seg.lang.startsWith("he") ? 0.85 : 0.95;
    synth.speak(u);
  }
}

/**
 * iOS only allows speech after a user gesture. Called from the capture button
 * when auto-read is on, so the result arriving seconds later isn't silent.
 */
export function primeSpeech(): void {
  if (!speechAvailable()) return;
  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  window.speechSynthesis.speak(u);
}

/** Strips cantillation marks but keeps nikkud; Hebrew voices read it better. */
export function forHebrewSpeech(text: string): string {
  return text.replace(/[֑-ֽֿ֯׀׃-׆]/g, "");
}
