import { useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { PageIntro } from "../../components/common/PageIntro";
import { categories, jobTypes } from "../../lib/constants";
import type { View } from "../../app/types";
import type { JobType } from "../../lib/types";
import type { Profile } from "../../lib/types";
import { submitJobRequest } from "../../services/adminService";

type JobRequestPageProps = {
  profile?: Profile | null;
  onNavigate: (view: View) => void;
  onSubmitted: () => void;
};

const steps = [
  { number: 1, title: "الأساسيات", caption: "بيانات الوظيفة" },
  { number: 2, title: "التواصل", caption: "طريقة الوصول إليك" },
  { number: 3, title: "التفاصيل", caption: "الوصف والمتطلبات" },
  { number: 4, title: "المراجعة", caption: "تأكد وأرسل" },
];

export function JobRequestPage({ profile, onNavigate, onSubmitted }: JobRequestPageProps) {
  const [form, setForm] = useState({
    title: "", company_name: profile?.organization || "", contact_name: profile?.full_name || "", contact_email: "", contact_whatsapp: "",
    category: "تقنية", city: "بغداد", job_type: "دوام كامل" as JobType, description: "",
    requirements: "", salary_range: "", deadline: "", internal_applications: profile?.role === "hr",
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const validateStep = (step: number) => {
    if (step === 1 && (!form.title.trim() || !form.company_name.trim() || !form.city.trim())) {
      return "أكمل المسمى الوظيفي واسم الشركة والمدينة أولاً.";
    }
    if (step === 2 && (!form.contact_name.trim() || (!form.contact_email.trim() && !form.contact_whatsapp.trim() && profile?.role !== "hr"))) {
      return "أدخل اسم مسؤول التواصل وأضف البريد الإلكتروني أو رقم الواتساب على الأقل.";
    }
    if (step === 3 && !form.description.trim()) return "اكتب وصفاً واضحاً للوظيفة قبل المتابعة.";
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
    const validationError = validateStep(2) || validateStep(3);
    if (validationError) {
      setError(validationError);
      setCurrentStep(!form.contact_name.trim() || (!form.contact_email.trim() && !form.contact_whatsapp.trim()) ? 2 : 3);
      return;
    }
    setSaving(true);
    setError("");
    const submitError = await submitJobRequest({
      ...form,
      contact_email: form.contact_email.trim() || null,
      contact_whatsapp: form.contact_whatsapp.trim() || null,
      salary_range: form.salary_range.trim() || null,
      deadline: form.deadline || null,
       internal_applications: form.internal_applications,
       created_by: null,
      requirements: form.requirements.split("\n").map((item) => item.trim()).filter(Boolean),
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

  return <section className="container page-section public-request-page">
    <button className="back-link" onClick={() => onNavigate("home")}><ArrowRight size={16} /> العودة للرئيسية</button>
     <PageIntro eyebrow="نشر وظيفة" title="أرسل تفاصيل فرصتك إلى IRAQ JOBS" description="خطوات بسيطة، ومراجعة من فريق الإدارة قبل ظهور الوظيفة للعامة. لا تحتاج إلى تسجيل حساب." />
    <div className="public-form-card wizard-card">
      <div className="public-form-intro"><span className="company-logo"><Building2 size={20} /></span><div><b>طلب نشر وظيفة</b><span>أكمل الخطوات الأربع حتى يصل طلبك إلى الإدارة</span></div></div>
      <div className="wizard-steps" aria-label="مراحل طلب نشر الوظيفة">{steps.map((step) => <div className={`wizard-step ${currentStep === step.number ? "active" : ""} ${currentStep > step.number ? "complete" : ""}`} key={step.number}><span>{currentStep > step.number ? <Check size={15} /> : step.number}</span><div><b>{step.title}</b><small>{step.caption}</small></div></div>)}</div>
      <div className="wizard-progress"><span style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }} /></div>
      <form className="post-form wizard-form" onSubmit={submit}>
        {currentStep === 1 && <div className="wizard-panel"><div className="wizard-panel-heading"><span>01</span><div><h2>ابدأ بمعلومات الوظيفة</h2><p>هذه البيانات ستظهر للباحثين عن عمل بعد الموافقة.</p></div></div><div className="form-grid"><label>المسمى الوظيفي *<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="مثال: مطور تطبيقات" /></label><label>اسم الشركة أو الجهة *<input required value={form.company_name} onChange={(event) => update("company_name", event.target.value)} placeholder="اكتب الاسم كما تريد ظهوره" /></label></div><div className="form-grid"><label>التصنيف<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>المدينة *<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="بغداد" /></label></div><label>نوع الدوام<select value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>{jobTypes.map((item) => <option key={item}>{item}</option>)}</select></label></div>}
         {currentStep === 2 && <div className="wizard-panel"><div className="wizard-panel-heading"><span>02</span><div><h2>كيف يتواصل معك المتقدمون؟</h2><p>أضف البريد أو الواتساب، ويمكنك تفعيل التقديم المباشر داخل المنصة.</p></div></div><label>اسم مسؤول التواصل *<input required value={form.contact_name} onChange={(event) => update("contact_name", event.target.value)} placeholder="الاسم الذي سيستقبل الاستفسارات" /></label><div className="contact-choice-grid"><label className="contact-input-card"><span>البريد الإلكتروني <small>اختياري إذا أضفت واتساب</small></span><input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} placeholder="jobs@company.com" dir="ltr" /></label><label className="contact-input-card whatsapp-input"><span>رقم الواتساب <small>اختياري إذا أضفت بريداً</small></span><input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div><label className="checkbox-field internal-application-toggle"><input type="checkbox" checked={form.internal_applications} onChange={(event) => setForm((current) => ({ ...current, internal_applications: event.target.checked }))} /><span><b>استقبال التقديمات داخل IRAQ JOBS</b><small>سيتمكن الباحث من التقديم من ملفه المهني، وستظهر الطلبات لك بعد موافقة المشرف.</small></span></label><div className="wizard-tip"><b>نصيحة</b><span>استخدم رقماً عليه واتساب فعّال حتى يصل إليك الباحثون بسرعة.</span></div></div>}
        {currentStep === 3 && <div className="wizard-panel"><div className="wizard-panel-heading"><span>03</span><div><h2>أضف التفاصيل التي تهم الباحث</h2><p>كلما كان الوصف أوضح، وصلت الوظيفة للمرشحين المناسبين.</p></div></div><label>وصف الوظيفة *<textarea required rows={6} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="اكتب نبذة عن الدور والمسؤوليات اليومية..." /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={4} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} placeholder={"خبرة React\nمهارات تواصل\nالعمل ضمن فريق"} /></label><div className="form-grid"><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} placeholder="مثال: 1,500,000 د.ع" /></label><label>آخر موعد للتقديم <span className="optional">اختياري</span><input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label></div></div>}
        {currentStep === 4 && <div className="wizard-panel review-panel"><div className="wizard-panel-heading"><span>04</span><div><h2>راجع الطلب قبل الإرسال</h2><p>تأكد من البيانات، وبعدها سيصل الطلب إلى لوحة الإدارة للمراجعة.</p></div></div><div className="review-summary"><div><small>الوظيفة</small><b>{form.title || "—"}</b><span>{form.company_name || "—"} · {form.city || "—"}</span></div><div><small>نوع الدوام والتصنيف</small><b>{form.job_type}</b><span>{form.category}</span></div><div><small>التواصل</small><b>{form.contact_name || "—"}</b><span>{form.contact_email || form.contact_whatsapp || "—"}</span></div><div><small>تفاصيل إضافية</small><b>{form.description ? "تمت إضافة الوصف" : "لم تتم إضافة الوصف"}</b><span>{form.requirements ? `${form.requirements.split("\n").filter(Boolean).length} متطلبات` : "بدون متطلبات محددة"}</span></div></div></div>}
        {error && <p className="form-error">{error}</p>}
        <div className="wizard-actions">{currentStep > 1 && <button type="button" className="outline-btn" onClick={goBack}><ArrowRight size={16} /> السابق</button>}{currentStep < steps.length ? <button type="button" className="primary-btn" onClick={goNext}>التالي <ArrowLeft size={17} /></button> : <button className="primary-btn" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Send size={17} />}{saving ? "جاري إرسال الطلب..." : "إرسال طلب النشر"}</button>}</div>
      </form>
    </div>
  </section>;
}