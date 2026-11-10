import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const tempDirectory = await mkdtemp(join(tmpdir(), "cv-import-test-"));
let cvImport;
let cvAiMerge;
try {
  await writeFile(join(tempDirectory, "package.json"), '{"type":"module"}');
  execFileSync(join(root, "node_modules/.bin/tsc"), [
    join(root, "src/features/candidate/cvImport.ts"),
    join(root, "src/features/candidate/cvAiMerge.ts"),
    "--rootDir", root,
    "--outDir", tempDirectory,
    "--module", "ESNext",
    "--target", "ES2022",
    "--moduleResolution", "Bundler",
    "--skipLibCheck",
    "--ignoreConfig",
    "--noCheck",
    "--types", "node",
  ], { cwd: root, stdio: "inherit" });
  cvImport = await import(pathToFileURL(join(tempDirectory, "src/features/candidate/cvImport.js")).href);
  cvAiMerge = await import(pathToFileURL(join(tempDirectory, "src/features/candidate/cvAiMerge.js")).href);
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}

const englishCv = `
FULL NAME: Mariam Adnan
EMAIL: mariam@example.com
PROFESSIONAL EXPERIENCE
Product Designer | Noor Tech
January 2022 - Present
- Led product discovery and design delivery.

Business Analyst | Sample Company
May 2019 - December 2021
- Mapped business processes and requirements.
LANGUAGES
Arabic - Native
English: Advanced
Kurdish
PROJECTS
Project management and Microsoft Office
`;

const englishResult = cvImport.parseCandidateCvText(englishCv);
assert.equal(englishResult.experiences.length, 2, "English CV should retain separate dated roles");
assert.equal(englishResult.experiences[0].title, "Product Designer");
assert.equal(englishResult.experiences[0].company, "Noor Tech");
assert.equal(englishResult.experiences[1].title, "Business Analyst");
assert.deepEqual(englishResult.languages.map((language) => language.name), ["العربية", "English", "Kurdish"]);
assert.equal(englishResult.languages.length, 3, "projects and skills must not be misread as languages");

const arabicCv = `
الخبرات العملية
مهندس مدني | شركة النور
كانون الثاني 2020 - كانون الأول 2022
- أشرف على تنفيذ المشاريع.
مدير موقع | شركة البناء
يناير 2023 - حتى الآن
- تابع جودة التنفيذ.
اللغات
العربية (اللغة الأم)
الإنكليزية - متوسط
المهارات التقنية
إدارة المشاريع، AutoCAD
`;

const arabicResult = cvImport.parseCandidateCvText(arabicCv);
assert.equal(arabicResult.experiences.length, 2, "Arabic CV should retain separate dated roles");
assert.equal(arabicResult.experiences[0].title, "مهندس مدني");
assert.equal(arabicResult.experiences[0].company, "شركة النور");
assert.deepEqual(arabicResult.languages.map((language) => language.name), ["العربية", "English"]);
assert.ok(arabicResult.experiences[1].isCurrent, "current role should remain current");

const flattenedPdfText = cvImport.reconstructPdfPageText([
  { str: "WORK EXPERIENCE", transform: [1, 0, 0, 1, 18, 720] },
  { str: "Product Designer", transform: [1, 0, 0, 1, 18, 700] },
  { str: "| Noor Tech", transform: [1, 0, 0, 1, 160, 700], hasEOL: true },
  { str: "Jan 2022 - Present", transform: [1, 0, 0, 1, 18, 680] },
]);
assert.match(flattenedPdfText, /Product Designer \| Noor Tech\nJan 2022 - Present/);

const ambiguousLanguages = cvImport.parseCandidateCvText(`
LANGUAGES
Project coordination
Microsoft Office
`);
assert.equal(ambiguousLanguages.languages.length, 0, "unknown text must not be fabricated into language entries");
assert.ok(ambiguousLanguages.warnings.some((warning) => warning.includes("أسماء لغات موثوقة")));

const aiText = cvImport.prepareCandidateCvAiText(`
FULL NAME: Mariam Adnan
EMAIL: mariam@example.com
PROFESSIONAL SUMMARY
Mariam Adnan is a product designer. Contact mariam@example.com or +964 770 123 4567.
WORK EXPERIENCE
Product Designer | Noor Tech
January 2022 - Present
`, "Mariam Adnan");
assert.match(aiText.text, /Product Designer \| Noor Tech/);
assert.doesNotMatch(aiText.text, /Mariam Adnan|mariam@example\.com|\+964 770 123 4567/);

const longAiText = cvImport.prepareCandidateCvAiText(`SUMMARY\n${"Professional writing ".repeat(1_000)}`);
assert.equal(longAiText.text.length, 12_000, "AI context must be capped to control daily usage");
assert.equal(longAiText.truncated, true);

