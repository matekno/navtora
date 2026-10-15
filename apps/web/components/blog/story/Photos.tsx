/** Photos of the story post, from public/blog/story/. The children's faces were blurred before publishing. */
const IMG = "/blog/story";

export const PHOTOS = {
  bima: { width: 1200, height: 1431 },
  puerta: { width: 1440, height: 1080 },
  chicos: { width: 1080, height: 1440 },
  telefono: { width: 576, height: 530 },
} as const;

type PhotoId = keyof typeof PHOTOS;

/** One photo or two side by side (stacked on phones), with a caption. */
export function Photos({ ids, alt, caption }: { ids: PhotoId[]; alt: string[]; caption: React.ReactNode }) {
  const pair = ids.length > 1;
  return (
    <figure className="my-10">
      <div className={`grid gap-3 ${pair ? "sm:grid-cols-2" : ""}`}>
        {ids.map((id, i) => (
          <img
            key={id}
            src={`${IMG}/${id}.webp`}
            alt={alt[i] ?? ""}
            width={PHOTOS[id].width}
            height={PHOTOS[id].height}
            loading="lazy"
            // a pair shares one shape so the two line up; a lone portrait photo is kept from towering over the text
            className={`w-full rounded-2xl ${pair ? "aspect-[4/5] object-cover" : PHOTOS[id].height > PHOTOS[id].width ? "mx-auto max-w-md" : ""}`}
          />
        ))}
      </div>
      <figcaption className="mt-3 text-sm leading-relaxed text-muted">{caption}</figcaption>
    </figure>
  );
}
