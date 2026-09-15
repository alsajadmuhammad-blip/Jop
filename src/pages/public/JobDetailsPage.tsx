import { ArrowRight, BriefcaseBusiness, Building2, Check, Clock3, Mail, MapPin, MessageCircle, Share2 } from "lucide-react";
import { PageIntro } from "../../components/common/PageIntro";
import type { View } from "../../app/types";
import type { Job } from "../../lib/types";

function whatsappUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("00") ? digits.slice(2) : digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

export function JobDetailsPage({ job, onNavigate }: { job: Job | null; onNavigate: (view: View) => void }) {
  if (!job) {
    return <section className="container page-section"><PageIntro eyebrow="الوظيفة" title="الوظيفة غير متاحة" description="قد تكون الوظيفة أُغلقت أو أن الرابط غير صحيح." /><button className="outline-btn" onClick={() => onNavigate("jobs")}><ArrowRight size={16} /> العودة إلى الوظائف</button></section>;
  }

  const hasContact = Boolean(job.contact_email || job.contact_whatsapp);
  return <section className="container page-section job-details-page">
    <button className="back-link" onClick={() => onNavigate("jobs")}><ArrowRight size={16} /> العودة إلى الوظائف</button>
    <div className="job-details-hero">
      <div className="job-details-heading"><span className="company-logo large"><Building2 size={25} /></span><div><span className="category-label">{job.category || "عام"}</span><h1>{job.title}</h1><p>{job.company_name}</p></div></div>
      <button className="outline-btn" onClick={() => void navigator.clipboard?.writeText(window.location.href)}><Share2 size={16} /> نسخ الرابط</button>
    </div>
    <div className="detail-chips"><span><Clock3 size={15} />{job.job_type}</span><span><MapPin size={15} />{job.city}</span><span><BriefcaseBusiness size={15} />{job.salary_range || "الراتب يحدد بالمقابلة"}</span></div>
    <div className="job-details-grid">
      <article className="job-details-content">
        <div className="content-block"><h2>عن الوظيفة</h2><p>{job.description}</p></div>
        <div className="content-block"><h2>المتطلبات</h2><ul className="requirements-list">{job.requirements.length ? job.requirements.map((item) => <li key={item}><Check size={16} />{item}</li>) : <li>لم تتم إضافة متطلبات محددة.</li>}</ul></div>
        <div className="job-application-notice"><MessageCircle size={20} /><div><b>التقديم المباشر غير متاح</b><p>هذه الوظيفة مخصصة للعرض. تواصل مع جهة النشر مباشرة عبر إحدى الوسائل المتاحة أدناه.</p></div></div>
      </article>
      <aside className="contact-card"><span className="eyebrow">طريقة التواصل</span><h2>تواصل مباشرة</h2><p>اختر الوسيلة المناسبة للتواصل مع الجهة الناشرة حول هذه الوظيفة.</p>{hasContact ? <div className="contact-actions">{job.contact_email && <a className="contact-action email" href={`mailto:${job.contact_email}`}><Mail size={19} /><span><small>البريد الإلكتروني</small><b>{job.contact_email}</b></span></a>}{job.contact_whatsapp && <a className="contact-action whatsapp" href={whatsappUrl(job.contact_whatsapp)} target="_blank" rel="noreferrer"><MessageCircle size={19} /><span><small>واتساب</small><b>{job.contact_whatsapp}</b></span></a>}</div> : <p className="contact-missing">لم تضف الجهة وسيلة تواصل لهذه الوظيفة بعد.</p>}</aside>
    </div>
  </section>;
}