const localExperiences = Array.from({ length: 4 }, (_, index) => ({
  id: `local-experience-${index + 1}`,
  title: `خبرة محلية ${index + 1}`,
  company: "شركة النور",
  location: "بغداد",
  startMonth: `201${index + 5}-01`,
  endMonth: "",
  isCurrent: true,
  legacyPeriod: "",
  description: `وصف محلي ${index + 1}.`,
}));
const aiExperiences = [
  {
    id: "ai-experience-1",
    title: "مهندس موقع",
    company: "شركة النور",
    location: "بغداد",
    startMonth: "2021-01",
    endMonth: "",
    isCurrent: true,
    legacyPeriod: "",
    description: "إشراف على المواقع.",
  },
  {
    id: "ai-experience-2",
    title: "مهندس مدني",
    company: "شركة النور",
    location: "بغداد",
    startMonth: "2019-01",
    endMonth: "2020-12",
    isCurrent: false,
    legacyPeriod: "",
    description: "تنسيق الأعمال الهندسية.",
  },
  {
    id: "ai-experience-3",
    title: "مشرف إنشاءات",
    company: "شركة النور",
    location: "البصرة",
    startMonth: "2017-01",
    endMonth: "2018-12",
    isCurrent: false,
    legacyPeriod: "",
    description: "متابعة فرق التنفيذ.",
  },
  {
    id: "ai-experience-4",
    title: "متدرب هندسي",
    company: "شركة النور",
    location: "بغداد",
    startMonth: "2015-01",
    endMonth: "2016-12",
    isCurrent: false,
    legacyPeriod: "",
    description: "دعم مهام الفريق الهندسي.",
  },
];
const localImport = {
  profile: {
    full_name: "مريم عدنان",
    email: "mariam@example.com",
    phone: "+964 770 000 0000",
    headline: "مهندس مدني",
    experience_years: 4,
    skills: ["AutoCAD", "JavaScript"],
    summary: "نبذة محلية.",
  },
  experiences: localExperiences,
  education: [{
    id: "local-education",
    degree: "بكالوريوس",
    specialization: "هندسة مدنية",
    institution: "جامعة بغداد",
    graduationYear: "",
  }, {
    id: "local-education-2",
    degree: "دبلوم",
    specialization: "",
    institution: "معهد النور",
    graduationYear: "2017",
  }],
  languages: [
    { name: "الإنكليزية", level: "" },
    { name: "Kurdish", level: "متوسط" },
  ],
  source: "pdf-text",
  ocrPages: 0,
  warnings: [],
  aiText: "نص محلي منقّى",
  aiTextTruncated: false,
};
const aiImport = {
  profile: {
    headline: "مهندس موقع",
    specialization: "هندسة مدنية",
    experience_years: 5,
    skills: ["autocad", "Revit"],
    summary: "نبذة من AI.",
  },
  experiences: aiExperiences,
  education: [{
    id: "ai-education-duplicate",
    degree: "بكالوريوس",
    specialization: "هندسة مدنية",
    institution: "جامعة بغداد",
    graduationYear: "2019",
  }],
  languages: [
    { name: "English", level: "متقدم" },
    { name: "العربية", level: "اللغة الأم" },
  ],
};
const selectedImport = cvAiMerge.applyCandidateCvAiResult(localImport, aiImport);
assert.equal(selectedImport.experiences.length, 4, "successful AI extraction should replace all local experiences");
assert.deepEqual(selectedImport.experiences.map((experience) => experience.id), aiExperiences.map((experience) => experience.id), "no local experiences should remain after successful AI extraction");
assert.equal(selectedImport.experiences[0].description, "إشراف على المواقع.", "AI experience details should be used instead of parser details");
assert.equal(selectedImport.education.length, 1, "AI education should replace locally parsed education");
assert.equal(selectedImport.education[0].id, "ai-education-duplicate", "local education records should not remain after successful AI extraction");
assert.deepEqual(selectedImport.languages, aiImport.languages, "AI languages should replace locally parsed languages");
assert.deepEqual(selectedImport.profile.skills, ["autocad", "Revit"], "AI skills should replace locally parsed skills");
assert.equal(selectedImport.profile.headline, "مهندس موقع", "AI profile fields should replace locally parsed values");
assert.equal(selectedImport.profile.full_name, "مريم عدنان", "locally parsed contact details not returned by AI should be retained");
assert.equal(selectedImport.profile.email, "mariam@example.com", "locally parsed email should be retained because AI does not extract it");
assert.equal(selectedImport.source, "ai", "the active result source should identify successful AI extraction");
assert.equal(selectedImport.aiText, undefined, "AI text should be removed after processing");

console.log("CV import checks passed: Arabic/English parsing, privacy, AI source replacement, and non-overlapping contact preservation.");
