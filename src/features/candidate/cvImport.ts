import type { PDFDocumentProxy } from "pdfjs-dist";
import type { CandidateProfileInput } from "../../lib/types";
import type {
  CandidateEducation,
  CandidateExperience,
  CandidateLanguage,
} from "../../services/candidateService";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 20;
const MAX_OCR_PAGES = 6;
const OCR_LANGUAGE_DATA_URL = "https://tessdata.projectnaptha.com/4.0.0";

type ImportedProfileFields = Partial<Pick<
  CandidateProfileInput,
  | "full_name"
  | "email"
  | "phone"
  | "headline"
  | "specialization"
  | "province"
  | "city"
  | "experience_years"
  | "skills"
  | "summary"
>>;

export type CandidateCvImport = {
  profile: ImportedProfileFields;
  experiences: CandidateExperience[];
  education: CandidateEducation[];
  languages: CandidateLanguage[];
  source: "pdf-text" | "docx" | "ocr";
  ocrPages: number;
  warnings: string[];
};

type ParsedCvText = Omit<CandidateCvImport, "source" | "ocrPages">;
type ProgressCallback = (message: string) => void;
type SectionName = "summary" | "experience" | "education" | "skills" | "languages";

const SECTION_ALIASES: Record<SectionName, string[]> = {
  summary: [
    "summary",
    "professional summary",
    "profile",
    "professional profile",
    "career objective",
    "objective",
    "نبذة",
    "نبذة مهنية",
    "الملخص",
    "الملف الشخصي",
    "الهدف المهني",
  ],
  experience: [
    "experience",
    "work experience",
    "professional experience",
    "employment history",
    "work history",
    "career history",
    "career experience",
    "الخبرة",
    "الخبرة العملية",
    "الخبرات العملية",
    "الخبرة المهنية",
    "المسار المهني",
    "التاريخ الوظيفي",
  ],
  education: [
    "education",
    "education and training",
    "academic background",
    "qualifications",
    "المؤهلات",
    "المؤهلات العلمية",
    "التعليم",
    "التعليم والتدريب",
    "الدراسة",
  ],
  skills: [
    "skills",
    "technical skills",
    "core skills",
    "key skills",
    "competencies",
    "core competencies",
    "المهارات",
    "المهارات التقنية",
    "الكفاءات",
    "نقاط القوة",
  ],
  languages: [
    "languages",
    "language skills",
    "language proficiency",
    "spoken languages",
    "اللغات",
    "المهارات اللغوية",
    "مستوى اللغات",
  ],
};

const NON_PROFILE_SECTION_HEADINGS = [
  "projects",
  "personal projects",
  "certifications",
  "certificates",
  "courses",
  "training",
  "awards",
  "honors",
  "publications",
  "references",
  "interests",
  "hobbies",
  "volunteer work",
  "volunteer experience",
  "personal details",
  "additional information",
  "المشاريع",
  "الشهادات",
  "الدورات",
  "التدريب",
  "الإنجازات",
  "الجوائز",
  "المراجع",
  "الاهتمامات",
  "الهوايات",
  "العمل التطوعي",
  "معلومات إضافية",
];

const IRAQI_PROVINCES: Array<{ name: string; aliases: string[] }> = [
  { name: "بغداد", aliases: ["بغداد", "baghdad", "bagdad"] },
  { name: "البصرة", aliases: ["البصرة", "basra", "basrah"] },
  { name: "نينوى", aliases: ["نينوى", "nineveh", "mosul"] },
  { name: "الأنبار", aliases: ["الانبار", "anbar", "al anbar"] },
  { name: "أربيل", aliases: ["اربيل", "erbil", "irbil"] },
  { name: "دهوك", aliases: ["دهوك", "duhok", "dohuk"] },
  { name: "السليمانية", aliases: ["السليمانية", "sulaymaniyah", "sulaimani"] },
  { name: "كركوك", aliases: ["كركوك", "kirkuk"] },
  { name: "ديالى", aliases: ["ديالى", "diyala"] },
  { name: "صلاح الدين", aliases: ["صلاح الدين", "saladin", "salah al din", "salahuddin"] },
  { name: "بابل", aliases: ["بابل", "babil", "babylon"] },
  { name: "كربلاء", aliases: ["كربلاء", "karbala"] },
  { name: "النجف", aliases: ["النجف", "najaf"] },
  { name: "القادسية", aliases: ["القادسية", "qadisiyyah", "al qadisiyah"] },
  { name: "واسط", aliases: ["واسط", "wasit"] },
  { name: "ميسان", aliases: ["ميسان", "maysan"] },
  { name: "ذي قار", aliases: ["ذي قار", "dhi qar", "thi qar"] },
  { name: "المثنى", aliases: ["المثنى", "muthanna"] },
];

const ARABIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

function normalizeText(value: string) {
  return value
    .normalize("NFKC")
    .replace(/[٠-٩۰-۹]/g, (digit) => ARABIC_DIGITS[digit] || digit)
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069\uFEFF]/g, "")
    .replace(/\u0640/g, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ");
}

