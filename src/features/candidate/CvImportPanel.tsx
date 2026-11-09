import { useState, type ChangeEvent, type DragEvent } from "react";
import { AlertTriangle, Check, FileText, LoaderCircle, Plus, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { languageLevels, type CandidateEducation, type CandidateExperience, type CandidateLanguage } from "../../services/candidateService";
import { analyzeCandidateCv, isCvAiConfigured, type CandidateCvAiResult } from "../../services/cvAiService";
import { readCandidateCv, type CandidateCvImport } from "./cvImport";
import "./cv-import.css";

type CvImportPanelProps = {
  onImport: (result: CandidateCvImport, replaceExisting: boolean) => void;
};

type TextProfileField =
  | "full_name"
  | "email"
  | "phone"
  | "headline"
  | "specialization"
  | "province"
  | "city"
  | "summary";

const profileFields: Array<{ key: TextProfileField; label: string; type?: string }> = [
  { key: "full_name", label: "الاسم الكامل" },
  { key: "headline", label: "المسمى الوظيفي" },
  { key: "specialization", label: "التخصص" },
  { key: "email", label: "البريد الإلكتروني", type: "email" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "province", label: "المحافظة" },
  { key: "city", label: "المدينة" },
];

function sourceLabel(result: CandidateCvImport) {
  if (result.source === "docx") return "تمت قراءة ملف Word داخل المتصفح";
  if (result.source === "ocr") return `تمت قراءة ${result.ocrPages} صفحة مصوّرة بتقنية OCR`;
  return "تم استخراج النص من PDF داخل المتصفح";
}

function createId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
}

function newExperience(): CandidateExperience {
  return {
    id: createId("review-experience"),
    title: "",
    company: "",
    location: "",
    startMonth: "",
    endMonth: "",
    isCurrent: false,
    legacyPeriod: "",
    description: "",
  };
}

function newEducation(): CandidateEducation {
  return {
    id: createId("review-education"),
    degree: "",
    specialization: "",
    institution: "",
    graduationYear: "",
  };
}

