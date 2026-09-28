import type { CandidateProfileInput } from "../../lib/types";
import type { CandidateExperience, CandidateLanguage } from "../../services/candidateService";

export type AtsResumeData = Omit<CandidateProfileInput, "languages"> & {
  experiences: CandidateExperience[];
  languages: CandidateLanguage[];
};

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

function section(title: string, content: string) {
  return content ? `<section><h2>${title}</h2>${content}</section>` : "";
}

export function buildAtsResumeDocument(data: AtsResumeData) {
  const contact = [
    data.email.trim(),
    data.phone.trim(),
    [data.province, data.city].filter(Boolean).join("، "),
  ].filter(Boolean).map(clean).join(" | ");
  const extraMeta = [
    data.specialization,
    data.experience_years ? `${data.experience_years} سنوات خبرة` : "",
    data.work_type,
    data.availability,
    data.remote_available ? "متاح للعمل عن بُعد" : "",
  ].filter(Boolean).map(clean).join(" · ");
  const experiences = data.experiences
    .filter((experience) => [experience.title, experience.company, experience.period, experience.description].some((value) => value.trim()))
    .map((experience) => `
      <article class="experience">
        <h3>${clean(experience.title || "خبرة مهنية")}</h3>
        <p class="meta">${[experience.company, experience.location, experience.period].filter(Boolean).map(clean).join(" · ")}</p>
        ${experience.description.trim() ? `<p>${lines(experience.description)}</p>` : ""}
      </article>
    `).join("");
  const languages = data.languages
    .filter((language) => language.name.trim())
    .map((language) => `<li>${clean(language.name)}${language.level ? ` — ${clean(language.level)}` : ""}</li>`)
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>${clean(data.full_name || "السيرة الذاتية")}</title>
    <style>
      @page { size: A4; margin: 17mm 18mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #202020; background: #fff; font-family: Arial, "Tahoma", sans-serif; font-size: 11pt; line-height: 1.75; }
      main { max-width: 760px; margin: 0 auto; }
      header { padding-bottom: 13px; border-bottom: 2px solid #222; }
      h1 { margin: 0; color: #111; font-size: 25pt; line-height: 1.2; }
      .headline { margin: 5px 0 7px; color: #333; font-size: 13pt; font-weight: 700; }
      .contact, .meta { margin: 0; color: #444; font-size: 9.5pt; }
      .submeta { margin: 4px 0 0; color: #555; font-size: 9.5pt; }
      section { margin-top: 17px; }
      h2 { margin: 0 0 7px; padding-bottom: 3px; border-bottom: 1px solid #888; color: #111; font-size: 13pt; }
      h3 { margin: 0; color: #222; font-size: 11.5pt; }
      p { margin: 0; }
      ul { margin: 5px 0 0; padding: 0 21px 0 0; }
      li { margin: 2px 0; }
      .experience { margin: 0 0 12px; }
      .experience:last-child { margin-bottom: 0; }
      .skills { display: block; }
      .skills li { display: inline; }
      .skills li:not(:last-child)::after { content: "، "; }
      .empty-note { color: #555; }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>${clean(data.full_name || "الاسم الكامل")}</h1>
        <p class="headline">${clean(data.headline || "المسمى الوظيفي")}</p>
        ${contact ? `<p class="contact">${contact}</p>` : ""}
        ${extraMeta ? `<p class="submeta">${extraMeta}</p>` : ""}
      </header>
      ${section("الملخص المهني", data.summary.trim() ? `<p>${lines(data.summary)}</p>` : "")}
      ${section("الخبرات العملية", experiences)}
      ${section("المهارات", data.skills.length ? `<ul class="skills">${list(data.skills)}</ul>` : "")}
      ${section("التعليم والمؤهلات", data.education.trim() ? `<p>${lines(data.education)}</p>` : "")}
      ${section("اللغات", languages ? `<ul>${languages}</ul>` : "")}
    </main>
  </body>
</html>`;
}

function fileName(fullName: string) {
  const normalized = fullName.trim().replace(/[^\p{L}\p{N}\-_ ]/gu, "").trim().replace(/\s+/g, "-");
  return `CV-${normalized || "ATS"}.doc`;
}

export function downloadAtsResume(data: AtsResumeData) {
  const blob = new Blob([buildAtsResumeDocument(data)], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName(data.full_name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printAtsResume(data: AtsResumeData) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return false;
  printWindow.document.write(buildAtsResumeDocument(data));
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 350);
  return true;
}