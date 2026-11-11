import { useMemo, useState } from "react";
import { ArrowRight, Check, Download, FileText, Pencil, Printer, ShieldCheck } from "lucide-react";
import type { View } from "../../app/types";
import { buildAtsResumeDocument, downloadResumeDocument, printResumeDocument, type ResumeData } from "../../features/candidate/atsResume";
import { buildProfessionalResumeDocument } from "../../features/candidate/professionalResume";
import { formatCandidateExperiencePeriodForAts } from "../../services/candidateService";
import "./candidate-resume-export-page.css";

type ResumeTemplate = "ats" | "professional" | "editorial";

type CandidateResumeExportPageProps = {
  data: ResumeData;
  onNavigate: (view: View) => void;
  onNotify?: (message: string) => void;
};

const templates: { id: ResumeTemplate; name: string; description: string }[] = [
  { id: "ats", name: "متوافق مع ATS", description: "واضح وبسيط لأنظمة الفرز" },
  { id: "professional", name: "احترافي", description: "تقسيم بصري منظم للخبرات" },
  { id: "editorial", name: "مهني معاصر", description: "مساحات هادئة ولمسة تحريرية" },
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function text(value: string | number | null | undefined) {
  return escapeHtml(String(value ?? "").trim());
}

function lines(value: string) {
  return text(value).replace(/\r?\n/g, "<br />");
}

function buildEditorialResumeDocument(data: ResumeData) {
  const contacts = [data.email, data.phone, [data.city, data.province].filter(Boolean).join(", ")]
    .filter((item) => item.trim())
    .map((item) => `<span>${text(item)}</span>`)
    .join("");
  const experiences = data.experiences
    .map((entry) => {
      const period = formatCandidateExperiencePeriodForAts(entry);
      if (![entry.title, entry.company, entry.location, period, entry.description].some((value) => value.trim())) return "";
      return `<article class="experience">
        <div class="entry-head"><h3>${text(entry.title || "Professional Experience")}</h3><span>${text(period)}</span></div>
        <p class="company">${[entry.company, entry.location].filter(Boolean).map(text).join(" · ")}</p>
        ${entry.description.trim() ? `<p>${lines(entry.description)}</p>` : ""}
      </article>`;
    })
    .filter(Boolean)
    .join("");
  const skills = data.skills.filter((skill) => skill.trim()).map((skill) => `<li>${text(skill)}</li>`).join("");
  const education = data.education.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)
    .map((entry) => `<li>${text(entry)}</li>`).join("");
  const languages = data.languages.filter((language) => language.name.trim())
    .map((language) => `<li>${text(language.name)}${language.level ? ` <span>${text(language.level)}</span>` : ""}</li>`)
    .join("");

  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${text(data.full_name || "Resume")}</title>
    <style>
      @page { size: A4; margin: 15mm; }
      * { box-sizing: border-box; }
      body { margin: 0; color: #344653; background: #e9eeec; font: 10pt/1.6 Arial, "Trebuchet MS", sans-serif; }
      main { max-width: 780px; min-height: 1040px; margin: 0 auto; padding: 38px 43px; background: #fffefa; }
      header { padding: 0 0 23px; border-bottom: 1px solid #d8dfdd; }
      .kicker { margin: 0 0 10px; color: #a66f4f; font-size: 8pt; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
      h1 { margin: 0; color: #193650; font: 32pt/1.14 Georgia, "Times New Roman", serif; }
      .headline { margin: 8px 0 14px; color: #617581; font-size: 12pt; }
      .contacts { display: flex; flex-wrap: wrap; gap: 6px 17px; color: #667780; font-size: 8.5pt; }
      .body-grid { width: 100%; padding-top: 24px; border-collapse: collapse; table-layout: fixed; }
      .main-column { width: 66%; padding: 0 24px 0 0; vertical-align: top; }
      .side { width: 34%; padding: 0; vertical-align: top; }
      section { margin: 0 0 24px; }
      h2 { margin: 0 0 11px; color: #a66f4f; font-size: 8pt; letter-spacing: 1.3px; text-transform: uppercase; }
      h2:after { display: block; width: 28px; height: 2px; margin-top: 6px; background: #d8b49d; content: ""; }
      p { margin: 0; }
      .summary { color: #51646f; font-size: 9pt; line-height: 1.8; }
      .experience { margin: 0 0 17px; page-break-inside: avoid; break-inside: avoid; }
      .entry-head { display: flex; align-items: baseline; justify-content: space-between; gap: 9px; }
      h3 { margin: 0; color: #193650; font-size: 10pt; }
      .entry-head span { color: #987252; font-size: 7.5pt; white-space: nowrap; }
      .company { margin: 3px 0 6px; color: #7b898e; font-size: 8pt; }
      .experience > p:last-child { color: #526670; font-size: 8.5pt; }
      ul { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
      li { color: #526570; font-size: 8.5pt; }
      .side li { padding-bottom: 6px; border-bottom: 1px solid #e7eae7; }
      .side li span { display: block; margin-top: 2px; color: #89949a; font-size: 7.5pt; }
      @media screen and (max-width: 640px) {
        body { padding: 8px; }
        main { min-height: auto; padding: 27px 21px; }
        .body-grid, .body-grid tbody, .body-grid tr, .body-grid td { display: block; width: 100%; }
        .main-column, .side { padding: 0; }
      }
      @media print {
        body { background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        main { max-width: none; min-height: 0; padding: 0; }
        section, .experience { page-break-inside: avoid; break-inside: avoid; }
      }
    </style>
  </head>
  <body><main>
    <header>
      <p class="kicker">Professional profile</p>
      <h1>${text(data.full_name || "Full Name")}</h1>
      <p class="headline">${text(data.headline || "Professional Title")}</p>
      <div class="contacts">${contacts}</div>
    </header>
    <table class="body-grid" role="presentation"><tbody><tr>
      <td class="main-column">
        ${data.summary.trim() ? `<section><h2>Profile</h2><p class="summary">${lines(data.summary)}</p></section>` : ""}
        ${experiences ? `<section><h2>Experience</h2>${experiences}</section>` : ""}
      </td>
      <td class="side">
        ${skills ? `<section><h2>Core skills</h2><ul>${skills}</ul></section>` : ""}
        ${education ? `<section><h2>Education</h2><ul>${education}</ul></section>` : ""}
        ${languages ? `<section><h2>Languages</h2><ul>${languages}</ul></section>` : ""}
        ${data.specialization.trim() || data.experience_years > 0 ? `<section><h2>Career snapshot</h2><ul>
          ${data.specialization.trim() ? `<li>${text(data.specialization)}</li>` : ""}
          ${data.experience_years > 0 ? `<li>${text(data.experience_years)} years of experience</li>` : ""}
        </ul></section>` : ""}
      </td>
    </tr></tbody></table>
  </main></body>
</html>`;
}

function missingProfileFields(data: ResumeData) {
  const missing: string[] = [];
  if (!data.full_name.trim()) missing.push("الاسم الكامل");
  if (!data.headline.trim()) missing.push("المسمى الوظيفي");
  if (!data.email.trim()) missing.push("البريد الإلكتروني");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) missing.push("بريد إلكتروني صحيح");
  if (!data.phone.trim()) missing.push("رقم الهاتف");
  if (!data.summary.trim()) missing.push("النبذة المهنية");
  return missing;
}

export function CandidateResumeExportPage({ data, onNavigate, onNotify }: CandidateResumeExportPageProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("professional");
  const missingFields = useMemo(() => missingProfileFields(data), [data]);
  const documentHtml = useMemo(() => {
    if (selectedTemplate === "ats") return buildAtsResumeDocument(data);
    if (selectedTemplate === "editorial") return buildEditorialResumeDocument(data);
    return buildProfessionalResumeDocument(data);
  }, [data, selectedTemplate]);
  const selectedName = templates.find((template) => template.id === selectedTemplate)?.name || "السيرة";
  const canExport = missingFields.length === 0;

  const downloadWord = () => {
    if (!canExport) return;
    const prefixes: Record<ResumeTemplate, string> = {
      ats: "ATS-Resume",
      professional: "Professional-Resume",
      editorial: "Editorial-Resume",
    };
    downloadResumeDocument(data, documentHtml, prefixes[selectedTemplate]);
    onNotify?.("تم تنزيل السيرة بصيغة Word.");
  };

  const printPdf = () => {
    if (!canExport) return;
    if (!printResumeDocument(documentHtml)) {
      onNotify?.("اسمح بفتح نافذة جديدة حتى تتمكن من حفظ السيرة كـ PDF.");
    }
  };

  return (
    <section className="container page-section dashboard-page candidate-resume-export-page" dir="rtl">
      <button type="button" className="candidate-resume-export-back" onClick={() => onNavigate("candidate")}>
        <ArrowRight size={16} /> العودة إلى ملفي
      </button>

      <header className="candidate-resume-export-heading">
        <div className="candidate-resume-export-heading-copy">
          <span className="candidate-resume-export-heading-icon"><FileText size={20} /></span>
          <div>
            <span className="eyebrow">معاينة وتنزيل</span>
            <h1>جهّز سيرتك الذاتية</h1>
            <p>اختر التصميم الذي يناسبك، راجع معاينة الملف نفسه، ثم نزّله بصيغة Word أو اطبعه واحفظه PDF.</p>
          </div>
        </div>
        <button type="button" className="candidate-resume-export-edit" onClick={() => onNavigate("candidate-profile-edit")}>
          <Pencil size={15} /> تعديل المعلومات
        </button>
      </header>

      <div className="candidate-resume-export-layout">
        <aside className="candidate-resume-export-controls">
          <section className="candidate-resume-export-panel" aria-labelledby="resume-template-heading">
            <h2 id="resume-template-heading">اختر قالبًا</h2>
            <p>يمكنك التبديل بين القوالب قبل التصدير.</p>
            <div className="candidate-resume-template-list" role="group" aria-label="قوالب السيرة الذاتية">
              {templates.map((template) => {
                const selected = selectedTemplate === template.id;
                return (
                  <button
                    type="button"
                    className="candidate-resume-template"
                    key={template.id}
                    aria-pressed={selected}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <span className="candidate-resume-template-mark" aria-hidden="true"><FileText size={17} /></span>
                    <span className="candidate-resume-template-copy"><b>{template.name}</b><small>{template.description}</small></span>
                    {selected && <Check className="candidate-resume-template-check" size={17} aria-label="القالب المحدد" />}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="candidate-resume-export-panel">
            <h2>تنزيل {selectedName}</h2>
            <p>استخدم Word للتعديل أو PDF لإرسال نسخة جاهزة.</p>
            <div className="candidate-resume-export-format-actions">
              <button type="button" className="candidate-resume-export-action" disabled={!canExport} onClick={downloadWord}>
                <Download size={16} /> تنزيل Word
              </button>
              <button type="button" className="candidate-resume-export-action secondary" disabled={!canExport} onClick={printPdf}>
                <Printer size={16} /> طباعة أو حفظ PDF
              </button>
            </div>
            <p className="candidate-resume-export-note"><ShieldCheck size={14} /> تتم معاينة الملف مباشرة في متصفحك، ولا تُرسل بياناتك إلى جهة خارجية.</p>
          </section>

          {!canExport && (
            <section className="candidate-resume-export-validation" role="alert" aria-live="polite">
              <h3>أكمل هذه المعلومات قبل التصدير</h3>
              <p>ستظهر سيرتك بشكل أفضل عند استكمال البيانات الأساسية.</p>
              <ul>{missingFields.map((field) => <li key={field}>{field}</li>)}</ul>
              <button type="button" className="candidate-resume-export-edit" onClick={() => onNavigate("candidate-profile-edit")}>
                <Pencil size={14} /> استكمال المعلومات
              </button>
            </section>
          )}
        </aside>

        <section className="candidate-resume-preview-wrap" aria-labelledby="resume-preview-heading">
          <div className="candidate-resume-preview-heading">
            <h2 id="resume-preview-heading">معاينة {selectedName}</h2>
            <span>تتحدث المعاينة مع تغيير القالب</span>
          </div>
          <iframe
            className="candidate-resume-preview-frame"
            title={`معاينة السيرة الذاتية — ${selectedName}`}
            srcDoc={documentHtml}
            sandbox=""
          />
        </section>
      </div>
    </section>
  );
}
