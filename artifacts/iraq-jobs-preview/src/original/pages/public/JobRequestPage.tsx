import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, CalendarDays, Check, CheckCircle2, FilePlus2, Minus, Plus, Send, ShieldCheck, Sparkles } from "lucide-react";
import { AppSelect } from "../../components/common/AppSelect";
import { DatePickerField } from "../../components/common/DatePickerField";
import { PageIntro } from "../../components/common/PageIntro";
import { categories, governorates, jobTypes } from "../../lib/constants";
import type { View } from "../../app/types";
import type { JobAdType, JobType, Profile } from "../../lib/types";
import { getBaghdadToday } from "../../lib/date";
import { formatDate } from "../../lib/format";
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
  { number: 1, title: "الأساسيات", caption: "العنوان والمحافظة" },
  { number: 2, title: "تفاصيل الوظيفة", caption: "المعلومات المهمة" },
];

function DirectApplicationToggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return <label className={`direct-application-card ${checked ? "is-active" : ""}`}>
    <span className="direct-application-icon"><ShieldCheck size={18} /></span>
    <span className="direct-application-copy"><b>تقديم مباشر من الحساب</b><small>يظهر للباحثين المسجلين والمكملين لملفهم فقط.</small></span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span className="direct-application-switch" aria-hidden="true"><i /></span>
  </label>;
}

