/** Photos of the story post, in public/blog/story/. The children's faces were blurred before publishing. */
import type { PrintPhoto } from "../Prints";

export const STORY = {
  bima: { src: "/blog/story/bima.webp", width: 1200, height: 1431 },
  puerta: { src: "/blog/story/puerta.webp", width: 1440, height: 1080 },
  chicos: { src: "/blog/story/chicos.webp", width: 1080, height: 1440 },
  telefono: { src: "/blog/story/telefono.webp", width: 576, height: 880 },
} satisfies Record<string, PrintPhoto>;
