import { useState, type ChangeEvent, type DragEvent } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, LoaderCircle, Plus, ShieldCheck, Trash2, Upload } from "lucide-react";
import { languageLevels, type CandidateEducation, type CandidateExperience, type CandidateLanguage } from "../../services/candidateService";
import { analyzeCandidateCv, isCvAiConfigured } from "../../services/cvAiService";
import { readCandidateCv, type CandidateCvImport } from "./cvImport";
import { mergeCandidateCvAiResult } from "./cvAiMerge";
import "./cv-import.css";

type CvImportPanelProps = {
  onImport: (result: CandidateCvImport, replaceExisting: boolean) => void;
};

type TextProfileField = "full_name" | "email" | "phone" | "headline" | "specialization" | "province" | "city";

const profileFields: Array<{ key: TextProfileField; label: string; type?: string }> = [
  { key: "full_name", label: "الاسم الكامل" },
  { key: "headline", label: "المسمى الوظيفي" },
  { key: "specialization", label: "التخصص" },
  { key: "email", label: "البريد الإلكتروني", type: "email" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "province", label: "المحافظة" },
  { key: "city", label: "المدينة" },
];

const steps = [
  "رفع السيرة",
  "تحليل اختياري",
  "المعلومات الأساسية",
  "الخبرات",
  "التعليم والمهارات",
  "التأكيد",
];

function sourceLabel(result: CandidateCvImport) {
  if (result.source === "docx") return "قراءة ملف Word داخل المتصفح";
  if (result.source === "ocr") return `قراءة ${result.ocrPages} صفحة مصوّرة`;
  return "استخراج نص PDF داخل المتصفح";
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
  return { id: createId("review-education"), degree: "", specialization: "", institution: "", graduationYear: "" };
}

