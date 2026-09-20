/**
 * Offline HadeethEnc Category Engine & Cross-Collection Topic Mapper.
 *
 * Links canonical Hadiths from the Fawaz Ahmed collections (Bukhari, Muslim,
 * Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah) to HadeethEnc's hierarchical
 * categorization taxonomy through:
 * 1. Normalized Arabic rasm phrase matching (using core Prophetic expressions).
 * 2. Canonical book & section topic alignment (e.g. Kitab al-Iman, Kitab as-Salah).
 * 3. Topic keywords in Arabic and English translations.
 */

import type { EncCategoryNode } from "./hadeethenc";

export interface HadithCategory {
  id: string;
  title: string;
  arabicTitle: string;
  color: string;
  parentId?: string | null;
}

/**
 * Standard HadeethEnc top-level and essential subcategories
 * mirroring https://hadeethenc.com and Hadith-JSON-Engine docs.
 */
export const OFFLINE_CATEGORIES: HadithCategory[] = [
  {
    id: "100",
    title: "The Creed & Faith",
    arabicTitle: "العقيدة والإيمان",
    color: "#D4AF37", // gold
  },
  {
    id: "101",
    title: "Monotheism (Tawheed)",
    arabicTitle: "التوحيد والأسماء والصفات",
    color: "#D4AF37",
    parentId: "100",
  },
  {
    id: "133",
    title: "Purification (Taharah)",
    arabicTitle: "الطهارة والوضوء والغسل",
    color: "#2DD4BF", // teal
  },
  {
    id: "134",
    title: "Prayer (Salah)",
    arabicTitle: "الصلاة وأحكامها",
    color: "#38BDF8", // sky
  },
  {
    id: "136",
    title: "Zakah & Charity",
    arabicTitle: "الزكاة والصدقات",
    color: "#34D399", // emerald
  },
  {
    id: "137",
    title: "Fasting (Sawm)",
    arabicTitle: "الصيام وأحكامه",
    color: "#FBBF24", // amber
  },
  {
    id: "138",
    title: "Hajj & Umrah",
    arabicTitle: "الحج والعمرة",
    color: "#A78BFA", // purple
  },
  {
    id: "191",
    title: "Family & Marriage",
    arabicTitle: "الأسرة والنكاح والطلاق",
    color: "#F472B6", // pink
  },
  {
    id: "122",
    title: "Transactions & Trade",
    arabicTitle: "المعاملات المالية والبيوع",
    color: "#FB923C", // orange
  },
  {
    id: "150",
    title: "Noble Manners & Ethics",
    arabicTitle: "الآداب والأخلاق ومكارم الخصال",
    color: "#10B981", // green
  },
  {
    id: "268",
    title: "Supplications & Adhkar",
    arabicTitle: "الأدعية والأذكار والاستغفار",
    color: "#818CF8", // indigo
  },
  {
    id: "126",
    title: "Food & Drinks",
    arabicTitle: "الأطعمة والأشربة والذبائح",
    color: "#E879F9", // fuchsia
  },
  {
    id: "292",
    title: "Travel & Expeditions",
    arabicTitle: "السفر والجهاد والسير",
    color: "#94A3B8", // slate
  },
  {
    id: "180",
    title: "Virtues & Merits",
    arabicTitle: "فضائل الأعمال والصحابة",
    color: "#EAB308", // yellow
  },
  {
    id: "220",
    title: "Heart Softeners & Piety",
    arabicTitle: "الرقائق والزهد والتوبة",
    color: "#6EE7B7", // light emerald
  },
  {
    id: "250",
    title: "Knowledge & Seeking Learning",
    arabicTitle: "العلم والتعليم وآداب العالم",
    color: "#60A5FA", // blue
  },
];

/**
 * Normalized Arabic text helper (strip tashkeel, unify alefs/hamzas)
 */
