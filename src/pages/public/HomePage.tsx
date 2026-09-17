import { ArrowLeft, BriefcaseBusiness, Building2, Clock3, FileText, HeartHandshake, MapPin, Send, Users, Zap } from "lucide-react";
import { SectionHeading } from "../../components/common/PageIntro";
import { JobCard } from "../../features/jobs/JobCard";
import { RequestCard } from "../../features/requests/RequestCard";
import type { View } from "../../app/types";
import type { CVRequest, Job } from "../../lib/types";
import { LoadingCards } from "../../components/common/Feedback";

type HomePageProps = {
  jobs: Job[];
  requests: CVRequest[];
  loading: boolean;
  onNavigate: (view: View) => void;
  onOpenJob: (job: Job) => void;
  onOpenRequest: (request: CVRequest) => void;
};

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return <div className="stat"><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>;
}

function Step({ icon, number, title, text }: { icon: React.ReactNode; number: string; title: string; text: string }) {
  return <article className="home-step"><span className="home-step-icon">{icon}</span><small>{number}</small><h3>{title}</h3><p>{text}</p></article>;
}

export function HomePage({ jobs, requests, loading, onNavigate, onOpenJob, onOpenRequest }: HomePageProps) {
  return <>
    <section className="home-hero">
      <div className="container home-hero-grid">
        <div className="home-hero-copy">
          <span className="home-kicker">منصة توظيف عراقية</span>
          <h1>ابحث عن وظيفتك<br /><em>القادمة بوضوح.</em></h1>
          <p>وظائف مرتبة حسب المجال والمدينة ونوع الدوام. افتح التفاصيل وتواصل مباشرة مع الجهة الناشرة.</p>
          <div className="hero-actions"><button className="primary-btn large" onClick={() => onNavigate("jobs")}>تصفح الوظائف <ArrowLeft size={18} /></button></div>
          <div className="home-trust-row"><span><BriefcaseBusiness size={15} /> {jobs.length} وظيفة منشورة</span><span><Clock3 size={15} /> الأحدث يظهر أولاً</span></div>
        </div>
        <div className="home-live-panel">
          <div className="home-live-head"><div><b>آخر الوظائف المضافة</b></div><small>{jobs.length} وظيفة</small></div>
          <div className="home-live-title"><span>فرص متاحة الآن</span><button onClick={() => onNavigate("jobs")}>كل الوظائف <ArrowLeft size={14} /></button></div>
          <div className="home-live-list">{jobs.slice(0, 3).map((job, index) => <button className="home-live-job" key={job.id} onClick={() => onOpenJob(job)}><span className={`mini-icon icon-${index + 1}`}><BriefcaseBusiness size={16} /></span><span><b>{job.title}</b><small>{job.company_name} · {job.city}</small></span><ArrowLeft size={15} /></button>)}{jobs.length === 0 && <div className="empty-mini">لا توجد وظائف منشورة حالياً</div>}</div>
          <div className="home-live-footer"><span><Clock3 size={14} /> يتم ترتيبها حسب تاريخ النشر</span><span>iraq jobs</span></div>
        </div>
      </div>
    </section>

    <section className="stats-strip"><div className="container stats-grid"><Stat icon={<BriefcaseBusiness />} value={`${jobs.length || "—"}`} label="وظيفة منشورة" /><Stat icon={<Users />} value={`${requests.length || "—"}`} label="طلب HR مفتوح" /><Stat icon={<HeartHandshake />} value="100%" label="مجاني للمتقدمين" /></div></section>

    <section className="container section-block home-jobs-section"><SectionHeading eyebrow="اختيارات اليوم" title="فرص تستحق نظرتك" action="كل الوظائف" onAction={() => onNavigate("jobs")} /><p className="home-section-lead">وظائف مختارة ومحدثة حتى تختصر وقت البحث وتبدأ التقديم بثقة.</p><div className="job-grid">{loading ? <LoadingCards /> : jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div></section>

    <section className="container home-how-section"><div className="home-section-heading"><div><span className="eyebrow"><Zap size={14} /> أبسط مما تتوقع</span><h2>من البحث إلى الخطوة الجاية</h2></div><p>كل شيء مصمم حتى تركز على الفرصة، مو على التعقيد.</p></div><div className="home-steps"><Step number="01" icon={<MapPin size={19} />} title="اختار فرصتك" text="تصفح الوظائف حسب المجال والمدينة ونوع الدوام." /><Step number="02" icon={<FileText size={19} />} title="اعرف التفاصيل" text="شوف الوصف والمتطلبات وطريقة التواصل بوضوح." /><Step number="03" icon={<Send size={19} />} title="قدّم مباشرة" text="أرسل سيرتك أو تواصل مع الجهة بخطوة بسيطة." /></div></section>

    <section className="container section-block home-requests-section"><SectionHeading eyebrow="للمهارات المطلوبة" title="طلبات HR" action="كل الطلبات" onAction={() => onNavigate("requests")} /><div className="request-grid">{requests.length ? requests.slice(0, 3).map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpenRequest(request)} />) : <div className="wide-empty"><FileText size={26} /><b>طلبات HR ستظهر هنا</b><span>تابع الطلبات الجديدة حسب اختصاصك.</span></div>}</div></section>

     <section className="container home-employer-cta"><div className="home-cta-icon"><Building2 size={25} /></div><div><span className="eyebrow light">لأصحاب الشركات والـ HR</span><h2>تحتاج مرشحين لوظيفة محددة؟</h2><p>أرسل تفاصيل الوظيفة لفريقنا لمراجعتها وتجهيزها للنشر.</p></div></section>
  </>;
}