import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, BriefcaseBusiness, Building2, CalendarDays, Check, Clock3, Mail, MapPin, MessageCircle, Share2, UserRound } from "lucide-react";
import { PageIntro } from "../../components/common/PageIntro";
import type { View } from "../../app/types";
import type { Job, Profile } from "../../lib/types";
import { formatDate, formatJobLocation } from "../../lib/format";
import { useEffect, useState } from "react";
import { ApplicationForm } from "../../features/applications/ApplicationForm";
import { hasSupabaseConfig } from "../../lib/supabase";
import { loadSavedJobIds, toggleSavedJob } from "../../services/savedJobService";
import { getBaghdadToday } from "../../lib/date";

function whatsappUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  const normalized = digits.startsWith("00") ? digits.slice(2) : digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
  return `https://wa.me/${normalized}`;
}

function DetailSection({ number, eyebrow, title, children }: { number: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section className="job-v3-detail-section"><div className="job-v3-section-title"><span>{number}</span><div><small>{eyebrow}</small><h2>{title}</h2></div></div>{children}</section>;
}

export function JobDetailsPage({ job, profile, onNavigate, onLogin, onNotify }: { job: Job | null; profile?: Profile | null; onNavigate: (view: View) => void; onLogin?: () => void; onNotify?: (message: string) => void }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!job || !profile || profile.role !== "candidate" || !hasSupabaseConfig) return;
    void loadSavedJobIds().then((result) => setSaved(result.ids.includes(job.id)));
  }, [job, profile]);

  if (!job || !job.deadline || job.deadline < getBaghdadToday()) {
    return <section className="container page-section"><PageIntro eyebrow="الوظيفة" title="الوظيفة غير متاحة" description="قد تكون الوظيفة أُغلقت أو أن الرابط غير صحيح." /><button className="outline-btn" onClick={() => onNavigate("jobs")}><ArrowRight size={16} /> العودة إلى الوظائف</button></section>;
  }

  const handleToggleSaved = async () => {
    if (saving) return;
    setSaving(true);
    const error = await toggleSavedJob(job.id, saved);
    setSaving(false);
    if (error) {
      onNotify?.("تعذر تحديث المحفوظات.");
      return;
    }
    setSaved(!saved);
    onNotify?.(!saved ? "تم حفظ الوظيفة" : "أزيلت الوظيفة من المحفوظات");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard?.writeText(window.location.href);
      onNotify?.("تم نسخ رابط الوظيفة");
    } catch {
      onNotify?.("تعذر نسخ الرابط من هذا المتصفح.");
    }
  };

  const hasContact = Boolean(job.contact_email || job.contact_whatsapp);
  const isQuick = job.ad_type === "quick";
  const location = formatJobLocation(job);
  return <main className={`container page-section job-v3-page ${isQuick ? "quick-job-details" : ""}`}>
    <button className="back-link job-v3-back" onClick={() => onNavigate("jobs")}><ArrowRight size={16} /> العودة إلى الوظائف</button>
    <header className="job-v3-header">
      <div className="job-v3-header-main">
        <span className="company-logo large"><Building2 size={25} /></span>
        <div>
            <div className="job-v3-tags"><span>{isQuick ? "إعلان سريع" : job.category || "عام"}</span>{job.internal_applications && <span className="job-v3-application-badge"><UserRound size={12} /> تقديم مباشر</span>}<small><CalendarDays size={12} /> {formatDate(job.created_at)}</small></div>
          <h1>{job.title}</h1>
           {job.company_name !== "جهة غير معلنة" && <p>{job.company_name}</p>}
        </div>
      </div>
       <div className="job-v3-header-actions">
          {profile?.role === "candidate" && <button type="button" className={saved ? "save-job-btn saved" : "save-job-btn"} disabled={saving} onClick={() => void handleToggleSaved()}>{saving ? "جاري الحفظ..." : <>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />} {saved ? "محفوظة" : "حفظ الوظيفة"}</>}</button>}
          <button className="outline-btn job-v3-share" onClick={() => void handleShare()}><Share2 size={16} /> مشاركة</button>
       </div>
    </header>

      <div className="job-v3-facts" aria-label="معلومات الوظيفة">
       <span><MapPin size={16} /><small>الموقع</small><strong>{location}</strong></span>
        <span><CalendarDays size={16} /><small>آخر موعد للتقديم</small><strong>{formatDate(job.deadline)}</strong></span>
       {!isQuick && <><span><Clock3 size={16} /><small>نوع الدوام</small><strong>{job.job_type}</strong></span>
       <span><BriefcaseBusiness size={16} /><small>الراتب</small><strong>{job.salary_range || "يحدد بالمقابلة"}</strong></span></>}
      </div>

    <div className="job-v3-layout">
      <article className="job-v3-content">
         <DetailSection number="01" eyebrow="تفاصيل الوظيفة" title="تفاصيل الوظيفة"><p className="job-v3-description">{job.description}</p></DetailSection>
         {!isQuick && <DetailSection number="02" eyebrow="ما نبحث عنه" title="المتطلبات">
          <ul className="job-v3-requirements">{job.requirements.length ? job.requirements.map((item) => <li key={item}><Check size={16} />{item}</li>) : <li><Check size={16} />لم تتم إضافة متطلبات محددة.</li>}</ul>
         </DetailSection>}
      </article>

       <aside className="job-v3-contact">
            {job.internal_applications && profile?.role === "candidate" && <div className="internal-application-box"><div className="job-v3-contact-title"><span><BriefcaseBusiness size={19} /></span><div><small>التقديم المباشر مفعّل</small><h2>قدّم من ملفك المهني</h2></div></div><p>أرسل طلبك مباشرة إلى الجهة من ملفك المهني، بدون رفع سيرة ذاتية جديدة.</p>{submitted ? <div className="application-success"><Check size={18} /> تم إرسال طلبك بنجاح</div> : <ApplicationForm jobId={job.id} onSubmitted={() => { setSubmitted(true); onNotify?.("تم إرسال طلبك إلى الجهة."); }} />}</div>}
            {job.internal_applications && !profile && <div className="internal-application-box guest-application-box"><div className="job-v3-contact-title"><span><UserRound size={19} /></span><div><small>التقديم المباشر مفعّل</small><h2>قدّم من ملفك المهني</h2></div></div><p>سجّل الدخول بحساب الباحث عن عمل، ثم أرسل طلبك مباشرة من ملفك المهني.</p><button type="button" className="primary-btn full" onClick={onLogin}><UserRound size={16} /> تسجيل الدخول للتقديم</button></div>}
            {job.internal_applications && profile && profile.role !== "candidate" && <div className="internal-application-box employer-application-note"><div className="job-v3-contact-title"><span><BriefcaseBusiness size={19} /></span><div><small>التقديم المباشر مفعّل</small><h2>استقبال الطلبات عبر المنصة</h2></div></div><p>يمكن للباحثين عن عمل التقديم من ملفاتهم المهنية. تواصل مع الجهة مباشرة عبر الوسائل أدناه أيضاً.</p></div>}
         <div className="job-v3-contact-title"><span><MessageCircle size={19} /></span><div><small>{job.internal_applications ? "طريقة إضافية للتقديم" : "خطوة التقديم"}</small><h2>تواصل مع الجهة</h2></div></div>
         <p>{job.internal_applications ? "يمكنك التقديم من ملفك المهني أو استخدام إحدى وسائل التواصل التالية." : "استخدم إحدى وسائل التواصل التالية واذكر اسم الوظيفة عند مراسلة الجهة."}</p>
         {hasContact ? <div className="contact-actions">{job.contact_whatsapp && <a className="contact-action whatsapp premium-contact" href={whatsappUrl(job.contact_whatsapp)} target="_blank" rel="noreferrer"><span className="contact-icon"><MessageCircle size={21} /></span><span className="contact-copy"><small>تواصل سريع</small><b>واتساب</b><em dir="ltr">{job.contact_whatsapp}</em></span><ArrowLeft className="contact-arrow" size={17} /></a>}{job.contact_email && <a className="contact-action email" href={`mailto:${job.contact_email}`}><Mail size={19} /><span><small>البريد الإلكتروني</small><b dir="ltr">{job.contact_email}</b></span></a>}</div> : <p className="contact-missing">{isQuick ? "لا توجد وسيلة تواصل مستقلة؛ راجع وصف الوظيفة فقد يتضمن تفاصيل التواصل." : "لم تضف الجهة وسيلة تواصل لهذه الوظيفة بعد."}</p>}
        <div className="job-v3-contact-note">تأكد من إرسال سيرتك الذاتية وذكر الوظيفة بوضوح.</div>
      </aside>
    </div>
  </main>;
}