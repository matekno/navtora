/**
 * The sources of the halacha post: what the halacha asks of a community where
 * no one can read Torah, the Conservative responsum on it and its dissent, and
 * why the scroll is prepared beforehand. Each summary only says what the
 * source says, as read in it.
 */
import type { Source } from "./SourceCard";

const SEFARIA = "Sefaria";
const RA = "https://www.rabbinicalassembly.org/sites/default/files";
const SRL = "https://www.seminariorabinico.org/wp-content/uploads";

export const SOURCES: Source[] = [
  // ---------- when no one knows how to read ----------
  {
    id: "sa-142-2",
    stance: "reading",
    title: { es: "Aunque nadie sepa leer, se lee", en: "Even if no one can read, the Torah is read" },
    original: "וישוב שיש שם מנין ואין מי שיודע לקרות בתורה כהלכתה בדקדוק ובטעמים אפ״ה יקראו בתורה בברכה כהלכתה",
    cite: { es: "Shulján Aruj, Óraj Jaim 142:2", en: "Shulchan Aruch, Orach Chayim 142:2" },
    summary: {
      es: "En un lugar donde hay minián pero nadie sabe leer la Torá como corresponde, con la pronunciación exacta y las teamim, aun así se lee la Torá, con la brajá.",
      en: "In a place where there is a minyan but no one who knows how to read the Torah properly, with the exact pronunciation and the cantillation, the Torah is read anyway, with the blessing.",
    },
    relevance: {
      es: "Es el punto de partida de la responsa conservadora. La lectura no se deja aunque falte quien la sepa hacer bien.",
      en: "It's where the Conservative responsum starts. The reading isn't dropped even when no one can do it well.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Shulchan_Arukh,_Orach_Chayim.142.2" }],
  },
  {
    id: "mb-142-8",
    stance: "reading",
    title: { es: "Alguien guía al que lee", en: "Someone guides the reader" },
    original: "יקרא זה מתוך החומש לפני האיש הקורא בס״ת להורות הדרך בנקודות וטעמים כראוי",
    cite: { es: "Mishná Berurá 142:8", en: "Mishnah Berurah 142:8" },
    summary: {
      es: "Si hay alguien que al menos sabe leer con las teamim de un jumash, que lea en voz baja al lado del que lee del Séfer Torá, para guiarlo con las vocales y las teamim. Tiene que leer bajo, para que el público escuche la lectura del rollo.",
      en: "If someone at least knows how to read with the cantillation from a printed chumash, they should read quietly beside the person reading from the Torah scroll, to guide them with the vowels and the cantillation. They read softly, so the congregation hears the reading from the scroll.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Mishnah_Berurah.142.8" }],
  },
  {
    id: "ahs-142-5",
    stance: "reading",
    title: { es: "«Porque no hay otra opción»", en: "“Because there is no other choice”" },
    original: "אחד מביט בחומש, ולוחש באזני הקורא בספר תורה, והקורא קורא בקול אחריו בספר התורה, דבאין ברירה שאני",
    cite: { es: "Aruj HaShulján, Óraj Jaim 142:5", en: "Aruch HaShulchan, Orach Chayim 142:5" },
    summary: {
      es: "¿Cómo se hace? Uno mira el jumash y le susurra al oído al que lee del Séfer Torá, y este repite en voz alta leyendo del rollo, porque no hay otra opción. De entrada, aclara, el lector tiene la obligación de leer con las teamim y con precisión.",
      en: "How is it done? One person looks at the chumash and whispers into the ear of the one reading from the Torah scroll, who repeats it aloud from the scroll, because there is no other choice. To begin with, it notes, the reader is obliged to read with the cantillation and with precision.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Arukh_HaShulchan,_Orach_Chaim.142.5" }],
  },
  {
    id: "megillah-32a",
    stance: "reading",
    title: { es: "Leer con las teamim", en: "Reading with the cantillation" },
    original: "כׇּל הַקּוֹרֵא בְּלֹא נְעִימָה... עָלָיו הַכָּתוּב אוֹמֵר: וְגַם אֲנִי נָתַתִּי לָהֶם חוּקִּים לֹא טוֹבִים",
    cite: { es: "Talmud Bavlí, Meguilá 32a", en: "Babylonian Talmud, Megillah 32a" },
    summary: {
      es: "Quien lee sin neimá, la melodía de las teamim, cumple el versículo «y también les di leyes que no eran buenas» (Ezequiel 20:25).",
      en: "Whoever reads without ne'imah, the melody of the cantillation, fulfills the verse “I also gave them laws that were not good” (Ezekiel 20:25).",
    },
    relevance: {
      es: "Por eso la responsa no propone leer sin melodía y pide hacer todo lo posible por mantenerla.",
      en: "That's why the responsum doesn't propose reading without the melody, and asks to do everything possible to keep it.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Megillah.32a" }],
  },

  // ---------- the Conservative responsum ----------
  {
    id: "fine-2026",
    stance: "responsum",
    title: { es: "Cuando nadie puede leer la Torá", en: "When No One Can Read Torah" },
    original: "When No One Can Read Torah",
    cite: {
      es: "Rab. David J. Fine, Comité de Leyes y Estándares (CJLS) de la Asamblea Rabínica, OH 142:2.2026a. Aprobada con 7 votos a favor, 11 en contra y 5 abstenciones",
      en: "Rabbi David J. Fine, Committee on Jewish Law and Standards (CJLS) of the Rabbinical Assembly, OH 142:2.2026a. Approved 7–11–5",
    },
    year: "2026",
    summary: {
      es: "Pregunta qué opciones tiene una kehilá cuando nadie puede leer del Séfer Torá como corresponde, y si se puede leer de un jumash impreso. Responde que leer de un jumash no cumple la obligación de la lectura pública, que se hace del rollo, y ordena cinco opciones de la mejor a la menos buena. Si la falta de lector es permanente, propone leer del jumash sin abrir el Séfer Torá y sin brajot.",
      en: "It asks what options a community has when no one can read from the Torah scroll properly, and whether a printed chumash may be used. It answers that reading from a chumash doesn't fulfill the obligation of the public reading, which is done from the scroll, and ranks five options from best to least good. If the lack of a reader is permanent, it suggests reading from the chumash without opening the scroll and without blessings.",
    },
    relevance: {
      es: "Las cuatro primeras opciones son leer del rollo. Todas dependen de que el rollo esté en el lugar correcto y de que quien lee sepa dónde empieza su aliá.",
      en: "The first four options all read from the scroll. All of them depend on the scroll being at the right place and on the reader knowing where their aliyah starts.",
    },
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/teshuvot/1779821055.pdf` }],
  },
  {
    id: "nevins-pitkowsky-2026",
    stance: "dissent",
    title: { es: "Disenso a «Cuando nadie puede leer la Torá»", en: "Dissent to “When No One Can Read Torah”" },
    original: "Dissent to “When No One Can Read Torah”",
    cite: {
      es: "Rabinos Daniel Nevins y Joel Pitkowsky, CJLS, OH 142:2b. Los disensos no son posiciones oficiales del Comité",
      en: "Rabbis Daniel Nevins and Joel Pitkowsky, CJLS, OH 142:2b. Dissents are not official positions of the Committee",
    },
    year: "2026",
    summary: {
      es: "Están de acuerdo con casi toda la responsa y solo rechazan la quinta opción, porque la lectura que escucha el público sale del jumash. Si un día no hay forma de leer del rollo, ni siquiera con la ayuda de un gabai, proponen estudiar la parashá del jumash, sin aliot, y leer la parte que faltó el Shabat siguiente.",
      en: "They agree with almost all of the responsum and only reject the fifth option, because the reading the congregation hears comes from the chumash. If on a given day there is no way to read from the scroll, even with a gabbai's help, they propose studying the parashah from the chumash, without aliyot, and reading the missed portion the next Shabbat.",
    },
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/2026-05/dissent-to-david-fine-torah-reading-5.17.26.pdf` }],
  },

  // ---------- preparing the scroll beforehand ----------
  {
    id: "yoma-70a",
    stance: "purpose",
    title: { es: "No se enrolla el Séfer Torá en público", en: "A Torah scroll is not rolled in public" },
    original: "אֵין גּוֹלְלִין סֵפֶר תּוֹרָה בְּצִיבּוּר, מִפְּנֵי כְּבוֹד צִיבּוּר",
    cite: { es: "Talmud Bavlí, Iomá 70a", en: "Babylonian Talmud, Yoma 70a" },
    summary: {
      es: "«No se enrolla un Séfer Torá en público, por respeto al público». Por eso en Iom Kipur el Cohén Gadol recita de memoria la lectura que está en otro libro, y por eso cuando Rosh Jódesh Tevet cae en Shabat se sacan tres rollos.",
      en: "“One does not roll a Torah scroll in public, out of respect for the congregation.” That's why on Yom Kippur the High Priest recites by heart the reading that is in another book, and why three scrolls come out when Rosh Chodesh Tevet falls on Shabbat.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Yoma.70a" }],
  },
  {
    id: "sa-144-3",
    stance: "purpose",
    title: { es: "Si hay un solo rollo, se enrolla", en: "With a single scroll, it is rolled" },
    original: "אין גוללין ס״ת בצבור מפני כבוד הצבור",
    cite: { es: "Shulján Aruj, Óraj Jaim 144:3", en: "Shulchan Aruch, Orach Chayim 144:3" },
    summary: {
      es: "No se enrolla en público por el honor del público. Pero si la comunidad tiene un solo rollo y hay que leer dos pasajes, se enrolla, y el honor del público cede.",
      en: "The scroll is not rolled in public, for the congregation's honor. But if the community has only one scroll and two passages must be read, it is rolled, and the congregation's honor gives way.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Shulchan_Arukh,_Orach_Chayim.144.3" }],
  },
  {
    id: "ahs-144-6",
    stance: "purpose",
    title: { es: "Dejar el rollo preparado antes de la tefilá", en: "Preparing the scroll before the service" },
    original: "וזה מוטל על השמש או על הקורא לגוללה מקודם התפילה",
    cite: { es: "Aruj HaShulján, Óraj Jaim 144:6", en: "Aruch HaShulchan, Orach Chayim 144:6" },
    summary: {
      es: "Es obligación del shamash o del lector enrollar el rollo antes de la tefilá y dejarlo en el lugar de la lectura del día. «Muchos no tienen cuidado con esto», escribe, «porque no saben que hay una prohibición».",
      en: "It is the duty of the shamash or the reader to roll the scroll before the service and leave it at the day's reading. “Many are not careful about this,” he writes, “because they don't know there is a prohibition.”",
    },
    relevance: {
      es: "Es justo la tarea en la que ayuda la app.",
      en: "It's exactly the task the app helps with.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Arukh_HaShulchan,_Orach_Chaim.144.6" }],
  },
  {
    id: "cjls-torah-reading-2020",
    stance: "purpose",
    title: { es: "Lectura de Torá durante COVID-19", en: "Torah Reading during COVID-19" },
    original: "Torah Reading during COVID-19",
    cite: {
      es: "Rabinos Pamela Barmash y Robert Scheinberg, CJLS. Es una guía y no una responsa oficial. El Seminario Rabínico Latinoamericano publicó su traducción",
      en: "Rabbis Pamela Barmash and Robert Scheinberg, CJLS. A guidance rather than an official responsum. The Seminario Rabínico Latinoamericano published it in Spanish",
    },
    year: "2020",
    summary: {
      es: "Si varios lectores sin experiencia tienen que encontrar el lugar en el rollo sin un gabai que los ayude, «esta es una tirja detzibura y también una posible vergüenza para ellos». Recomienda pegar notas adhesivas entre las columnas en el comienzo de cada aliá, sin tocar las letras.",
      en: "If several inexperienced readers must find their place in the scroll without a gabbai to help, “this is a tircha d'tzibura and also a possible embarrassment for them.” It recommends sticky-note flags between the columns at the start of each aliyah, not touching the letters.",
    },
    relevance: {
      es: "Es el texto del movimiento más cercano al problema que resuelve la app, y está en castellano.",
      en: "It's the movement's text closest to the problem the app solves.",
    },
    links: [
      { label: { es: "PDF en castellano (Seminario)", en: "Spanish PDF (Seminario)" }, url: `${SRL}/RA-Lectura-de-Tor%C3%A1-durante-COVID.pdf` },
      { label: { es: "Original en inglés", en: "Original" }, url: "https://www.rabbinicalassembly.org/story/torah-reading-during-covid-19" },
    ],
  },
];
