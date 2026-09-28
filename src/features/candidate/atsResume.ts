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
    .filter((experience) => [experience.title, experience.company, experience.period, experience.description].some((value) => value.trim()))
    .map((experience) => `
      <article class="${className}">
        <h3>${clean(experience.title || "Professional Experience")}</h3>
        <p class="meta">${[experience.company, experience.location, experience.period].filter(Boolean).map(clean).join(" | ")}</p>
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

export function buildStandardCvDocument(data: ResumeData) {
  const contact = contactParts(data);
  const meta = professionalMeta(data);
  const standardExperiences = data.experiences
    .filter((experience) => [experience.title, experience.company, experience.period, experience.description].some((value) => value.trim()))
    .map((experience) => `
      <article class="standard-experience">
        <div class="experience-date">${[experience.period, experience.location].filter(Boolean).map(clean).join("<br />")}</div>
        <div class="experience-copy">
          <h3>${clean(experience.title || "Professional Experience")}</h3>
          ${experience.company.trim() ? `<p class="meta">${clean(experience.company)}</p>` : ""}
          ${experience.description.trim() ? `<p>${lines(experience.description)}</p>` : ""}
        </div>
      </article>
    `).join("");
  const skills = data.skills.filter((skill) => skill.trim());
  const languages = data.languages.filter((language) => language.name.trim());

  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <title>${clean(data.full_name || "CV")}</title>
    <style>
      @page { size: A4; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 100%; min-height: 297mm; }
      body { margin: 0; color: #253b36; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; line-height: 1.62; }
      .cv-page { width: 210mm; min-height: 297mm; margin: 0 auto; padding: 15mm 16mm 17mm; background: #fffdf9; overflow-wrap: anywhere; }
      .top-accent { width: 100%; height: 5px; margin-bottom: 18px; background: #2f7d68; }
      .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 17px; border-bottom: 1px solid #d7e3dc; }
      .identity { min-width: 0; }
      h1 { margin: 0; color: #173d34; font-size: 28pt; line-height: 1.08; letter-spacing: -.4px; }
      .headline { margin: 7px 0 0; color: #2f7d68; font-size: 13pt; font-weight: 700; line-height: 1.4; }
      .contact-block { width: 60mm; flex: 0 0 60mm; padding: 11px 12px; border: 1px solid #d7e3dc; border-radius: 8px; background: #f2f8f4; }
      .contact-block p { margin: 0 0 4px; color: #45645a; font-size: 9pt; line-height: 1.55; }
      .contact-block p:last-child { margin-bottom: 0; }
      .intro-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 15px; }
      .intro-card { padding: 11px 13px; border-left: 3px solid #e0ab51; background: #fff8e9; break-inside: avoid; page-break-inside: avoid; }
      .intro-card h2, .section h2 { margin: 0 0 7px; color: #225b4b; font-size: 10.5pt; line-height: 1.25; text-transform: uppercase; letter-spacing: .8px; }
      .intro-card p, .education-copy { margin: 0; color: #4c625b; line-height: 1.72; }
      .section { margin-top: 18px; break-inside: auto; }
      .section h2 { display: flex; align-items: center; gap: 8px; padding-bottom: 6px; border-bottom: 1px solid #d7e3dc; }
      .section h2::before { content: ""; width: 20px; height: 3px; border-radius: 99px; background: #e0ab51; }
      .skills-grid { display: flex; flex-wrap: wrap; gap: 7px; margin-top: 9px; }
      .skill { padding: 5px 9px; border: 1px solid #c9dfd4; border-radius: 99px; color: #286652; background: #f1f8f4; font-size: 9.5pt; }
      .standard-experience { display: grid; grid-template-columns: 39mm 1fr; gap: 13px; padding: 10px 0 13px; border-bottom: 1px solid #e4ece7; break-inside: avoid; page-break-inside: avoid; }
      .standard-experience:last-child { border-bottom: 0; }
      .standard-experience h3 { margin: 0; color: #173d34; font-size: 11.5pt; line-height: 1.4; }
      .experience-date { color: #a17628; font-size: 9pt; font-weight: 700; line-height: 1.6; }
      .experience-copy .meta { margin: 0 0 5px; color: #2f7d68; font-size: 9.5pt; font-weight: 700; }
      .experience-copy p:last-child { margin: 0; color: #4c625b; white-space: pre-line; }
      .language-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .language { padding: 8px 10px; border-radius: 7px; background: #f2f8f4; color: #416158; font-size: 9.5pt; }
      .language b { display: block; color: #225b4b; }
      .language small { display: block; margin-top: 2px; color: #758b83; font-size: 8.5pt; }
      @media print {
        html, body { width: 210mm; min-height: 297mm; }
        .cv-page { width: 210mm; min-height: 297mm; margin: 0; }
      }
    </style>
  </head>
  <body>
    <div class="cv-page">
      <div class="top-accent"></div>
      <header class="header">
        <div class="identity">
          <h1>${clean(data.full_name || "Full Name")}</h1>
          <p class="headline">${clean(data.headline || "Professional Title")}</p>
        </div>
        ${contact.length ? `<div class="contact-block">${contact.map((item) => `<p>${clean(item)}</p>`).join("")}</div>` : ""}
      </header>
      <div class="intro-row">
        ${data.summary.trim() ? `<section class="intro-card"><h2>Professional Summary</h2><p>${lines(data.summary)}</p></section>` : ""}
        ${meta.length ? `<section class="intro-card"><h2>Professional Snapshot</h2><p>${meta.map(clean).join(" · ")}</p></section>` : ""}
      </div>
      ${skills.length ? `<section class="section"><h2>Core Skills</h2><div class="skills-grid">${skills.map((skill) => `<span class="skill">${clean(skill)}</span>`).join("")}</div></section>` : ""}
      ${standardExperiences ? `<section class="section"><h2>Professional Experience</h2>${standardExperiences}</section>` : ""}
      ${data.education.trim() ? `<section class="section"><h2>Education</h2><p class="education-copy">${lines(data.education)}</p></section>` : ""}
      ${languages.length ? `<section class="section"><h2>Languages</h2><div class="language-grid">${languages.map((language) => `<div class="language"><b>${clean(language.name)}</b>${language.level ? `<small>${clean(language.level)}</small>` : ""}</div>`).join("")}</div></section>` : ""}
    </div>
  </body>
</html>`;
}

export function downloadAtsResume(data: AtsResumeData) {
  downloadDocument(data, buildAtsResumeDocument(data), "ATS-Resume");
}

export function printAtsResume(data: AtsResumeData) {
  return printDocument(buildAtsResumeDocument(data));
}

export function downloadStandardCv(data: ResumeData) {
  downloadDocument(data, buildStandardCvDocument(data), "CV");
}

export function printStandardCv(data: ResumeData) {
  return printDocument(buildStandardCvDocument(data));
}