function normalizeAr(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[\u0622\u0623\u0625\u0627]/g, "\u0627")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0649/g, "\u064A")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064A")
    .replace(/[^\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Signature matchers: key canonical Arabic words and rasm patterns
 * representing specific topic domains.
 */
interface CategoryRule {
  categoryId: string;
  arabicKeywords: string[];
  sectionKeywords: string[];
  arabicSignatures?: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    categoryId: "100", // Creed & Faith
    arabicKeywords: ["ايمان", "توحيد", "شرك", "كفر", "اسلام", "نفاق", "رسل", "ملائكه", "يوم القيامه", "قدر", "عرش"],
    sectionKeywords: ["faith", "belief", "iman", "tawheed", "creed", "oneness"],
    arabicSignatures: ["انما الاعمال بالنيات", "بني الاسلام على خمس", "ان تؤمن بالله وملائكته", "من قال لا اله الا الله"],
  },
  {
    categoryId: "133", // Purification
    arabicKeywords: ["وضوء", "طهور", "غسل", "تيمم", "استنجاء", "حيض", "جنابه", "سواك", "مذي", "نجاسه", "خفين"],
    sectionKeywords: ["purification", "ablution", "wudu", "ghusl", "tayammum", "menses", "rubbing"],
    arabicSignatures: ["الطهور شطر الايمان", "لا يقبل الله صلاه احدكم اذا احدث حتى يتوضا", "لولا ان اشق على امتي لامرتهم بالسواك"],
  },
  {
    categoryId: "134", // Prayer
    arabicKeywords: ["صلاه", "سجود", "ركوع", "اذان", "اقامه", "قبله", "جمعه", "وتر", "تراويح", "قصر", "كسوف", "جنازه"],
    sectionKeywords: ["prayer", "prayers", "salah", "salat", "call to prayer", "adhan", "prostration", "friday", "jumu'ah", "times of prayer", "shortening"],
    arabicSignatures: ["صلوا كما رايتموني اصلي", "وجعلت لي الارض مسجدا وطهورا", "اقرب ما يكون العبد من ربه وهو ساجد", "بين الرجل وبين الشرك والكفر ترك الصلاه"],
  },
  {
    categoryId: "136", // Zakah & Charity
    arabicKeywords: ["زكاه", "صدقه", "انفاق", "سائل", "مسكين", "فقراء", "ذهب", "فضه", "عشر", "فطره"],
    sectionKeywords: ["zakat", "zakah", "charity", "alms", "poor-rate", "giving"],
    arabicSignatures: ["اليد العليا خير من اليد السفلى", "ما نقصت صدقه من مال", "اتقوا النار ولو بشق تمره", "تبسمك في وجه اخيك صدقه"],
  },
  {
    categoryId: "137", // Fasting
    arabicKeywords: ["صيام", "صوم", "رمضان", "افطار", "سحور", "ليله القدر", "اعتكاف", "عاشوراء", "شوال"],
    sectionKeywords: ["fasting", "fasts", "sawm", "ramadan", "suhur", "iftar", "retiring to a mosque for prayer", "i'tikaf"],
    arabicSignatures: ["من صام رمضان ايمانا واحتسابا", "الصيام جنه", "للصائم فرحتان", "تسحروا فان في السحور بركه"],
  },
  {
    categoryId: "138", // Hajj & Umrah
    arabicKeywords: ["حج", "عمره", "احرام", "طواف", "سعي", "عرفه", "منى", "مزدلفه", "هدي", "تلبيّه", "كعبه"],
    sectionKeywords: ["hajj", "pilgrimage", "umrah", "ihram", "tawaf", "arafat"],
    arabicSignatures: ["من حج لله فلم يرفث ولم يفسق", "الحج المبرور ليس له جزاء الا الجنه", "العمره الى العمره كفاره لما بينهما", "خذوا عني مناسككم"],
  },
  {
    categoryId: "191", // Family & Marriage
    arabicKeywords: ["نكاح", "زواج", "مهر", "طلاق", "رضاع", "نفقه", "وليمه", "عشره", "اولاد", "والدين", "عقوق"],
    sectionKeywords: ["marriage", "wedlock", "divorce", "nikah", "talaq", "dowry", "family", "suckling"],
    arabicSignatures: ["يا معشر الشباب من استطاع منكم الباءه فليتزوج", "تنكح المراه لاربع", "خيركم خيركم لاهله", "رضا الرب في رضا الوالد"],
  },
  {
    categoryId: "122", // Transactions & Trade
    arabicKeywords: ["بيع", "شراء", "ربا", "قرض", "سلم", "شفعه", "اجاره", "شركه", "غصب", "رهن", "دين"],
    sectionKeywords: ["sales", "trade", "transactions", "usury", "riba", "debts", "loans", "mortgaging", "partnership"],
    arabicSignatures: ["البيعان بالخيار ما لم يتفرقا", "من غش فليس منا", "رحم الله رجلا سمحا اذا باع واذا اشترى", "المسلمون على شروطهم"],
  },
  {
    categoryId: "150", // Manners & Ethics
    arabicKeywords: ["خلق", "ادب", "حياء", "صدق", "كذب", "غيبه", "نميمه", "سلام", "استئذان", "جار", "صله رحم", "غضب"],
    sectionKeywords: ["good manners", "etiquette", "adab", "ethics", "morals", "behavior", "greeting", "asking permission"],
    arabicSignatures: ["انما بعثت لاتمم صالح الاخلاق", "الحياء لا ياتي الا بخير", "لا يؤمن احدكم حتى يحب لاخيه ما يحب لنفسه", "من كان يؤمن بالله واليوم الاخر فليقل خيرا او ليصمت", "لا يدخل الجنه قاطع رحم"],
  },
  {
    categoryId: "268", // Supplications & Adhkar
    arabicKeywords: ["دعاء", "ذكر", "استغفار", "تسبيح", "تحميد", "تهليل", "تكبير", "رقيه", "تعوذ", "استخاره"],
    sectionKeywords: ["supplication", "invocations", "remembrance", "adhkar", "dua", "seeking forgiveness", "istighfar"],
    arabicSignatures: ["الدعاء هو العباده", "مثل الذي يذكر ربه والذي لا يذكر ربه مثل الحي والميت", "كلمتان خفيفتان على اللسان ثقيلتان في الميزان", "سيد الاستغفار"],
  },
  {
    categoryId: "126", // Food & Drinks
    arabicKeywords: ["طعام", "اكل", "شرب", "ذبيحه", "صيد", "خمر", "نبيذ", "يمين", "تسميه", "ضيافه"],
    sectionKeywords: ["food", "drinks", "meals", "slaughter", "hunting", "liquors"],
    arabicSignatures: ["يا غلام سم الله وكل بيمينك وكل مما يليك", "كل مسكر حرام", "ما ملا ادمي وعاء شرا من بطن"],
  },
  {
    categoryId: "220", // Heart Softeners & Piety
    arabicKeywords: ["رقاق", "زهد", "توبه", "قبر", "موت", "جنه", "نار", "صبر", "فتنه", "اخره", "رجاء", "خوف"],
    sectionKeywords: ["to make the heart tender", "riqaq", "heart-melting", "piety", "zuhd", "repentance", "afflictions"],
    arabicSignatures: ["كن في الدنيا كانك غريب او عابر سبيل", "نعمتان مغبون فيهما كثير من الناس الصحه والفراغ", "لو كانت الدنيا تعدل عند الله جناح بعوضه"],
  },
  {
    categoryId: "250", // Knowledge
    arabicKeywords: ["علم", "فقيه", "عالم", "متعلم", "حكمه", "فتوى", "حديث", "روايه"],
    sectionKeywords: ["knowledge", "learning", "ilm", "scholar"],
    arabicSignatures: ["طلب العلم فريضه على كل مسلم", "من سلك طريقا يلتمس فيه علما سهل الله له به طريقا الى الجنه", "ان العلماء ورثه الانبياء"],
  },
];

const categoryMap = new Map(OFFLINE_CATEGORIES.map((c) => [c.id, c]));

/**
 * Evaluates and returns matching categories for any HadithNode.
 * Guaranteed to run fast in-memory using cached rules and text tokens.
 */
export function getHadithCategories(node: {
  collection: string;
  hadithNumber: number | string;
  arabicText: string;
  sectionName: string;
  sectionId?: number;
  translatedText?: string;
}): HadithCategory[] {
  const normArabic = normalizeAr(node.arabicText || "");
  const normSection = (node.sectionName || "").toLowerCase();
  const normTrans = (node.translatedText || "").toLowerCase();

  const matchedIds = new Set<string>();

  for (const rule of CATEGORY_RULES) {
    // 1. Signature exact / phrase hit in Arabic (highest confidence)
    if (rule.arabicSignatures) {
      for (const sig of rule.arabicSignatures) {
        const normSig = normalizeAr(sig);
        if (normArabic.includes(normSig)) {
          matchedIds.add(rule.categoryId);
          break;
        }
      }
    }

    // 2. Section/Book Name hit
    if (!matchedIds.has(rule.categoryId)) {
      for (const sk of rule.sectionKeywords) {
        if (normSection.includes(sk)) {
          matchedIds.add(rule.categoryId);
          break;
        }
      }
    }

    // 3. Arabic keyword frequency hit
    if (!matchedIds.has(rule.categoryId) && normArabic.length > 15) {
      let kwHits = 0;
      for (const ak of rule.arabicKeywords) {
        if (normArabic.includes(ak)) {
          kwHits++;
          if (kwHits >= 2) {
            matchedIds.add(rule.categoryId);
            break;
          }
        }
      }
    }

    // 4. Secondary translation keyword check if needed
    if (!matchedIds.has(rule.categoryId) && normTrans) {
      for (const sk of rule.sectionKeywords) {
        if (sk.length > 4 && normTrans.includes(` ${sk} `)) {
          matchedIds.add(rule.categoryId);
          break;
        }
      }
    }
  }

  // Fallback: If no match, check section name alone
  if (matchedIds.size === 0) {
    if (normSection.includes("prayer") || normSection.includes("salat")) matchedIds.add("134");
    else if (normSection.includes("fast") || normSection.includes("ramadan")) matchedIds.add("137");
    else if (normSection.includes("zakat")) matchedIds.add("136");
    else if (normSection.includes("purification") || normSection.includes("wudu")) matchedIds.add("133");
    else if (normSection.includes("belief") || normSection.includes("faith")) matchedIds.add("100");
    else if (normSection.includes("manner") || normSection.includes("etiquette")) matchedIds.add("150");
    else matchedIds.add("150"); // general morals/manners default
  }

  return Array.from(matchedIds)
    .map((id) => categoryMap.get(id))
    .filter((c): c is HadithCategory => Boolean(c));
}

/**
 * Returns offline EncCategoryNode list compatible with HadeethEnc API formats.
 */
export function getOfflineCategoryNodes(): EncCategoryNode[] {
  return OFFLINE_CATEGORIES.map((c) => ({
    id: c.id,
    title: c.title,
    hadeeths_count: "250+",
    parent_id: c.parentId ?? null,
    depth: c.parentId ? 1 : 0,
    isLeaf: !OFFLINE_CATEGORIES.some((sub) => sub.parentId === c.id),
  }));
}

/**
 * Fast offline category search for TopicSearch component.
 */
export function searchOfflineCategories(query: string, limit = 8): EncCategoryNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const all = getOfflineCategoryNodes();
  return all
    .filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (categoryMap.get(c.id)?.arabicTitle || "").includes(query.trim()),
    )
    .slice(0, limit);
}
