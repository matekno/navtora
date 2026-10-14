/**
 * The sources of the halacha post: why the scroll is prepared beforehand, and
 * why phones stay out of Shabbat and Yom Tov. Each summary only says what the
 * source says, as read in it.
 */
import type { Source } from "./SourceCard";

const SEFARIA = "Sefaria";
const RA = "https://www.rabbinicalassembly.org/sites/default/files";
const SRL = "https://www.seminariorabinico.org/wp-content/uploads";

export const SOURCES: Source[] = [

  // ---------- why prepare the scroll beforehand ----------
  {
    id: "yoma-mishnah",
    stance: "purpose",
    title: { es: "El Cohén Gadol lee de memoria", en: "The High Priest reads by heart" },
    original: "יוֹתֵר מִמַּה שֶּׁקָּרִיתִי לִפְנֵיכֶם כָּתוּב כָּאן",
    cite: { es: "Mishná Iomá 7:1; Mishná Sotá 7:7", en: "Mishnah Yoma 7:1; Mishnah Sotah 7:7" },
    summary: {
      es: "En Iom Kipur el Cohén Gadol lee dos pasajes de Vaikrá, enrolla el rollo y dice: «más de lo que les leí está escrito acá». El tercer pasaje, que está en Bamidbar, lo recita de memoria.",
      en: "On Yom Kippur the High Priest reads two passages from Leviticus, rolls up the scroll and says: “More than what I have read before you is written here.” The third passage, which is in Numbers, he recites by heart.",
    },
    relevance: {
      es: "Antes que hacer esperar al público mientras se enrolla el rollo hasta otro libro, se prefirió que leyera de memoria.",
      en: "Rather than have the people wait while the scroll was rolled to another book, he read by heart.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Mishnah_Yoma.7.1" }],
  },
  {
    id: "yoma-70a",
    stance: "purpose",
    title: { es: "No se enrolla el Séfer Torá en público", en: "A Torah scroll is not rolled in public" },
    original: "אֵין גּוֹלְלִין סֵפֶר תּוֹרָה בְּצִיבּוּר, מִפְּנֵי כְּבוֹד צִיבּוּר",
    cite: { es: "Talmud Bavlí, Iomá 70a", en: "Babylonian Talmud, Yoma 70a" },
    summary: {
      es: "¿Por qué el Cohén Gadol no enrolla y lee? «Porque no se enrolla un Séfer Torá en público, por respeto al público». ¿Y por qué no traer otro rollo? Para que no se piense que el primero tenía un error, o para no decir una brajá de más. Ahí mismo se cuenta que cuando Rosh Jódesh Tevet cae en Shabat se sacan tres rollos.",
      en: "Why doesn't the High Priest roll the scroll and read? “Because one does not roll a Torah scroll in public, out of respect for the congregation.” And why not bring another scroll? So no one thinks the first was flawed, or to avoid an unnecessary blessing. The same page says that when Rosh Chodesh Tevet falls on Shabbat, three scrolls are taken out.",
    },
    relevance: { es: "Es la raíz talmúdica del problema que la app trata de achicar.", en: "It's the Talmudic root of the problem the app tries to shrink." },
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
    relevance: {
      es: "Con un solo rollo, enrollar en público está permitido. Dejar el rollo preparado no evita una prohibición: ahorra una espera.",
      en: "With a single scroll, rolling in public is allowed. Preparing the scroll beforehand doesn't avoid a prohibition: it saves a wait.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Shulchan_Arukh,_Orach_Chayim.144.3" }],
  },
  {
    id: "mb-144",
    stance: "purpose",
    title: { es: "Buscar el lugar durante Pesukei deZimrá", en: "Finding the place during Pesukei deZimrah" },
    original: "שגוללין ומחפשין בעת שאומרים הקהל פסוקי דזמרה",
    cite: { es: "Mishná Berurá 144:13–14", en: "Mishnah Berurah 144:13–14" },
    summary: {
      es: "Con dos rollos se puede enrollar uno mientras se lee el otro, y es mejor aún «como se acostumbra hoy: enrollar y buscar mientras el público dice Pesukei deZimrá». El honor del público se afecta porque quedaría esperando en silencio.",
      en: "With two scrolls, one can be rolled while the other is read, and better still is “the custom today, to roll and search while the congregation says Pesukei deZimrah.” The congregation's honor is affected because it would be left waiting in silence.",
    },
    relevance: {
      es: "Buscar el lugar es una tarea que tiene que estar hecha antes de la lectura. Con la app se puede hacer todavía antes: el día anterior.",
      en: "Finding the place is a task that has to be done before the reading. With the app it can be done earlier still: the day before.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Mishnah_Berurah.144.13" }],
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
      es: "Convierte en deber la tarea que facilita la app, y la ubica antes de la tefilá.",
      en: "It makes the task the app helps with into a duty, and places it before the service.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Arukh_HaShulchan,_Orach_Chaim.144.6" }],
  },
  {
    id: "magen-avraham-144",
    stance: "purpose",
    title: { es: "El honor del público es renunciable", en: "The congregation may waive its honor" },
    original: "יש מתי מעט ומסתמא מוחלין על כבודם",
    cite: { es: "Maguén Avraham sobre Óraj Jaim 144:7", en: "Magen Avraham on Orach Chayim 144:7" },
    summary: {
      es: "Distingue el Templo, donde estaba todo Israel y nadie renunciaba a su honor, de la sinagoga, donde son pocos y probablemente renuncian.",
      en: "It distinguishes the Temple, where all Israel was present and no one waived their honor, from the synagogue, where there are few and they probably waive it.",
    },
    relevance: {
      es: "Un matiz: que el público espere no es una catástrofe halájica. Dejar el rollo preparado hace la lectura más fluida, nada más.",
      en: "A nuance: a waiting congregation is no halachic catastrophe. A scroll prepared beforehand makes the reading smoother, nothing more.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Magen_Avraham.144.7" }],
  },
  {
    id: "several-scrolls",
    stance: "purpose",
    title: { es: "Varios rollos en los días especiales", en: "Several scrolls on special days" },
    cite: { es: "Shulján Aruj, Óraj Jaim 684:3; Kitzur Shulján Aruj 78:7", en: "Shulchan Aruch, Orach Chayim 684:3; Kitzur Shulchan Aruch 78:7" },
    summary: {
      es: "Cuando Rosh Jódesh Tevet cae en Shabat se sacan tres rollos: la parashá, Rosh Jódesh y Janucá. Si hacen falta tres y la comunidad tiene dos, no se enrolla el segundo para la tercera lectura: se vuelve a tomar el primero.",
      en: "When Rosh Chodesh Tevet falls on Shabbat, three scrolls come out: the parashah, Rosh Chodesh and Chanukah. If three are needed and the community has two, the second is not rolled for the third reading; the first is taken again.",
    },
    relevance: {
      es: "Son los días en que más ayuda la app: para Iom Tov, Rosh Jódesh, Janucá o las cuatro parashiot hay que dejar, la víspera, varios rollos abiertos en lugares distintos.",
      en: "These are the days the app helps most: for Yom Tov, Rosh Chodesh, Chanukah or the four parashiyot, several scrolls must be left open at different places the day before.",
    },
    links: [
      { label: SEFARIA, url: "https://www.sefaria.org/Shulchan_Arukh,_Orach_Chayim.684.3" },
      { label: "Kitzur (Sefaria)", url: "https://www.sefaria.org/Kitzur_Shulchan_Arukh.78.7" },
    ],
  },
  {
    id: "berakhot-12b",
    stance: "purpose",
    title: { es: "La carga sobre el público", en: "The burden on the congregation" },
    original: "מִשּׁוּם טוֹרַח צִבּוּר",
    cite: { es: "Talmud Bavlí, Brajot 12b", en: "Babylonian Talmud, Berakhot 12b" },
    summary: {
      es: "Se quiso agregar la parashá de Balak al Shemá y no se agregó «por la carga sobre el público» (tóraj tzibur).",
      en: "The Sages wanted to add the passage of Balak to the Shema, and didn't, “because of the burden on the congregation” (torach tzibur).",
    },
    relevance: {
      es: "Es la fuente clásica de tirjá detziburá. Iomá 70a y el Shulján Aruj, en cambio, hablan de kavod hatzibur, el respeto al público: son conceptos vecinos, no iguales.",
      en: "It's the classic source for tircha detzibura. Yoma 70a and the Shulchan Aruch speak instead of kavod hatzibur, respect for the congregation: related ideas, not the same one.",
    },
    links: [{ label: SEFARIA, url: "https://www.sefaria.org/Berakhot.12b.14" }],
  },
  {
    id: "cjls-torah-reading-2020",
    stance: "purpose",
    title: { es: "Lectura de Torá durante COVID-19", en: "Torah Reading during COVID-19" },
    original: "Torah Reading during COVID-19",
    cite: {
      es: "CJLS: rabinos Pamela Barmash y Robert Scheinberg. Es una guía, no una responsa oficial. El Seminario Rabínico Latinoamericano publicó su traducción",
      en: "CJLS: Rabbis Pamela Barmash and Robert Scheinberg. A guidance, not an official responsum. The Seminario Rabínico Latinoamericano published it in Spanish",
    },
    year: "2020",
    summary: {
      es: "Si varios lectores sin experiencia tienen que encontrar el lugar en el rollo sin un gabai que los ayude, «esta es una tirja detzibura y también una posible vergüenza para ellos». Recomienda pegar notas adhesivas entre las columnas, sin tocar las letras, en el comienzo de cada aliá: «se puede hacer incluso en Shabat».",
      en: "If several inexperienced readers must find their place in the scroll without a gabbai to help, “this is a tircha d'tzibura and also a possible embarrassment for them.” It recommends sticky-note flags between the columns, not touching the letters, at the start of each aliyah: “this could even be done on Shabbat.”",
    },
    relevance: {
      es: "Es el texto del movimiento más cercano al problema que resuelve la app, y está en castellano. Las notas se pueden pegar el día anterior, en los lugares que encontrás con la app.",
      en: "It's the movement's text closest to the problem the app solves. The notes can go in the day before, at the places you find with the app.",
    },
    links: [
      { label: { es: "PDF en castellano (Seminario)", en: "Spanish PDF (Seminario)" }, url: `${SRL}/RA-Lectura-de-Tor%C3%A1-durante-COVID.pdf` },
      { label: { es: "Original en inglés", en: "Original" }, url: "https://www.rabbinicalassembly.org/story/torah-reading-during-covid-19" },
    ],
  },

  // ---------- why not on Shabbat: within the Conservative movement ----------
  {
    id: "nevins-2012",
    stance: "restricts",
    title: { es: "El uso de aparatos eléctricos y electrónicos en Shabat", en: "The Use of Electrical and Electronic Devices on Shabbat" },
    original: "The Use of Electrical and Electronic Devices on Shabbat",
    cite: { es: "Rab. Daniel Nevins, CJLS (17 votos, 2 en contra y 2 abstenciones). Es la posición oficial vigente", en: "Rabbi Daniel Nevins, CJLS (approved 17–2–2). The current official position" },
    year: "2012",
    summary: {
      es: "La electricidad en sí no es melajá ni shevut. Pero registrar texto, sonido, imágenes u otros datos con un aparato electrónico es toledat kotev, un derivado de escribir, y por eso está prohibido operar en Shabat y Iom Tov «cualquier aparato de grabación, cámara, computadora, tablet o teléfono celular». Distingue la pantalla, que se borra sola, de la memoria permanente, pero rechaza distinguir entre aplicaciones de un mismo aparato. El kevod habriyot desplaza prohibiciones rabínicas, no una melajá.",
      en: "Electricity in itself is neither melachah nor shevut. But recording text, sound, images or other data with an electronic device is toledat kotev, derived from writing, so operating “any electronic recording device, camera, computer, tablet, or cellular phone” on Shabbat and Yom Tov is forbidden. It distinguishes a screen, which clears itself, from permanent memory, but rejects distinctions between apps on the same device. Kevod habriyot overrides rabbinic prohibitions, not a melachah.",
    },
    relevance: {
      es: "En su tabla, el teléfono celular y la cámara digital están prohibidos en Shabat y en Iom Tov. Por eso NavTorá se usa antes.",
      en: "In its table, the cellular phone and the digital camera are forbidden on Shabbat and Yom Tov. That is why NavTorah is used beforehand.",
    },
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/2020-05/ElectricSabbathSpring2012.pdf` }],
  },
  {
    id: "schwartz-weiner-2023",
    stance: "restricts",
    title: { es: "Un nuevo responsum sobre el Shabat", en: "A New Responsum on the Sabbath" },
    original: "A New Responsum on the Sabbath",
    cite: { es: "Rabinos Schwartz y Weiner, CJLS (11 votos, 5 en contra y 5 abstenciones)", en: "Rabbis Schwartz and Weiner, CJLS (approved 11–5–5)" },
    year: "2023",
    summary: {
      es: "Sostiene que todo uso de la electricidad en Shabat está prohibido como shevut.",
      en: "It holds that any use of electricity on Shabbat is forbidden as a shevut.",
    },
    relevance: {
      es: "El mismo día el Comité aprobó también otra posición, de los rabinos Fine y Leff, según la cual la electricidad en sí no está prohibida. Ninguna de las dos se ocupa de celulares ni de cámaras: de eso se ocupa Nevins.",
      en: "The same day the Committee also approved another position, by Rabbis Fine and Leff, under which electricity in itself is not forbidden. Neither deals with phones or cameras: Nevins does.",
    },
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/2023-07/schwartz-weiner-sabbath-final-7.26.pdf` }],
  },
  {
    id: "levin-2020",
    stance: "restricts",
    title: { es: "Transmisión en Shabat y Iom Tov: disenso y desafío", en: "Streaming Services on Shabbat and Yom Tov: A Dissent and a Challenge" },
    original: "Streaming Services on Shabbat and Yom Tov – A Dissent and a Challenge",
    cite: { es: "Rabina Amy Levin, CJLS. El Seminario Rabínico Latinoamericano publicó su traducción", en: "Rabbi Amy Levin, CJLS. The Seminario Rabínico Latinoamericano published it in Spanish" },
    year: "2020",
    summary: {
      es: "Disiente del permiso del Comité para transmitir los servicios de Shabat por internet: no acepta que la pandemia sea una situación apremiante, teme que se termine arreglando el equipo en Shabat, y recuerda con Nevins que registrar datos es kotev. Mientras no exista algo como una computadora apta para Shabat, ese permiso «parece inaceptable».",
      en: "It dissents from the Committee's permission to stream Shabbat services: it doesn't accept the pandemic as a pressing need, worries that people will end up fixing equipment on Shabbat, and recalls with Nevins that recording data is kotev. Until something like a Shabbat-compliant computer exists, that permission “seems unacceptable”.",
    },
    links: [
      { label: { es: "PDF en castellano (Seminario)", en: "Spanish PDF (Seminario)" }, url: `${SRL}/RA-Transmisi%C3%B3n-Shabat-y-Iom-Tov-%E2%80%93-Levin.pdf` },
      { label: { es: "Original en inglés", en: "Original (PDF)" }, url: `${RA}/2020-05/Streaming%20Services%20on%20Shabbat%20and%20Yom%20Tov%20Dissent-%20Levin.pdf` },
    ],
  },
  {
    id: "reisner-2012",
    stance: "restricts",
    title: { es: "Un disenso justificado", en: "A Dissent Justified" },
    original: "A Dissent Justified",
    cite: { es: "Rab. Avram Reisner, CJLS, disidencia a Nevins", en: "Rabbi Avram Reisner, CJLS, dissent to Nevins" },
    year: "2012",
    summary: {
      es: "Crear luz es una de las funciones que prohíbe encender (mavir), «como sea que se logre». La electricidad que produce luz es entonces un derivado de encender fuego.",
      en: "Creating light is one of the functions forbidden as kindling (mav'ir), “howsoever it is achieved.” Electricity that produces light is therefore derived from kindling.",
    },
    relevance: {
      es: "Con esta postura, prender la pantalla, que da luz, ya es un problema en sí mismo.",
      en: "On this view, turning on the screen, which gives light, is already a problem in itself.",
    },
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/assets/public/halakhah/teshuvot/2011-2020/reisner-dissent-nevins.pdf` }],
  },
  {
    id: "photography-1984",
    stance: "restricts",
    title: { es: "Grabación y fotografía en Shabat", en: "Tape Recording and Photography on Shabbat" },
    original: "Tape Recording and Photography on Shabbat",
    cite: { es: "Rab. Mayer Rabinowitz y Dvora Weisberg, CJLS (7 votos, 7 en contra y 3 abstenciones)", en: "Rabbi Mayer Rabinowitz and Dvora Weisberg, CJLS (adopted 7–7–3)" },
    year: "1984",
    summary: {
      es: "Fotografiar, como grabar, puede considerarse escribir (ketivá), y está prohibido en Shabat.",
      en: "Photographing, like recording, can be classed as writing (ketivah), and is forbidden on Shabbat.",
    },
    relevance: {
      es: "Es el antecedente conservador más directo sobre usar una cámara en Shabat.",
      en: "It's the most direct Conservative precedent on using a camera on Shabbat.",
    },
    links: [{ label: "Rabbinical Assembly (PDF)", url: `${RA}/assets/public/halakhah/teshuvot/20012004/45.pdf` }],
  },
  {
    id: "golinkin-2020",
    stance: "restricts",
    title: { es: "Diez responsa breves ante la crisis del coronavirus", en: "Ten Brief Responsa/Halakhic Reactions to the Corona Crisis" },
    original: "Ten Brief Responsa/Halakhic Reactions to the Corona Crisis",
    cite: { es: "Rab. David Golinkin, Instituto Schechter (Masortí Israel), Responsa in a Moment 14:5", en: "Rabbi David Golinkin, Schechter Institutes (Masorti Israel), Responsa in a Moment 14:5" },
    year: "2020",
    summary: {
      es: "Escribe que muchos en el movimiento se apoyan en las responsa de 1950, y que a él ese enfoque no lo convence: usar electricidad en Shabat es «la antítesis del Palacio en el Tiempo» de Heschel. Durante la pandemia propuso reunirse por Zoom antes de encender las velas, para Minjá y Kabalat Shabat, apagar y rezar Arvit en casa.",
      en: "He writes that many in the movement rely on the 1950 responsa, and that he doesn't find that approach convincing: using electricity on Shabbat is “the antithesis of the ‘Palace in Time’” of Heschel. During the pandemic he suggested meeting on Zoom before candle lighting for Minchah and Kabbalat Shabbat, then turning it off and praying Maariv at home.",
    },
    relevance: {
      es: "Su salida, hacer las cosas antes de que empiece Shabat, es la misma que propone NavTorá.",
      en: "Its way out, doing things before Shabbat begins, is the same one NavTorah takes.",
    },
    links: [{ label: "Schechter", url: "https://schechter.edu/?p=897" }],
  },

  // ---------- why not on Shabbat: classical and Orthodox ----------
  {
    id: "chazon-ish",
    stance: "restricts",
    title: { es: "Cerrar un circuito es construir", en: "Closing a circuit is building" },
    cite: { es: "Jazón Ish, Óraj Jaim 50:9", en: "Chazon Ish, Orach Chayim 50:9" },
    summary: {
      es: "Cerrar un circuito eléctrico «construye» un utensilio (boné) y abrirlo lo «destruye»; también menciona completar una obra (maké bepatish). Si es así, es una prohibición de la Torá.",
      en: "Closing an electric circuit “builds” a utensil (boneh) and opening it “destroys” it; he also mentions completing a work (makeh bepatish). If so, it is a Torah prohibition.",
    },
    relevance: {
      es: "Con esta postura, prender cualquier aparato está prohibido, y ningún valor rabínico lo desplaza.",
      en: "On this view, turning on any device is forbidden, and no rabbinic value overrides it.",
    },
    links: [{ label: { es: "Resumen en castellano (Pninei Halajá)", en: "Summary in Spanish (Peninei Halakhah)" }, url: "https://ph.yhb.org.il/es/01-17-02/" }],
  },
  {
    id: "beit-yitzchak",
    stance: "restricts",
    title: { es: "Cerrar un circuito es crear algo nuevo", en: "Closing a circuit creates something new" },
    cite: { es: "Beit Itzjak, Iore Deá 2:31 (R. Itzjak Shmelkes, Lemberg)", en: "Beit Yitzchak, Yoreh De'ah 2:31 (R. Yitzchak Shmelkes, Lemberg)" },
    summary: {
      es: "Cerrar un circuito se parece a perfumar una ropa (molid, Beitzá 23a): una prohibición rabínica de crear algo nuevo en Shabat.",
      en: "Closing a circuit resembles scenting a garment (molid, Beitzah 23a): a rabbinic prohibition on creating something new on Shabbat.",
    },
    links: [{ label: { es: "Resumen en castellano (Pninei Halajá)", en: "Summary in Spanish (Peninei Halakhah)" }, url: "https://ph.yhb.org.il/es/01-17-02/" }],
  },
  {
    id: "auerbach",
    stance: "restricts",
    title: { es: "No hay una prohibición de fondo, pero se prohíbe", en: "No prohibition in principle, but forbidden in practice" },
    cite: { es: "R. Shlomo Zalman Auerbach, Minjat Shlomó", en: "R. Shlomo Zalman Auerbach, Minchat Shlomo" },
    summary: {
      es: "Rechaza que cerrar un circuito sea construir o crear algo nuevo: es como abrir y cerrar una puerta. Llega a escribir que, en su opinión, usar electricidad sin luz ni calor no tiene una prohibición propia. Aun así no lo permite sin gran necesidad, para que nadie termine prendiendo luces, y pide mantener la costumbre de prohibir. Según el Rab. Neuwirth, para él la imagen en un monitor ni siquiera era escritura.",
      en: "He rejects the idea that closing a circuit is building or creating something new: it's like opening and closing a door. He goes as far as writing that using electricity without light or heat carries no prohibition of its own. Even so, he doesn't allow it without great need, lest people come to turn on lights, and upholds the custom of forbidding it. According to Rabbi Neuwirth, he didn't consider an image on a monitor writing at all.",
    },
    relevance: {
      es: "En la teoría es la postura ortodoxa más cercana a la conservadora; en la práctica prohíbe.",
      en: "In theory it's the Orthodox position closest to the Conservative one; in practice it forbids.",
    },
    links: [{ label: { es: "Resumen en castellano (Pninei Halajá)", en: "Summary in Spanish (Peninei Halakhah)" }, url: "https://ph.yhb.org.il/es/01-17-02/" }],
  },
  {
    id: "feinstein",
    stance: "restricts",
    title: { es: "El menosprecio del Shabat", en: "Belittling Shabbat" },
    cite: { es: "R. Moshe Feinstein, Igrot Moshé, Óraj Jaim 4:60 y 4:84", en: "R. Moshe Feinstein, Igrot Moshe, Orach Chayim 4:60 and 4:84" },
    summary: {
      es: "Aunque no haya una melajá clara, hay usos de la tecnología que contradicen el carácter del día y son zilzul Shabat, menosprecio del Shabat: por eso prohíbe, por ejemplo, programar con temporizador una radio o una televisión. Sobre la imagen en un monitor, opina que no es duradera y que es a lo sumo una prohibición rabínica.",
      en: "Even without a clear melachah, some uses of technology contradict the character of the day and are zilzul Shabbat, belittling Shabbat: that is why he forbids, for example, setting a radio or a television on a timer. Of an image on a monitor, he holds that it isn't lasting and is at most a rabbinic prohibition.",
    },
    relevance: {
      es: "Aun si la pantalla no fuera escribir, este criterio pesa contra usar un celular en la bimá.",
      en: "Even if a screen isn't writing, this standard weighs against using a phone at the bimah.",
    },
    links: [{ label: { es: "Panorama de Broyde y Jachter (inglés)", en: "Overview by Broyde and Jachter" }, url: "https://www.daat.ac.il/daat/english/journal/broyde_1.htm" }],
  },
  {
    id: "pninei-halacha",
    stance: "restricts",
    title: { es: "La electricidad y los artefactos eléctricos", en: "Electricity and Electrical Appliances" },
    cite: { es: "R. Eliezer Melamed, Pninei Halajá, Shabat, capítulos 17 y 18", en: "R. Eliezer Melamed, Peninei Halakhah, Shabbat, chapters 17 and 18" },
    summary: {
      es: "Expone todas las posturas sobre la electricidad (Rav Kuk, R. Uziel, el Jazón Ish, el Beit Itzjak, R. Auerbach) y está traducido al castellano. En la práctica actúa, de entrada, según quienes la prohíben por la Torá. En el capítulo siguiente: «está prohibido tipear letras en el computador o guardarlas en la memoria, tomar fotografías o grabar voces».",
      en: "It lays out every position on electricity (Rav Kook, R. Uziel, the Chazon Ish, the Beit Yitzchak, R. Auerbach), and is online in Spanish too. In practice it follows, from the outset, those who forbid it by Torah law. The next chapter: “it is forbidden to type letters on a computer or save them in memory, to take photographs or to record voices.”",
    },
    relevance: {
      es: "Es la mejor referencia ortodoxa en castellano para quien quiera profundizar.",
      en: "It's the best Orthodox reference available in Spanish for anyone who wants to go deeper.",
    },
    links: [
      { label: { es: "Capítulo 17 en castellano", en: "Chapter 17 (Spanish)" }, url: "https://ph.yhb.org.il/es/category/01/01-17/" },
      { label: { es: "Capítulo 18 en castellano", en: "Chapter 18 (Spanish)" }, url: "https://ph.yhb.org.il/es/01-18-01/" },
    ],
  },
  {
    id: "bleich-cameras",
    stance: "restricts",
    title: { es: "Cámaras de vigilancia en Shabat", en: "Use of Surveillance Systems on Shabbat" },
    original: "Survey of Recent Halakhic Periodical Literature: Use of Surveillance Systems on Shabbat",
    cite: { es: "R. J. David Bleich, Tradition 35:3", en: "R. J. David Bleich, Tradition 35:3" },
    year: "2001",
    summary: {
      es: "Para quien pasa frente a una cámara de seguridad hay posturas permisivas: no lo hace a propósito y la imagen en el monitor no dura. En cambio, para el acto de fotografiar, el Keren LeDavid lo considera escribir, una prohibición de la Torá, aunque se haga de manera indirecta.",
      en: "For someone walking past a security camera there are lenient positions: it isn't intentional and the image on the monitor doesn't last. For the act of taking a photograph, though, the Keren LeDavid holds it is writing, a Torah prohibition, even when done indirectly.",
    },
    relevance: {
      es: "La app usa la cámara a propósito, así que las permisiones para el caso pasivo no se le aplican directamente.",
      en: "The app uses the camera on purpose, so the lenient rulings for the passive case don't apply to it directly.",
    },
    links: [{ label: "Tradition (PDF)", url: "https://traditiononline.org/wp-content/uploads/2019/06/Survey-of-Recent-30.pdf" }],
  },
  {
    id: "melachot",
    stance: "restricts",
    title: { es: "Escribir, muktzé y transportar", en: "Writing, muktzeh and carrying" },
    cite: {
      es: "Mishná Shabat 7:2; Rambam, Hiljot Shabat 11:17; Shulján Aruj, Óraj Jaim 308:1 y 308:3; Mishná Shabat 1:1; Óraj Jaim 345:1",
      en: "Mishnah Shabbat 7:2; Rambam, Laws of Shabbat 11:17; Shulchan Aruch, Orach Chayim 308:1 and 308:3; Mishnah Shabbat 1:1; Orach Chayim 345:1",
    },
    summary: {
      es: "Escribir dos letras es una de las 39 melajot, y trazar formas es un derivado de escribir. Un objeto que se usa sobre todo para algo prohibido (kli shemelajtó leisur) no se mueve en Shabat salvo para usarlo en algo permitido o para despejar su lugar; tocarlo sin moverlo no está prohibido. Y sin eruv no se puede llevar nada de la casa a la sinagoga.",
      en: "Writing two letters is one of the 39 melachot, and drawing shapes is derived from writing. An object used mainly for something forbidden (kli shemelachto le'issur) isn't moved on Shabbat except to use it for something permitted or to clear its place; touching it without moving it isn't forbidden. And without an eruv, nothing may be carried from home to the synagogue.",
    },
    relevance: {
      es: "Usar la app implica levantar el teléfono y llevarlo hasta el rollo: aun antes de la pantalla y la cámara, eso ya choca con estas leyes.",
      en: "Using the app means picking the phone up and bringing it to the scroll: even before the screen and the camera, that already runs into these laws.",
    },
    links: [
      { label: { es: "Mishná Shabat 7:2", en: "Mishnah Shabbat 7:2" }, url: "https://www.sefaria.org/Mishnah_Shabbat.7.2" },
      { label: "Rambam 11:17", url: "https://www.sefaria.org/Mishneh_Torah,_Sabbath.11.17" },
      { label: { es: "Óraj Jaim 308", en: "Orach Chayim 308" }, url: "https://www.sefaria.org/Shulchan_Arukh,_Orach_Chayim.308.3" },
      { label: { es: "Óraj Jaim 345", en: "Orach Chayim 345" }, url: "https://www.sefaria.org/Shulchan_Arukh,_Orach_Chayim.345.1" },
    ],
  },
  {
    id: "uvdin-dechol",
    stance: "restricts",
    title: { es: "El espíritu del día", en: "The spirit of the day" },
    original: "וְכִבַּדְתּוֹ מֵעֲשׂוֹת דְּרָכֶיךָ",
    cite: { es: "Isaías 58:13; Ramban sobre Vaikrá 23:24", en: "Isaiah 58:13; Ramban on Leviticus 23:24" },
    summary: {
      es: "Honrar el Shabat «absteniéndote de tus caminos». Para el Ramban, el shabatón es un mandamiento de reposo que abarca también lo que no es melajá. De ahí sale la idea de uvdin dejol: actividades de días de semana que, aunque no estén prohibidas, no son del Shabat.",
      en: "Honor Shabbat “by not going your own ways.” For the Ramban, shabbaton is a commandment to rest that covers things that aren't melachah too. From it comes the idea of uvdin dechol: weekday activities that, even if not forbidden, don't belong to Shabbat.",
    },
    relevance: {
      es: "Es la base de la idea de que un celular en la bimá no es del Shabat. La usan Nevins, Golinkin y R. Feinstein.",
      en: "It underlies the idea that a phone at the bimah doesn't belong to Shabbat. Nevins, Golinkin and R. Feinstein all use it.",
    },
    links: [
      { label: { es: "Isaías 58:13", en: "Isaiah 58:13" }, url: "https://www.sefaria.org/Isaiah.58.13" },
      { label: "Ramban", url: "https://www.sefaria.org/Ramban_on_Leviticus.23.24.1" },
    ],
  },

  // ---------- where to ask ----------
  {
    id: "srl-halacha",
    stance: "ask",
    title: { es: "Centro de Estudios de la Halajá del Seminario", en: "The Seminario's Center for Halakhic Studies" },
    cite: { es: "Seminario Rabínico Latinoamericano, Buenos Aires", en: "Seminario Rabínico Latinoamericano, Buenos Aires" },
    summary: {
      es: "Trabaja junto con el Beit Din del Seminario y recibe preguntas de cualquiera por un formulario. Publica responsa breves en castellano y portugués.",
      en: "It works with the Seminario's Beit Din and takes questions from anyone through a form. It publishes short responsa in Spanish and Portuguese.",
    },
    relevance: {
      es: "Para una pregunta concreta sobre tu kehilá, es el lugar para hacerla.",
      en: "For a specific question about your own community, it's the place to ask.",
    },
    links: [{ label: { es: "Hacer una pregunta", en: "Ask a question (Spanish)" }, url: "https://www.seminariorabinico.org/halaja/" }],
  },
];
