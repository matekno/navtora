import { Fragment, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { contentEn } from "./content-en";
import { contentEs } from "./content-es";
import type { StageLabels, StageStep } from "./PhotoStage";
import { StoryScroller } from "./StoryScroller";

export interface PostContent {
  labels: StageLabels;
  intro: ReactNode;
  steps: Array<{ stage: StageStep; content: ReactNode }>;
  outro: ReactNode;
}

/** "From a photo to the exact column": one real photo followed through the reader, step by step. */
export function HowItWorks({ lang }: { lang: Locale }) {
  const c = lang === "es" ? contentEs() : contentEn();
  // the steps reach the client component as a list, so each one needs a key
  const steps = c.steps.map((s, i) => ({ stage: s.stage, content: <Fragment key={i}>{s.content}</Fragment> }));
  return (
    <article>
      <div className="mx-auto mt-10 max-w-6xl px-5 sm:px-6">
        <div className="prose-blog max-w-3xl">{c.intro}</div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl px-5 sm:px-6">
        <StoryScroller steps={steps} labels={c.labels} />
      </div>
      <div className="mx-auto mt-4 max-w-6xl px-5 sm:px-6">
        <div className="prose-blog max-w-3xl">{c.outro}</div>
      </div>
    </article>
  );
}
