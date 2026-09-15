import { useState } from "react";
import { ArrowRight, Building2, CheckCircle2, LoaderCircle, Send } from "lucide-react";
import { PageIntro } from "../../components/common/PageIntro";
import { categories, jobTypes } from "../../lib/constants";
import type { View } from "../../app/types";
import type { JobType } from "../../lib/types";
import { submitJobRequest } from "../../services/adminService";

type JobRequestPageProps = {
  onNavigate: (view: View) => void;
  onSubmitted: () => void;
};

export function JobRequestPage({ onNavigate, onSubmitted }: JobRequestPageProps) {
  const [form, setForm] = useState({
    title: "", company_name: "", contact_name: "", contact_email: "", contact_whatsapp: "",
    category: "تقنية", city: "بغداد", job_type: "دوام كامل" as JobType, description: "",
    requirements: "", salary_range: "", deadline: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.contact_email.trim() && !form.contact_whatsapp.trim()) {
      setError("أضف البريد الإلكتروني أو رقم الواتساب على الأقل.");
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
    return <section className="container page-section centered-state"><CheckCircle2 size={52} /><h1>تم استلام طلبك</h1><p>سيراجع فريق مسار البيانات، وعند الموافقة ستظهر الوظيفة للباحثين عن عمل.</p><button className="primary-btn" onClick={() => onNavigate("home")}><ArrowRight size={17} /> العودة للرئيسية</button></section>;
  }

  return <section className="container page-section public-request-page"><button className="back-link" onClick={() => onNavigate("home")}><ArrowRight size={16} /> العودة للرئيسية</button><PageIntro eyebrow="نشر وظيفة" title="أرسل تفاصيل فرصتك إلى مسار" description="املأ البيانات الأساسية، وسيراجعها فريق الإدارة قبل نشرها للعامة. لا تحتاج إلى تسجيل حساب." /><div className="public-form-card"><div className="public-form-intro"><span className="company-logo"><Building2 size={20} /></span><div><b>طلب نشر وظيفة</b><span>الحقول التي تحتوي على نجمة مطلوبة</span></div></div><form className="post-form" onSubmit={submit}><div className="form-grid"><label>المسمى الوظيفي *<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="مثال: مطور تطبيقات" /></label><label>اسم الشركة أو الجهة *<input required value={form.company_name} onChange={(event) => update("company_name", event.target.value)} /></label></div><div className="form-grid"><label>اسم مسؤول التواصل *<input required value={form.contact_name} onChange={(event) => update("contact_name", event.target.value)} /></label><label>المدينة *<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="بغداد" /></label></div><div className="form-grid"><label>البريد الإلكتروني <span className="optional">واحد من الاثنين مطلوب</span><input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} placeholder="jobs@company.com" dir="ltr" /></label><label>واتساب <span className="optional">واحد من الاثنين مطلوب</span><input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div><div className="form-grid"><label>التصنيف<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>نوع الدوام<select value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>{jobTypes.map((item) => <option key={item}>{item}</option>)}</select></label></div><div className="form-grid"><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} /></label><label>آخر موعد للتقديم <span className="optional">اختياري</span><input type="date" value={form.deadline} onChange={(event) => update("deadline", event.target.value)} /></label></div><label>وصف الوظيفة *<textarea required rows={5} value={form.description} onChange={(event) => update("description", event.target.value)} placeholder="اكتب نبذة واضحة عن الدور والمسؤوليات..." /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={4} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} placeholder="خبرة React&#10;مهارات تواصل..." /></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Send size={17} />}{saving ? "جاري إرسال الطلب..." : "إرسال طلب النشر"}</button></form></div></section>;
}