import {
  downloadResumeDocument,
  printResumeDocument,
  type ResumeData,
} from "./atsResume";
import { formatCandidateExperiencePeriodForAts } from "../../services/candidateService";

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

function sectionCard(title: string, content: string, variant = "") {
  if (!content) return "";
  return `<table class="cv-section${variant ? ` ${clean(variant)}` : ""}" role="presentation" cellspacing="0" cellpadding="0">
    <tbody>
      <tr><td class="cv-section-heading">${clean(title)}</td></tr>
      <tr><td class="cv-section-body">${content}</td></tr>
    </tbody>
  </table>`;
}

function experienceMarkup(data: ResumeData) {
  return data.experiences
    .map((experience) => ({
      experience,
      period: formatCandidateExperiencePeriodForAts(experience),
    }))
    .filter(({ experience, period }) =>
      [experience.title, experience.company, experience.location, period, experience.description]
        .some((value) => value.trim()),
    )
    .map(({ experience, period }) => `
      <article class="cv-experience">
        <table class="cv-entry-heading" role="presentation" cellspacing="0" cellpadding="0">
          <tbody><tr>
            <td><h3>${clean(experience.title || "Professional Experience")}</h3></td>
            ${period ? `<td class="cv-period">${clean(period)}</td>` : ""}
          </tr></tbody>
        </table>
        ${[experience.company, experience.location].filter(Boolean).length
          ? `<p class="cv-company">${[experience.company, experience.location].map(clean).join(" · ")}</p>`
          : ""}
        ${experience.description.trim() ? `<p class="cv-description">${lines(experience.description)}</p>` : ""}
      </article>
    `)
    .join("");
}

function skillsMarkup(skills: string[]) {
  const entries = skills.map((skill) => skill.trim()).filter(Boolean);
  if (entries.length === 0) return "";

  const rows: string[][] = [];
  for (let index = 0; index < entries.length; index += 2) {
    rows.push(entries.slice(index, index + 2));
  }

  return `<table class="cv-skills" role="presentation" cellspacing="0" cellpadding="0">
    <tbody>${rows.map((row) => `<tr>
      ${row.map((skill) => `<td>${clean(skill)}</td>`).join("")}
      ${row.length === 1 ? "<td></td>" : ""}
    </tr>`).join("")}</tbody>
  </table>`;
}

function educationMarkup(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [degree, ...details] = entry.split(/\s+\|\s+/);
      return `<div class="cv-education-entry">
        <strong>${clean(degree)}</strong>
        ${details.length ? `<p>${details.map(clean).join(" · ")}</p>` : ""}
      </div>`;
    })
    .join("");
}

function languageLevel(level: string) {
  return ({
    "اللغة الأم": "Native",
    "متقدم": "Advanced",
    "جيد جدًا": "Very Good",
    "متوسط": "Intermediate",
    "مبتدئ": "Beginner",
  } as Record<string, string>)[level] || level;
}

function languagesMarkup(data: ResumeData) {
  const entries = data.languages.filter((language) => language.name.trim());
  if (entries.length === 0) return "";

  return `<table class="cv-languages" cellspacing="0" cellpadding="0"><tbody>
    ${entries.map((language) => `<tr>
      <td class="cv-language-name">${clean(language.name)}</td>
      <td class="cv-language-level">${clean(languageLevel(language.level))}</td>
    </tr>`).join("")}
  </tbody></table>`;
}