function normalizeForMatch(value: string) {
  return normalizeText(value)
    .toLocaleLowerCase()
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[：]/g, ":")
    .trim();
}

function createEntryId(prefix: string, index: number) {
  const unique = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${index}`;
  return `${prefix}-${unique}`;
}

function extractSections(text: string) {
  const sections: Record<SectionName, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    languages: [],
  };
  const header: string[] = [];
  let current: SectionName | null = null;

  for (const rawLine of normalizeText(text).split("\n")) {
    const line = rawLine.trim();
    const match = matchSectionHeading(line);
    if (match) {
      current = match.section;
      if (current && match.remainder) sections[current].push(match.remainder);
      continue;
    }
    if (current) sections[current].push(line);
    else header.push(line);
  }

  return { sections, header };
}

function matchSectionHeading(line: string): { section: SectionName | null; remainder: string } | null {
  if (!line || line.length > 90) return null;

  const separatorIndex = line.search(/[:：]/);
  const headingPart = separatorIndex >= 0 ? line.slice(0, separatorIndex) : line;
  const normalizedHeading = normalizeForMatch(headingPart);

  for (const [section, aliases] of Object.entries(SECTION_ALIASES) as Array<[SectionName, string[]]>) {
    if (aliases.some((alias) => normalizeForMatch(alias) === normalizedHeading)) {
      return {
        section,
        remainder: separatorIndex >= 0 ? line.slice(separatorIndex + 1).trim() : "",
      };
    }
  }
  if (NON_PROFILE_SECTION_HEADINGS.some((heading) => normalizeForMatch(heading) === normalizedHeading)) {
    return { section: null, remainder: "" };
  }
  return null;
}

function firstLabeledValue(lines: string[], labels: string) {
  const pattern = new RegExp(`^\\s*(?:${labels})\\s*[:：\\-–—]\\s*(.+?)\\s*$`, "i");
  for (const line of lines) {
    const match = line.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
}

function cleanContactValue(value: string) {
  return value.replace(/^[\s:：|،,;؛-]+|[\s|،,;؛]+$/g, "").trim();
}

function extractEmail(text: string) {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const email = match?.[0]?.trim() || "";
  return email.length <= 254 ? email : "";
}

function limitField(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function extractPhone(text: string) {
  const candidates = text.match(/(?:\+|00)?[0-9][0-9\s().-]{7,}[0-9]/g) || [];
  const candidate = candidates
    .map((value) => value.replace(/[^\d+]/g, ""))
    .find((value) => {
      const digitCount = value.replace(/\D/g, "").length;
      return digitCount >= 9 && digitCount <= 15;
    });
  return candidate || "";
}

function findProvince(text: string) {
  const normalized = normalizeForMatch(text);
  for (const province of IRAQI_PROVINCES) {
    if (province.aliases.some((alias) => normalized.includes(normalizeForMatch(alias)))) {
      return province.name;
    }
  }
  return "";
}

function splitItems(lines: string[]) {
  const items = lines
    .flatMap((line) => line.split(/[،,;؛|•●▪◦]+/g))
    .map((item) => item.replace(/^[\s\-–—*]+|[\s\-–—*]+$/g, "").trim())
    .filter((item) => item.length >= 2 && item.length <= 60);
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeForMatch(item);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 35);
}

const LANGUAGE_CATALOG: Array<[string, string[]]> = [
  ["العربية", ["arabic", "العربية", "العربي", "عربي", "اللغة العربية"]],
  ["English", ["english", "الإنجليزية", "الانجليزية", "الإنكليزية", "الانكليزية", "انكليزي", "إنكليزي", "اللغة الإنجليزية", "اللغة الانكليزية"]],
  ["Kurdish", ["kurdish", "الكردية", "الكردي", "كردي", "كوردي", "سوراني", "باديني"]],
  ["French", ["french", "الفرنسية", "الفرنسي"]],
  ["German", ["german", "الألمانية", "الالمانية", "ألماني", "الماني"]],
  ["Spanish", ["spanish", "الإسبانية", "الاسبانية", "إسباني", "اسباني"]],
  ["Turkish", ["turkish", "التركية", "التركي"]],
  ["Persian", ["persian", "farsi", "الفارسية", "فارسي", "داري", "داريّة"]],
  ["Russian", ["russian", "الروسية", "الروسي"]],
  ["Chinese", ["chinese", "mandarin", "الصينية", "الصيني", "الماندرين"]],
  ["Italian", ["italian", "الإيطالية", "الايطالية", "إيطالي", "ايطالي"]],
  ["Portuguese", ["portuguese", "البرتغالية", "البرتغالي"]],
  ["Hindi", ["hindi", "الهندية", "الهندي"]],
  ["Urdu", ["urdu", "الأردية", "الاردية", "أردو", "اردو"]],
  ["Japanese", ["japanese", "اليابانية", "الياباني"]],
  ["Korean", ["korean", "الكورية", "الكوري"]],
  ["Dutch", ["dutch", "الهولندية", "الهولندي"]],
  ["Greek", ["greek", "اليونانية", "اليوناني"]],
  ["Swedish", ["swedish", "السويدية", "السويدي"]],
  ["Norwegian", ["norwegian", "النرويجية", "النرويجي"]],
  ["Danish", ["danish", "الدنماركية", "الدنماركي"]],
  ["Polish", ["polish", "البولندية", "البولندي"]],
  ["Romanian", ["romanian", "الرومانية", "الروماني"]],
  ["Ukrainian", ["ukrainian", "الأوكرانية", "الاوكرانية", "الأوكراني", "الاوكراني"]],
  ["Hebrew", ["hebrew", "العبرية", "العبري"]],
  ["Armenian", ["armenian", "الأرمنية", "الارمنية", "الأرمني", "الارمني"]],
  ["Azerbaijani", ["azerbaijani", "الأذربيجانية", "الاذربيجانية"]],
  ["Indonesian", ["indonesian", "الإندونيسية", "الاندونيسية"]],
  ["Malay", ["malay", "الملايوية", "الملايو"]],
  ["Thai", ["thai", "التايلاندية", "التايلندي"]],
  ["Vietnamese", ["vietnamese", "الفيتنامية", "الفيتنامي"]],
  ["Swahili", ["swahili", "السواحلية", "السواحلي"]],
  ["Somali", ["somali", "الصومالية", "الصومالي"]],
  ["Pashto", ["pashto", "البشتوية", "البشتو"]],
  ["Filipino", ["filipino", "tagalog", "الفلبينية", "الفلبيني"]],
  ["Bengali", ["bengali", "البنغالية", "البنغالي"]],
  ["Serbian", ["serbian", "الصربية", "الصربي"]],
  ["Croatian", ["croatian", "الكرواتية", "الكرواتي"]],
  ["Bosnian", ["bosnian", "البوسنية", "البوسني"]],
];

const LANGUAGE_ALIAS_LOOKUP = new Map<string, string>();
for (const [canonical, aliases] of LANGUAGE_CATALOG) {
  for (const alias of aliases) LANGUAGE_ALIAS_LOOKUP.set(normalizeForMatch(alias), canonical);
}

const LANGUAGE_LEVEL_PATTERNS: Array<{ pattern: RegExp; level: CandidateLanguage["level"] }> = [
  { pattern: /(native|mother tongue|bilingual|اللغة الام|لغة ام|بطلاقة تامة)/i, level: "اللغة الأم" },
  { pattern: /(fluent|advanced|proficient|excellent|بطلاقة|متقدم|ممتاز)/i, level: "متقدم" },
  { pattern: /(upper intermediate|very good|good|جيد جدا|جيد جدًا|جيد)/i, level: "جيد جدًا" },
  { pattern: /(intermediate|conversational|متوسط)/i, level: "متوسط" },
  { pattern: /(basic|beginner|elementary|مبتدئ|اساسي|أساسي)/i, level: "مبتدئ" },
];

function parseLanguages(lines: string[]): CandidateLanguage[] {
  const candidates = lines
    .flatMap((line) => line.split(/[,،;؛|\/•●▪◦]+|\s+(?:and|و)\s+/i))
    .map((item) => item.replace(/^[\s\-–—*]+|[\s\-–—*]+$/g, "").trim())
    .filter(Boolean);
  const results: CandidateLanguage[] = [];
  const seen = new Set<string>();

  for (const item of candidates) {
    const normalized = normalizeForMatch(item);
    const level = LANGUAGE_LEVEL_PATTERNS.find(({ pattern }) => pattern.test(normalized))?.level || "";
    const cleanedName = normalized
      .replace(/\([^)]*\)|\[[^\]]*\]|（[^）]*）/g, " ")
      .replace(/^(?:spoken\s+)?languages?\s*[:：-]?\s*/i, "")
      .replace(/^(?:اللغة|اللغات)\s*[:：-]?\s*/i, "")
      .replace(/\s*(?:[-–—|:：]\s*)?(?:native|mother tongue|bilingual|fluent|advanced|proficient|excellent|upper intermediate|very good|good|intermediate|conversational|basic|beginner|elementary|اللغة الام|لغة ام|بطلاقة تامة|بطلاقة|متقدم|ممتاز|جيد جدا|جيد|متوسط|مبتدئ|اساسي|أساسي).*$/i, "")
      .replace(/\s+(?:language|اللغة)$/i, "")
      .replace(/[.!،,:؛|–—\-]+$/g, "")
      .trim();
    const canonical = LANGUAGE_ALIAS_LOOKUP.get(cleanedName);
    if (!canonical || seen.has(canonical)) continue;
    seen.add(canonical);
    results.push({ name: canonical, level });
    if (results.length === 12) break;
  }

  return results;
}

const MONTH_ALIASES: Record<string, string> = {
  jan: "01", january: "01", يناير: "01", "كانون الثاني": "01",
  feb: "02", february: "02", فبراير: "02", شباط: "02",
  mar: "03", march: "03", مارس: "03", آذار: "03",
  apr: "04", april: "04", أبريل: "04", نيسان: "04",
  may: "05", مايو: "05", أيار: "05",
  jun: "06", june: "06", يونيو: "06", حزيران: "06",
  jul: "07", july: "07", يوليو: "07", تموز: "07",
  aug: "08", august: "08", أغسطس: "08", آب: "08",
  sep: "09", sept: "09", september: "09", سبتمبر: "09", أيلول: "09",
  oct: "10", october: "10", أكتوبر: "10", "تشرين الأول": "10",
  nov: "11", november: "11", نوفمبر: "11", "تشرين الثاني": "11",
  dec: "12", december: "12", ديسمبر: "12", "كانون الأول": "12",
};

const MONTH_PATTERN = Object.keys(MONTH_ALIASES).join("|");
const DATE_TOKEN_PATTERN = `(?:(?:${MONTH_PATTERN})\\s+)?(?:19|20)\\d{2}|(?:0?[1-9]|1[0-2])[/.-](?:19|20)\\d{2}`;
const CURRENT_DATE_PATTERN = "(?:present|current|now|حتى\\s+الآن|حتى\\s+الان|حاليًا|حاليا|مستمر)";
const DATE_RANGE_REGEX = new RegExp(
  `(${DATE_TOKEN_PATTERN})\\s*(?:-|–|—|to|until|إلى|الى|حتى|لغاية)\\s*(${DATE_TOKEN_PATTERN}|${CURRENT_DATE_PATTERN})`,
  "i",
);

function parseDateToken(value: string) {
  const token = normalizeForMatch(value);
  const numericMonthFirst = token.match(/^(0?[1-9]|1[0-2])[/.-]((?:19|20)\d{2})$/);
  if (numericMonthFirst) {
    return `${numericMonthFirst[2]}-${numericMonthFirst[1].padStart(2, "0")}`;
  }

  const year = token.match(/(?:19|20)\d{2}/)?.[0];
  if (!year) return "";
  for (const [monthName, monthNumber] of Object.entries(MONTH_ALIASES)) {
    if (token.includes(normalizeForMatch(monthName))) return `${year}-${monthNumber}`;
  }
  return `${year}-01`;
}

function isCurrentDate(value: string) {
  return /(present|current|now|حتي الان|حاليا|مستمر)/i.test(normalizeForMatch(value));
}

function splitExperienceBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let current: string[] = [];
  let currentHasDate = false;

  const flush = () => {
    if (current.length) blocks.push(current);
    current = [];
    currentHasDate = false;
  };
  const isBullet = (line: string) => /^(?:[-•●▪◦*]|\d+[.)])\s*/u.test(line);
  const looksLikeHeader = (index: number) => {
    const line = lines[index]?.trim() || "";
    if (!line || line.length > 100 || isBullet(line) || /[.!?؟]$/.test(line)) return false;
    if (/^(?:job\s*title|position|title|company|employer|organization|المسمى|الوظيفة|الشركة|جهة العمل)\s*[:：-]/i.test(line)) return true;
    if (/\s+(?:at|@|في|لدى)\s+|[|•●▪]\s*|\s+[—–]\s+/i.test(line)) return true;
    const upcomingDate = lines.slice(index, index + 4).some((candidate) => DATE_RANGE_REGEX.test(candidate));
    return upcomingDate && line.split(/\s+/).length <= 10;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      let nextIndex = index + 1;
      while (nextIndex < lines.length && !lines[nextIndex].trim()) nextIndex += 1;
      const nextLine = lines[nextIndex]?.trim() || "";
      if (current.length && nextLine && !DATE_RANGE_REGEX.test(nextLine) && looksLikeHeader(nextIndex)) flush();
      continue;
    }

    const hasDate = DATE_RANGE_REGEX.test(line);
    const beginsFollowingEntry = current.length > 0 && currentHasDate && !hasDate && looksLikeHeader(index);
    const startsAnotherUndatedEntry = current.length > 0 && !currentHasDate && !hasDate &&
      /^(?:job\s*title|position|title|company|employer|organization|المسمى|الوظيفة|الشركة|جهة العمل)\s*[:：-]/i.test(line);
    if ((hasDate && currentHasDate) || beginsFollowingEntry || startsAnotherUndatedEntry) {
      flush();
    }
    current.push(line);
    currentHasDate ||= hasDate;
  }
  flush();
  return blocks;
}

function parseExperienceBlock(lines: string[], index: number): CandidateExperience | null {
  const content = lines.map((line) => line.trim()).filter(Boolean);
  if (!content.length) return null;

  const dateLine = content.find((line) => DATE_RANGE_REGEX.test(line)) || "";
  const dateMatch = dateLine.match(DATE_RANGE_REGEX);
  const periodText = dateMatch?.[0] || "";
  const startMonth = dateMatch ? parseDateToken(dateMatch[1]) : "";
  const endMonth = dateMatch && !isCurrentDate(dateMatch[2]) ? parseDateToken(dateMatch[2]) : "";
  const isCurrent = Boolean(dateMatch && isCurrentDate(dateMatch[2]));
  const labelValue = (labels: string) => firstLabeledValue(content, labels);

  const explicitTitle = labelValue("job\\s*title|position|title|المسمى الوظيفي|المسمى|الوظيفة");
  const explicitCompany = labelValue("company|employer|organization|جهة العمل|الشركة|المؤسسة");
  const explicitLocation = labelValue("location|work location|الموقع|مكان العمل");
  const lineWithoutPeriod = dateLine && periodText
    ? dateLine.replace(periodText, " ").replace(/\s+/g, " ").trim()
    : "";
  const labelPattern = /^(?:job\s*title|position|title|company|employer|organization|location|description|responsibilities|المسمى الوظيفي|المسمى|الوظيفة|الشركة|جهة العمل|الموقع|الوصف|المسؤوليات)\s*[:：-]/i;
  const headerLines = content.filter((line) => line !== dateLine && !/^(?:[-•●▪◦*]|\d+[.)])\s*/u.test(line) && !labelPattern.test(line));
  const header = lineWithoutPeriod || headerLines[0] || "";
  const splitHeader = header
    .split(/\s+(?:at|@|في|لدى)\s+|[|•●▪]+|\s+[—–]\s+|,\s+/i)
    .map((item) => item.trim())
    .filter(Boolean);
  const title = explicitTitle || splitHeader[0] || headerLines[0] || "";
  const company = explicitCompany || splitHeader[1] || (header !== headerLines[0] ? headerLines[0] : headerLines[1]) || "";
  const description = content
    .filter((line) =>
      line !== dateLine &&
      line !== header &&
      line !== headerLines[0] &&
      line !== headerLines[1] &&
      !labelPattern.test(line) &&
      line !== explicitTitle &&
      line !== explicitCompany &&
      line !== explicitLocation
    )
    .join("\n")
    .replace(/^[\s\-–—•●▪]+/gm, "")
    .trim();

  const experience: CandidateExperience = {
    id: createEntryId("cv-experience", index),
    title: limitField(title, 140),
    company: limitField(company, 140),
    location: limitField(explicitLocation, 100),
    startMonth,
    endMonth,
    isCurrent,
    legacyPeriod: periodText && (!startMonth || (!endMonth && !isCurrent)) ? limitField(periodText, 80) : "",
    description: limitField(description, 2500),
  };

  return Object.values(experience).some((value) => typeof value === "boolean" ? value : Boolean(value)) ? experience : null;
}

function parseExperiences(lines: string[]) {
  return splitExperienceBlocks(lines)
    .map((block, index) => parseExperienceBlock(block, index))
    .filter((entry): entry is CandidateExperience => Boolean(entry))
    .slice(0, 12);
}

function splitEducationBlocks(lines: string[]) {
  const blocks: string[][] = [];
  let block: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const beginsNewQualification = /^(?:bachelor|master|ph\.?d|doctorate|diploma|associate|bsc\b|msc\b|ba\b|ma\b|بكالوريوس|ماجستير|دكتوراه|دبلوم|ليسانس|شهادة)/i.test(line);
    if (beginsNewQualification && block.length) {
      blocks.push(block);
      block = [];
    }
    block.push(line);
  }
  if (block.length) blocks.push(block);
  return blocks;
}

function parseEducation(lines: string[]): CandidateEducation[] {
  return splitEducationBlocks(lines)
    .map((block, index) => {
      const text = block.join(" ");
      const degree = firstLabeledValue(block, "degree|qualification|certificate|الشهادة|المؤهل");
      const specialization = firstLabeledValue(block, "speciali[sz]ation|major|field of study|التخصص");
      const institution = firstLabeledValue(block, "university|college|institute|institution|الجامعة|الكلية|المعهد|الجهة التعليمية");
      const year = text.match(/(?:19|20)\d{2}/)?.[0] || "";
      const remaining = block.filter((line) =>
        line !== degree && line !== specialization && line !== institution && !line.includes(year),
      );
      const fallbackDegree = degree || remaining[0] || "";
      const fallbackInstitution = institution || remaining[1] || "";
      if (!fallbackDegree && !fallbackInstitution && !year) return null;
      return {
        id: createEntryId("cv-education", index),
        degree: limitField(fallbackDegree, 140),
        specialization: limitField(specialization, 140),
        institution: limitField(fallbackInstitution, 140),
        graduationYear: year,
      } satisfies CandidateEducation;
    })
    .filter((entry): entry is CandidateEducation => Boolean(entry))
    .slice(0, 10);
}

function explicitExperienceYears(text: string) {
  const match = text.match(
    /(?:experience|خبرة)[^\n\d]{0,24}(\d{1,2}(?:\.\d+)?)\s*(?:\+?\s*)?(?:years?|yrs?|سنوات?|سنة)|(\d{1,2}(?:\.\d+)?)\s*(?:\+?\s*)?(?:years?|yrs?|سنوات?|سنة)[^\n]{0,24}(?:experience|خبرة)/i,
  );
  const value = Number(match?.[1] || match?.[2]);
  return Number.isFinite(value) && value >= 0 && value <= 60 ? value : null;
}

function estimateExperienceYears(experiences: CandidateExperience[]) {
  const intervals = experiences
    .filter((experience) => experience.startMonth)
    .map((experience) => {
      const [startYear, startMonth] = experience.startMonth.split("-").map(Number);
      const endValue = experience.isCurrent
        ? new Date().getFullYear() * 12 + new Date().getMonth()
        : experience.endMonth
          ? Number(experience.endMonth.slice(0, 4)) * 12 + Number(experience.endMonth.slice(5, 7)) - 1
          : startYear * 12 + startMonth - 1;
      return {
        start: startYear * 12 + startMonth - 1,
        end: Math.max(startYear * 12 + startMonth - 1, endValue),
      };
    })
    .sort((a, b) => a.start - b.start);
  if (!intervals.length) return null;

  let totalMonths = 0;
  let start = intervals[0].start;
  let end = intervals[0].end;
  for (const interval of intervals.slice(1)) {
    if (interval.start <= end + 1) end = Math.max(end, interval.end);
    else {
      totalMonths += end - start + 1;
      start = interval.start;
      end = interval.end;
    }
  }
  totalMonths += end - start + 1;
  return Math.min(60, Math.round((totalMonths / 12) * 10) / 10);
}

function inferSpecialization(headline: string) {
  const normalized = normalizeForMatch(headline);
  const matches: Array<{ value: string; terms: string[] }> = [
    { value: "تقنية المعلومات", terms: ["software", "developer", "programmer", "it ", "مهندس برمجيات", "مطور", "مبرمج", "تقنية المعلومات"] },
    { value: "الهندسة", terms: ["engineer", "engineering", "مهندس", "هندسة"] },
    { value: "المحاسبة والمالية", terms: ["accountant", "accounting", "finance", "محاسب", "محاسبة", "مالية"] },
    { value: "الموارد البشرية", terms: ["human resources", "hr ", "recruiter", "موارد بشرية", "موارد البشريه", "توظيف"] },
    { value: "التسويق", terms: ["marketing", "digital marketing", "تسويق"] },
    { value: "التصميم", terms: ["designer", "design", "مصمم", "تصميم"] },
    { value: "المبيعات", terms: ["sales", "مبيعات"] },
    { value: "التعليم", terms: ["teacher", "instructor", "معلم", "مدرس", "تدريس"] },
    { value: "الطب والتمريض", terms: ["nurse", "doctor", "physician", "تمريض", "طبيب", "طبيبة"] },
  ];
  return matches.find((item) => item.terms.some((term) => normalized.includes(normalizeForMatch(term))))?.value || "";
}

export function parseCandidateCvText(text: string): ParsedCvText {
  const normalizedText = normalizeText(text);
  const { sections, header } = extractSections(normalizedText);
  const contactText = [...header, ...sections.summary].join("\n");
  const labeledEmail = firstLabeledValue(header, "email|e-mail|البريد الإلكتروني|البريد الالكتروني");
  const email = extractEmail(labeledEmail || contactText);
  const labeledPhone = firstLabeledValue(header, "phone|mobile|telephone|tel\\.?|رقم الهاتف|الهاتف|الموبايل");
  const phone = cleanContactValue(labeledPhone) || extractPhone(contactText);
  const nameFromLabel = firstLabeledValue(
    [...header, ...sections.summary],
    "full\\s*name|candidate\\s*name|name|الاسم(?: الكامل)?",
  );
  const headerLine = header.find((line) => {
    const normalized = normalizeForMatch(line);
    const words = line.split(/\s+/).filter(Boolean);
    const digits = (line.match(/\d/g) || []).length;
    return (
      line.length >= 3 &&
      line.length <= 72 &&
      words.length >= 2 &&
      words.length <= 6 &&
      !normalized.includes("@") &&
      digits < 3 &&
      !/\d{5,}/.test(line) &&
      !/(?:email|e-mail|phone|mobile|telephone|location|email|البريد|الهاتف|الموبايل|العنوان|الموقع)/i.test(normalized) &&
      !/(resume|curriculum vitae|السيرة الذاتية|cv|contact|اتصال)/i.test(normalized)
    );
  }) || "";
  const full_name = cleanContactValue(nameFromLabel || headerLine);

  const headline = firstLabeledValue(
    header,
    "professional\\s*title|job\\s*title|headline|position|المسمى الوظيفي|المسمى|الوظيفة",
  ) || header.find((line) => line !== full_name && line.length > 3 && line.length < 90 && !line.includes("@")) || "";
  const specialization = firstLabeledValue(
    [...header, ...sections.summary],
    "speciali[sz]ation|field|area of expertise|التخصص|الاختصاص",
  ) || inferSpecialization(headline);
  const province = firstLabeledValue(header, "province|governorate|المحافظة|محافظة")
    || findProvince(contactText);
  const city = firstLabeledValue(header, "city|location|المدينة|المدينة الحالية");
  const explicitSummary = sections.summary.filter(Boolean).join("\n").trim().slice(0, 1200);
  const experienceEntries = parseExperiences(sections.experience);
  const experienceYears = explicitExperienceYears(normalizedText) ?? estimateExperienceYears(experienceEntries);
  const skills = splitItems(sections.skills);
  const languages = parseLanguages(sections.languages);
  const education = parseEducation(sections.education);
  const warnings: string[] = [];
  if (sections.languages.some((line) => line.trim()) && !languages.length) {
    warnings.push("لم نتمكن من تحديد أسماء لغات موثوقة من هذا القسم. أضف اللغات يدويًا أو صحّحها قبل الاعتماد.");
  }
  const dateRangeCount = sections.experience.reduce(
    (count, line) => count + (line.match(new RegExp(DATE_RANGE_REGEX.source, "gi")) || []).length,
    0,
  );
  if (dateRangeCount > experienceEntries.length && dateRangeCount > 1) {
    warnings.push("قد لا يكون تقسيم الخبرات أو تواريخها كاملًا. راجع كل وظيفة وفترتها قبل الاعتماد.");
  }
  if (sections.experience.some((line) => line.trim()) && experienceEntries.length === 1 && !dateRangeCount) {
    warnings.push("لم تظهر تواريخ واضحة للخبرات؛ قد تكون عدة وظائف مدمجة في سجل واحد. راجعها وأضف أو افصل الخبرات يدويًا.");
  }

  const profile: ImportedProfileFields = {};
  if (full_name) profile.full_name = full_name;
  if (email) profile.email = email;
  if (phone) profile.phone = phone;
  if (headline) profile.headline = limitField(cleanContactValue(headline), 120);
  if (specialization) profile.specialization = limitField(cleanContactValue(specialization), 100);
  if (province) profile.province = limitField(cleanContactValue(province), 80);
  if (city) profile.city = limitField(cleanContactValue(city), 80);
  if (experienceYears !== null) profile.experience_years = experienceYears;
  if (skills.length) profile.skills = skills;
  if (explicitSummary) profile.summary = explicitSummary;

  return {
    profile,
    experiences: experienceEntries,
    education,
    languages,
    warnings,
  };
}

function countExtractedFields(parsed: ParsedCvText) {
  return (
    Object.values(parsed.profile).filter((value) =>
      Array.isArray(value) ? value.length > 0 : value !== "" && value !== null && value !== undefined,
    ).length +
    Number(parsed.experiences.length > 0) +
    Number(parsed.education.length > 0) +
    Number(parsed.languages.length > 0)
  );
}

export function reconstructPdfPageText(items: readonly unknown[]) {
  let text = "";
  let previousY: number | null = null;

  for (const candidate of items) {
    if (!candidate || typeof candidate !== "object") continue;
    const item = candidate as { str?: unknown; hasEOL?: unknown; transform?: unknown };
    if (typeof item.str !== "string") continue;
    const fragment = item.str.replace(/\s+/g, " ").trim();
    const transform = Array.isArray(item.transform) ? item.transform : null;
    const y = transform && typeof transform[5] === "number" ? transform[5] : null;

    if (!fragment) {
      if (item.hasEOL && text && !text.endsWith("\n")) text += "\n";
      previousY = y ?? previousY;
      continue;
    }

    const movedToNewLine = previousY !== null && y !== null && Math.abs(previousY - y) > 2.5;
    if (text && !text.endsWith("\n")) text += movedToNewLine ? "\n" : " ";
    text += fragment;
    if (item.hasEOL && !text.endsWith("\n")) text += "\n";
    previousY = y ?? previousY;
  }

  return text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function extractPdf(fileBytes: Uint8Array, onProgress: ProgressCallback) {
  const [pdfjs, workerUrlModule] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrlModule.default;
  const loadingTask = pdfjs.getDocument({ data: fileBytes });
  const pdf = await loadingTask.promise;

  try {
    const pageTexts: string[] = [];
    const pagesToRead = Math.min(pdf.numPages, MAX_PDF_PAGES);
    for (let pageNumber = 1; pageNumber <= pagesToRead; pageNumber += 1) {
      onProgress(`جاري قراءة الصفحة ${pageNumber} من ${pagesToRead}...`);
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(reconstructPdfPageText(content.items));
    }

    const pagesWithText = pageTexts.map((text, index) => ({
      index: index + 1,
      text,
      hasText: text.replace(/\s/g, "").length >= 24,
    }));
    const ocrCandidates = pagesWithText.filter((page) => !page.hasText).map((page) => page.index);
    const totalTextLength = pageTexts.join("").replace(/\s/g, "").length;
    const needsOcr = totalTextLength < 80 || ocrCandidates.length > 0;
    let ocrPages = 0;

    if (needsOcr) {
      const pageNumbers = (totalTextLength < 80 && !ocrCandidates.length
        ? pagesWithText.map((page) => page.index)
        : ocrCandidates
      ).slice(0, MAX_OCR_PAGES);
      if (pageNumbers.length) {
        onProgress("الملف مصوّر أو يحتوي صفحات بلا نص؛ جاري تشغيل OCR عربي/إنكليزي داخل المتصفح...");
        const ocrTextByPage = await recognizePdfPages(pdf, pageNumbers, onProgress);
        for (const result of ocrTextByPage) {
          pageTexts[result.pageNumber - 1] = [pageTexts[result.pageNumber - 1], result.text].filter(Boolean).join("\n");
        }
        ocrPages = ocrTextByPage.length;
      }
    }

    const warnings: string[] = [];
    if (pdf.numPages > MAX_PDF_PAGES) {
      warnings.push(`تمت قراءة أول ${MAX_PDF_PAGES} صفحة فقط من الملف.`);
    }
    if (needsOcr && (ocrCandidates.length > MAX_OCR_PAGES || (totalTextLength < 80 && pdf.numPages > MAX_OCR_PAGES))) {
      warnings.push(`تمت معالجة أول ${MAX_OCR_PAGES} صفحات مصوّرة فقط.`);
    }
    return {
      text: pageTexts.join("\n"),
      ocrPages,
      warnings,
    };
  } finally {
    await pdf.destroy();
  }
}

async function recognizePdfPages(
  pdf: PDFDocumentProxy,
  pageNumbers: number[],
  onProgress: ProgressCallback,
) {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("ara+eng", 1, {
    langPath: OCR_LANGUAGE_DATA_URL,
    logger: ({ status, progress }) => {
      if (status === "loading tesseract core") onProgress("جاري تجهيز محرك قراءة النص...");
      else if (status === "loading language traineddata") onProgress("جاري تحميل قواميس العربية والإنكليزية للـOCR...");
      else if (status === "recognizing text") onProgress(`جاري قراءة النص المصوّر (${Math.round(progress * 100)}٪)...`);
    },
  });

  try {
    const results: Array<{ pageNumber: number; text: string }> = [];
    for (const pageNumber of pageNumbers) {
      onProgress(`جاري قراءة الصفحة المصوّرة ${pageNumber}...`);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.6 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("تعذر تجهيز الصفحة للقراءة.");
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const result = await worker.recognize(canvas);
      results.push({ pageNumber, text: result.data.text });
      canvas.width = 0;
      canvas.height = 0;
    }
    return results;
  } finally {
    await worker.terminate();
  }
}

export async function readCandidateCv(file: File, onProgress: ProgressCallback): Promise<CandidateCvImport> {
  const filename = file.name.toLocaleLowerCase();
  const isPdf = filename.endsWith(".pdf") || file.type === "application/pdf";
  const isDocx =
    filename.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (!isPdf && !isDocx) {
    throw new Error("الملفات المدعومة حاليًا هي PDF وDOCX فقط.");
  }
  if (!file.size) throw new Error("الملف فارغ.");
  if (file.size > MAX_FILE_BYTES) throw new Error("حجم الملف أكبر من 10 ميغابايت.");

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const isPdfSignature = new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  const isZipSignature = bytes[0] === 0x50 && bytes[1] === 0x4b;
  if ((isPdf && !isPdfSignature) || (isDocx && !isZipSignature)) {
    throw new Error("محتوى الملف لا يطابق نوعه. اختَر ملف PDF أو DOCX صالحًا.");
  }

  let text = "";
  let source: CandidateCvImport["source"] = isPdf ? "pdf-text" : "docx";
  let ocrPages = 0;
  let warnings: string[] = [];

  if (isPdf) {
    const extracted = await extractPdf(bytes, onProgress);
    text = extracted.text;
    ocrPages = extracted.ocrPages;
    warnings = extracted.warnings;
    if (ocrPages) source = "ocr";
  } else {
    onProgress("جاري قراءة مستند Word داخل المتصفح...");
    const mammoth = await import("mammoth");
    const result = await mammoth.default.extractRawText({ arrayBuffer: buffer });
    text = result.value;
  }

  const parsed = parseCandidateCvText(text);
  if (!countExtractedFields(parsed)) {
    throw new Error("ما قدرنا نحدد بيانات كافية من الملف. جرّب PDF نصيًا أو DOCX أو عدّل محتوى السيرة.");
  }

  return {
    ...parsed,
    source,
    ocrPages,
    warnings: [...warnings, ...parsed.warnings],
  };
}
