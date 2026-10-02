import type { CandidateProfileInput } from "../../lib/types";
import type { CandidateExperience, CandidateLanguage } from "../../services/candidateService";

export type ResumeData = Omit<CandidateProfileInput, "languages"> & {
  experiences: CandidateExperience[];
  languages: CandidateLanguage[];
};

export type AtsResumeData = ResumeData;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clean(value: string | number | null | undefined) {
  return escapeHtml(String(value ?? "").trim());
}

function lines(value: string) {
  return clean(value).replace(/\r?\n/g, "<br />");
}

function list(items: string[]) {
  return items.filter((item) => item.trim()).map((item) => `<li>${clean(item)}</li>`).join("");
}

function contactParts(data: ResumeData) {
  return [
    data.email.trim(),
    data.phone.trim(),
    [data.city, data.province].filter(Boolean).join(", "),
  ].filter(Boolean);
}

function professionalMeta(data: ResumeData) {
  return [
    data.specialization,
    data.experience_years ? `${data.experience_years} years of experience` : "",
  ].filter(Boolean);
}

function englishLanguageLevel(level: CandidateLanguage["level"]) {
  return ({
    "اللغة الأم": "Native",
    "متقدم": "Advanced",
    "جيد جدًا": "Very Good",
    "متوسط": "Intermediate",
    "مبتدئ": "Beginner",
  } as Record<string, string>)[level] || level;
}

function experienceEntries(data: ResumeData, className = "experience") {
  return data.experiences
    .map((experience) => {
      const period = experience.startYear && experience.isCurrent
        ? `${experience.startYear} – Present`
        : experience.startYear && experience.endYear
          ? `${experience.startYear} – ${experience.endYear}`
          : experience.startYear || experience.endYear || experience.legacyPeriod;
      return { experience, period };
    })
    .filter(({ experience, period }) => [experience.title, experience.company, experience.location, period, experience.description].some((value) => value.trim()))
    .map(({ experience, period }) => `
      <article class="${className}">
        <h3>${clean(experience.title || "Professional Experience")}</h3>
        <p class="meta">${[experience.company, experience.location, period].filter(Boolean).map(clean).join(" | ")}</p>
        ${experience.description.trim() ? `<p>${lines(experience.description)}</p>` : ""}
      </article>
    `).join("");
}

function languagesMarkup(data: ResumeData, ordered = false) {
  const entries = data.languages
    .filter((language) => language.name.trim())
    .map((language) => `<li>${clean(language.name)}${language.level ? ` — ${clean(englishLanguageLevel(language.level))}` : ""}</li>`)
    .join("");
  return ordered ? entries : `<ul>${entries}</ul>`;
}

function downloadDocument(data: ResumeData, content: string, prefix: string) {
  const safeName = data.full_name.trim().replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "-") || "Candidate";
  const blob = new Blob([content], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${prefix}-${safeName}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function printDocument(content: string) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 350);
  return true;
}

export function buildAtsResumeDocument(data: AtsResumeData) {
  const contact = contactParts(data).map(clean).join(" | ");
  const meta = professionalMeta(data).map(clean).join(" | ");
  const experiences = experienceEntries(data);

  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <title>${clean(data.full_name || "Resume")}</title>
    <style>
      @page { size: A4; margin: 17mm 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #202020; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.62; }
      main { max-width: 760px; margin: 0 auto; }
      header { padding-bottom: 13px; border-bottom: 2px solid #222; }
      h1 { margin: 0; color: #111; font-size: 25pt; line-height: 1.15; letter-spacing: .1px; }
      .headline { margin: 5px 0 8px; color: #333; font-size: 13pt; font-weight: 700; }
      .contact, .meta { margin: 0; color: #444; font-size: 9.5pt; }
      .submeta { margin: 4px 0 0; color: #555; font-size: 9.5pt; }
      section { margin-top: 17px; }
      h2 { margin: 0 0 7px; padding-bottom: 4px; border-bottom: 1px solid #777; color: #111; font-size: 12.5pt; line-height: 1.25; text-transform: uppercase; letter-spacing: .3px; }
      h3 { margin: 0; color: #222; font-size: 11.5pt; line-height: 1.4; }
      p { margin: 0; }
      ul { margin: 5px 0 0; padding: 0 0 0 19px; }
      li { margin: 2px 0; }
      .experience { margin: 0 0 13px; }
      .experience:last-child { margin-bottom: 0; }
      .skills li { display: inline; }
      .skills li:not(:last-child)::after { content: ", "; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${clean(data.full_name || "Full Name")}</h1>
        <p class="headline">${clean(data.headline || "Professional Title")}</p>
        ${contact ? `<p class="contact">${contact}</p>` : ""}
        ${meta ? `<p class="submeta">${meta}</p>` : ""}
      </header>
      ${data.summary.trim() ? `<section><h2>Professional Summary</h2><p>${lines(data.summary)}</p></section>` : ""}
      ${data.skills.length ? `<section><h2>Core Skills</h2><ul class="skills">${list(data.skills)}</ul></section>` : ""}
      ${experiences ? `<section><h2>Professional Experience</h2>${experiences}</section>` : ""}
      ${data.education.trim() ? `<section><h2>Education</h2><p>${lines(data.education)}</p></section>` : ""}
      ${languagesMarkup(data, true) ? `<section><h2>Languages</h2><ul>${languagesMarkup(data, true)}</ul></section>` : ""}
    </main>
  </body>
</html>`;
}

export function downloadAtsResume(data: AtsResumeData) {
  downloadDocument(data, buildAtsResumeDocument(data), "ATS-Resume");
}

export function printAtsResume(data: AtsResumeData) {
  return printDocument(buildAtsResumeDocument(data));
}