export function buildProfessionalResumeDocument(data: ResumeData) {
  const contactRows = [
    data.email.trim() ? `<td><span class="cv-contact-label">Email</span>${clean(data.email)}</td>` : "",
    data.phone.trim() ? `<td><span class="cv-contact-label">Phone</span>${clean(data.phone)}</td>` : "",
  ].filter(Boolean);
  const location = [data.city, data.province].filter((value) => value.trim()).map(clean).join(", ");
  const contact = contactRows.length || location
    ? `<table class="cv-contact" role="presentation" cellspacing="0" cellpadding="0"><tbody>
        ${contactRows.length ? `<tr>${contactRows.join("")}</tr>` : ""}
        ${location ? `<tr><td colspan="2"><span class="cv-contact-label">Location</span>${location}</td></tr>` : ""}
      </tbody></table>`
    : "";

  const experiences = experienceMarkup(data);
  const summary = data.summary.trim() ? sectionCard("Professional summary", `<p class="cv-summary">${lines(data.summary)}</p>`, "summary-section") : "";
  const experienceSection = sectionCard("Professional experience", experiences, "experience-section");
  const snapshotRows = [
    data.specialization.trim()
      ? `<tr><td><span class="cv-data-label">Specialization</span><strong>${clean(data.specialization)}</strong></td></tr>`
      : "",
    data.experience_years > 0
      ? `<tr><td><span class="cv-data-label">Experience</span><strong>${clean(data.experience_years)} years</strong></td></tr>`
      : "",
  ].filter(Boolean).join("");
  const snapshot = snapshotRows
    ? sectionCard("Career snapshot", `<table class="cv-snapshot" cellspacing="0" cellpadding="0"><tbody>${snapshotRows}</tbody></table>`, "snapshot-section")
    : "";
  const skills = sectionCard("Core skills", skillsMarkup(data.skills), "skills-section");
  const education = sectionCard("Education", educationMarkup(data.education), "education-section");
  const languages = sectionCard("Languages", languagesMarkup(data), "languages-section");
  const sideColumn = [snapshot, skills, education, languages].join("");
  const columns = experienceSection || sideColumn
    ? `<table class="cv-columns" role="presentation" cellspacing="0" cellpadding="0"><tbody>
        <tr>
          <td class="cv-main-column">${experienceSection}</td>
          <td class="cv-side-column">${sideColumn}</td>
        </tr>
      </tbody></table>`
    : "";

  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <title>${clean(data.full_name || "Professional Resume")}</title>
    <style>
      @page { size: A4 portrait; margin: 14mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #263b4c; background: #eef2f3; font-family: Arial, "Trebuchet MS", sans-serif; font-size: 10pt; line-height: 1.55; }
      main { width: 100%; max-width: 794px; margin: 0 auto; background: #fff; }
      .cv-header { padding: 22px 25px 18px; border-bottom: 4px solid #c58a63; color: #fff; background: #193650; }
      .cv-kicker { margin: 0 0 7px; color: #e2b997; font-size: 7.5pt; font-weight: 700; letter-spacing: 1.2px; }
      .cv-name { margin: 0; color: #fff; font-family: Georgia, "Times New Roman", serif; font-size: 28pt; line-height: 1.12; }
      .cv-headline { margin: 5px 0 11px; color: #e5edf0; font-size: 12pt; font-weight: 600; }
      .cv-contact { width: 100%; border-collapse: collapse; }
      .cv-contact td { padding: 4px 14px 2px 0; color: #f2f5f6; font-size: 9pt; vertical-align: top; }
      .cv-contact-label { padding-right: 5px; color: #e2b997; font-size: 7pt; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; }
      .cv-content { padding: 19px 25px 23px; }
      .cv-section { width: 100%; margin: 0 0 11px; border: 1px solid #dce4e7; border-collapse: collapse; }
      .cv-section-heading { padding: 7px 10px; border-bottom: 1px solid #dce4e7; color: #193650; background: #f1f5f5; font-size: 8.5pt; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
      .cv-section-body { padding: 9px 10px; vertical-align: top; }
      .summary-section { border-left: 3px solid #c58a63; }
      .summary-section .cv-section-heading { background: #faf5f0; }
      .cv-summary { margin: 0; color: #405667; font-size: 9pt; line-height: 1.68; }
      .cv-columns { width: 100%; margin-top: 13px; border-collapse: separate; border-spacing: 0; table-layout: fixed; }
      .cv-main-column { width: 62%; padding: 0 6px 0 0; vertical-align: top; }
      .cv-side-column { width: 38%; padding: 0 0 0 6px; vertical-align: top; }
      .cv-experience { padding: 9px 0; border-bottom: 1px solid #e3e9eb; page-break-inside: avoid; break-inside: avoid; }
      .cv-experience:last-child { border-bottom: 0; }
      .cv-entry-heading { width: 100%; border-collapse: collapse; }
      .cv-entry-heading td { padding: 0; vertical-align: top; }
      .cv-entry-heading h3 { margin: 0; color: #244a62; font-size: 9.5pt; line-height: 1.4; }
      .cv-period { width: 95px; padding-left: 5px !important; color: #8b6245; font-size: 7.5pt; font-weight: 700; text-align: right; white-space: nowrap; }
      .cv-company { margin: 3px 0 5px; color: #6d7e88; font-size: 8pt; font-weight: 600; }
      .cv-description { margin: 0; color: #4b606e; font-size: 8.5pt; line-height: 1.58; }
      .cv-snapshot, .cv-languages { width: 100%; border-collapse: collapse; }
      .cv-snapshot td, .cv-languages td { padding: 6px 0; border-bottom: 1px solid #e7edef; vertical-align: top; }
      .cv-snapshot tr:last-child td, .cv-languages tr:last-child td { border-bottom: 0; }
      .cv-data-label { display: block; margin-bottom: 2px; color: #7b8b92; font-size: 7pt; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
      .cv-snapshot strong, .cv-language-name { color: #35546a; font-size: 8.5pt; font-weight: 700; }
      .cv-language-level { color: #71828b; font-size: 8pt; text-align: right; }
      .cv-skills { width: 100%; border-collapse: separate; border-spacing: 4px; }
      .cv-skills td { width: 50%; padding: 5px 6px; border: 1px solid #dfe7e8; color: #35556a; background: #f6f9f8; font-size: 7.5pt; line-height: 1.4; vertical-align: middle; }
      .cv-education-entry { padding: 3px 0 6px; page-break-inside: avoid; break-inside: avoid; }
      .cv-education-entry strong { color: #35546a; font-size: 8.5pt; }
      .cv-education-entry p { margin: 3px 0 0; color: #71818a; font-size: 7.5pt; line-height: 1.5; }
      @media screen and (max-width: 680px) {
        body { padding: 14px 10px; }
        .cv-header { padding: 20px 17px 16px; }
        .cv-content { padding: 16px 17px 20px; }
        .cv-columns, .cv-columns tbody, .cv-columns tr, .cv-columns td { display: block; width: 100%; }
        .cv-main-column, .cv-side-column { padding: 0; }
      }
      @media print {
        body { padding: 0; background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        main { max-width: none; }
        .cv-header, .cv-section-heading, .cv-skills td { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        .cv-section-heading, .cv-experience, .cv-education-entry { page-break-inside: avoid; break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="cv-header">
        <p class="cv-kicker">PROFESSIONAL PROFILE</p>
        <h1 class="cv-name">${clean(data.full_name || "Full Name")}</h1>
        <p class="cv-headline">${clean(data.headline || "Professional Title")}</p>
        ${contact}
      </header>
      <div class="cv-content">
        ${summary}
        ${columns}
      </div>
    </main>
  </body>
</html>`;
}

export function downloadProfessionalResume(data: ResumeData) {
  downloadResumeDocument(data, buildProfessionalResumeDocument(data), "Professional-Resume");
}

export function printProfessionalResume(data: ResumeData) {
  return printResumeDocument(buildProfessionalResumeDocument(data));
}
