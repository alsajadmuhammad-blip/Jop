import { ArrowLeft, BriefcaseBusiness, Building2, Check, FileText, HeartHandshake, Send, Sparkles, Users } from "lucide-react";
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

export function HomePage({ jobs, requests, loading, onNavigate, onOpenJob, onOpenRequest }: HomePageProps) {
  return <><section className="hero-section"><div className="hero-orb orb-one" /><div className="hero-orb orb-two" /><div className="container hero-grid"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15} /> فرصتك الجاية تبدأ من هنا</div><h1>نقرّبك من<br /><span>الفرصة الصح.</span></h1><p>وظائف وفرص عراقية، بطريقة أوضح وأسرع.</p><div className="hero-actions"><button className="primary-btn large" onClick={() => onNavigate("jobs")}>استكشف الوظائف <ArrowLeft size={18} /></button><button className="text-btn" onClick={() => onNavigate("requests")}>أرسل سيرتك الذاتية <Send size={17} /></button></div></div><div className="hero-card"><div className="hero-card-top"><span className="live-dot" /> أحدث الوظائف</div>{jobs.slice(0, 3).map((job, index) => <button className="mini-job" key={job.id} onClick={() => onOpenJob(job)}><span className={`mini-icon icon-${index + 1}`}><Building2 size={17} /></span><span><b>{job.title}</b><small>{job.company_name} · {job.city}</small></span><ArrowLeft size={16} /></button>)}{jobs.length === 0 && <div className="empty-mini">لا توجد وظائف منشورة حالياً</div>}<button className="hero-card-link" onClick={() => onNavigate("jobs")}>عرض كل الوظائف <ArrowLeft size={15} /></button></div></div></section><section className="stats-strip"><div className="container stats-grid"><Stat icon={<BriefcaseBusiness />} value={`${jobs.length || "—"}`} label="وظيفة منشورة" /><Stat icon={<Users />} value="HR" label="جهات توظف" /><Stat icon={<HeartHandshake />} value="100%" label="مجاني للمتقدمين" /></div></section><section className="container section-block"><SectionHeading eyebrow="آخر الفرص" title="وظائف جديدة" action="كل الوظائف" onAction={() => onNavigate("jobs")} /><div className="job-grid">{loading ? <LoadingCards /> : jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div></section><section className="container section-block"><SectionHeading eyebrow="طلبات HR" title="اختصاصك مطلوب؟" action="كل الطلبات" onAction={() => onNavigate("requests")} /><div className="request-grid">{requests.length ? requests.slice(0, 3).map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpenRequest(request)} />) : <div className="wide-empty"><FileText size={26} /><b>طلبات HR ستظهر هنا</b><span>تابع الطلبات الجديدة حسب اختصاصك.</span></div>}</div></section><section className="container cta-section"><div><span className="eyebrow light"><HeartHandshake size={15} /> للباحثين عن عمل</span><h2>ما لكيت الوظيفة المناسبة؟<br />خلّي الـHR يوصل لك.</h2></div><button className="light-btn" onClick={() => onNavigate("requests")}>شوف طلبات HR <ArrowLeft size={17} /></button></section></>;
}