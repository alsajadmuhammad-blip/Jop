import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const tempDirectory = await mkdtemp(join(tmpdir(), "cv-import-test-"));
let cvImport;
try {
  await writeFile(join(tempDirectory, "package.json"), '{"type":"module"}');
  execFileSync(join(root, "node_modules/.bin/tsc"), [
    join(root, "src/features/candidate/cvImport.ts"),
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

console.log("CV import parser checks passed: English, Arabic, false-positive languages, PDF reconstruction, AI payload privacy and size cap.");
