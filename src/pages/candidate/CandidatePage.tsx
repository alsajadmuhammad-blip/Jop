import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, Check, CheckCircle2, Download, FileText, GraduationCap, Languages, MapPin, Plus, Printer, Save, ShieldCheck, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { AppSelect } from "../../components/common/AppSelect";
import type { View } from "../../app/types";
import type { CandidateProfile, CandidateProfileInput, Profile } from "../../lib/types";
import { hasSupabaseConfig } from "../../lib/supabase";
import { experienceStoragePrefix, formatCandidateLanguages, languageLevels, loadCandidateProfile, parseCandidateExperiences, parseCandidateLanguages, saveCandidateProfile, type CandidateExperience, type CandidateLanguage, type LanguageLevel } from "../../services/candidateService";
import { downloadAtsResume, printAtsResume } from "../../features/candidate/atsResume";

type CandidatePageProps = {
  profile: Profile;
  onNavigate: (view: View) => void;
  onProfileUpdated?: () => void;
  onNotify?: (message: string) => void;
};

type ExperienceEntry = CandidateExperience;

function serializeExperiences(experiences: ExperienceEntry[]) {
  return experiences.length ? `${experienceStoragePrefix}${JSON.stringify(experiences)}` : "";
}

function toInput(profile: CandidateProfile | null, account: Profile): CandidateProfileInput {
  return {
    full_name: profile?.full_name || account.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    headline: profile?.headline || "",
    specialization: profile?.specialization || "",
    province: profile?.province || "",
    city: profile?.city || "",
    experience_years: profile?.experience_years || 0,
    skills: profile?.skills || [],
    experience_details: profile?.experience_details || "",
    education: profile?.education || "",
    languages: profile?.languages || [],
    work_type: profile?.work_type || "",
    remote_available: profile?.remote_available || false,
    expected_salary_min: profile?.expected_salary_min ?? null,
    availability: profile?.availability || "",
    summary: profile?.summary || "",
  };
}

