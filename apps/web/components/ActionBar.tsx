/**
 * The main buttons of a result, kept at the bottom of the screen while the
 * details above scroll: after a scan, what to do next is always in view.
 * Goes last inside a `min-h-dvh flex-col` page with `px-5` and no bottom
 * padding, as a direct child so that it can stick.
 */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden className="h-6 shrink-0" />
      <div className="sticky bottom-0 z-10 -mx-5 mt-auto border-t border-line bg-ink/95 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="flex gap-3">{children}</div>
      </div>
    </>
  );
}
