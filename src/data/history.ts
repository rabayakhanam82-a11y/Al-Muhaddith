/** Epistemological Local History of Hadith module, static content matrix. */

export interface HistoryEra {
  id: string;
  epoch: string;
  period: string;
  summary: string;
  hubs: HistoryHub[];
}

export interface HistoryHub {
  id: string;
  city: string;
  region: string;
  period: string;
  headline: string;
  body: string;
  scholars: string[];
}

export interface ScholarMethod {
  id: string;
  title: string;
  body: string;
}

export const HISTORY_ERAS: HistoryEra[] = [
  {
    id: "era-companions",
    epoch: "Era of First Assembly",
    period: "610 – 661 CE",
    summary:
      "Direct preservation synchronized by the Companions through verified personal logs (sahifah) and rigorous memory transmission, anchored to the prophetic practice itself.",
    hubs: [
      {
        id: "hub-medina",
        city: "Medina",
        region: "Hejaz",
        period: "622 – 661 CE",
        headline: "The Mother Hub of Verification",
        body: "Medina hosted the densest concentration of Companions; legal rulings and narrations were cross-checked against living practice. Umar ibn al-Khattab institutionalized consultation of narrators before accepting reports.",
        scholars: ["Abu Hurairah", "Aisha bint Abi Bakr", "Abdullah ibn Umar"],
      },
      {
        id: "hub-mecca",
        city: "Mecca",
        region: "Hejaz",
        period: "610 – 661 CE",
        headline: "Custodians of Ritual Memory",
        body: "Mecca preserved narrations tied to pilgrimage rites and the Abrahamic legacy, transmitted through Ibn Abbas's famed teaching circles by the Zamzam canopy.",
        scholars: ["Ibn Abbas", "Zaid ibn Thabit"],
      },
    ],
  },
  {
    id: "era-successors",
    epoch: "Systematization Contexts",
    period: "661 – 750 CE",
    summary:
      "Development of analytical evaluation frameworks tracking textual variants across an expanding empire: the birth of critical isnad scrutiny.",
    hubs: [
      {
        id: "hub-kufa",
        city: "Kufa",
        region: "Iraq",
        period: "638 – 750 CE",
        headline: "Forge of Isnad Criticism",
        body: "Kufa's scholars pioneered systematic isnad analysis. Ibn Sirin's dictum that 'they never asked about the isnad before the Fitna; after it, they said: name your men' crystallized here.",
        scholars: ["Ibn Sirin", "Al-Sha'bi", "Ibrahim al-Nakha'i"],
      },
      {
        id: "hub-basra",
        city: "Basra",
        region: "Iraq",
        period: "636 – 750 CE",
        headline: "Grammar of Transmission",
        body: "Basra married philology to hadith science; Hasan al-Basri's circle demanded the exact chain wording, seeding precision standards later formalized as Riwayah and Dirayah.",
        scholars: ["Hasan al-Basri", "Muhammad ibn Sirin", "Qatada"],
      },
      {
        id: "hub-damascus",
        city: "Damascus",
        region: "Syria",
        period: "661 – 750 CE",
        headline: "Umayyad Archive",
        body: "The Umayyad capital kept court records and the libraries of Khalid ibn Ma'dan, channeling Syrian chains through Makhul and al-Awza'i.",
        scholars: ["Makhul al-Shami", "Al-Awza'i"],
      },
    ],
  },
  {
    id: "era-compilation",
    epoch: "The Golden Compilation",
    period: "750 – 923 CE",
    summary:
      "Introduction of strict validation filters by al-Bukhari and contemporaries, refining collection practice into the canonical Six Books.",
    hubs: [
      {
        id: "hub-bukhara",
        city: "Bukhara",
        region: "Transoxiana",
        period: "810 – 870 CE",
        headline: "Al-Bukhari's crucible",
        body: "Imam al-Bukhari sifted 600,000 narrations over 16 years of travel, accepting only those with perfectly contiguous, upright chains, and praying two rak'ahs before each entry.",
        scholars: ["Imam al-Bukhari"],
      },
      {
        id: "hub-baghdad",
        city: "Baghdad",
        region: "Iraq",
        period: "767 – 923 CE",
        headline: "Capital of Canonical Review",
        body: "Baghdad's House of Wisdom era hosted Muslim, al-Tirmidhi's teacher al-Bukhari, and the public examinations where al-Bukhari defended 400 iterations of his Sahih.",
        scholars: ["Imam Muslim", "Ahmad ibn Hanbal", "Al-Tirmidhi"],
      },
      {
        id: "hub-qayrawan",
        city: "Qayrawan",
        region: "North Africa",
        period: "800 – 900 CE",
        headline: "Western Gateway",
        body: "Maliki transmitters carried Muwatta recensions west; Qayrawan and Cordoba became relay stations for Sahih authentication into Andalusia.",
        scholars: ["Sahnun", "Ibn al-Qasim"],
      },
    ],
  },
];

export const SCHOLAR_METHODS: ScholarMethod[] = [
  {
    id: "method-isnad",
    title: "Isnad: The Chain of Custody",
    body: "Every narration carries a chain of named transmitters. Matn criticism verifies content against Qur'an and mass-transmitted Sunnah, while isnad analysis verifies people: continuity, integrity ('adalah), and precision (dabt).",
  },
  {
    id: "method-rijal",
    title: "Asma al-Rijal: Biographical Evaluation",
    body: "Rijal works catalog every transmitter: birth, teachers, students, memory reliability, and doctrinal probity. Grading verdicts (Sahih, Hasan, Da'if, Mawdu') descend directly from these biographical ledgers.",
  },
  {
    id: "method-riwayah",
    title: "Riwayah & Dirayah",
    body: "Riwayah is the exact report of wording; Dirayah is the understanding of its legal implication. A narrator fails if either breaks, hence double-axis grading rather than a single authenticity score.",
  },
  {
    id: "method-musnad",
    title: "From Musnad to Sahih",
    body: "Compilations evolved from arranged-by-companion musnads to thematic abwab. Al-Bukhari's innovation was chapter jurisprudence: every bab is a legal argument expressed through the hadiths chosen for it.",
  },
];
