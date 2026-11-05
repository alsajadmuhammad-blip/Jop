import { useState, type ChangeEvent, type DragEvent } from "react";
import { Check, FileText, LoaderCircle, ShieldCheck, Upload, X } from "lucide-react";
import { readCandidateCv, type CandidateCvImport } from "./cvImport";
import "./cv-import.css";

type CvImportPanelProps = {
  onImport: (result: CandidateCvImport) => void;
};

function sourceLabel(result: CandidateCvImport) {
  if (result.source === "docx") return "تمت قراءة ملف Word داخل المتصفح";
  if (result.source === "ocr") return `تمت قراءة ${result.ocrPages} صفحة مصوّرة بـ OCR عربي/إنكليزي`;
  return "تم استخراج النص من PDF داخل المتصفح";
}

export function CvImportPanel({ onImport }: CvImportPanelProps) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<CandidateCvImport | null>(null);

  const processFile = async (file: File) => {
    setError("");
    setPreview(null);
    setBusy(true);
    setStatus("جاري تجهيز الملف وقراءته داخل المتصفح...");

    try {
      const result = await readCandidateCv(file, setStatus);
      setPreview(result);
      setStatus("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذرت قراءة الملف. جرّب ملف PDF أو DOCX.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void processFile(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void processFile(file);
  };

  const previewRows = preview
    ? [
      ["الاسم", preview.profile.full_name],
      ["المسمى", preview.profile.headline],
      ["التخصص", preview.profile.specialization],
      ["البريد", preview.profile.email],
      ["الهاتف", preview.profile.phone],
      ["الموقع", [preview.profile.city, preview.profile.province].filter(Boolean).join("، ")],
      ["سنوات الخبرة", preview.profile.experience_years ? `${preview.profile.experience_years} سنة` : ""],
      ["النبذة", preview.profile.summary],
    ].filter(([, value]) => Boolean(value))
    : [];

  const importedCount = preview
    ? previewRows.length + (preview.profile.skills?.length || 0) + preview.experiences.length + preview.education.length + preview.languages.length
    : 0;
  const periodLabel = (experience: CandidateCvImport["experiences"][number]) =>
    experience.legacyPeriod ||
    [experience.startMonth, experience.isCurrent ? "حتى الآن" : experience.endMonth].filter(Boolean).join(" — ");

  return (
    <section className="cv-import-panel" aria-labelledby="cv-import-heading">
      <div className="cv-import-heading">
        <span className="cv-import-icon"><FileText size={19} /></span>
        <div>
          <span className="cv-import-eyebrow">استيراد محلي وآمن</span>
          <h2 id="cv-import-heading">املأ ملفك من سيرتك الذاتية</h2>
          <p>نستخرج البيانات من PDF أو Word، ثم نعرضها لك للمراجعة قبل إضافتها إلى الملف.</p>
        </div>
      </div>

      {!preview && (
        <div
          className={`cv-import-dropzone${dragging ? " is-dragging" : ""}${busy ? " is-busy" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <span className="cv-import-upload-icon">{busy ? <LoaderCircle className="cv-import-spinner" size={19} /> : <Upload size={19} />}</span>
          <div className="cv-import-drop-copy">
            <b>{busy ? status || "جاري قراءة الملف..." : "اسحب ملف السيرة إلى هنا أو اختره من جهازك"}</b>
            <small>PDF أو DOCX · الحد الأعلى 10 ميغابايت</small>
          </div>
          <label className="cv-import-select">
            اختر ملفًا
            <input
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={busy}
              onChange={handleFileInput}
              aria-label="اختر ملف سيرة ذاتية بصيغة PDF أو DOCX"
            />
          </label>
        </div>
      )}

      {busy && status && <p className="cv-import-progress" role="status" aria-live="polite">{status}</p>}
      {error && <p className="cv-import-error" role="alert">{error}</p>}

      {preview && (
        <div className="cv-import-preview">
          <div className="cv-import-preview-head">
            <div>
              <b><Check size={16} /> جاهزة للمراجعة</b>
              <small>{sourceLabel(preview)}</small>
            </div>
            <button type="button" className="cv-import-reset" onClick={() => setPreview(null)} aria-label="إلغاء معاينة السيرة">
              <X size={16} />
            </button>
          </div>

          {previewRows.length > 0 && (
            <dl className="cv-import-fields">
              {previewRows.map(([label, value]) => (
                <div className="cv-import-field" key={label}>
                  <dt>{label}</dt>
                  <dd dir="auto">{value}</dd>
                </div>
              ))}
            </dl>
          )}

          <div className="cv-import-counts" aria-label="البيانات المستخرجة">
            {preview.profile.skills?.length ? <span>{preview.profile.skills.length} مهارة</span> : null}
            {preview.experiences.length ? <span>{preview.experiences.length} خبرة</span> : null}
            {preview.education.length ? <span>{preview.education.length} مؤهل</span> : null}
            {preview.languages.length ? <span>{preview.languages.length} لغة</span> : null}
            <span>{importedCount} حقلًا أو عنصرًا جاهزًا</span>
          </div>

          {preview.profile.skills?.length ? (
            <div className="cv-import-data-section">
              <b>المهارات المكتشفة</b>
              <div className="cv-import-skill-list">
                {preview.profile.skills.map((skill) => <span key={skill} dir="auto">{skill}</span>)}
              </div>
            </div>
          ) : null}

          {preview.experiences.length ? (
            <div className="cv-import-data-section">
              <b>الخبرات المكتشفة</b>
              <div className="cv-import-record-list">
                {preview.experiences.map((experience) => (
                  <article className="cv-import-record" key={experience.id}>
                    <strong dir="auto">{[experience.title, experience.company].filter(Boolean).join(" · ") || "خبرة مهنية"}</strong>
                    {periodLabel(experience) && <small dir="auto">{periodLabel(experience)}</small>}
                    {experience.description && <p dir="auto">{experience.description}</p>}
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {preview.education.length ? (
            <div className="cv-import-data-section">
              <b>المؤهلات المكتشفة</b>
              <div className="cv-import-record-list">
                {preview.education.map((entry) => (
                  <article className="cv-import-record" key={entry.id}>
                    <strong dir="auto">{entry.degree || entry.specialization || "مؤهل تعليمي"}</strong>
                    <small dir="auto">{[entry.specialization, entry.institution, entry.graduationYear].filter(Boolean).join(" · ")}</small>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {preview.languages.length ? (
            <div className="cv-import-data-section">
              <b>اللغات المكتشفة</b>
              <div className="cv-import-skill-list">
                {preview.languages.map((language, index) => <span key={`${language.name}-${index}`} dir="auto">{[language.name, language.level].filter(Boolean).join(" · ")}</span>)}
              </div>
            </div>
          ) : null}

          {preview.warnings.map((warning) => <p className="cv-import-warning" key={warning}>{warning}</p>)}
          {preview.source === "ocr" && <p className="cv-import-warning">قد يخطئ OCR في قراءة بعض الكلمات أو الأرقام؛ راجع الحقول بعد إضافتها.</p>}

          <div className="cv-import-actions">
            <button type="button" className="cv-import-apply" onClick={() => { onImport(preview); setPreview(null); }}>
              <Check size={16} /> تطبيق البيانات على ملفي
            </button>
            <button type="button" className="cv-import-select cv-import-select-secondary" onClick={() => setPreview(null)}>
              اختيار ملف آخر
            </button>
          </div>
          <p className="cv-import-review-note">سنملأ الحقول الفارغة ونضيف العناصر غير المكررة، ولن نستبدل معلوماتك الموجودة.</p>
        </div>
      )}

      <p className="cv-import-privacy">
        <ShieldCheck size={15} />
        الملف نفسه لا يُرفع ولا يُخزّن. تتم القراءة داخل المتصفح؛ وعند OCR تُحمّل ملفات المحرك واللغة، ولا يُرسل محتوى السيرة.
      </p>
    </section>
  );
}
