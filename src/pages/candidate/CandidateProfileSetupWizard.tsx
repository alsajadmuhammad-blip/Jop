import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Check, FileText, GraduationCap, Languages, MapPin, Plus, Sparkles, Trash2 } from "lucide-react";
import { AppSelect } from "../../components/common/AppSelect";
import type { CandidateProfileInput } from "../../lib/types";
import type { CandidateEducation, CandidateLanguage, CandidateExperience } from "../../services/candidateService";

type SetupStep = 0 | 1 | 2 | 3;

type ReadinessItem = {
  label: string;
  complete: boolean;
};

type CandidateProfileSetupWizardProps = {
  step: SetupStep;
  form: CandidateProfileInput;
  education: CandidateEducation[];
  languages: CandidateLanguage[];
  experiences: CandidateExperience[];
  skillDraft: string;
  resumeReadiness: number;
  readinessItems: ReadinessItem[];
  autosaveNotice: ReactNode;
  onUpdate: <K extends keyof CandidateProfileInput>(key: K, value: CandidateProfileInput[K]) => void;
  onSkillDraftChange: (value: string) => void;
  onAddSkill: () => void;
  onRemoveSkill: (skill: string) => void;
  onUpdateExperienceYears: (value: string) => void;
  onAddExperience: () => void;
  onAddEducation: () => void;
  onUpdateEducation: (id: string, key: keyof CandidateEducation, value: string) => void;
  onRemoveEducation: (id: string) => void;
  onAddLanguage: () => void;
  onUpdateLanguage: (index: number, key: keyof CandidateLanguage, value: CandidateLanguage[keyof CandidateLanguage]) => void;
  onRemoveLanguage: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  onLater: () => void;
  onImportResume: () => void;
};

const steps = [
  { title: "معلوماتك الأساسية", icon: FileText },
  { title: "مهاراتك وخبرتك", icon: Sparkles },
  { title: "التعليم واللغات", icon: GraduationCap },
  { title: "العمل المناسب إلك", icon: BriefcaseBusiness },
] as const;

