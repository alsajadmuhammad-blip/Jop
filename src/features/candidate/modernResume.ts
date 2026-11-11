import { englishLanguageLevel, type ResumeData } from "./atsResume";
import { formatCandidateExperiencePeriodForAts } from "../../services/candidateService";

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clean(value: string | number | null | undefined) {
  return escapeHtml(value).trim();
}

function lines(value: string) {
  return clean(value).replace(/\r?\n/g, "<br />");
}

function section(title: string, content: string, className = "") {
  if (!content) return "";
  return `<section class="section ${className}">
    <h2 class="section-title"><span class="section-mark" aria-hidden="true"></span>${escapeHtml(title)}</h2>
    <div class="section-content">${content}</div>
  </section>`;
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
      <article class="experience-entry">
        <table class="entry-heading" role="presentation" cellspacing="0" cellpadding="0">
          <tbody><tr>
            <td><h3>${clean(experience.title || "الخبرة المهنية")}</h3></td>
            ${period ? `<td class="entry-period" dir="ltr">${clean(period)}</td>` : ""}
          </tr></tbody>
        </table>
        ${[experience.company, experience.location].some((value) => value.trim())
          ? `<p class="entry-meta">${[experience.company, experience.location].filter((value) => value.trim()).map(clean).join(" <span aria-hidden=\"true\">·</span> ")}</p>`
          : ""}
        ${experience.description.trim() ? `<p class="entry-description">${lines(experience.description)}</p>` : ""}
      </article>
    `)
    .join("");
}

function educationMarkup(value: string) {
  return value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [degree, ...details] = entry.split(/\s+\|\s+/);
      return `<div class="education-entry">
        <strong>${clean(degree)}</strong>
        ${details.length ? `<p>${details.map(clean).join(" <span aria-hidden=\"true\">·</span> ")}</p>` : ""}
      </div>`;
    })
    .join("");
}

function skillsMarkup(skills: string[]) {
  const entries = skills.filter((skill) => skill.trim());
  if (!entries.length) return "";
  return `<ul class="skill-list">${entries.map((skill) => `<li>${clean(skill)}</li>`).join("")}</ul>`;
}

function languagesMarkup(data: ResumeData) {
  const entries = data.languages.filter((language) => language.name.trim());
  if (!entries.length) return "";
  return `<ul class="language-list">${entries.map((language) => `
    <li><span class="language-name">${clean(language.name)}</span>
      ${language.level ? `<span class="language-level" dir="ltr">${clean(englishLanguageLevel(language.level))}</span>` : ""}
    </li>`).join("")}
  </ul>`;
}

export function buildModernResumeDocument(data: ResumeData): string {
  const contact = [
    data.email.trim()
      ? `<td><span class="contact-label">البريد الإلكتروني</span><bdi dir="ltr">${clean(data.email)}</bdi></td>`
      : "",
    data.phone.trim()
      ? `<td><span class="contact-label">الهاتف</span><bdi dir="ltr">${clean(data.phone)}</bdi></td>`
      : "",
  ].filter(Boolean);
  const location = [data.city, data.province].filter((value) => value.trim()).map(clean).join("، ");
  const contactMarkup = contact.length || location
    ? `<table class="contact-table" role="presentation" cellspacing="0" cellpadding="0"><tbody>
        ${contact.length ? `<tr>${contact.join("")}</tr>` : ""}
        ${location ? `<tr><td colspan="2"><span class="contact-label">الموقع</span>${location}</td></tr>` : ""}
      </tbody></table>`
    : "";

  const summary = section("نبذة مهنية", data.summary.trim()
    ? `<p class="summary-copy">${lines(data.summary)}</p>`
    : "", "summary-section");
  const experiences = section("الخبرات العملية", experienceMarkup(data), "experience-section");
  const skills = section("المهارات", skillsMarkup(data.skills), "skills-section");
  const education = section("التعليم", educationMarkup(data.education), "education-section");
  const languages = section("اللغات", languagesMarkup(data), "languages-section");
  const snapshotRows = [
    data.specialization.trim()
      ? `<tr><td><span class="detail-label">التخصص</span><strong>${clean(data.specialization)}</strong></td></tr>`
      : "",
    data.experience_years > 0
      ? `<tr><td><span class="detail-label">سنوات الخبرة</span><strong>${clean(data.experience_years)} سنة</strong></td></tr>`
      : "",
  ].filter(Boolean).join("");
  const snapshot = section("ملخص المسار المهني", snapshotRows
    ? `<table class="snapshot-table" cellspacing="0" cellpadding="0"><tbody>${snapshotRows}</tbody></table>`
    : "", "snapshot-section");

  const aside = [snapshot, skills, education, languages].join("");
  const content = experiences || aside
    ? `<table class="content-columns" role="presentation" cellspacing="0" cellpadding="0"><tbody><tr>
        <td class="primary-column">${experiences}</td>
        <td class="secondary-column">${aside}</td>
      </tr></tbody></table>`
    : "";

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${clean(data.full_name || "السيرة الذاتية")}</title>
    <style>
      @page { size: A4 portrait; margin: 13mm; }
      * { box-sizing: border-box; }
      html { background: #edf2f6; }
      body {
        margin: 0;
        color: #253c50;
        background: #edf2f6;
        font-family: Tahoma, Arial, sans-serif;
        font-size: 10pt;
        line-height: 1.7;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      main {
        width: 100%;
        max-width: 794px;
        min-height: 1123px;
        margin: 24px auto;
        overflow: hidden;
        background: #fbfcfd;
        box-shadow: 0 12px 36px rgba(30, 55, 78, .12);
      }
      .cv-header {
        position: relative;
        padding: 31px 36px 26px;
        color: #f6f9fc;
        background: #173754;
        border-bottom: 5px solid #4b8fc2;
      }
      .cv-header::before {
        position: absolute;
        top: 0;
        right: 0;
        width: 6px;
        height: 100%;
        background: #8bb8d7;
        content: "";
      }
      .header-kicker {
        margin: 0 0 6px;
        color: #9ec7e3;
        font-size: 8pt;
        font-weight: 700;
        letter-spacing: .4px;
      }
      .cv-name {
        margin: 0;
        color: #fff;
        font-size: 27pt;
        font-weight: 700;
        line-height: 1.3;
      }
      .cv-headline {
        margin: 4px 0 16px;
        color: #d8e5ef;
        font-size: 12pt;
        font-weight: 500;
      }
      .contact-table { width: 100%; border-collapse: collapse; }
      .contact-table td {
        padding: 3px 0 3px 19px;
        color: #edf4f8;
        font-size: 8.5pt;
        vertical-align: top;
      }
      .contact-label {
        display: inline-block;
        margin-left: 7px;
        color: #9ec7e3;
        font-size: 7pt;
        font-weight: 700;
      }
      .cv-content { padding: 24px 31px 30px; }
      .summary-section {
        margin: 0 0 20px;
        padding: 13px 17px 14px;
        border-right: 3px solid #4b8fc2;
        background: #f0f5f8;
      }
      .section { margin: 0 0 19px; }
      .section-title {
        display: flex;
        align-items: center;
        gap: 9px;
        margin: 0 0 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid #d9e3ea;
        color: #173754;
        font-size: 11pt;
        font-weight: 700;
        line-height: 1.4;
      }
      .section-mark {
        display: inline-block;
        width: 4px;
        height: 17px;
        flex: 0 0 4px;
        background: #4b8fc2;
      }
      .section-content { color: #40596c; }
      .summary-copy { margin: 0; line-height: 1.85; }
      .content-columns {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        table-layout: fixed;
      }
      .primary-column {
        width: 62%;
        padding: 0 0 0 22px;
        vertical-align: top;
      }
      .secondary-column {
        width: 38%;
        padding: 0 17px 0 0;
        border-right: 1px solid #dce5eb;
        vertical-align: top;
      }
      .experience-entry {
        padding: 10px 0 12px;
        border-bottom: 1px solid #e2e9ee;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .experience-entry:first-child { padding-top: 2px; }
      .experience-entry:last-child { border-bottom: 0; }
      .entry-heading { width: 100%; border-collapse: collapse; }
      .entry-heading td { padding: 0; vertical-align: top; }
      .entry-heading h3 {
        margin: 0;
        color: #244c6b;
        font-size: 10pt;
        line-height: 1.5;
      }
      .entry-period {
        width: 116px;
        padding-right: 8px !important;
        color: #52738b;
        font-size: 7.5pt;
        white-space: nowrap;
        text-align: left;
      }
      .entry-meta { margin: 2px 0 5px; color: #52738b; font-size: 8pt; font-weight: 700; }
      .entry-description { margin: 0; color: #40596c; font-size: 8.5pt; line-height: 1.75; }
      .secondary-column .section { margin-bottom: 17px; }
      .secondary-column .section-title { margin-bottom: 7px; font-size: 9.5pt; }
      .snapshot-table { width: 100%; border-collapse: collapse; }
      .snapshot-table td {
        padding: 5px 0 7px;
        border-bottom: 1px solid #e2e9ee;
        vertical-align: top;
      }
      .snapshot-table tr:last-child td { border-bottom: 0; }
      .detail-label { display: block; color: #718697; font-size: 7.5pt; }
      .snapshot-table strong { color: #294e69; font-size: 8.5pt; }
      .skill-list, .language-list { margin: 0; padding: 0; list-style: none; }
      .skill-list li {
        position: relative;
        margin: 0 0 6px;
        padding: 5px 11px 5px 6px;
        border-right: 2px solid #8ab4d1;
        color: #35566f;
        background: #f0f5f8;
        font-size: 8pt;
        line-height: 1.5;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .language-list li {
        display: block;
        padding: 5px 0;
        border-bottom: 1px solid #e2e9ee;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .language-list li:last-child { border-bottom: 0; }
      .language-name { color: #35566f; font-size: 8.5pt; font-weight: 700; }
      .language-level {
        display: block;
        color: #718697;
        font-size: 7.5pt;
      }
      .education-entry {
        padding: 2px 0 8px;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .education-entry strong { color: #35566f; font-size: 8.5pt; }
      .education-entry p { margin: 2px 0 0; color: #718697; font-size: 7.5pt; line-height: 1.55; }
      @media screen and (max-width: 680px) {
        html, body { background: #edf2f6; }
        main { min-height: 0; margin: 10px auto; }
        .cv-header { padding: 25px 22px 20px; }
        .cv-name { font-size: 23pt; }
        .cv-content { padding: 19px 20px 24px; }
        .content-columns, .content-columns tbody, .content-columns tr, .content-columns td {
          display: block;
          width: 100%;
        }
        .primary-column { padding: 0; }
        .secondary-column { padding: 0; border-right: 0; }
      }
      @media print {
        html, body { background: #fff; }
        body { margin: 0; }
        main {
          width: 100%;
          max-width: none;
          min-height: 0;
          margin: 0;
          overflow: visible;
          box-shadow: none;
        }
        .cv-header, .summary-section, .skill-list li, .section-title, .cv-header::before {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .section-title, .education-entry, .experience-entry { page-break-inside: avoid; break-inside: avoid; }
        .content-columns { page-break-inside: auto; }
      }
    </style>
  </head>
  <body>
    <main>
      <header class="cv-header">
        <p class="header-kicker">السيرة الذاتية</p>
        <h1 class="cv-name">${clean(data.full_name || "الاسم الكامل")}</h1>
        <p class="cv-headline">${clean(data.headline || "المسمى الوظيفي")}</p>
        ${contactMarkup}
      </header>
      <div class="cv-content">
        ${summary}
        ${content}
      </div>
    </main>
  </body>
</html>`;
}
