import { ArrowLeft, BriefcaseBusiness, Building2, Check, CheckCircle2, Clock3, FileText, HeartHandshake, MapPin, Send, ShieldCheck, Sparkles, Users, Zap } from "lucide-react";
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
      <div className="home-hero-glow glow-one" /><div className="home-hero-glow glow-two" />
      <div className="container home-hero-grid">
        <div className="home-hero-copy">
          <div className="hero-brand-lockup"><img src="/iraq-jobs-logo.jpg" alt="iraq jobs" /><span><b>iraq jobs</b><small>for job seekers</small></span></div>
          <span className="home-kicker"><Sparkles size={15} /> الفرص العراقية، بشكل أوضح</span>
          <h1>خطوتك الجاية<br /><em>تبدأ من هنا.</em></h1>
          <p>منصة تجمع الباحثين عن عمل مع الوظائف والجهات التي تبحث عن مهاراتهم. ابحث، قدّم، وخلي الفرصة تقرب لك.</p>
          <div className="hero-actions"><button className="primary-btn large" onClick={() => onNavigate("jobs")}>استكشف الوظائف <ArrowLeft size={18} /></button><button className="home-secondary-btn" onClick={() => onNavigate("job-request")}><Building2 size={17} /> أنا جهة توظيف</button></div>
          <div className="home-trust-row"><span><CheckCircle2 size={15} /> وظائف محدثة</span><span><ShieldCheck size={15} /> تجربة مجانية للمتقدم</span><span><Zap size={15} /> تصفح سريع</span></div>
        </div>
        <div className="home-live-panel">
          <div className="home-live-head"><div><span className="live-dot" /><b>تتحرك الآن</b></div><small>{jobs.length} فرصة متاحة</small></div>
          <div className="home-live-title"><span>أحدث الوظائف</span><button onClick={() => onNavigate("jobs")}>عرض الكل <ArrowLeft size={14} /></button></div>
          <div className="home-live-list">{jobs.slice(0, 3).map((job, index) => <button className="home-live-job" key={job.id} onClick={() => onOpenJob(job)}><span className={`mini-icon icon-${index + 1}`}><BriefcaseBusiness size={16} /></span><span><b>{job.title}</b><small>{job.company_name} · {job.city}</small></span><ArrowLeft size={15} /></button>)}{jobs.length === 0 && <div className="empty-mini">لا توجد وظائف منشورة حالياً</div>}</div>
          <div className="home-live-footer"><span><Clock3 size={14} /> آخر الفرص أولاً</span><span>iraq jobs</span></div>
        </div>
      </div>
    </section>

    <section className="stats-strip"><div className="container stats-grid"><Stat icon={<BriefcaseBusiness />} value={`${jobs.length || "—"}`} label="وظيفة منشورة" /><Stat icon={<Users />} value={`${requests.length || "—"}`} label="طلب HR مفتوح" /><Stat icon={<HeartHandshake />} value="100%" label="مجاني للمتقدمين" /></div></section>

    <section className="container section-block home-jobs-section"><SectionHeading eyebrow="اختيارات اليوم" title="فرص تستحق نظرتك" action="كل الوظائف" onAction={() => onNavigate("jobs")} /><p className="home-section-lead">وظائف مختارة ومحدثة حتى تختصر وقت البحث وتبدأ التقديم بثقة.</p><div className="job-grid">{loading ? <LoadingCards /> : jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div></section>

    <section className="container home-how-section"><div className="home-section-heading"><div><span className="eyebrow"><Zap size={14} /> أبسط مما تتوقع</span><h2>من البحث إلى الخطوة الجاية</h2></div><p>كل شيء مصمم حتى تركز على الفرصة، مو على التعقيد.</p></div><div className="home-steps"><Step number="01" icon={<MapPin size={19} />} title="اختار فرصتك" text="تصفح الوظائف حسب المجال والمدينة ونوع الدوام." /><Step number="02" icon={<FileText size={19} />} title="اعرف التفاصيل" text="شوف الوصف والمتطلبات وطريقة التواصل بوضوح." /><Step number="03" icon={<Send size={19} />} title="قدّم مباشرة" text="أرسل سيرتك أو تواصل مع الجهة بخطوة بسيطة." /></div></section>

    <section className="container section-block home-requests-section"><SectionHeading eyebrow="للمهارات المطلوبة" title="طلبات HR" action="كل الطلبات" onAction={() => onNavigate("requests")} /><div className="request-grid">{requests.length ? requests.slice(0, 3).map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpenRequest(request)} />) : <div className="wide-empty"><FileText size={26} /><b>طلبات HR ستظهر هنا</b><span>تابع الطلبات الجديدة حسب اختصاصك.</span></div>}</div></section>

    <section className="container home-employer-cta"><div className="home-cta-icon"><Building2 size={25} /></div><div><span className="eyebrow light">لأصحاب الشركات والـ HR</span><h2>عندك فرصة؟ خلّها توصل للشخص الصح.</h2><p>أرسل تفاصيل الوظيفة، وفريقنا يراجعها قبل نشرها للباحثين عن عمل.</p></div><button className="light-btn" onClick={() => onNavigate("job-request")}>انشر وظيفة <ArrowLeft size={17} /></button></section>
  </>;
}