import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { AppSelect } from "../../components/common/AppSelect";
import { PageIntro } from "../../components/common/PageIntro";
import { categories, jobTypes } from "../../lib/constants";
import type { View } from "../../app/types";
import type { JobAdType, JobType, Profile } from "../../lib/types";
import { submitJobRequest } from "../../services/adminService";

type JobRequestPageProps = {
  profile?: Profile | null;
  onNavigate: (view: View) => void;
  onSubmitted: () => void;
};

type WizardStep = { number: number; title: string; caption: string };

const detailedSteps: WizardStep[] = [
  { number: 1, title: "الأساسيات", caption: "بيانات الوظيفة" },
  { number: 2, title: "التواصل", caption: "طريقة الوصول إليك" },
  { number: 3, title: "التفاصيل", caption: "الوصف والمتطلبات" },
  { number: 4, title: "المراجعة", caption: "تأكد وأرسل" },
];

const quickSteps: WizardStep[] = [
  { number: 1, title: "الأساسيات", caption: "العنوان والجهة" },
  { number: 2, title: "تفاصيل الوظيفة", caption: "المعلومات المهمة" },
  { number: 3, title: "التواصل والإرسال", caption: "تأكد وأرسل" },
];

export function JobRequestPage({ profile, onNavigate, onSubmitted }: JobRequestPageProps) {
  const [form, setForm] = useState({
    ad_type: "detailed" as JobAdType,
    title: "",
    company_name: profile?.organization || "",
    contact_name: profile?.full_name || "",
    contact_email: "",
    contact_whatsapp: "",
    category: "",
    city: "بغداد",
    job_type: "دوام كامل" as JobType,
    description: "",
    requirements: "",
    salary_range: "",
    deadline: "",
    internal_applications: profile?.role === "hr",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const steps = useMemo(() => form.ad_type === "quick" ? quickSteps : detailedSteps, [form.ad_type]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const chooseAdType = (adType: JobAdType) => {
    setForm((current) => ({
      ...current,
      ad_type: adType,
      ...(adType === "quick"
        ? { category: "عام", city: "العراق", job_type: "دوام كامل" as JobType }
        : { category: current.category === "عام" ? "" : current.category, city: "بغداد" }),
    }));
    setCurrentStep(1);
    setError("");
  };

  const validateStep = (step: number) => {
    if (step === 1 && (!form.title.trim() || !form.company_name.trim() || (form.ad_type === "detailed" && (!form.city.trim() || !form.category.trim())))) {
      return form.ad_type === "quick"
        ? "أكمل العنوان الوظيفي واسم الجهة أولاً."
        : "أكمل المسمى الوظيفي واسم الشركة والتصنيف والمدينة أولاً.";
    }
    if ((form.ad_type === "detailed" && step === 2) || (form.ad_type === "quick" && step === 3)) {
      if (!form.contact_email.trim() && !form.contact_whatsapp.trim() && !(form.ad_type === "detailed" && profile?.role === "hr")) return "أضف البريد الإلكتروني أو رقم الواتساب على الأقل.";
    }
    if ((form.ad_type === "detailed" && step === 3) || (form.ad_type === "quick" && step === 2)) {
      if (!form.description.trim()) return "اكتب تفاصيل واضحة عن الوظيفة قبل المتابعة.";
    }
    return "";
  };

  const goNext = () => {
    const validationError = validateStep(currentStep);
    if (validationError) return setError(validationError);
    setError("");
    setCurrentStep((step) => Math.min(step + 1, steps.length));
  };

  const goBack = () => {
    setError("");
    setCurrentStep((step) => Math.max(step - 1, 1));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const requiredSteps = form.ad_type === "quick" ? [1, 2, 3] : [1, 2, 3];
    const validationError = requiredSteps.map(validateStep).find(Boolean);
    if (validationError) {
      setError(validationError);
      setCurrentStep(requiredSteps.find((step) => validateStep(step)) || steps.length);
      return;
    }

    setSaving(true);
    setError("");
    const submitError = await submitJobRequest({
      ...form,
      contact_name: form.contact_name.trim() || form.company_name.trim(),
      contact_email: form.contact_email.trim() || null,
      contact_whatsapp: form.contact_whatsapp.trim() || null,
      salary_range: form.ad_type === "quick" ? null : form.salary_range.trim() || null,
      deadline: form.ad_type === "quick" ? null : form.deadline || null,
      created_by: null,
      requirements: form.ad_type === "quick"
        ? []
        : form.requirements.split("\n").map((item) => item.trim()).filter(Boolean),
    });
    setSaving(false);
    if (submitError) {
      setError(submitError.message || "تعذر إرسال طلب النشر.");
      return;
    }
    setSent(true);
    onSubmitted();
  };

  if (sent) {
    return <section className="container page-section centered-state"><CheckCircle2 size={52} /><h1>تم استلام طلبك</h1><p>سيراجع فريق IRAQ JOBS البيانات، وعند الموافقة ستظهر الوظيفة للباحثين عن عمل.</p><button className="primary-btn" onClick={() => onNavigate("home")}><ArrowRight size={17} /> العودة للرئيسية</button></section>;
  }

  const isQuick = form.ad_type === "quick";

  return <section className="container page-section public-request-page">
    <button className="back-link" onClick={() => onNavigate("home")}><ArrowRight size={16} /> العودة للرئيسية</button>
    <PageIntro eyebrow="نشر وظيفة" title="اختر طريقة نشر إعلانك" description="انشر إعلاناً مفصلاً بالمعلومات الكاملة، أو اختر الإعلان السريع حتى تظهر الفرصة بخطوات أقل." />
    <div className="post-type-selector" aria-label="نوع الإعلان">
      <button type="button" className={isQuick ? "" : "selected"} onClick={() => chooseAdType("detailed")}><span>إعلان مفصل</span><small>كل التفاصيل والمتطلبات</small></button>
      <button type="button" className={isQuick ? "selected" : ""} onClick={() => chooseAdType("quick")}><span>إعلان سريع</span><small>العنوان والتفاصيل والتواصل</small></button>
    </div>
     <div className={`public-form-card wizard-card ${isQuick ? "quick-single-page" : ""}`}>
       <div className="public-form-intro"><span className="company-logo"><Building2 size={20} /></span><div><b>{isQuick ? "طلب نشر إعلان سريع" : "طلب نشر إعلان مفصل"}</b><span>{isQuick ? "أكمل الحقول الأساسية في صفحة واحدة" : "أكمل الخطوات الأربع حتى يصل طلبك إلى الإدارة"}</span></div></div>
       {!isQuick && <><div className="wizard-steps" aria-label="مراحل طلب نشر الوظيفة">{steps.map((step) => <div className={`wizard-step ${currentStep === step.number ? "active" : ""} ${currentStep > step.number ? "complete" : ""}`} key={step.number}><span>{currentStep > step.number ? <Check size={15} /> : step.number}</span><div><b>{step.title}</b><small>{step.caption}</small></div></div>)}</div><div className="wizard-progress"><span style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} /></div></>}
       <form className={`post-form wizard-form ${isQuick ? "quick-single-form" : ""}`} onSubmit={submit}>
         {(currentStep === 1 || isQuick) && <div className="wizard-panel"><div className="wizard-panel-heading"><span>01</span><div><h2>{isQuick ? "بيانات الإعلان" : "ابدأ بمعلومات الوظيفة"}</h2><p>{isQuick ? "اكتب المعلومات التي تريد أن تظهر للباحثين بدون حقول إضافية." : "هذه البيانات ستظهر للباحثين عن عمل بعد الموافقة."}</p></div></div><div className="form-grid"><label>المسمى الوظيفي *<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="مثال: موظف مبيعات" /></label><label>اسم الشركة أو الجهة *<input required value={form.company_name} onChange={(event) => update("company_name", event.target.value)} placeholder="اكتب الاسم كما تريد ظهوره" /></label></div>{!isQuick && <><div className="form-grid"><label>التصنيف *<AppSelect value={form.category} onChange={(value) => update("category", value)} options={categories.map((value) => ({ value, label: value }))} placeholder="اختر التصنيف" ariaLabel="التصنيف" /></label><label>المدينة *<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="بغداد" /></label></div><label>نوع الدوام<AppSelect value={form.job_type} onChange={(value) => update("job_type", value)} options={jobTypes.map((value) => ({ value, label: value }))} ariaLabel="نوع الدوام" /></label></>}</div>}
        {currentStep === 2 && !isQuick && <div className="wizard-panel"><div className="wizard-panel-heading"><span>02</span><div><h2>كيف يتواصل معك المتقدمون؟</h2><p>أضف البريد أو الواتساب، ويمكنك تفعيل التقديم المباشر للمستخدمين المسجلين.</p></div></div><label>اسم مسؤول التواصل <span className="optional">اختياري</span><input value={form.contact_name} onChange={(event) => update("contact_name", event.target.value)} placeholder="الاسم الذي سيستقبل الاستفسارات" /></label><div className="contact-choice-grid"><label className="contact-input-card"><span>البريد الإلكتروني <small>اختياري إذا أضفت واتساب</small></span><input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} placeholder="jobs@company.com" dir="ltr" /></label><label className="contact-input-card whatsapp-input"><span>رقم الواتساب <small>اختياري إذا أضفت بريداً</small></span><input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div><label className="checkbox-field internal-application-toggle"><input type="checkbox" checked={form.internal_applications} onChange={(event) => setForm((current) => ({ ...current, internal_applications: event.target.checked }))} /><span><b>استقبال التقديمات داخل IRAQ JOBS</b><small>تظهر هذه الميزة فقط للباحثين المسجلين والمكملين لملفهم المهني.</small></span></label></div>}
         {isQuick && <><div className="wizard-panel"><div className="wizard-panel-heading"><span>02</span><div><h2>تفاصيل الوظيفة</h2><p>اذكر طبيعة العمل وأهم ما يحتاج الباحث معرفته قبل التواصل.</p></div></div><label>تفاصيل الوظيفة *<textarea required rows={7} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="اكتب نبذة مختصرة عن العمل، المهام، والمكان أو الوقت إذا كان مهماً..." /></label></div><div className="wizard-panel"><div className="wizard-panel-heading"><span>03</span><div><h2>وسائل التواصل والإرسال</h2><p>أضف وسيلة واحدة على الأقل حتى يعرف الباحث كيف يتواصل مع الجهة.</p></div></div><div className="contact-choice-grid"><label className="contact-input-card"><span>البريد الإلكتروني</span><input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} placeholder="jobs@company.com" dir="ltr" /></label><label className="contact-input-card whatsapp-input"><span>رقم الواتساب</span><input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div><p className="quick-contact-hint">يمكنك إضافة البريد أو الواتساب أو الاثنين معاً.</p><label className="checkbox-field internal-application-toggle"><input type="checkbox" checked={form.internal_applications} onChange={(event) => setForm((current) => ({ ...current, internal_applications: event.target.checked }))} /><span><b>تفعيل التقديم المباشر</b><small>التقديم المباشر متاح فقط للمستخدمين المسجلين في IRAQ JOBS.</small></span></label><div className="quick-review-card"><span className="job-card-badge quick">إعلان سريع</span><b>{form.title || "عنوان الوظيفة"}</b><small>{form.company_name || "اسم الجهة"} · يظهر بعد موافقة الإدارة</small></div></div></>}
        {currentStep === 3 && !isQuick && <div className="wizard-panel"><div className="wizard-panel-heading"><span>03</span><div><h2>أضف التفاصيل التي تهم الباحث</h2><p>كلما كان الوصف أوضح، وصلت الوظيفة للمرشحين المناسبين.</p></div></div><label>وصف الوظيفة *<textarea required rows={6} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="اكتب نبذة عن الدور والمسؤوليات اليومية..." /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={4} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} placeholder={"خبرة React\nمهارات تواصل\nالعمل ضمن فريق"} /></label><div className="form-grid"><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} placeholder="مثال: 1,500,000 د.ع" /></label><label>آخر موعد للتقديم <span className="optional">اختياري</span><input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label></div></div>}
        {currentStep === 4 && <div className="wizard-panel review-panel"><div className="wizard-panel-heading"><span>04</span><div><h2>راجع الطلب قبل الإرسال</h2><p>تأكد من البيانات، وبعدها سيصل الطلب إلى لوحة الإدارة للمراجعة.</p></div></div><div className="review-summary"><div><small>نوع الإعلان</small><b>إعلان مفصل</b><span>{form.title || "—"}</span></div><div><small>الجهة والموقع</small><b>{form.company_name || "—"}</b><span>{form.city || "—"} · {form.job_type}</span></div><div><small>التواصل</small><b>{form.contact_name || form.company_name || "—"}</b><span>{form.contact_email || form.contact_whatsapp || "—"}</span></div><div><small>تفاصيل إضافية</small><b>{form.description ? "تمت إضافة الوصف" : "لم تتم إضافة الوصف"}</b><span>{form.requirements ? `${form.requirements.split("\n").filter(Boolean).length} متطلبات` : "بدون متطلبات محددة"}</span></div></div></div>}
        {error && <p className="form-error">{error}</p>}
         <div className="wizard-actions">{!isQuick && currentStep > 1 && <button type="button" className="outline-btn" onClick={goBack}><ArrowRight size={16} /> السابق</button>}{!isQuick && currentStep < steps.length ? <button type="button" className="primary-btn" onClick={goNext}>التالي <ArrowLeft size={17} /></button> : <button className="primary-btn" disabled={saving}>{saving ? "جاري إرسال الطلب..." : <><Send size={17} /> إرسال طلب النشر</>}</button>}</div>
      </form>
    </div>
  </section>;
}