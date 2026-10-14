/** The frame every figure in the blog sits in, with its caption underneath. */
export function Figure({ children, caption }: { children: React.ReactNode; caption?: React.ReactNode }) {
  return (
    <figure className="my-8">
      <div className="rounded-2xl border border-line/70 bg-panel p-4 sm:p-5">{children}</div>
      {caption && <figcaption className="mt-3 text-sm leading-relaxed text-muted">{caption}</figcaption>}
    </figure>
  );
}