export function CvImportPanel({ onImport }: CvImportPanelProps) {
  const [step, setStep] = useState(1);
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
  const [aiCompleted, setAiCompleted] = useState(false);
  const [aiQuotaExhausted, setAiQuotaExhausted] = useState(false);

  const updatePreview = (update: (current: CandidateCvImport) => CandidateCvImport) => {
    setPreview((current) => current ? update(current) : current);
    setReviewConfirmed(false);
  };

  const resetFlow = () => {
    setStep(1);
    setPreview(null);
    setError("");
    setStatus("");
    setReviewConfirmed(false);
    setReplaceExisting(false);
    setAiConsent(false);
    setAiError("");
    setAiNotice("");
    setAiCompleted(false);
    setAiQuotaExhausted(false);
  };

  const processFile = async (file: File) => {
    setError("");
    setPreview(null);
    setStep(1);
    setReviewConfirmed(false);
    setReplaceExisting(false);
    setAiConsent(false);
    setAiError("");
    setAiNotice("");
    setAiCompleted(false);
    setAiQuotaExhausted(false);
    setBusy(true);
    setStatus("جارٍ قراءة الملف محليًا...");
    try {
      const result = await readCandidateCv(file, setStatus);
      setPreview(result);
      setStatus("");
      setStep(2);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذرت قراءة الملف. اختر ملف PDF أو DOCX.");
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
      setPreview((current) => current ? mergeCandidateCvAiResult(current, result) : current);
      setAiNotice("اكتمل التحليل. ستراجع كل النتائج في الخطوات التالية.");
      setAiCompleted(true);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "تعذر التحليل. يمكنك المتابعة بالاستخراج المحلي.";
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
  const importedCount = profileCount + validExperiences.length + validEducation.length + validLanguages.length;

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
      education: current.education.map((entry, itemIndex) => itemIndex === index ? { ...entry, [key]: value } : entry),
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

  const goNext = () => {
    if (!preview) return;
    if (step === 2 && !preview.aiText) {
      setStep(3);
      return;
    }
    setStep((current) => Math.min(6, current + 1));
  };

  const applyImport = () => {
    if (!preview || !reviewConfirmed || !importedCount) return;
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
    resetFlow();
  };

  return (
    <section className="cv-import-panel" aria-labelledby="cv-import-heading" dir="rtl">
      <header className="cv-import-heading">
        <span className="cv-import-icon"><FileText size={19} /></span>
        <div>
          <span className="cv-import-eyebrow">استيراد على مراحل</span>
          <h2 id="cv-import-heading">{preview ? steps[step - 1] : "ابدأ بملف سيرتك الذاتية"}</h2>
          <p>{preview ? "يمكنك الرجوع لأي خطوة وتعديل البيانات قبل اعتمادها." : "ارفع ملف PDF أو Word. تتم القراءة على جهازك."}</p>
        </div>
      </header>

      {preview && (
        <nav className="cv-import-stepper" aria-label="خطوات استيراد السيرة">
          {steps.map((label, index) => {
            const number = index + 1;
            return (
              <button
                key={label}
                type="button"
                className={`cv-import-step${step === number ? " is-active" : ""}${step > number ? " is-complete" : ""}`}
                onClick={() => number < step && setStep(number)}
                disabled={number >= step}
                aria-current={step === number ? "step" : undefined}
                aria-label={`الخطوة ${number}: ${label}`}
              >
                <span>{step > number ? <Check size={13} /> : number}</span>
                <small>{label}</small>
              </button>
            );
          })}
        </nav>
      )}

      {!preview && (
        <>
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
              <b>{busy ? status || "جارٍ قراءة الملف..." : "اسحب ملف السيرة إلى هنا أو اختره من جهازك"}</b>
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
          <p className="cv-import-local-note"><ShieldCheck size={15} /> يبقى الملف على جهازك. لا يُضاف شيء إلى ملفك الآن.</p>
        </>
      )}

      {busy && status && <p className="cv-import-progress" role="status" aria-live="polite">{status}</p>}
      {error && <p className="cv-import-error" role="alert">{error}</p>}

      {preview && (
        <div className="cv-import-preview">
          {step === 1 && (
            <div className="cv-import-step-content">
              <div className="cv-import-file-card">
                <span className="cv-import-upload-icon"><Check size={18} /></span>
                <div><b>تم استخراج النص محليًا</b><small>{sourceLabel(preview)}</small></div>
              </div>
              {preview.warnings.length > 0 && (
                <p className="cv-import-step-hint" role="note">{preview.warnings[0]}</p>
              )}
              <p className="cv-import-step-hint">النتائج مسودة قابلة للتعديل. لن تتغير بيانات ملفك حتى تأكيد الخطوة الأخيرة.</p>
            </div>
          )}

          {step === 2 && (
            <div className="cv-import-step-content">
              <div className="cv-import-ai-panel">
                <div className="cv-import-ai-heading">
                  <span className="cv-import-ai-mark"><ShieldCheck size={18} /></span>
                  <div>
                    <b>تحليل إضافي اختياري</b>
                    <p>
                      {isCvAiConfigured()
                        ? "بعد موافقتك، نرسل نصًا مهنيًا منقحًا فقط لمساعدتك في تنظيم النتائج. لا يغادر الملف الأصلي جهازك."
                        : "التحليل غير متاح حاليًا. يمكنك المتابعة بالنتائج المستخرجة محليًا."}
                    </p>
                  </div>
                </div>
                {preview.aiText && isCvAiConfigured() && (
                  <>
                    {preview.aiTextTruncated && <small className="cv-import-ai-limit">اقتصر النص المُرسل على أول 12,000 حرف.</small>}
                    <label className="cv-import-ai-consent">
                      <input
                        type="checkbox"
                        checked={aiConsent}
                        disabled={aiBusy || aiQuotaExhausted}
                        onChange={(event) => setAiConsent(event.target.checked)}
                      />
                      <span>أوافق صراحةً على إرسال النص المهني المنقح للتحليل مرة واحدة.</span>
                    </label>
                    <button
                      type="button"
                      className="cv-import-ai-button"
                      disabled={!aiConsent || aiBusy || aiQuotaExhausted}
                      onClick={() => void enhanceWithAi()}
                    >
                      {aiBusy ? <><LoaderCircle className="cv-import-spinner" size={16} /> جارٍ التحليل</> : "موافقة وتحليل"}
                    </button>
                    {aiError && <p className="cv-import-ai-error" role="alert">{aiError}</p>}
                    {aiNotice && <p className="cv-import-ai-success" role="status">{aiNotice}</p>}
                  </>
                )}
                {preview.aiText && !isCvAiConfigured() && (
                  <p className="cv-import-step-hint">يمكنك المتابعة مباشرة، دون إرسال أي نص.</p>
                )}
                {aiCompleted && <p className="cv-import-ai-success" role="status">{aiNotice}</p>}
                {!preview.aiText && !aiCompleted && (
                  <p className="cv-import-step-hint">لم يُعثر على نص مهني مناسب للتحليل الإضافي. تابع لمراجعة الاستخراج المحلي.</p>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="cv-import-edit-section">
              <div className="cv-import-edit-heading">
                <b>المعلومات الأساسية</b><small>عدّل الحقول التي تحتاج إلى تصحيح.</small>
              </div>
              <div className="cv-import-edit-grid">
                {profileFields.map((field) => (
                  <label key={field.key}>
                    {field.label}
                    <input
                      type={field.type || "text"}
                      value={preview.profile[field.key] || ""}
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
                      profile: { ...current.profile, experience_years: event.target.value ? Number(event.target.value) : undefined },
                    }))}
                  />
                </label>
                <label className="cv-import-edit-wide">النبذة المهنية
                  <textarea rows={5} value={preview.profile.summary || ""} onChange={(event) => updatePreview((current) => ({
                    ...current,
                    profile: { ...current.profile, summary: event.target.value },
                  }))} />
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="cv-import-edit-section">
              <div className="cv-import-edit-heading">
                <b>الخبرات العملية <span className="cv-import-count">{preview.experiences.length}</span></b>
                <button type="button" className="cv-import-add" onClick={() => updatePreview((current) => ({
                  ...current, experiences: [...current.experiences, newExperience()],
                }))}><Plus size={15} /> إضافة خبرة</button>
              </div>
              {preview.experiences.length === 0 && <p className="cv-import-empty">لم تُستخرج خبرة. يمكنك إضافتها أو المتابعة دونها.</p>}
              <div className="cv-import-edit-records">
                {preview.experiences.map((experience, index) => (
                  <article className="cv-import-edit-record" key={experience.id}>
                    <div className="cv-import-edit-record-heading">
                      <b>الخبرة {index + 1}</b>
                      <button type="button" className="cv-import-remove" onClick={() => updatePreview((current) => ({
                        ...current, experiences: current.experiences.filter((_, itemIndex) => itemIndex !== index),
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
          )}

          {step === 5 && (
            <div className="cv-import-review-groups">
              <div className="cv-import-edit-section">
                <div className="cv-import-edit-heading">
                  <b>التعليم والمؤهلات <span className="cv-import-count">{preview.education.length}</span></b>
                  <button type="button" className="cv-import-add" onClick={() => updatePreview((current) => ({
                    ...current, education: [...current.education, newEducation()],
                  }))}><Plus size={15} /> إضافة مؤهل</button>
                </div>
                {preview.education.length === 0 && <p className="cv-import-empty">لا توجد مؤهلات مستخرجة. أضف مؤهلًا أو اترك القائمة فارغة.</p>}
                <div className="cv-import-edit-records">
                  {preview.education.map((entry, index) => (
                    <article className="cv-import-edit-record" key={entry.id}>
                      <div className="cv-import-edit-record-heading">
                        <b>المؤهل {index + 1}</b>
                        <button type="button" className="cv-import-remove" onClick={() => updatePreview((current) => ({
                          ...current, education: current.education.filter((_, itemIndex) => itemIndex !== index),
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
                  <b>اللغات <span className="cv-import-count">{preview.languages.length}</span></b>
                  <button type="button" className="cv-import-add" onClick={() => updatePreview((current) => ({
                    ...current, languages: [...current.languages, { name: "", level: "" }],
                  }))}><Plus size={15} /> إضافة لغة</button>
                </div>
                {preview.languages.length === 0 && <p className="cv-import-empty">لا توجد لغات مستخرجة. يمكنك إدخال لغاتك.</p>}
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
                        ...current, languages: current.languages.filter((_, itemIndex) => itemIndex !== index),
                      }))} aria-label={`حذف اللغة ${index + 1}`}><Trash2 size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cv-import-edit-section">
                <div className="cv-import-edit-heading">
                  <b>المهارات <span className="cv-import-count">{preview.profile.skills?.length || 0}</span></b>
                </div>
                <label className="cv-import-skill-field">اكتب كل مهارة في سطر
                  <textarea rows={4} value={(preview.profile.skills || []).join("\n")} onChange={(event) => updatePreview((current) => ({
                    ...current,
                    profile: { ...current.profile, skills: event.target.value.split(/\n|،|,/).map((skill) => skill.trim()).filter(Boolean).slice(0, 35) },
                  }))} />
                </label>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="cv-import-step-content">
              <div className="cv-import-final-summary">
                <b>ملخص ما ستضيفه</b>
                <div className="cv-import-counts" aria-label="عدد البيانات التي ستضاف">
                  <span>{profileCount} حقلًا أساسيًا</span>
                  <span>{validExperiences.length} خبرة</span>
                  <span>{validEducation.length} مؤهل</span>
                  <span>{validLanguages.length} لغة</span>
                  <span>{preview.profile.skills?.length || 0} مهارة</span>
                </div>
              </div>
              <label className={`cv-import-replace-option${replaceExisting ? " is-enabled" : ""}`}>
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(event) => { setReplaceExisting(event.target.checked); setReviewConfirmed(false); }}
                />
                <span>
                  <b>استبدال المعلومات الحالية بنتائج هذه المراجعة</b>
                  <small>اختياري. عند عدم التفعيل، تبقى معلوماتك الحالية وتُملأ الحقول الفارغة فقط.</small>
                </span>
              </label>
              <label className="cv-import-confirm">
                <input type="checkbox" checked={reviewConfirmed} onChange={(event) => setReviewConfirmed(event.target.checked)} />
                <span>راجعت البيانات وأوافق على إضافتها إلى ملفي.</span>
              </label>
              <p className="cv-import-final-note"><ShieldCheck size={15} /> لن تُضاف البيانات إلا بعد الضغط على زر التأكيد.</p>
            </div>
          )}

          <footer className="cv-import-navigation">
            {step > 1 ? (
              <button type="button" className="cv-import-back-step" onClick={() => setStep((current) => Math.max(1, current - 1))}>
                <ArrowRight size={16} /> السابق
              </button>
            ) : (
              <button type="button" className="cv-import-back-step" onClick={resetFlow}>اختيار ملف آخر</button>
            )}
            {step < 6 ? (
              <button type="button" className="cv-import-next" onClick={goNext} disabled={aiBusy}>
                {step === 5 ? "مراجعة الملخص" : "متابعة"} <ArrowLeft size={16} />
              </button>
            ) : (
              <button type="button" className="cv-import-next cv-import-apply" disabled={!reviewConfirmed || !importedCount} onClick={applyImport}>
                <Check size={16} /> {replaceExisting ? "تأكيد الاستبدال" : "تأكيد وإضافة إلى ملفي"}
              </button>
            )}
          </footer>
        </div>
      )}
    </section>
  );
}