function normalizeMergeKey(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function mergeEntries<T extends object>(existing: T[], incoming: T[], keyFor: (entry: T) => string) {
  const merged = [...existing];
  for (const entry of incoming) {
    const key = keyFor(entry);
    const index = key ? merged.findIndex((current) => keyFor(current) === key) : -1;
    if (index < 0) {
      merged.push(entry);
      continue;
    }

    const current = merged[index] as Record<string, unknown>;
    const addition = entry as Record<string, unknown>;
    const next = { ...current };
    for (const [field, value] of Object.entries(addition)) {
      if (field === "id") continue;
      if (typeof value === "string" && value.trim()) next[field] = value;
      else if (value === true) next[field] = true;
    }
    merged[index] = next as T;
  }
  return merged;
}

function mergeAiResult(current: CandidateCvImport, ai: CandidateCvAiResult): CandidateCvImport {
  const localProfile = current.profile;
  return {
    ...current,
    profile: {
      ...localProfile,
      headline: localProfile.headline || ai.profile.headline || "",
      specialization: localProfile.specialization || ai.profile.specialization || "",
      experience_years: localProfile.experience_years || ai.profile.experience_years || 0,
      skills: [...new Set([...(localProfile.skills || []), ...(ai.profile.skills || [])]
        .map((skill) => skill.trim()).filter(Boolean))].slice(0, 35),
      summary: localProfile.summary || ai.profile.summary || "",
    },
    experiences: mergeEntries(
      current.experiences,
      ai.experiences,
      (entry) => normalizeMergeKey([
        entry.title,
        entry.company,
        entry.legacyPeriod || `${entry.startMonth}-${entry.endMonth}`,
      ].join("|")),
    ),
    education: mergeEntries(
      current.education,
      ai.education,
      (entry) => normalizeMergeKey([entry.degree, entry.institution, entry.graduationYear].join("|")),
    ),
    languages: mergeEntries(
      current.languages,
      ai.languages,
      (entry) => normalizeMergeKey(entry.name),
    ),
  };
}

export function CvImportPanel({ onImport }: CvImportPanelProps) {
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<CandidateCvImport | null>(null);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiNotice, setAiNotice] = useState("");
  const [aiApplied, setAiApplied] = useState(false);
  const [aiQuotaExhausted, setAiQuotaExhausted] = useState(false);

  const updatePreview = (update: (current: CandidateCvImport) => CandidateCvImport) => {
    setPreview((current) => current ? update(current) : current);
    setReviewConfirmed(false);
  };

  const processFile = async (file: File) => {
    setError("");
    setPreview(null);
    setReviewConfirmed(false);
    setReplaceExisting(false);
    setAiConsent(false);
    setAiError("");
    setAiNotice("");
    setAiApplied(false);
    setAiQuotaExhausted(false);
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

  const enhanceWithAi = async () => {
    if (!preview?.aiText || !aiConsent || aiBusy || aiQuotaExhausted) return;
    setAiBusy(true);
    setAiError("");
    setAiNotice("");
    try {
      const result = await analyzeCandidateCv(preview.aiText);
      setPreview((current) => current ? {
        ...mergeAiResult(current, result),
        aiText: undefined,
        aiTextTruncated: false,
      } : current);
      setReviewConfirmed(false);
      setAiApplied(true);
      setAiNotice("وصلت النتائج الإضافية. راجعها وعدّلها قبل اعتمادها.");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "تعذر التحليل السحابي. يمكنك متابعة الاستخراج المحلي.";
      setAiError(message);
      if (message.includes("انتهت حصة")) setAiQuotaExhausted(true);
    } finally {
      setAiBusy(false);
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

  const profileTextValue = (key: TextProfileField) => preview?.profile[key] || "";
  const validExperiences = preview?.experiences.filter((experience) =>
    [experience.title, experience.company, experience.location, experience.startMonth, experience.endMonth, experience.legacyPeriod, experience.description]
      .some((value) => value.trim()) || experience.isCurrent,
  ) || [];
  const validEducation = preview?.education.filter((entry) =>
    [entry.degree, entry.specialization, entry.institution, entry.graduationYear].some((value) => value.trim()),
  ) || [];
  const validLanguages = preview?.languages.filter((entry) => entry.name.trim()) || [];
  const profileCount = preview
    ? Object.values(preview.profile).filter((value) => Array.isArray(value) ? value.length > 0 : value !== "" && value !== null && value !== undefined).length
    : 0;
  const importedCount = preview
    ? profileCount + validExperiences.length + validEducation.length + validLanguages.length
    : 0;

  const updateExperience = (index: number, key: keyof CandidateExperience, value: string | boolean) => {
    updatePreview((current) => ({
      ...current,
      experiences: current.experiences.map((experience, itemIndex) => {
        if (itemIndex !== index) return experience;
        const next = { ...experience, [key]: value } as CandidateExperience;
        if (key === "legacyPeriod") {
          next.startMonth = "";
          next.endMonth = "";
          next.isCurrent = false;
        } else if (key === "startMonth" || key === "endMonth") {
          next.legacyPeriod = "";
          if (key === "endMonth" && value) next.isCurrent = false;
        } else if (key === "isCurrent" && value) {
          next.endMonth = "";
          next.legacyPeriod = "";
        }
        return next;
      }),
    }));
  };

  const updateEducation = (index: number, key: keyof CandidateEducation, value: string) => {
    updatePreview((current) => ({
      ...current,
      education: current.education.map((entry, itemIndex) =>
        itemIndex === index ? { ...entry, [key]: value } : entry,
      ),
    }));
  };

  const updateLanguage = (index: number, key: keyof CandidateLanguage, value: string) => {
    updatePreview((current) => ({
      ...current,
      languages: current.languages.map((entry, itemIndex) =>
        itemIndex === index ? { ...entry, [key]: value } as CandidateLanguage : entry,
      ),
    }));
  };

  return (
    <section className="cv-import-panel" aria-labelledby="cv-import-heading">
      <div className="cv-import-heading">
        <span className="cv-import-icon"><FileText size={19} /></span>
        <div>
          <span className="cv-import-eyebrow">قراءة داخل المتصفح</span>
          <h2 id="cv-import-heading">استخرج بيانات سيرتك وراجعها</h2>
          <p>ارفع ملف PDF أو Word. لن تُعتمد أي معلومة قبل مراجعتك وتأكيدك.</p>
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
              <b><Check size={16} /> البيانات جاهزة للمراجعة والتعديل</b>
              <small>{sourceLabel(preview)}</small>
            </div>
            <button
              type="button"
              className="cv-import-reset"
              onClick={() => { setPreview(null); setReviewConfirmed(false); }}
              aria-label="إلغاء معاينة السيرة"
            >
              <X size={16} />
            </button>
          </div>

          <div className="cv-import-warning cv-import-warning-strong" role="alert">
            <AlertTriangle size={18} />
            <span><b>الاستخراج آلي وقد يخطئ.</b> تأكد من الاسم، والتواريخ، والخبرات، والمؤهلات، واللغات قبل اعتماد البيانات.</span>
          </div>

          {isCvAiConfigured() && preview.aiText && (
            <div className="cv-import-ai-panel">
              <div>
                <b>تحسين اختياري عبر Supabase وCloudflare AI</b>
                <p>يُرسل النص المهني بعد حذف الاسم المعروف والبريد والهاتف والروابط إلى دالة Supabase، ومنها إلى نموذج Cloudflare، بعد موافقتك. ملف PDF أو Word لا يغادر جهازك، ولا نحفظ النص المرسل أو نسجله.</p>
                {preview.aiTextTruncated && <small>اختصرنا النص إلى أول 12,000 حرف لتقليل استهلاك الحصة اليومية.</small>}
              </div>
              <label className="cv-import-ai-consent">
                <input
                  type="checkbox"
                  checked={aiConsent}
                  disabled={aiBusy || aiQuotaExhausted}
                  onChange={(event) => setAiConsent(event.target.checked)}
                />
                <span>أوافق على إرسال هذا النص فقط إلى Cloudflare لمعالجته في هذا الطلب.</span>
              </label>
              <button
                type="button"
                className="cv-import-ai-button"
                disabled={!aiConsent || aiBusy || aiQuotaExhausted}
                onClick={() => void enhanceWithAi()}
              >
                {aiBusy ? <><LoaderCircle className="cv-import-spinner" size={16} /> جارٍ التحليل...</> : <><ShieldCheck size={16} /> تحسين الاستخراج بالذكاء الاصطناعي</>}
              </button>
              {aiError && <p className="cv-import-ai-error" role="alert">{aiError}</p>}
              {aiNotice && <p className="cv-import-ai-success" role="status">{aiNotice}</p>}
            </div>
          )}
          {isCvAiConfigured() && !preview.aiText && !aiApplied && (
            <p className="cv-import-ai-note" role="note">لم نعثر على أقسام مهنية مناسبة للإرسال السحابي؛ يمكنك متابعة النتائج المحلية وتعديلها يدويًا.</p>
          )}
          {aiApplied && <p className="cv-import-ai-success" role="status">{aiNotice}</p>}
          {!isCvAiConfigured() && (
            <p className="cv-import-ai-note" role="note">التحليل السحابي غير مربوط بعد؛ الاستخراج المحلي يعمل، ولا يُرسل أي نص إلى الخارج.</p>
          )}

          <div className="cv-import-counts" aria-label="عدد البيانات المستخرجة">
            {preview.profile.skills?.length ? <span>{preview.profile.skills.length} مهارة</span> : null}
            {validExperiences.length ? <span>{validExperiences.length} خبرة</span> : null}
            {validEducation.length ? <span>{validEducation.length} مؤهل</span> : null}
            {validLanguages.length ? <span>{validLanguages.length} لغة معروفة</span> : null}
            <span>{importedCount} حقلًا أو عنصرًا</span>
          </div>

          {preview.warnings.map((warning, index) => (
            <p className="cv-import-warning" role="note" key={`${index}-${warning}`}>{warning}</p>
          ))}
          {preview.source === "ocr" && (
            <p className="cv-import-warning" role="note">الملف مصوّر؛ قد يخطئ OCR في قراءة الكلمات أو الأرقام. راجع كل معلومة يدويًا.</p>
          )}

          <div className="cv-import-edit-section">
            <div className="cv-import-edit-heading">
              <b>المعلومات الأساسية</b>
              <small>عدّل أي حقل لا يطابق سيرتك.</small>
            </div>
            <div className="cv-import-edit-grid">
              {profileFields.map((field) => (
                <label key={field.key}>
                  {field.label}
                  <input
                    type={field.type || "text"}
                    value={profileTextValue(field.key)}
                    dir={field.key === "email" || field.key === "phone" ? "ltr" : "auto"}
                    onChange={(event) => updatePreview((current) => ({
                      ...current,
                      profile: { ...current.profile, [field.key]: event.target.value },
                    }))}
                  />
                </label>
              ))}
              <label>
                سنوات الخبرة
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={preview.profile.experience_years ?? ""}
                  onChange={(event) => updatePreview((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      experience_years: event.target.value ? Number(event.target.value) : undefined,
                    },
                  }))}
                />
              </label>
              <label className="cv-import-edit-wide">
                النبذة المهنية
                <textarea
                  rows={4}
                  value={preview.profile.summary || ""}
                  onChange={(event) => updatePreview((current) => ({
                    ...current,
                    profile: { ...current.profile, summary: event.target.value },
                  }))}
                />
              </label>
              <label className="cv-import-edit-wide">
                المهارات، كل مهارة بسطر
                <textarea
                  rows={3}
                  value={(preview.profile.skills || []).join("\n")}
                  onChange={(event) => updatePreview((current) => ({
                    ...current,
                    profile: {
                      ...current.profile,
                      skills: event.target.value.split(/\n|،|,/).map((skill) => skill.trim()).filter(Boolean).slice(0, 35),
                    },
                  }))}
                />
              </label>
            </div>
          </div>

          <div className="cv-import-edit-section">
            <div className="cv-import-edit-heading">
              <b>الخبرات العملية ({preview.experiences.length})</b>
              <button type="button" className="cv-import-add" onClick={() => updatePreview((current) => ({
                ...current,
                experiences: [...current.experiences, newExperience()],
              }))}><Plus size={15} /> إضافة خبرة</button>
            </div>
            {preview.experiences.length === 0 && <p className="cv-import-empty">لم تُستخرج خبرات موثوقة. أضفها يدويًا أو اترك القسم فارغًا.</p>}
            <div className="cv-import-edit-records">
              {preview.experiences.map((experience, index) => (
                <article className="cv-import-edit-record" key={experience.id}>
                  <div className="cv-import-edit-record-heading">
                    <b>الخبرة {index + 1}</b>
                    <button type="button" className="cv-import-remove" onClick={() => updatePreview((current) => ({
                      ...current,
                      experiences: current.experiences.filter((_, itemIndex) => itemIndex !== index),
                    }))} aria-label={`حذف الخبرة ${index + 1}`}><Trash2 size={15} /></button>
                  </div>
                  <div className="cv-import-edit-grid">
                    <label>المسمى الوظيفي<input value={experience.title} onChange={(event) => updateExperience(index, "title", event.target.value)} /></label>
                    <label>جهة العمل<input value={experience.company} onChange={(event) => updateExperience(index, "company", event.target.value)} /></label>
                    <label>الموقع<input value={experience.location} onChange={(event) => updateExperience(index, "location", event.target.value)} /></label>
                    {experience.legacyPeriod ? (
                      <label>الفترة كما وردت في السيرة<input value={experience.legacyPeriod} onChange={(event) => updateExperience(index, "legacyPeriod", event.target.value)} /></label>
                    ) : (
                      <>
                        <label>من شهر / سنة<input type="month" value={experience.startMonth} onChange={(event) => updateExperience(index, "startMonth", event.target.value)} /></label>
                        <label>إلى شهر / سنة<input type="month" value={experience.endMonth} disabled={experience.isCurrent} onChange={(event) => updateExperience(index, "endMonth", event.target.value)} /></label>
                        <label className="cv-import-current-checkbox"><input type="checkbox" checked={experience.isCurrent} onChange={(event) => updateExperience(index, "isCurrent", event.target.checked)} /> ما زلت أعمل هنا</label>
                      </>
                    )}
                    <label className="cv-import-edit-wide">المسؤوليات والإنجازات<textarea rows={3} value={experience.description} onChange={(event) => updateExperience(index, "description", event.target.value)} /></label>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="cv-import-edit-section">
            <div className="cv-import-edit-heading">
              <b>التعليم والمؤهلات ({preview.education.length})</b>
              <button type="button" className="cv-import-add" onClick={() => updatePreview((current) => ({
                ...current,
                education: [...current.education, newEducation()],
              }))}><Plus size={15} /> إضافة مؤهل</button>
            </div>
            {preview.education.length === 0 && <p className="cv-import-empty">لم يُستخرج مؤهل موثوق. أضفه يدويًا أو اترك القسم فارغًا.</p>}
            <div className="cv-import-edit-records">
              {preview.education.map((entry, index) => (
                <article className="cv-import-edit-record" key={entry.id}>
                  <div className="cv-import-edit-record-heading">
                    <b>المؤهل {index + 1}</b>
                    <button type="button" className="cv-import-remove" onClick={() => updatePreview((current) => ({
                      ...current,
                      education: current.education.filter((_, itemIndex) => itemIndex !== index),
                    }))} aria-label={`حذف المؤهل ${index + 1}`}><Trash2 size={15} /></button>
                  </div>
                  <div className="cv-import-edit-grid">
                    <label>الشهادة<input value={entry.degree} onChange={(event) => updateEducation(index, "degree", event.target.value)} /></label>
                    <label>التخصص<input value={entry.specialization} onChange={(event) => updateEducation(index, "specialization", event.target.value)} /></label>
                    <label>الجامعة أو المعهد<input value={entry.institution} onChange={(event) => updateEducation(index, "institution", event.target.value)} /></label>
                    <label>سنة التخرج<input value={entry.graduationYear} onChange={(event) => updateEducation(index, "graduationYear", event.target.value)} /></label>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="cv-import-edit-section">
            <div className="cv-import-edit-heading">
              <b>اللغات ({preview.languages.length})</b>
              <button type="button" className="cv-import-add" onClick={() => updatePreview((current) => ({
                ...current,
                languages: [...current.languages, { name: "", level: "" }],
              }))}><Plus size={15} /> إضافة لغة</button>
            </div>
            {preview.languages.length === 0 && <p className="cv-import-empty">لم تُستخرج لغات موثوقة. لن نضيف أسماء عشوائية؛ أضف الصحيح يدويًا.</p>}
            <div className="cv-import-language-list">
              {preview.languages.map((language, index) => (
                <div className="cv-import-language-row" key={`language-${index}`}>
                  <label>اسم اللغة<input value={language.name} onChange={(event) => updateLanguage(index, "name", event.target.value)} /></label>
                  <label>المستوى
                    <select value={language.level} onChange={(event) => updateLanguage(index, "level", event.target.value)}>
                      <option value="">غير محدد</option>
                      {languageLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                    </select>
                  </label>
                  <button type="button" className="cv-import-remove" onClick={() => updatePreview((current) => ({
                    ...current,
                    languages: current.languages.filter((_, itemIndex) => itemIndex !== index),
                  }))} aria-label={`حذف اللغة ${index + 1}`}><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          </div>

          <label className="cv-import-confirm">
            <input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} />
            <span>راجعت البيانات وعدّلت ما يلزم، وأؤكد صحة المعلومات التي سأعتمدها.</span>
          </label>

          <label className={`cv-import-replace-option${replaceExisting ? " is-enabled" : ""}`}>
            <input
              type="checkbox"
              checked={replaceExisting}
              onChange={(event) => {
                setReplaceExisting(event.target.checked);
                setReviewConfirmed(false);
              }}
            />
            <span>
              <b>استبدال البيانات الحالية التي لها نتيجة مراجَعة</b>
              <small>عند التفعيل، تُستبدل القيم المستخرجة والقوائم التي تحتوي بيانات في هذه المعاينة فقط. الأقسام التي لم تُستخرج تبقى كما هي.</small>
            </span>
          </label>

          {replaceExisting && (
            <p className="cv-import-warning" role="alert">
              ستحلّ النتائج التي راجعتها محل البيانات الموجودة في الحقول والقوائم المطابقة. تأكد من صحة كل عنصر قبل المتابعة.
            </p>
          )}

          <div className="cv-import-actions">
            <button
              type="button"
              className="cv-import-apply"
              disabled={!reviewConfirmed || !importedCount}
              onClick={() => {
                const reviewedData = { ...preview };
                delete reviewedData.aiText;
                delete reviewedData.aiTextTruncated;
                onImport({
                  ...reviewedData,
                  profile: {
                    ...reviewedData.profile,
                    skills: reviewedData.profile.skills?.map((skill) => skill.trim()).filter(Boolean),
                  },
                  experiences: validExperiences,
                  education: validEducation,
                  languages: validLanguages,
                }, replaceExisting);
                setPreview(null);
                setReviewConfirmed(false);
                setReplaceExisting(false);
              }}
            >
              <Check size={16} /> {replaceExisting ? "استبدال البيانات بعد مراجعتها" : "إضافة البيانات إلى ملفي"}
            </button>
            <button type="button" className="cv-import-select cv-import-select-secondary" onClick={() => { setPreview(null); setReviewConfirmed(false); }}>
              اختيار ملف آخر
            </button>
          </div>
          <p className="cv-import-review-note">
            {replaceExisting
              ? "لن تتغير بيانات الأقسام التي لم تظهر لها نتائج في المعاينة."
              : "نملأ الحقول الفارغة ونضيف العناصر غير المكررة دون استبدال معلوماتك الحالية."}
          </p>
        </div>
      )}

      <p className="cv-import-privacy">
        <ShieldCheck size={15} />
        الملف نفسه لا يُرفع ولا يُخزّن. تتم القراءة داخل المتصفح؛ وفي حالة OCR يُحمّل محرك القراءة وقواميس اللغة، ولا يُرسل محتوى السيرة.
      </p>
    </section>
  );
}
