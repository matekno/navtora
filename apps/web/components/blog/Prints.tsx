/**
 * Photos shown like prints: a white frame, a slight tilt and a short caption
 * on the frame. Used by the personal posts (story, about), whose text flows
 * around them on wide screens; their article needs the `prose-prints` class.
 */

/** A photo in public/, with its size so the page doesn't jump while it loads. */
export interface PrintPhoto {
  src: string;
  width: number;
  height: number;
}

interface PrintProps {
  photo: PrintPhoto;
  alt: string;
  caption: string;
  /** degrees; negative leans left */
  tilt: number;
  className?: string;
}

function Print({ photo, alt, caption, tilt, className = "" }: PrintProps) {
  return (
    <figure className={`rounded-[3px] bg-[#fbfaf6] p-2 pb-2.5 shadow-[0_18px_40px_-14px_rgb(0_0_0/0.75)] ${className}`} style={{ transform: `rotate(${tilt}deg)` }}>
      <img src={photo.src} alt={alt} width={photo.width} height={photo.height} loading="lazy" className="block w-full rounded-[2px]" />
      <figcaption className="mt-2 px-1 text-center text-[13px] leading-snug text-neutral-700">{caption}</figcaption>
    </figure>
  );
}

/** One print, floated beside the text on wide screens (the paragraphs after it wrap around it) and centered on phones. */
export function Photo({ side, ...print }: PrintProps & { side: "left" | "right" }) {
  const float = side === "right" ? "sm:float-right sm:ml-8" : "sm:float-left sm:mr-8";
  return <Print {...print} className={`mx-auto my-8 w-[78%] max-w-[300px] sm:mt-2 sm:mb-6 sm:w-[42%] ${float}`} />;
}

/** Two prints overlapping a little, as if dropped on the table. */
export function PhotoPair({ prints }: { prints: [Omit<PrintProps, "className">, Omit<PrintProps, "className">] }) {
  const [a, b] = prints;
  return (
    <div className="clear-both my-12 flex items-start justify-center">
      <Print {...a} className="relative z-10 w-1/2 max-w-[280px]" />
      <Print {...b} className="-ml-2 mt-10 w-1/2 max-w-[280px] sm:-ml-6" />
    </div>
  );
}
