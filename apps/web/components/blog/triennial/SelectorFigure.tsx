import type { Locale } from "@/lib/i18n";
import { Figure } from "../Figure";

/** Screenshots of the target picker under the triennial cycle, in public/blog/triennial/, one pair per language. */
export const SHOT = { width: 780, height: 1360 };

export function SelectorFigure({ lang, alts, caption }: { lang: Locale; alts: [string, string]; caption: string }) {
  return (
    <Figure caption={caption}>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {(["date", "parasha"] as const).map((name, i) => (
          <img
            key={name}
            src={`/blog/triennial/${name}-${lang}.webp`}
            alt={alts[i]}
            width={SHOT.width}
            height={SHOT.height}
            loading="lazy"
            className="block w-full rounded-xl border border-line/70"
          />
        ))}
      </div>
    </Figure>
  );
}