export function CandidateProfileSetupWizard({
  step,
  form,
  education,
  languages,
  experiences,
  skillDraft,
  resumeReadiness,
  readinessItems,
  autosaveNotice,
  onUpdate,
  onSkillDraftChange,
  onAddSkill,
  onRemoveSkill,
  onUpdateExperienceYears,
  onAddExperience,
  onAddEducation,
  onUpdateEducation,
  onRemoveEducation,
  onAddLanguage,
  onUpdateLanguage,
  onRemoveLanguage,
  onBack,
  onNext,
  onLater,
  onImportResume,
}: CandidateProfileSetupWizardProps) {
  const StepIcon = steps[step].icon;
  const completedEducation = education.filter((entry) =>
    [entry.degree, entry.specialization, entry.institution, entry.graduationYear].some((value) => value.trim()),
  ).length;
  const completedLanguages = languages.filter((language) => language.name.trim()).length;

  return (
    <section className="container page-section dashboard-page candidate-profile-page candidate-setup-page" dir="rtl">
      <div className="candidate-setup-card">
        <header className="candidate-setup-heading">
          <span className="candidate-setup-kicker">ملفك المهني</span>
          <h1>خلّينا نجهّز ملفك للتقديم</h1>
          <p>أدخل المعلومات اللي تعرفها هسه، وتكدر تكمل الباقي لاحقًا.</p>
          <button type="button" className="candidate-setup-import-link" onClick={onImportResume}>
            <FileText size={15} /> عندك سيرة جاهزة؟ ارفعها
          </button>
        </header>

        <section className="candidate-setup-readiness" aria-label="جاهزية تصدير السيرة">
          <div className="candidate-setup-readiness-heading">
            <span>جاهزية تصدير السيرة</span>
            <strong>{resumeReadiness}%</strong>
          </div>
          <div
            className="candidate-setup-readiness-track"
            role="progressbar"
            aria-label="جاهزية تصدير السيرة"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={resumeReadiness}
          >
            <span style={{ width: `${resumeReadiness}%` }} />
          </div>
          <small>
            {resumeReadiness === 100
              ? "سيرتك جاهزة للتصدير، والتفاصيل الإضافية اختيارية."
              : "تزيد النسبة عند إضافة المعلومات الأساسية المطلوبة للتصدير، مو عند ملء كل الأقسام."}
          </small>
        </section>

        <div className="candidate-setup-step-heading">
          <span className="candidate-setup-step-icon"><StepIcon size={19} /></span>
          <div>
            <span>الخطوة {step + 1} من {steps.length}</span>
            <h2>{steps[step].title}</h2>
          </div>
        </div>

        <div className="candidate-setup-step-dots" aria-hidden="true">
          {steps.map((item, index) => (
            <span className={index <= step ? "active" : ""} key={item.title} />
          ))}
        </div>

        {autosaveNotice}

        <div className="candidate-setup-fields">
          {step === 0 && (
            <>
              <p className="candidate-setup-step-intro">هذي المعلومات الأساسية اللي يحتاجها صاحب العمل حتى يتعرف عليك ويتواصل وياك.</p>
              <div className="candidate-setup-field-grid">
                <label>الاسم الكامل<input value={form.full_name} onChange={(event) => onUpdate("full_name", event.target.value)} placeholder="مثال: أحمد محمد" /></label>
                <label>المسمى الوظيفي<input value={form.headline} onChange={(event) => onUpdate("headline", event.target.value)} placeholder="مثال: مصمم جرافيك" /></label>
                <label>البريد الإلكتروني<input type="email" dir="ltr" value={form.email} onChange={(event) => onUpdate("email", event.target.value)} placeholder="name@example.com" /></label>
                <label>رقم الهاتف<input dir="ltr" value={form.phone} onChange={(event) => onUpdate("phone", event.target.value)} placeholder="+964 7XX XXX XXXX" /></label>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <p className="candidate-setup-step-intro">أضف المهارات اللي تستخدمها، ونبذة قصيرة عنك. تگدر تضيف وظيفة أو تدريب أو مشروع إذا تحب.</p>
              <label className="candidate-setup-full-field">نبذة قصيرة عنك
                <textarea
                  rows={4}
                  value={form.summary}
                  onChange={(event) => onUpdate("summary", event.target.value)}
                  placeholder="مثال: أعمل في التسويق الرقمي وأهتم بإدارة الحملات وكتابة المحتوى."
                />
              </label>
              <div className="candidate-setup-skill-entry">
                <label htmlFor="candidate-setup-skill">مهارة جديدة</label>
                <div>
                  <input
                    id="candidate-setup-skill"
                    value={skillDraft}
                    onChange={(event) => onSkillDraftChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        onAddSkill();
                      }
                    }}
                    placeholder="مثال: التصميم أو خدمة العملاء"
                  />
                  <button type="button" onClick={onAddSkill}><Plus size={15} /> إضافة</button>
                </div>
              </div>
              <div className="candidate-setup-skill-list" aria-label="المهارات المضافة">
                {form.skills.map((skill) => (
                  <span key={skill}>{skill}<button type="button" onClick={() => onRemoveSkill(skill)} aria-label={`حذف ${skill}`}><Trash2 size={13} /></button></span>
                ))}
                {form.skills.length === 0 && <small>ما أضفت مهارات بعد.</small>}
              </div>
              <div className="candidate-setup-field-grid candidate-setup-secondary-fields">
                <label>سنوات الخبرة<input type="number" min={0} max={60} step={1} value={form.experience_years} onChange={(event) => onUpdateExperienceYears(event.target.value)} /></label>
                <label className="candidate-setup-checkbox"><input type="checkbox" checked={form.remote_available} onChange={(event) => onUpdate("remote_available", event.target.checked)} /><span>أقبل العمل عن بُعد</span></label>
              </div>
              <div className="candidate-setup-experience-row">
                <span><BriefcaseBusiness size={16} /> {experiences.length ? `${experiences.length} خبرة مضافة` : "إضافة تفاصيل الخبرة اختيارية"}</span>
                <button type="button" onClick={onAddExperience}><Plus size={14} /> إضافة خبرة</button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="candidate-setup-step-intro">أضف الشهادات واللغات إذا متوفرة. تگدر تتجاوز أي قسم مو مناسب إلك.</p>
              <section className="candidate-setup-subsection">
                <div className="candidate-setup-subsection-heading">
                  <span><GraduationCap size={17} /> التعليم</span>
                  <button type="button" onClick={onAddEducation}><Plus size={14} /> إضافة شهادة</button>
                </div>
                {education.length === 0 && <p className="candidate-setup-empty">ما أضفت شهادات بعد.</p>}
                {education.map((entry, index) => (
                  <article className="candidate-setup-entry" key={entry.id}>
                    <div className="candidate-setup-entry-heading">
                      <b>{entry.degree || `شهادة ${index + 1}`}</b>
                      <button type="button" onClick={() => onRemoveEducation(entry.id)} aria-label={`حذف الشهادة ${index + 1}`}><Trash2 size={14} /></button>
                    </div>
                    <div className="candidate-setup-field-grid">
                      <label>الشهادة<input value={entry.degree} onChange={(event) => onUpdateEducation(entry.id, "degree", event.target.value)} placeholder="مثال: بكالوريوس" /></label>
                      <label>التخصص<input value={entry.specialization} onChange={(event) => onUpdateEducation(entry.id, "specialization", event.target.value)} placeholder="مثال: إدارة أعمال" /></label>
                      <label>الجامعة أو المعهد<input value={entry.institution} onChange={(event) => onUpdateEducation(entry.id, "institution", event.target.value)} /></label>
                      <label>سنة التخرج<input type="number" min={1950} max={new Date().getFullYear() + 10} value={entry.graduationYear} onChange={(event) => onUpdateEducation(entry.id, "graduationYear", event.target.value)} placeholder="2024" /></label>
                    </div>
                  </article>
                ))}
                {completedEducation > 0 && <small className="candidate-setup-count">{completedEducation} مؤهل</small>}
              </section>

              <section className="candidate-setup-subsection">
                <div className="candidate-setup-subsection-heading">
                  <span><Languages size={17} /> اللغات</span>
                  <button type="button" onClick={onAddLanguage}><Plus size={14} /> إضافة لغة</button>
                </div>
                {languages.length === 0 && <p className="candidate-setup-empty">أضف اللغة ومستواها إذا تحب.</p>}
                <div className="candidate-setup-language-list">
                  {languages.map((language, index) => (
                    <div className="candidate-setup-language-row" key={`setup-language-${index}`}>
                      <input value={language.name} onChange={(event) => onUpdateLanguage(index, "name", event.target.value)} placeholder="مثال: العربية" aria-label={`اسم اللغة ${index + 1}`} />
                      <AppSelect
                        value={language.level}
                        onChange={(value) => onUpdateLanguage(index, "level", value as CandidateLanguage["level"])}
                        placeholder="اختر المستوى"
                        options={["اللغة الأم", "متقدم", "جيد جدًا", "متوسط", "مبتدئ"].map((level) => ({ value: level, label: level }))}
                        ariaLabel={`مستوى اللغة ${index + 1}`}
                      />
                      <button type="button" onClick={() => onRemoveLanguage(index)} aria-label={`حذف اللغة ${index + 1}`}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                {completedLanguages > 0 && <small className="candidate-setup-count">{completedLanguages} لغة</small>}
              </section>
            </>
          )}

          {step === 3 && (
            <>
              <p className="candidate-setup-step-intro">حدد نوع الفرصة ومكان العمل المناسبين إلك. تگدر تعدلها بأي وقت.</p>
              <div className="candidate-setup-field-grid">
                <label>التخصص<input value={form.specialization} onChange={(event) => onUpdate("specialization", event.target.value)} placeholder="مثال: محاسبة أو برمجة" /></label>
                <label>المحافظة<input value={form.province} onChange={(event) => onUpdate("province", event.target.value)} placeholder="مثال: بغداد" /></label>
                <label>المدينة<input value={form.city} onChange={(event) => onUpdate("city", event.target.value)} placeholder="مثال: الكرادة" /></label>
                <label>نوع العمل
                  <AppSelect
                    value={form.work_type}
                    onChange={(value) => onUpdate("work_type", value)}
                    placeholder="اختر نوع العمل"
                    options={["دوام كامل", "دوام جزئي", "عن بُعد", "تدريب", "عمل حر"].map((value) => ({ value, label: value }))}
                    ariaLabel="نوع العمل"
                  />
                </label>
                <label>موعد التوفر
                  <AppSelect
                    value={form.availability}
                    onChange={(value) => onUpdate("availability", value)}
                    placeholder="اختر موعد التوفر"
                    options={["متاح فورًا", "خلال أسبوعين", "خلال شهر", "غير محدد"].map((value) => ({ value, label: value }))}
                    ariaLabel="موعد التوفر"
                  />
                </label>
              </div>
              <div className="candidate-setup-location-note"><MapPin size={15} /> تفضيلات العمل ما تأثر على إمكانية تصدير السيرة.</div>
            </>
          )}
        </div>

        <footer className="candidate-setup-actions">
          {step > 0
            ? <button type="button" className="candidate-setup-back" onClick={onBack}><ArrowRight size={15} /> رجوع</button>
            : <span className="candidate-setup-autosave-note"><Check size={14} /> التغييرات تُحفظ تلقائيًا</span>}
          <div>
            <button type="button" className="candidate-setup-later" onClick={onLater}>لاحقًا</button>
            <button type="button" className="candidate-setup-next" onClick={onNext}>
              {step === 3 ? "إنهاء والعودة للملف" : "التالي"} <ArrowLeft size={15} />
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
