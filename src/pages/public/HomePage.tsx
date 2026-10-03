import { ArrowLeft, BadgeCheck, BriefcaseBusiness, Building2, CheckCircle2, CircleDollarSign, HeartHandshake, MapPin, Search, Send, ShieldCheck, Users } from "lucide-react";
import { JobCard } from "../../features/jobs/JobCard";
import { RequestCard } from "../../features/requests/RequestCard";
import type { View } from "../../app/types";
import type { CVRequest, Job } from "../../lib/types";
import { LoadingCards } from "../../components/common/Feedback";

type HomePageProps = {
  jobs: Job[];
  requests: CVRequest[];
  hasMoreJobs: boolean;
  hasMoreRequests: boolean;
  loading: boolean;
  onNavigate: (view: View) => void;
  onOpenJob: (job: Job) => void;
  onOpenRequest: (request: CVRequest) => void;
};

function TrustItem({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return <article className="home-refresh-trust-item"><span><Icon size={20} /></span><div><strong>{title}</strong><p>{text}</p></div></article>;
}

function Step({ number, icon: Icon, title, text }: { number: string; icon: typeof Search; title: string; text: string }) {
  return <article className="home-refresh-step"><span className="home-refresh-step-number">{number}</span><span className="home-refresh-step-icon"><Icon size={20} /></span><div><h3>{title}</h3><p>{text}</p></div></article>;
}

export function HomePage({ jobs, requests, hasMoreJobs, hasMoreRequests, loading, onNavigate, onOpenJob, onOpenRequest }: HomePageProps) {
  return <main className="home-refresh">
    <section className="home-refresh-hero">
      <div className="container home-refresh-hero-inner">
        <div className="home-refresh-frame">
          <div className="home-refresh-image-wrap">
            <img
              className="home-refresh-hero-image"
              src="/images/iraq-heritage-home.webp?v=2"
              alt="مشهد فني لآثار ومعالم بلاد الرافدين التاريخية"
              fetchPriority="high"
            />
          </div>

          <div className="home-refresh-hero-content">
            <div className="home-refresh-hero-copy">
              <span className="home-refresh-eyebrow"><HeartHandshake size={16} /> فرصة عادلة للجميع</span>
              <h1>نساعدك توصل<br /><em>للفرصة المناسبة.</em></h1>
              <p>منصة عراقية مجانية تجمع الباحثين عن عمل مع الجهات التي تبحث عن كفاءات. تصفح، قدّم، وابدأ خطوتك القادمة بدون رسوم.</p>
              <div className="home-refresh-actions">
                <button className="primary-btn large" onClick={() => onNavigate("jobs")}>تصفح الوظائف <ArrowLeft size={18} /></button>
                <button className="home-refresh-secondary-btn" onClick={() => onNavigate("signup")}>أنشئ حسابك مجاناً <UserPlusIcon /></button>
              </div>
              <div className="home-refresh-proof">
                <span><CheckCircle2 size={15} /> مجاني للباحثين عن عمل</span>
                <span><CheckCircle2 size={15} /> مجاني للجهات الناشرة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="home-refresh-trust">
      <div className="container home-refresh-trust-grid">
        <TrustItem icon={CircleDollarSign} title="بدون أي رسوم" text="لا نأخذ أجوراً من أي طرف." />
        <TrustItem icon={ShieldCheck} title="منصة مستقلة" text="ننشر الفرص فقط ولا نوظف." />
        <TrustItem icon={BadgeCheck} title="اختيارك بيدك" text="تتواصل مباشرة مع الجهة." />
      </div>
    </section>

    <section className="container home-refresh-section home-refresh-jobs">
      <div className="home-refresh-section-heading"><div><span>آخر الفرص</span><h2>وظائف جديدة تستحق نظرتك</h2></div><button className="home-refresh-text-link" onClick={() => onNavigate("jobs")}>كل الوظائف <ArrowLeft size={15} /></button></div>
      <div className="job-grid home-refresh-job-grid">{loading ? <LoadingCards /> : jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div>
      {!loading && jobs.length === 0 && <div className="home-refresh-jobs-empty"><BriefcaseBusiness size={20} /><p>ماكو وظائف منشورة حالياً. تابعنا حتى توصلك الفرص الجديدة.</p></div>}
    </section>

    <section className="home-refresh-audience-section">
      <div className="container">
        <div className="home-refresh-section-heading centered"><div><span>مصممة للطرفين</span><h2>كل طرف يلقى اللي يحتاجه</h2></div><p>حساب مجاني، تجربة واضحة، وبدون عمولات مخفية.</p></div>
        <div className="home-refresh-audience-grid">
          <article className="home-refresh-audience-card candidate"><span className="home-refresh-audience-icon"><Users size={24} /></span><small>للباحثين عن عمل</small><h3>دور على فرصتك بثقة</h3><p>استعرض الوظائف، احفظ اللي يعجبك، وقدّم أو تواصل مع الجهة الناشرة مباشرة.</p><button onClick={() => onNavigate("signup")}>إنشاء حساب باحث عن عمل <ArrowLeft size={16} /></button></article>
          <article className="home-refresh-audience-card employer"><span className="home-refresh-audience-icon"><Building2 size={24} /></span><small>للشركات و HR</small><h3>انشر فرصتك مجاناً</h3><p>أرسل تفاصيل الوظيفة للمراجعة والنشر، ووصل إلى الباحثين عن عمل بدون أي تكلفة.</p><button onClick={() => onNavigate("job-request")}>أرسل وظيفة للنشر <Send size={16} /></button></article>
        </div>
      </div>
    </section>

    <section className="container home-refresh-section home-refresh-how">
      <div className="home-refresh-section-heading"><div><span>كيف تعمل المنصة؟</span><h2>ثلاث خطوات واضحة</h2></div><p>ماكو تعقيد، وماكو رسوم.</p></div>
      <div className="home-refresh-steps"><Step number="01" icon={Search} title="ابحث" text="استخدم الوظائف المنشورة وابحث حسب المجال أو المدينة." /><Step number="02" icon={CheckCircle2} title="اختار" text="راجع التفاصيل والمتطلبات وتأكد أن الفرصة تناسبك." /><Step number="03" icon={Send} title="تواصل" text="قدّم أو تواصل مباشرة مع الجهة المعلنة." /></div>
    </section>

    <section className="container home-refresh-notice">
      <div className="home-refresh-notice-icon"><ShieldCheck size={24} /></div>
      <div><strong>مهم تعرف</strong><p>IRAQ JOBS منصة مجانية وخيرية لنشر الوظائف فقط. لا نأخذ أجوراً مقابل نشر الوظائف أو التوظيف أو التقديم، ولا نتحمل مسؤولية صحة الإعلانات أو نتائج التواصل بين الأطراف.</p></div>
    </section>
    {requests.length > 0 && <section className="container home-refresh-request-hint"><span>{requests.length}{hasMoreRequests ? "+" : ""} طلب توظيف مفتوح</span><button onClick={() => onNavigate("jobs")}>استعرض الفرص <ArrowLeft size={15} /></button></section>}
  </main>;
}

function UserPlusIcon() {
  return <span aria-hidden="true">+</span>;
}