export function CandidatePage({ profile, onNavigate, onProfileUpdated, onNotify }: CandidatePageProps) {
  const initialForm = toInput(null, profile);
  const [form, setForm] = useState<CandidateProfileInput>(initialForm);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
  const [languages, setLanguages] = useState<CandidateLanguage[]>(() => parseCandidateLanguages(initialForm.languages));
  const [skillDraft, setSkillDraft] = useState("");
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }
    void loadCandidateProfile(profile.id).then((result) => {
      if (result.profile) {
        const nextForm = toInput(result.profile, profile);
        setForm(nextForm);
        setLanguages(parseCandidateLanguages(nextForm.languages));
        setExperiences(parseCandidateExperiences(nextForm.experience_details));
      }
      if (result.error) setError("تعذر تحميل ملفك المهني.");
      setLoading(false);
    });
  }, [profile]);

  const update = <K extends keyof CandidateProfileInput>(key: K, value: CandidateProfileInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const addSkill = () => {
    const nextSkill = skillDraft.trim();
    if (!nextSkill || form.skills.some((skill) => skill.toLocaleLowerCase() === nextSkill.toLocaleLowerCase())) return;
    update("skills", [...form.skills, nextSkill]);
    setSkillDraft("");
  };

  const removeSkill = (skillToRemove: string) => {
    update("skills", form.skills.filter((skill) => skill !== skillToRemove));
  };

  const addExperience = () => {
    setExperiences((current) => [...current, {
      id: `experience-${Date.now()}`,
      title: "",
      company: "",
      location: "",
      period: "",
      description: "",
    }]);
  };

  const updateExperience = <K extends keyof ExperienceEntry>(id: string, key: K, value: ExperienceEntry[K]) => {
    setExperiences((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  };

  const removeExperience = (id: string) => {
    setExperiences((current) => current.filter((item) => item.id !== id));
  };

  const addLanguage = () => {
    setLanguages((current) => [...current, { name: "", level: "" }]);
  };

  const updateLanguage = <K extends keyof CandidateLanguage>(index: number, key: K, value: CandidateLanguage[K]) => {
    setLanguages((current) => current.map((language, languageIndex) => languageIndex === index ? { ...language, [key]: value } : language));
  };

  const removeLanguage = (index: number) => {
    setLanguages((current) => current.filter((_, languageIndex) => languageIndex !== index));
  };

  const completeness = useMemo(() => {
    const checks = [
      form.full_name,
      form.headline,
      form.specialization,
      form.province,
      form.city,
      form.skills.length,
      experiences.length,
      form.education,
      form.summary,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [experiences.length, form]);
  const canExportAts = Boolean(form.full_name.trim() && form.headline.trim() && form.email.trim() && form.phone.trim() && form.summary.trim());

  const atsData = () => ({
    ...form,
    languages,
    experiences,
  });

  const exportAts = () => {
    if (!canExportAts) {
      onNotify?.("أكمل الاسم والمسمى والبريد والهاتف والنبذة أولاً حتى نخرج سيرة قوية.");
      return;
    }
    downloadAtsResume(atsData());
    onNotify?.("تم تنزيل ملف Word لـ ATS ويمكنك تعديله.");
  };

  const printAts = () => {
    if (!canExportAts) {
      onNotify?.("أكمل البيانات الأساسية أولاً حتى نجهز نسخة PDF مرتبة.");
      return;
    }
    if (!printAtsResume(atsData())) onNotify?.("اسمح بفتح نافذة جديدة حتى تتمكن من حفظ ATS كـ PDF.");
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.full_name.trim() || !form.headline.trim() || !form.specialization.trim()) {
      setError("أكمل الاسم والمسمى الوظيفي والتخصص أولاً.");
      return;
    }
    setSaving(true);
    setError("");
    const formToSave = { ...form, languages: formatCandidateLanguages(languages), experience_details: serializeExperiences(experiences) };
    if (!hasSupabaseConfig) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setSaving(false);
      onNotify?.("تم حفظ ملفك في وضع المعاينة.");
      return;
    }
    const result = await saveCandidateProfile(profile.id, formToSave);
    setSaving(false);
    if (result.error) {
      setError(result.error.message || "تعذر حفظ الملف.");
      return;
    }
    onNotify?.("تم حفظ ملفك المهني");
    onProfileUpdated?.();
  };

  if (loading) {
    return <section className="container page-section centered-state"><span className="live-dot" /><p>جاري تحميل ملفك المهني...</p></section>;
  }

  return <section className="container page-section dashboard-page candidate-profile-page">
    <div className="candidate-profile-hero">
      <div className="candidate-hero-copy">
        <span className="eyebrow"><Sparkles size={14} /> مساحة الباحث عن عمل</span>
        <h1>خلّي ملفك يحكي عنك</h1>
        <p>ملف مهني مرتب يخلّي أصحاب العمل يشوفون قيمتك بسرعة، ويزيد فرص وصول الفرصة المناسبة لك.</p>
         <div className="candidate-hero-meta"><span><UserRound size={14} /> {form.full_name || "اسمك الكامل"}</span><span><MapPin size={14} /> {form.city || "أضف مدينتك"}</span></div>
         <div className="candidate-hero-actions"><button type="button" className="candidate-hero-primary" onClick={() => onNavigate("jobs")}><BriefcaseBusiness size={15} /> استكشف الوظائف</button><button type="button" className="candidate-hero-secondary" onClick={() => onNavigate("applied")}><CheckCircle2 size={15} /> تقديماتي</button></div>
      </div>
      <div className="candidate-hero-score">
        <div className="candidate-avatar-large">{(form.full_name || "م").slice(0, 1)}</div>
        <div className="score-ring" style={{ "--score": `${completeness * 3.6}deg` } as React.CSSProperties}><strong>{completeness}%</strong><span>اكتمال الملف</span></div>
      </div>
    </div>
    <div className="candidate-profile-grid">
      <form className="candidate-profile-form candidate-profile-editor" onSubmit={submit}>
        <section className="profile-editor-section">
          <div className="profile-section-heading"><span className="profile-section-icon"><FileText size={18} /></span><div><span className="eyebrow">الخطوة الأولى</span><h2>معلوماتك المهنية</h2><p>البيانات التي تظهر أولاً عندما يجدك صاحب عمل.</p></div></div>
          <div className="form-grid"><label>الاسم الكامل<input required value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="مثال: أحمد محمد" /></label><label>المسمى الوظيفي<input required value={form.headline} onChange={(event) => update("headline", event.target.value)} placeholder="مثال: مطور واجهات أمامية" /></label></div>
          <div className="form-grid"><label>التخصص<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} placeholder="مثال: برمجيات، محاسبة، تسويق" /></label><label>المحافظة<input required value={form.province} onChange={(event) => update("province", event.target.value)} placeholder="بغداد" /></label></div>
          <div className="form-grid"><label>المدينة<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="بغداد" /></label><label>البريد الإلكتروني<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} dir="ltr" /></label></div>
          <div className="form-grid"><label>رقم الهاتف<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} dir="ltr" /></label></div>
          <label>نبذة مهنية<textarea required rows={4} value={form.summary} onChange={(event) => update("summary", event.target.value)} placeholder="اكتب 2–3 أسطر عن خبرتك، أسلوبك، والقيمة التي تقدمها..." /></label>
        </section>

        <section className="profile-editor-section">
          <div className="profile-section-heading"><span className="profile-section-icon orange"><Sparkles size={18} /></span><div><span className="eyebrow">نقاط قوتك</span><h2>المهارات</h2><p>أضف كل مهارة لوحدها حتى تظهر بشكل مرتب في نتائج البحث.</p></div></div>
          <div className="skill-entry-row"><input value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} placeholder="اكتب مهارة مثل React أو إدارة المشاريع" /><button type="button" className="add-skill-btn" onClick={addSkill}><Plus size={17} /> إضافة</button></div>
          <div className="editable-skill-list">{form.skills.map((skill) => <span className="editable-skill" key={skill}>{skill}<button type="button" onClick={() => removeSkill(skill)} aria-label={`حذف ${skill}`}><X size={13} /></button></span>)}{form.skills.length === 0 && <span className="profile-empty-hint">لم تضف مهارات بعد. ابدأ بأهم 3 مهارات عندك.</span>}</div>
          <div className="form-grid single-label-row"><label>سنوات الخبرة<input type="number" min="0" max="60" value={form.experience_years} onChange={(event) => update("experience_years", Number(event.target.value) || 0)} /></label><label className="checkbox-field"><input type="checkbox" checked={form.remote_available} onChange={(event) => update("remote_available", event.target.checked)} /><span>أقبل العمل عن بُعد</span></label></div>
        </section>

        <section className="profile-editor-section">
          <div className="profile-section-heading experience-heading"><span className="profile-section-icon blue"><BriefcaseBusiness size={18} /></span><div><span className="eyebrow">مسارك المهني</span><h2>الخبرات العملية</h2><p>أضف كل تجربة بشكل مستقل مع إنجازاتك الأساسية.</p></div><button type="button" className="outline-btn add-experience-btn" onClick={addExperience}><Plus size={16} /> إضافة خبرة</button></div>
          <div className="experience-editor-list">{experiences.map((experience, index) => <article className="experience-editor-card" key={experience.id}><div className="experience-card-top"><span className="experience-number">{String(index + 1).padStart(2, "0")}</span><div><b>{experience.title || "خبرة جديدة"}</b><small>{experience.company || "أضف جهة العمل والمدة"}</small></div><button type="button" className="remove-experience-btn" onClick={() => removeExperience(experience.id)} aria-label="حذف الخبرة"><Trash2 size={16} /></button></div><div className="form-grid"><label>المسمى الوظيفي<input value={experience.title} onChange={(event) => updateExperience(experience.id, "title", event.target.value)} placeholder="مثال: مسؤول تسويق" /></label><label>جهة العمل<input value={experience.company} onChange={(event) => updateExperience(experience.id, "company", event.target.value)} placeholder="اسم الشركة أو المشروع" /></label></div><div className="form-grid"><label>المدة<input value={experience.period} onChange={(event) => updateExperience(experience.id, "period", event.target.value)} placeholder="مثال: 2022 – 2024" /></label><label>الموقع<input value={experience.location} onChange={(event) => updateExperience(experience.id, "location", event.target.value)} placeholder="بغداد / عن بُعد" /></label></div><label>أبرز المسؤوليات والإنجازات<textarea rows={3} value={experience.description} onChange={(event) => updateExperience(experience.id, "description", event.target.value)} placeholder="اذكر ما أنجزته، وليس فقط ما كانت مهمتك..." /></label></article>)}{experiences.length === 0 && <button type="button" className="empty-experience-card" onClick={addExperience}><span><Plus size={21} /></span><b>أضف أول خبرة مهنية</b><small>رتّب مسارك الوظيفي حتى يقرأه صاحب العمل بسهولة.</small></button>}</div>
        </section>

        <section className="profile-editor-section">
          <div className="profile-section-heading"><span className="profile-section-icon violet"><GraduationCap size={18} /></span><div><span className="eyebrow">تفاصيل إضافية</span><h2>التعليم والجاهزية</h2><p>معلومات تساعد على اختيار الفرصة الأنسب لك.</p></div></div>
           <div className="form-grid"><label>المؤهل والتعليم<input required value={form.education} onChange={(event) => update("education", event.target.value)} placeholder="بكالوريوس هندسة حاسبات" /></label><div className="language-editor-field"><div className="language-editor-heading"><span><b>اللغات</b><small>أضف كل لغة ومستواها بشكل مستقل.</small></span><button type="button" className="outline-btn language-add-btn" onClick={addLanguage}><Plus size={14} /> إضافة لغة</button></div><div className="language-entry-list">{languages.map((language, index) => <div className="language-entry" key={`language-${index}`}><input value={language.name} onChange={(event) => updateLanguage(index, "name", event.target.value)} placeholder="مثال: العربية أو English" aria-label={`اسم اللغة ${index + 1}`} /><AppSelect value={language.level} onChange={(value) => updateLanguage(index, "level", value as LanguageLevel)} placeholder="اختر المستوى" options={languageLevels.map((level) => ({ value: level, label: level }))} ariaLabel={`مستوى اللغة ${index + 1}`} /><button type="button" className="language-remove-btn" onClick={() => removeLanguage(index)} aria-label="حذف اللغة"><X size={15} /></button></div>)}{languages.length === 0 && <p className="language-empty-hint"><Languages size={14} /> لم تضف لغة بعد. أضف اللغة الأم أو أي لغة تستخدمها في العمل.</p>}</div></div></div>
           <div className="form-grid"><label>نوع العمل المطلوب<AppSelect value={form.work_type} onChange={(value) => update("work_type", value)} placeholder="اختر نوع العمل" options={["دوام كامل", "دوام جزئي", "عن بُعد", "تدريب", "عمل حر"].map((value) => ({ value, label: value }))} ariaLabel="نوع العمل المطلوب" /></label><label>التوفر للعمل<AppSelect value={form.availability} onChange={(value) => update("availability", value)} placeholder="اختر حالة التوفر" options={["متاح فورًا", "خلال أسبوعين", "خلال شهر", "غير محدد"].map((value) => ({ value, label: value }))} ariaLabel="التوفر للعمل" /></label></div>
          <div className="form-grid"><label>أقل راتب متوقع <span className="optional">اختياري</span><input type="number" min="0" value={form.expected_salary_min ?? ""} onChange={(event) => update("expected_salary_min", event.target.value ? Number(event.target.value) : null)} /></label><div className="profile-language-hint"><Languages size={17} /><span>كلما كانت تفاصيلك أوضح، يظهر ملفك في نتائج أكثر دقة.</span></div></div>
        </section>

        {error && <p className="form-error">{error}</p>}
        <div className="profile-form-actions"><button className="primary-btn save-profile-btn" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ الملف المهني"} <Save size={17} /></button><button type="button" className="text-btn" onClick={() => onNavigate("jobs")}><ArrowLeft size={16} /> تصفح الوظائف</button></div>
      </form>

      <aside className="candidate-profile-aside">
        <div className="profile-aside-card ats-export-card">
          <div className="aside-card-heading"><div><span className="eyebrow">English application version</span><h3>ATS Resume</h3></div><FileText size={20} /></div>
          <p>نسخة إنكليزية رسمية بخط خطي واضح وترتيب مناسب لأنظمة التوظيف الآلية.</p>
          <div className="ats-export-actions">
            <button type="button" className="primary-btn" onClick={exportAts}><Download size={16} /> تنزيل Word ATS</button>
            <button type="button" className="outline-btn" onClick={printAts}><Printer size={15} /> حفظ ATS كـ PDF</button>
          </div>
          {!canExportAts && <small className="ats-export-hint">أكمل بيانات الاتصال والنبذة المهنية لتفعيل التصدير.</small>}
        </div>
        <div className="profile-aside-card privacy-card"><div className="aside-card-icon"><ShieldCheck size={19} /></div><div><b>ملفك يظهر لأصحاب العمل المصرّح لهم</b><p>يظهر ملفك فقط لأصحاب العمل الذين لديهم صلاحية الوصول إلى ملفات الباحثين عن العمل، والتي يفعّلها المشرف.</p></div><span className="privacy-status"><Check size={13} /> وصول مقيّد</span></div>
        <div className="profile-aside-card checklist-card"><div className="aside-card-heading"><div><span className="eyebrow">قائمة الإنجاز</span><h3>قرّب ملفك من 100%</h3></div><CheckCircle2 size={20} /></div><ul><li className={form.full_name ? "done" : ""}><span>{form.full_name ? <Check size={13} /> : "1"}</span>الاسم الكامل</li><li className={form.headline ? "done" : ""}><span>{form.headline ? <Check size={13} /> : "2"}</span>المسمى الوظيفي</li><li className={form.skills.length ? "done" : ""}><span>{form.skills.length ? <Check size={13} /> : "3"}</span>أضف مهاراتك</li><li className={experiences.length ? "done" : ""}><span>{experiences.length ? <Check size={13} /> : "4"}</span>أضف خبرة واحدة على الأقل</li><li className={form.summary ? "done" : ""}><span>{form.summary ? <Check size={13} /> : "5"}</span>نبذة مهنية قصيرة</li></ul></div>
        <div className="profile-aside-card tip-card"><div className="aside-card-heading"><div><span className="eyebrow">نصيحة سريعة</span><h3>اكتب إنجازك بالأرقام</h3></div><Sparkles size={20} /></div><p>بدل «أدرت حسابات التواصل»، جرّب «رفعت التفاعل 35% خلال 6 أشهر». التفاصيل الصغيرة تفرق.</p></div>
        <div className="profile-aside-card mini-contact-card"><div className="mini-contact-icon"><FileText size={17} /></div><div><b>تحتاج تحديث سيرتك؟</b><small>أكمل الملف هنا، وبعدها استخدمه للتقديم على الفرص.</small></div></div>
      </aside>
    </div>
  </section>;
}