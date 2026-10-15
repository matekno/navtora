/**
 * The source of the halacha post: the CJLS responsum on what to do when no
 * one can read Torah. The responsum itself goes through the sources it rests
 * on, so the post cites only it, and the post's text summarizes it.
 */
import type { Source } from "./SourceCard";

const RA = "https://www.rabbinicalassembly.org/sites/default/files";

export const SOURCES: Source[] = [
  {
    id: "fine-2026",
    title: { es: "Cuando nadie puede leer la Torá", en: "When No One Can Read Torah" },
    original: "When No One Can Read Torah",
    cite: {
      es: "Rab. David J. Fine, Comité de Leyes y Estándares (CJLS) de la Asamblea Rabínica, OH 142:2.2026a. Aprobada con 7 votos a favor, 11 en contra y 5 abstenciones",
      en: "Rabbi David J. Fine, Committee on Jewish Law and Standards (CJLS) of the Rabbinical Assembly, OH 142:2.2026a. Approved 7–11–5",
    },
    year: "2026",
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/teshuvot/1779821055.pdf` }],
  },
];
