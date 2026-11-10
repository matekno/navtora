/**
 * The main buttons of a screen, kept at the bottom of the window while the
 * details above scroll, so what to do next is always in view. A sticky bar
 * follows the real window, unlike a page sized with 100dvh, which on Android
 * can reach under the system navigation bar.
 * Goes last inside a `min-h-dvh flex-col` page with no bottom padding, as a
 * direct child so that it can stick; `gutter` is the page's side padding.
 */
const GUTTER = { 5: "-mx-5 px-5", 6: "-mx-6 px-6" } as const;

export function ActionBar({ children, gutter = 5 }: { children: React.ReactNode; gutter?: keyof typeof GUTTER }) {
  return (
    <>
      <div aria-hidden className="h-6 shrink-0" />
      <div className={`sticky bottom-0 z-10 mt-auto border-t border-line bg-ink/95 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur ${GUTTER[gutter]}`}>
        <div className="flex gap-3">{children}</div>
      </div>
    </>
  );
}
