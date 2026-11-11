import { useEffect, useMemo, useRef, useState } from "react";
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
  { id: "editorial", name: "مهني معاصر", description: "تصميم A4 مرتب من صفحة واحدة" },
];

const A4_PREVIEW_WIDTH = 794;
const A4_PREVIEW_HEIGHT = 1123;

function buildA4PreviewDocument(html: string, template: ResumeTemplate) {
  if (template === "editorial") return html;

  const verticalMargin = template === "ats" ? 60 : 53;
  const horizontalMargin = template === "ats" ? 68 : 53;
  const previewStyles = `<style id="a4-screen-preview">
    @media screen {
      html, body {
        width: ${A4_PREVIEW_WIDTH}px !important;
        min-width: ${A4_PREVIEW_WIDTH}px !important;
        min-height: ${A4_PREVIEW_HEIGHT}px !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #fff !important;
        overflow: visible !important;
      }
      body { height: auto !important; }
      main {
        width: ${A4_PREVIEW_WIDTH}px !important;
        max-width: none !important;
        min-height: ${A4_PREVIEW_HEIGHT}px !important;
        height: auto !important;
        margin: 0 !important;
        padding: ${verticalMargin}px ${horizontalMargin}px !important;
        box-sizing: border-box !important;
        overflow: visible !important;
        background: #fff !important;
        box-shadow: none !important;
      }
    }
  </style>`;

  return html.replace("</head>", `${previewStyles}</head>`);
}

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
      @page { size: A4 portrait; margin: 0; }
      * { box-sizing: border-box; }
      html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
      body { overflow: visible; color: #263b4b; background: #fff; font: 8.5pt/1.42 Arial, "Trebuchet MS", sans-serif; }
      main.resume-page { width: 210mm; height: 297mm; margin: 0; padding: 10mm 12mm; overflow: visible; background: #fffefa; }
      header { padding: 8px 0 13px; border-top: 3px solid #193650; border-bottom: 1px solid #d6dfdf; }
      .kicker { margin: 0 0 6px; color: #a66f4f; font-size: 7pt; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; }
      h1 { margin: 0; color: #193650; font: 25pt/1.08 Georgia, "Times New Roman", serif; }
      .headline { margin: 5px 0 9px; color: #526a79; font-size: 10pt; font-weight: 600; }
      .contacts { display: flex; flex-wrap: wrap; gap: 4px 13px; color: #667780; font-size: 7.5pt; }
      .body-grid { width: 100%; padding-top: 15px; border-collapse: collapse; table-layout: fixed; }
      .main-column { width: 65%; padding: 0 18px 0 0; vertical-align: top; }
      .side { width: 35%; padding: 0 0 0 14px; border-left: 1px solid #e5e9e7; vertical-align: top; }
      section { margin: 0 0 14px; }
      h2 { margin: 0 0 7px; color: #193650; font-size: 7pt; letter-spacing: 1px; text-transform: uppercase; }
      h2:after { display: block; width: 25px; height: 2px; margin-top: 4px; background: #c98c65; content: ""; }
      p { margin: 0; }
      .summary { color: #51646f; font-size: 8pt; line-height: 1.5; }
      .experience { margin: 0 0 10px; page-break-inside: avoid; break-inside: avoid; }
      .entry-head { display: flex; align-items: baseline; justify-content: space-between; gap: 9px; }
      h3 { margin: 0; color: #193650; font-size: 8.5pt; }
      .entry-head span { color: #987252; font-size: 7pt; white-space: nowrap; }
      .company { margin: 2px 0 4px; color: #7b898e; font-size: 7.3pt; }
      .experience > p:last-child { color: #526670; font-size: 7.5pt; line-height: 1.42; }
      ul { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
      li { color: #526570; font-size: 7.5pt; line-height: 1.4; }
      .side li { padding-bottom: 4px; border-bottom: 1px solid #e7eae7; }
      .side li span { display: block; margin-top: 1px; color: #89949a; font-size: 6.8pt; }
      #resume-content-end { height: 0; margin: 0; padding: 0; }
      @media print {
        html, body { width: 210mm; height: 297mm; }
        body { overflow: visible; background: #fff; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        main.resume-page { width: 210mm; height: 297mm; overflow: visible; }
        section, .experience { page-break-inside: avoid; break-inside: avoid; }
      }
    </style>
  </head>
  <body><main class="resume-page">
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
    <div id="resume-content-end"></div>
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
  const contentSignature = JSON.stringify(data);
  const [editorialFitResult, setEditorialFitResult] = useState<{ signature: string; fits: boolean } | null>(null);
  const previewSheetRef = useRef<HTMLDivElement>(null);
  const previewFrameRef = useRef<HTMLIFrameElement>(null);
  const [previewScale, setPreviewScale] = useState(1);
  const documentHtml = useMemo(() => {
    if (selectedTemplate === "ats") return buildAtsResumeDocument(data);
    if (selectedTemplate === "editorial") return buildEditorialResumeDocument(data);
    return buildProfessionalResumeDocument(data);
  }, [data, selectedTemplate]);
  const previewHtml = useMemo(
    () => buildA4PreviewDocument(documentHtml, selectedTemplate),
    [documentHtml, selectedTemplate],
  );
  const selectedName = templates.find((template) => template.id === selectedTemplate)?.name || "السيرة";
  const editorialFitsA4 = editorialFitResult?.signature === contentSignature ? editorialFitResult.fits : null;
  const canExport = missingFields.length === 0 && (selectedTemplate !== "editorial" || editorialFitsA4 === true);

  useEffect(() => {
    const sheet = previewSheetRef.current;
    if (!sheet) return;
    const updateScale = () => setPreviewScale(Math.min(1, sheet.clientWidth / A4_PREVIEW_WIDTH));
    const observer = new ResizeObserver(updateScale);
    updateScale();
    observer.observe(sheet);
    return () => observer.disconnect();
  }, []);

  const checkEditorialPageFit = () => {
    if (selectedTemplate !== "editorial") return;
    const previewDocument = previewFrameRef.current?.contentDocument;
    const page = previewDocument?.querySelector<HTMLElement>(".resume-page");
    const contentEnd = previewDocument?.getElementById("resume-content-end");
    if (!page || !contentEnd) {
      setEditorialFitResult({ signature: contentSignature, fits: false });
      return;
    }
    const pageBounds = page.getBoundingClientRect();
    const contentBounds = contentEnd.getBoundingClientRect();
    const defaultView = previewDocument?.defaultView;
    const bottomInset = Number.parseFloat(
      defaultView?.getComputedStyle(page).paddingBottom || "0",
    );
    const fits = contentBounds.top <= pageBounds.bottom - bottomInset + 1;
    setEditorialFitResult({ signature: contentSignature, fits });
  };

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
            {selectedTemplate === "editorial" && (
              <div
                className={`candidate-resume-a4-fit-status ${editorialFitsA4 === false ? "overflow" : editorialFitsA4 ? "fits" : "checking"}`}
                role={editorialFitsA4 === false ? "alert" : "status"}
                aria-live="polite"
              >
                {editorialFitsA4 === null
                  ? "جارٍ فحص المحتوى ضمن ورقة A4..."
                  : editorialFitsA4
                    ? "المحتوى مناسب لصفحة A4 واحدة."
                    : "المحتوى أطول من صفحة A4. اختصر النبذة أو تفاصيل الخبرة؛ لن نصدّر نسخة مقسومة على صفحتين."}
                {editorialFitsA4 === false && (
                  <button type="button" className="candidate-resume-export-edit" onClick={() => onNavigate("candidate-profile-edit")}>
                    <Pencil size={14} /> تعديل البيانات
                  </button>
                )}
              </div>
            )}
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
            <span>ورقة A4 · {selectedTemplate === "editorial" ? "صفحة واحدة" : "عرض جاهز للطباعة"}</span>
          </div>
          <div className="candidate-resume-preview-sheet" ref={previewSheetRef}>
            <iframe
              ref={previewFrameRef}
              className="candidate-resume-preview-frame"
              title={`معاينة السيرة الذاتية — ${selectedName}`}
              srcDoc={previewHtml}
              sandbox="allow-same-origin"
              width={A4_PREVIEW_WIDTH}
              height={A4_PREVIEW_HEIGHT}
              style={{ transform: `scale(${previewScale})` }}
              onLoad={checkEditorialPageFit}
            />
          </div>
        </section>
      </div>
    </section>
  );
}
