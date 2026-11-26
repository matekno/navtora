/**
 * The sources of the triennial post: where the cycle comes from, the CJLS
 * responsa that brought it to today, the ten-verse minimum the app warns about,
 * and hebcal, which NavTorah uses to compute it. The post summarizes them and
 * recommends reading them.
 */
import type { Source } from "../SourceCard";

const RA = "https://www.rabbinicalassembly.org/sites/default/files";
const TALMUD = { es: "Talmud", en: "Talmud" };

export const SOURCES: Source[] = [
  {
    id: "meguila-29b",
    label: TALMUD,
    title: { es: "En Eretz Israel completaban la Torá en tres años", en: "In the Land of Israel they completed the Torah in three years" },
    original: "לבני מערבא דמסקי לדאורייתא בתלת שנין",
    cite: { es: "Talmud Bavli, Meguilá 29b", en: "Babylonian Talmud, Megillah 29b" },
    links: [{ label: "Sefaria", url: "https://www.sefaria.org/Megillah.29b" }],
  },
  {
    id: "rambam",
    label: { es: "Mishné Torá", en: "Mishneh Torah" },
    title: { es: "Hay quienes completan la Torá en tres años", en: "Some complete the Torah in three years" },
    original: "ויש מי שמשלים את התורה בשלש שנים ואינו מנהג פשוט",
    cite: { es: "Rambam, Mishné Torá, Hiljot Tefilá 13:1", en: "Maimonides, Mishneh Torah, Laws of Prayer 13:1" },
    links: [{ label: "Sefaria", url: "https://www.sefaria.org/Mishneh_Torah%2C_Prayer_and_the_Priestly_Blessing.13.1" }],
  },
  {
    id: "moses",
    title: { es: "¿Hay un ciclo trienal auténtico de lecturas de la Torá?", en: "Is There an Authentic Triennial Cycle of Torah Readings?" },
    original: "Is There an Authentic Triennial Cycle of Torah Readings?",
    cite: {
      es: "Rab. Lionel E. Moses, Comité de Leyes y Estándares (CJLS) de la Asamblea Rabínica. El Comité no aceptó su propuesta",
      en: "Rabbi Lionel E. Moses, Committee on Jewish Law and Standards (CJLS) of the Rabbinical Assembly. The Committee did not accept its proposal",
    },
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/public/halakhah/teshuvot/19861990/moses_triennial.pdf` }],
  },
  {
    id: "dorff-1987",
    title: { es: "Sistemas anual y trienal para leer la Torá", en: "Annual and Triennial Systems for Reading the Torah" },
    original: "Annual and Triennial Systems for Reading the Torah",
    cite: {
      es: "Rab. Elliot N. Dorff, CJLS de la Asamblea Rabínica. Aprobada el 29 de abril de 1987 con 7 votos a favor, 4 en contra y 2 abstenciones",
      en: "Rabbi Elliot N. Dorff, CJLS of the Rabbinical Assembly. Approved on April 29, 1987, 7–4–2",
    },
    year: "1987",
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/public/halakhah/teshuvot/19861990/dorff_reading.pdf` }],
  },
  {
    id: "eisenberg-1988",
    title: { es: "Un sistema trienal completo para leer la Torá", en: "A Complete Triennial System for Reading the Torah" },
    original: "A Complete Triennial System for Reading the Torah",
    cite: {
      es: "Rab. Richard Eisenberg, CJLS de la Asamblea Rabínica, adoptada en 1988. Con los ajustes del rabino Joshua Heller (2012) y del rabino Miles B. Cohen (2020)",
      en: "Rabbi Richard Eisenberg, CJLS of the Rabbinical Assembly, adopted in 1988. With the changes by Rabbi Joshua Heller (2012) and Rabbi Miles B. Cohen (2020)",
    },
    year: "1988",
    links: [
      { label: { es: "Responsa (PDF)", en: "Responsum (PDF)" }, url: `${RA}/public/halakhah/teshuvot/19861990/eisenberg_triennial.pdf` },
      { label: { es: "Ajuste de 2012 (PDF)", en: "2012 emendation (PDF)" }, url: `${RA}/public/halakhah/teshuvot/2011-2020/heller-triennial-emendation.pdf` },
      { label: { es: "Ajuste de 2020 (PDF)", en: "2020 modification (PDF)" }, url: `${RA}/2021-09/cohen-triennial.pdf` },
    ],
  },
  {
    id: "diez-pesukim",
    label: { es: "Talmud y Shulján Aruj", en: "Talmud and Shulchan Arukh" },
    title: { es: "No se leen menos de diez pesukim", en: "No fewer than ten verses are read" },
    original: "אין פוחתין מעשרה פסוקין בבית הכנסת",
    cite: { es: "Talmud Bavli, Meguilá 21b, y Shulján Aruj, Óraj Jaim 137:1", en: "Babylonian Talmud, Megillah 21b, and Shulchan Arukh, Orach Chaim 137:1" },
    links: [
      { label: { es: "Meguilá 21b en Sefaria", en: "Megillah 21b on Sefaria" }, url: "https://www.sefaria.org/Megillah.21b" },
      { label: { es: "Shulján Aruj en Sefaria", en: "Shulchan Arukh on Sefaria" }, url: "https://www.sefaria.org/Shulchan_Arukh%2C_Orach_Chayim.137.1" },
    ],
  },
  {
    id: "hebcal",
    label: { es: "hebcal", en: "hebcal" },
    title: { es: "El ciclo trienal en hebcal", en: "The triennial cycle on hebcal" },
    original: "Triennial Torah Reading Cycle",
    cite: {
      es: "hebcal.com, y la librería @hebcal/triennial que usa NavTorá para saber qué se lee cada Shabat",
      en: "hebcal.com, and the @hebcal/triennial library NavTorah uses to know what is read each Shabbat",
    },
    links: [
      { label: "hebcal.com", url: "https://www.hebcal.com/home/50/triennial-torah-reading-cycle" },
      { label: "GitHub", url: "https://github.com/hebcal/hebcal-triennial" },
    ],
  },
];