export function JobRequestPage({ profile, onNavigate, onSubmitted }: JobRequestPageProps) {
  const [form, setForm] = useState({
    ad_type: "quick" as JobAdType,
    title: "",
    company_name: profile?.organization || "",
    contact_name: profile?.full_name || "",
    contact_email: "",
    contact_whatsapp: "",
    category: "",
    province: "",
    city: "",
    job_type: "" as JobType,
    description: "",
    requirements: "",
    salary_range: "",
    deadline: "",
    internal_applications: false,
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [contactExpanded, setContactExpanded] = useState(false);
  const [deadlineExpanded, setDeadlineExpanded] = useState(false);
  const today = getBaghdadToday();
  const steps = useMemo(() => form.ad_type === "quick" ? quickSteps : detailedSteps, [form.ad_type]);
  const canEnableInternalApplications = profile?.role === "hr" || profile?.role === "admin";

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const chooseAdType = (adType: JobAdType) => {
    setForm((current) => ({ ...current, ad_type: adType }));
    setCurrentStep(1);
    setError("");
  };

  const validateStep = (step: number) => {
    if (step === 1 && (!form.title.trim() || !form.province || (form.ad_type === "detailed" && (!form.company_name.trim() || !form.city.trim() || !form.category.trim())))) {
      return form.ad_type === "quick"
        ? "اكتب العنوان الوظيفي واختر المحافظة."
        : "أكمل المسمى الوظيفي واسم الشركة والتصنيف والمحافظة والمدينة.";
    }
    if (form.ad_type === "detailed" && step === 3) {
      if (!form.deadline) return "حدد آخر موعد للتقديم.";
      if (form.deadline < today) return "اختر تاريخاً اليوم أو بعده.";
    }
    if (form.ad_type === "detailed" && step === 2) {
      if (!form.contact_email.trim() && !form.contact_whatsapp.trim() && !profile) return "أضف البريد الإلكتروني أو رقم الواتساب على الأقل.";
    }
    if (form.ad_type === "quick" && step === 2 && form.deadline && form.deadline < today) return "اختر آخر موعد اليوم أو بعده.";
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
    const requiredSteps = form.ad_type === "quick" ? [1, 2] : [1, 2, 3];
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
      company_name: form.ad_type === "quick" ? "جهة غير معلنة" : form.company_name.trim(),
      contact_name: form.contact_name.trim() || (form.ad_type === "quick" ? "صاحب الإعلان" : form.company_name.trim()),
      contact_email: form.contact_email.trim() || null,
      contact_whatsapp: form.contact_whatsapp.trim() || null,
      salary_range: form.ad_type === "quick" ? null : form.salary_range.trim() || null,
      deadline: form.ad_type === "quick" ? form.deadline || null : form.deadline,
      category: form.ad_type === "quick" ? "عام" : form.category,
      city: form.ad_type === "quick" ? "" : form.city,
      job_type: form.ad_type === "quick" ? "دوام كامل" : form.job_type,
      created_by: profile?.id || null,
      internal_applications: canEnableInternalApplications ? form.internal_applications : false,
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
     <PageIntro eyebrow="نشر وظيفة" title="انشر فرصتك بوضوح" description="اختر القالب المناسب، أدخل المعلومات الأساسية، وسيراجع فريقنا الطلب قبل ظهوره للباحثين." />
     <button type="button" className={`ad-mode-banner ${isQuick ? "for-detailed" : "for-quick"}`} onClick={() => chooseAdType(isQuick ? "detailed" : "quick")}>
       <span className="ad-mode-banner-icon">{isQuick ? <FilePlus2 size={21} /> : <Sparkles size={21} />}</span>
       <span className="ad-mode-banner-copy">
         <small>{isQuick ? "تحتاج مساحة أكبر للتفاصيل؟" : "تريد نشر الوظيفة بأسرع طريقة؟"}</small>
         <b>{isQuick ? "انتقل إلى الإعلان المفصل" : "ارجع إلى الإعلان السريع"}</b>
         <em>{isQuick ? "أضف التصنيف والراتب والمتطلبات ووسائل التواصل." : "عنوان الوظيفة والمحافظة والوصف تكفي للبدء."}</em>
       </span>
       <ArrowLeft className="ad-mode-banner-arrow" size={19} />
     </button>
     <div className={`public-form-card wizard-card ${isQuick ? "quick-single-page" : ""}`}>
       <div className="public-form-intro"><span className="company-logo"><Building2 size={20} /></span><div><b>{isQuick ? "طلب نشر إعلان سريع" : "طلب نشر إعلان مفصل"}</b><span>{isQuick ? "أكمل الحقول الأساسية في صفحة واحدة" : "أكمل الخطوات الأربع حتى يصل طلبك إلى الإدارة"}</span></div></div>
        {!isQuick && <><div className="wizard-steps" aria-label="مراحل طلب نشر الوظيفة">{steps.map((step) => <div className={`wizard-step ${currentStep === step.number ? "active" : ""} ${currentStep > step.number ? "complete" : ""}`} key={step.number}><span>{currentStep > step.number ? <Check size={15} /> : step.number}</span><div><b>{step.title}</b><small>{step.caption}</small></div></div>)}</div><div className="wizard-progress"><span style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} /></div></>}
       <form className={`post-form wizard-form ${isQuick ? "quick-single-form" : ""}`} onSubmit={submit}>
             {!isQuick && currentStep === 1 && <div className="wizard-panel"><div className="wizard-panel-heading"><span>01</span><div><h2>ابدأ بمعلومات الوظيفة</h2><p>هذه البيانات ستظهر للباحثين عن عمل بعد الموافقة.</p></div></div><div className="form-grid"><label>المسمى الوظيفي *<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="مثال: موظف مبيعات" /></label><label>اسم الشركة أو الجهة *<input required value={form.company_name} onChange={(event) => update("company_name", event.target.value)} placeholder="اكتب الاسم كما تريد ظهوره" /></label></div><div className="form-grid"><label>المحافظة *<AppSelect value={form.province} onChange={(value) => update("province", value)} options={governorates.map((value) => ({ value, label: value }))} placeholder="اختر المحافظة" ariaLabel="المحافظة" /></label><label>المدينة *<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="مثال: المنصور" /></label></div><div className="form-grid"><label>التصنيف *<AppSelect value={form.category} onChange={(value) => update("category", value)} options={categories.map((value) => ({ value, label: value }))} placeholder="اختر التصنيف" ariaLabel="التصنيف" /></label><label>نوع الدوام<AppSelect value={form.job_type} onChange={(value) => update("job_type", value)} options={jobTypes.map((value) => ({ value, label: value }))} ariaLabel="نوع الدوام" /></label></div></div>}
             {isQuick && <div className="wizard-panel quick-posting-panel"><div className="wizard-panel-heading"><span>01</span><div><h2>إعلان سريع</h2><p>اكتب العنوان والمحافظة، ثم أضف بقية تفاصيل الوظيفة في الوصف.</p></div></div><label>العنوان الوظيفي *<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="مثال: موظف مبيعات" /></label><label>المحافظة *<AppSelect value={form.province} onChange={(value) => update("province", value)} options={governorates.map((value) => ({ value, label: value }))} placeholder="اختر المحافظة" ariaLabel="المحافظة" /></label><label>تفاصيل الوظيفة *<textarea required rows={8} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="اكتب طبيعة العمل، المهام، الخبرة، الراتب، الدوام، وأي معلومات أخرى يحتاجها الباحث..." /></label>
               {!deadlineExpanded ? <button type="button" className="quick-deadline-toggle" onClick={() => setDeadlineExpanded(true)}><CalendarDays size={16} /><span>إضافة آخر موعد للتقديم</span><Plus size={15} /></button> : <div className="quick-deadline-fields"><DatePickerField id="quick-request-deadline" label="آخر موعد للتقديم (اختياري)" min={today} value={form.deadline} onChange={(value) => update("deadline", value)} /><button type="button" className="quick-deadline-remove" onClick={() => { update("deadline", ""); setDeadlineExpanded(false); }}>إزالة الموعد</button></div>}
               <p className="quick-expiry-note">إذا لم تحدد آخر موعد، يبقى الإعلان متاحاً للتقديم لمدة 15 يوماً من تاريخ الموافقة على نشره.</p>
               {canEnableInternalApplications && <DirectApplicationToggle checked={form.internal_applications} onChange={(checked) => setForm((current) => ({ ...current, internal_applications: checked }))} />}
               <div className="quick-contact-disclosure"><button type="button" className="quick-contact-toggle" aria-expanded={contactExpanded} onClick={() => setContactExpanded((current) => !current)}>{contactExpanded ? <Minus size={16} /> : <Plus size={16} />}<span>{contactExpanded ? "إخفاء وسائل التواصل" : "إضافة وسيلة تواصل (اختياري)"}</span></button>{contactExpanded && <div className="quick-contact-fields"><p>أضف البريد أو الواتساب، أو اترك وسيلة التواصل ضمن وصف الوظيفة.</p><div className="contact-choice-grid"><label className="contact-input-card"><span>البريد الإلكتروني <small>اختياري</small></span><input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} placeholder="jobs@company.com" dir="ltr" /></label><label className="contact-input-card whatsapp-input"><span>رقم الواتساب <small>اختياري</small></span><input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div></div>}</div>
                <div className="quick-review-card"><b>{form.title || "عنوان الوظيفة"}</b><small>{form.province || "اختر المحافظة"} · {form.deadline ? `آخر موعد ${formatDate(form.deadline)}` : "مدة النشر 15 يوماً من تاريخ الموافقة"}</small><small>{form.internal_applications ? "التقديم المباشر متاح للباحثين المسجلين" : "التقديم بالتواصل مع الجهة"}</small></div></div>}
         {currentStep === 2 && !isQuick && <div className="wizard-panel"><div className="wizard-panel-heading"><span>02</span><div><h2>طريقة التواصل</h2><p>اختر الوسيلة التي تريد استقبال الاستفسارات من خلالها.</p></div></div><label>اسم مسؤول التواصل <span className="optional">اختياري</span><input value={form.contact_name} onChange={(event) => update("contact_name", event.target.value)} placeholder="الاسم الذي سيستقبل الاستفسارات" /></label><div className="contact-choice-grid"><label className="contact-input-card"><span>البريد الإلكتروني <small>اختياري إذا أضفت واتساب</small></span><input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} placeholder="jobs@company.com" dir="ltr" /></label><label className="contact-input-card whatsapp-input"><span>رقم الواتساب <small>اختياري إذا أضفت بريداً</small></span><input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div>{canEnableInternalApplications && <DirectApplicationToggle checked={form.internal_applications} onChange={(checked) => setForm((current) => ({ ...current, internal_applications: checked }))} />}</div>}
          {currentStep === 3 && !isQuick && <div className="wizard-panel"><div className="wizard-panel-heading"><span>03</span><div><h2>أضف التفاصيل التي تهم الباحث</h2><p>كلما كان الوصف أوضح، وصلت الوظيفة للمرشحين المناسبين.</p></div></div><label>وصف الوظيفة *<textarea required rows={6} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="اكتب نبذة عن الدور والمسؤوليات اليومية..." /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={4} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} placeholder={"خبرة React\nمهارات تواصل\nالعمل ضمن فريق"} /></label><div className="form-grid"><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} placeholder="مثال: 1,500,000 د.ع" /></label><DatePickerField id="job-request-deadline" label="آخر موعد للتقديم" required min={today} value={form.deadline} onChange={(value) => update("deadline", value)} /></div></div>}
            {currentStep === 4 && <div className="wizard-panel review-panel"><div className="wizard-panel-heading"><span>04</span><div><h2>راجع الطلب قبل الإرسال</h2><p>تأكد من البيانات، وبعدها سيصل الطلب إلى لوحة الإدارة للمراجعة.</p></div></div><div className="review-summary"><div><small>نوع الإعلان</small><b>إعلان مفصل</b><span>{form.title || "—"}</span></div><div><small>الجهة والموقع</small><b>{form.company_name || "—"}</b><span>{[form.city, form.province].filter(Boolean).join(" · ") || "—"} · {form.job_type}</span></div><div><small>التواصل</small><b>{form.contact_name || form.company_name || "—"}</b><span>{form.contact_email || form.contact_whatsapp || "—"}</span></div><div><small>آخر موعد للتقديم</small><b>{formatDate(form.deadline)}</b></div><div><small>التقديم المباشر</small><b>{form.internal_applications ? "مفعّل" : "غير مفعّل"}</b><span>{form.internal_applications ? "تصل الطلبات إلى حسابك" : "التقديم عبر وسائل التواصل"}</span></div><div><small>تفاصيل إضافية</small><b>{form.description ? "تمت إضافة الوصف" : "لم تتم إضافة الوصف"}</b><span>{form.requirements ? `${form.requirements.split("\n").filter(Boolean).length} متطلبات` : "بدون متطلبات محددة"}</span></div></div></div>}
        {error && <p className="form-error">{error}</p>}
         <div className="wizard-actions">{!isQuick && currentStep > 1 && <button type="button" className="outline-btn" onClick={goBack}><ArrowRight size={16} /> السابق</button>}{!isQuick && currentStep < steps.length ? <button type="button" className="primary-btn" onClick={goNext}>التالي <ArrowLeft size={17} /></button> : <button className="primary-btn" disabled={saving}>{saving ? "جاري إرسال الطلب..." : <><Send size={17} /> إرسال طلب النشر</>}</button>}</div>
      </form>
    </div>
  </section>;
}