import { ArrowLeft, BriefcaseBusiness, Building2, MapPin } from "lucide-react";
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

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="home-v3-stat"><strong>{value}</strong><span>{label}</span></div>;
}

function MethodStep({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="home-v3-method"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>;
}

export function HomePage({ jobs, requests, loading, onNavigate, onOpenJob, onOpenRequest }: HomePageProps) {
  return <main className="home-page-v3">
    <section className="home-v3-hero">
      <div className="container">
        <div className="home-v3-hero-grid">
          <div className="home-v3-hero-copy">
            <div className="home-v3-brand-lockup"><img src="/iraq-jobs-logo.jpg" alt="iraq jobs" /><span><strong>IRAQ JOBS</strong><small>FOR JOB SEEKERS</small></span></div>
            <span className="home-v3-overline">فرص العمل في العراق <i /> منصة توظيف موثوقة</span>
            <h1>وظيفتك القادمة<br /><span>تبدأ بخطوة واضحة.</span></h1>
            <p>اعثر على الفرصة المناسبة، راجع التفاصيل، وتواصل مع الجهة مباشرة.</p>
            <div className="home-v3-actions">
              <button className="primary-btn large" onClick={() => onNavigate("jobs")}>استعرض الوظائف <ArrowLeft size={18} /></button>
              <span className="home-v3-action-note"><BriefcaseBusiness size={15} /> {jobs.length} وظيفة منشورة</span>
            </div>
          </div>

          <div className="home-v3-featured">
            <div className="home-v3-featured-head">
              <div><small>آخر التحديثات</small><h2>وظائف جديدة</h2></div>
              <span>{jobs.length}</span>
            </div>
            <div className="home-v3-featured-list">
              {jobs.slice(0, 3).map((job, index) => <button className="home-v3-featured-job" key={job.id} onClick={() => onOpenJob(job)}>
                <span className="home-v3-job-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="home-v3-featured-job-copy"><strong>{job.title}</strong><small>{job.company_name}</small><em><MapPin size={12} /> {job.city}</em></span>
                <ArrowLeft size={16} />
              </button>)}
              {jobs.length === 0 && <div className="home-v3-empty">لا توجد وظائف منشورة حالياً</div>}
            </div>
            <button className="home-v3-featured-link" onClick={() => onNavigate("jobs")}>مشاهدة كل الوظائف <ArrowLeft size={15} /></button>
          </div>
        </div>
      </div>
    </section>

    <section className="home-v3-stats">
      <div className="container home-v3-stats-grid">
        <Stat value={`${jobs.length || "—"}`} label="وظيفة منشورة" />
        <Stat value={`${requests.length || "—"}`} label="طلب HR مفتوح" />
        <Stat value="مباشر" label="التواصل مع الجهة" />
        <Stat value="مجاني" label="للباحث عن عمل" />
      </div>
    </section>

    <section className="container home-v3-section home-v3-jobs">
      <div className="home-v3-section-head">
        <div><span>الفرص الحالية</span><h2>وظائف تستحق نظرتك</h2></div>
        <button className="home-v3-text-link" onClick={() => onNavigate("jobs")}>كل الوظائف <ArrowLeft size={15} /></button>
      </div>
      <div className="job-grid home-v3-job-grid">{loading ? <LoadingCards /> : jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div>
    </section>

    <section className="container home-v3-section home-v3-method-section">
      <div className="home-v3-section-head"><div><span>طريقة بسيطة</span><h2>من البحث إلى التواصل</h2></div><p>كل ما تحتاجه للوصول إلى فرصتك.</p></div>
      <div className="home-v3-method-grid">
        <MethodStep number="01" title="ابحث" text="استخدم المجال أو المدينة أو نوع الدوام." />
        <MethodStep number="02" title="راجع" text="اقرأ الوصف والمتطلبات والراتب." />
        <MethodStep number="03" title="تواصل" text="تواصل مباشرة مع الجهة الناشرة." />
      </div>
    </section>

    {requests.length > 0 && <section className="container home-v3-section home-v3-requests">
      <div className="home-v3-section-head"><div><span>للمهارات المطلوبة</span><h2>طلبات HR</h2></div><button className="home-v3-text-link" onClick={() => onNavigate("requests")}>كل الطلبات <ArrowLeft size={15} /></button></div>
      <div className="request-grid">{requests.slice(0, 3).map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpenRequest(request)} />)}</div>
    </section>}

    <section className="container home-v3-employer">
      <div className="home-v3-employer-mark"><Building2 size={21} /></div>
      <div><small>لأصحاب الشركات والـ HR</small><strong>لديك وظيفة شاغرة؟ أرسل تفاصيلها للمراجعة.</strong></div>
      <span>iraq jobs</span>
    </section>
  </main>;
}