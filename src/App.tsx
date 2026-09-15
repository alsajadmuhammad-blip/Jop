import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  HeartHandshake,
  LayoutDashboard,
  LoaderCircle,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { supabase, hasSupabaseConfig } from "./lib/supabase";
import type { Application, ApplicationStatus, CVRequest, Job, JobType, PostStatus, Profile } from "./lib/types";

type View = "home" | "jobs" | "requests" | "admin" | "hr";
type Modal = "job" | "request" | "login" | "admin-post" | null;

const jobTypes: JobType[] = ["دوام كامل", "دوام جزئي", "عن بُعد", "تدريب", "عمل حر"];
const categories = ["تقنية", "إدارة", "تسويق", "تصميم", "مالية", "هندسة", "موارد بشرية", "خدمة عملاء"];

const demoJobs: Job[] = [
  {
    id: "demo-1",
    title: "مطور واجهات أمامية",
    company_name: "شركة حلول رقمية",
    category: "تقنية",
    city: "بغداد",
    job_type: "دوام كامل",
    description: "نبحث عن مطور واجهات أمامية للانضمام إلى فريق منتج يعمل على حلول رقمية تخدم السوق العراقي.",
    requirements: ["خبرة React أو Vue", "فهم جيد لـ HTML و CSS", "القدرة على العمل ضمن فريق"],
    salary_range: "1,500,000 – 2,200,000 د.ع",
    status: "published",
    created_at: new Date().toISOString(),
    deadline: null,
    created_by: null,
  },
  {
    id: "demo-2",
    title: "مسؤول موارد بشرية",
    company_name: "مجموعة النخبة",
    category: "موارد بشرية",
    city: "أربيل",
    job_type: "دوام كامل",
    description: "فرصة لمسؤول موارد بشرية لديه شغف ببناء فرق قوية وتحسين تجربة الموظفين.",
    requirements: ["خبرة سنتان على الأقل", "مهارات تواصل ممتازة", "إجادة برامج Office"],
    salary_range: "1,000,000 – 1,500,000 د.ع",
    status: "published",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    deadline: null,
    created_by: null,
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ar-IQ", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function App() {
  const [view, setView] = useState<View>(() => (window.location.hash.replace("#", "") as View) || "home");
  const [modal, setModal] = useState<Modal>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CVRequest | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<CVRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");

  const navigate = (next: View) => {
    setView(next);
    setMobileMenu(false);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };

  const loadPublicData = async () => {
    if (!hasSupabaseConfig) {
      setJobs(demoJobs);
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: jobData }, { data: requestData }] = await Promise.all([
      supabase.from("jobs").select("*").eq("status", "published").order("created_at", { ascending: false }),
      supabase.from("cv_requests").select("*").eq("status", "published").order("created_at", { ascending: false }),
    ]);
    setJobs((jobData as Job[]) || []);
    setRequests((requestData as CVRequest[]) || []);
    setLoading(false);
  };

  const loadSession = async () => {
    if (!hasSupabaseConfig) return;
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) await loadProfile(data.session.user.id);
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) void loadProfile(session.user.id);
      else setProfile(null);
    });
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("id, full_name, role, organization").eq("id", userId).single();
    setProfile((data as Profile) || null);
  };

  useEffect(() => {
    void Promise.all([loadPublicData(), loadSession()]);
    const onHash = () => setView((window.location.hash.replace("#", "") as View) || "home");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if ((view === "admin" || view === "hr") && !profile) setModal("login");
    if (view === "admin" && profile && profile.role !== "admin") notify("هذه الصفحة مخصصة للإدارة");
  }, [view, profile]);

  useEffect(() => {
    if (profile?.role === "admin" || profile?.role === "hr") {
      void loadApplications();
    }
  }, [profile]);

  const loadApplications = async () => {
    const { data } = await supabase
      .from("applications")
      .select("*, jobs(title, company_name), cv_requests(title, organization_name)")
      .order("created_at", { ascending: false });
    setApplications((data as Application[]) || []);
  };

  const publishedJobs = useMemo(() => jobs.filter((job) => job.status === "published"), [jobs]);

  const openJob = (job: Job) => {
    setSelectedJob(job);
    setModal("job");
  };

  const openRequest = (request: CVRequest) => {
    setSelectedRequest(request);
    setModal("request");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    navigate("home");
    notify("تم تسجيل الخروج");
  };

  return (
    <div className="app-shell">
      <Header view={view} profile={profile} onNavigate={navigate} onLogin={() => setModal("login")} onLogout={signOut} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
      <main>
        {!hasSupabaseConfig && <div className="config-banner"><ShieldCheck size={16} /> وضع المعاينة فعال — أضف إعدادات Supabase لتشغيل البيانات الحقيقية.</div>}
        {view === "home" && <Home jobs={publishedJobs} requests={requests} loading={loading} onNavigate={navigate} onOpenJob={openJob} onOpenRequest={openRequest} />}
        {view === "jobs" && <JobsPage jobs={publishedJobs} loading={loading} onOpenJob={openJob} />}
        {view === "requests" && <RequestsPage requests={requests} loading={loading} onOpenRequest={openRequest} />}
        {view === "admin" && profile?.role === "admin" && <AdminPage jobs={jobs} requests={requests} applications={applications} onRefresh={() => { void loadPublicData(); void loadApplications(); }} onNotify={notify} />}
        {view === "hr" && profile?.role === "hr" && <HRPage applications={applications} onRefresh={() => void loadApplications()} onNotify={notify} />}
      </main>
      <Footer />
      {modal === "job" && selectedJob && <JobModal job={selectedJob} onClose={() => setModal(null)} onSubmitted={() => { setModal(null); notify("وصل طلبك بنجاح. بالتوفيق!"); }} />}
      {modal === "request" && selectedRequest && <RequestModal request={selectedRequest} onClose={() => setModal(null)} onSubmitted={() => { setModal(null); notify("تم إرسال سيرتك الذاتية إلى الجهة المختصة."); }} />}
      {modal === "login" && <LoginModal onClose={() => setModal(null)} onSuccess={(nextProfile) => { setProfile(nextProfile); setModal(null); notify("تم تسجيل الدخول"); }} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  );
}

function Header({ view, profile, onNavigate, onLogin, onLogout, mobileMenu, setMobileMenu }: { view: View; profile: Profile | null; onNavigate: (view: View) => void; onLogin: () => void; onLogout: () => void; mobileMenu: boolean; setMobileMenu: (value: boolean) => void }) {
  const links: { label: string; view: View }[] = [
    { label: "الوظائف", view: "jobs" },
    { label: "طلبات HR", view: "requests" },
  ];
  return (
    <header className="site-header">
      <div className="nav-wrap">
        <button className="brand" onClick={() => onNavigate("home")} aria-label="الصفحة الرئيسية">
          <span className="brand-mark"><BriefcaseBusiness size={19} /></span>
          <span><b>مسار</b><small>وظائف العراق</small></span>
        </button>
        <nav className={mobileMenu ? "main-nav open" : "main-nav"}>
          {links.map((link) => <button key={link.view} className={view === link.view ? "nav-link active" : "nav-link"} onClick={() => onNavigate(link.view)}>{link.label}</button>)}
          {profile?.role === "admin" && <button className={view === "admin" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("admin")}><LayoutDashboard size={16} /> الإدارة</button>}
          {profile?.role === "hr" && <button className={view === "hr" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("hr")}><Users size={16} /> مساحة HR</button>}
        </nav>
        <div className="header-actions">
          {profile ? <button className="profile-chip" onClick={onLogout}><span>{(profile.full_name || "مستخدم").slice(0, 1)}</span>{profile.full_name || "حسابي"}<LogOut size={15} /></button> : <button className="login-btn" onClick={onLogin}><LogIn size={16} /> دخول</button>}
          <button className="menu-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="القائمة"><Menu size={21} /></button>
        </div>
      </div>
    </header>
  );
}

function Home({ jobs, requests, loading, onNavigate, onOpenJob, onOpenRequest }: { jobs: Job[]; requests: CVRequest[]; loading: boolean; onNavigate: (view: View) => void; onOpenJob: (job: Job) => void; onOpenRequest: (request: CVRequest) => void }) {
  return (
    <>
      <section className="hero-section">
        <div className="hero-orb orb-one" /><div className="hero-orb orb-two" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> فرصتك الجاية تبدأ من هنا</div>
            <h1>نقرّبك من<br /><span>الفرصة الصح.</span></h1>
            <p>منصة عراقية تجمع الباحثين عن عمل مع الشركات والـHR بطريقة أوضح، أسرع، وأقرب للناس.</p>
            <div className="hero-actions"><button className="primary-btn large" onClick={() => onNavigate("jobs")}>استكشف الوظائف <ArrowLeft size={18} /></button><button className="text-btn" onClick={() => onNavigate("requests")}>أرسل سيرتك الذاتية <Send size={17} /></button></div>
            <div className="hero-trust"><span><span className="avatar-stack"><i>ع</i><i>م</i><i>س</i></span> آلاف الباحثين عن فرصة</span><span className="dot-sep" /><span>وظائف موثوقة من السوق العراقي</span></div>
          </div>
          <div className="hero-card">
            <div className="hero-card-top"><span className="live-dot" /> آخر الوظائف المنشورة <span>هذا الأسبوع</span></div>
            {jobs.slice(0, 3).map((job, index) => <button className="mini-job" key={job.id} onClick={() => onOpenJob(job)}><span className={`mini-icon icon-${index + 1}`}><Building2 size={17} /></span><span><b>{job.title}</b><small>{job.company_name} · {job.city}</small></span><ArrowLeft size={16} /></button>)}
            {jobs.length === 0 && <div className="empty-mini">لا توجد وظائف منشورة حالياً</div>}
            <button className="hero-card-link" onClick={() => onNavigate("jobs")}>عرض كل الوظائف <ArrowLeft size={15} /></button>
          </div>
        </div>
      </section>
      <section className="stats-strip"><div className="container stats-grid"><Stat icon={<BriefcaseBusiness />} value={`${jobs.length || "—"}`} label="وظيفة منشورة" /><Stat icon={<Users />} value="HR" label="جهات تبحث عن مواهب" /><Stat icon={<HeartHandshake />} value="100%" label="مجاني للمتقدمين" /></div></section>
      <section className="container section-block"><SectionHeading eyebrow="آخر الفرص" title="وظائف ممكن تكون بدايتك" action="كل الوظائف" onAction={() => onNavigate("jobs")} /><div className="job-grid">{loading ? <LoadingCards /> : jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div></section>
      <section className="container section-block"><SectionHeading eyebrow="مطلوبة من HR" title="اختصاصك مطلوب؟ أرسل CV" action="كل الطلبات" onAction={() => onNavigate("requests")} /><div className="request-grid">{requests.length ? requests.slice(0, 3).map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpenRequest(request)} />) : <div className="wide-empty"><FileText size={26} /><b>طلبات الـHR ستظهر هنا</b><span>تابع هذه الصفحة لتعرف الاختصاصات المطلوبة حالياً.</span></div>}</div></section>
      <section className="container cta-section"><div><span className="eyebrow light"><HeartHandshake size={15} /> للباحثين عن عمل</span><h2>ما لكيت الوظيفة المناسبة؟<br />خلّي الـHR يوصل لك.</h2><p>أرسل سيرتك الذاتية مرة واحدة للطلب المناسب، ونوصلها للجهة اللي تبحث عن اختصاصك.</p></div><button className="light-btn" onClick={() => onNavigate("requests")}>شوف طلبات الـHR <ArrowLeft size={17} /></button></section>
    </>
  );
}

function JobsPage({ jobs, loading, onOpenJob }: { jobs: Job[]; loading: boolean; onOpenJob: (job: Job) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const filtered = jobs.filter((job) => `${job.title} ${job.company_name} ${job.city}`.toLowerCase().includes(query.toLowerCase()) && (category === "الكل" || job.category === category));
  return <section className="container page-section"><PageIntro eyebrow="فرص العمل" title="وظائف منشورة وواضحة" description="تصفح الفرص المنشورة من الشركات والجهات العراقية، وقدّم مباشرة بدون تعقيد." /><div className="filters-bar"><div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن وظيفة، شركة، أو مدينة..." /></div><div className="select-field"><Filter size={16} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option>الكل</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div></div>{loading ? <LoadingCards /> : filtered.length ? <div className="job-grid wide">{filtered.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div> : <EmptyState title="ماكو وظائف بهذا البحث" text="جرّب كلمة ثانية أو ارجع لاحقاً، الوظائف الجديدة تنزل باستمرار." />}</section>;
}

function RequestsPage({ requests, loading, onOpenRequest }: { requests: CVRequest[]; loading: boolean; onOpenRequest: (request: CVRequest) => void }) {
  return <section className="container page-section"><PageIntro eyebrow="طلبات الـHR" title="اختصاصات مطلوبة حالياً" description="هذه الطلبات تنزل من كروبات وفرق HR. إذا اختصاصك مطابق، أرسل CV مباشرة للجهة." />{loading ? <LoadingCards /> : requests.length ? <div className="request-grid wide">{requests.map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpenRequest(request)} />)}</div> : <EmptyState title="لا توجد طلبات منشورة حالياً" text="تابعنا، أول ما يطلبون اختصاصات جديدة راح تظهر هنا." />}</section>;
}

function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return <button className="job-card" onClick={onClick}><div className="card-top"><span className="company-logo"><Building2 size={19} /></span><span className="saved-icon"><HeartHandshake size={17} /></span></div><div className="card-body"><span className="category-label">{job.category || "عام"}</span><h3>{job.title}</h3><p className="company-name">{job.company_name}</p><div className="job-meta"><span><MapPin size={14} />{job.city}</span><span><Clock3 size={14} />{job.job_type}</span></div></div><div className="card-footer"><span>{job.salary_range || "الراتب يحدد بالمقابلة"}</span><b>{formatDate(job.created_at)}</b></div></button>;
}

function RequestCard({ request, onClick }: { request: CVRequest; onClick: () => void }) {
  return <button className="request-card" onClick={onClick}><div className="request-icon"><Users size={22} /></div><div className="request-content"><div className="card-top-line"><span className="urgent-label">طلب CV</span><span className="date-label">{formatDate(request.created_at)}</span></div><h3>{request.title}</h3><p>{request.organization_name}</p><div className="specialization"><span>الاختصاص المطلوب</span><b>{request.specialization}</b></div></div><ArrowLeft className="request-arrow" size={18} /></button>;
}

function JobModal({ job, onClose, onSubmitted }: { job: Job; onClose: () => void; onSubmitted: () => void }) {
  return <ModalShell onClose={onClose} title="التقديم على الوظيفة"><div className="modal-job-head"><span className="company-logo large"><Building2 size={24} /></span><div><h2>{job.title}</h2><p>{job.company_name} · {job.city}</p></div></div><div className="detail-chips"><span><Clock3 size={15} />{job.job_type}</span><span><MapPin size={15} />{job.city}</span><span><BriefcaseBusiness size={15} />{job.category}</span></div><div className="modal-copy"><h4>عن الوظيفة</h4><p>{job.description}</p><h4>المتطلبات</h4><ul>{job.requirements.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div><ApplicationForm jobId={job.id.startsWith("demo") ? null : job.id} onSubmitted={onSubmitted} /></ModalShell>;
}

function RequestModal({ request, onClose, onSubmitted }: { request: CVRequest; onClose: () => void; onSubmitted: () => void }) {
  return <ModalShell onClose={onClose} title="إرسال السيرة الذاتية"><div className="modal-job-head"><span className="request-icon large"><Users size={24} /></span><div><h2>{request.title}</h2><p>{request.organization_name}</p></div></div><div className="request-detail"><span>الاختصاص المطلوب</span><b>{request.specialization}</b><p>{request.details}</p></div><ApplicationForm requestId={request.id} onSubmitted={onSubmitted} /></ModalShell>;
}

function ApplicationForm({ jobId, requestId, onSubmitted }: { jobId?: string | null; requestId?: string; onSubmitted: () => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", note: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setError("أرفق ملف الـCV بصيغة PDF.");
    if (file.type !== "application/pdf") return setError("نقبل ملفات PDF فقط.");
    if (file.size > 5 * 1024 * 1024) return setError("حجم الملف يجب أن يكون أقل من 5MB.");
    setSaving(true); setError("");
    if (!hasSupabaseConfig || !jobId && !requestId) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaving(false); onSubmitted(); return;
    }
    try {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const upload = await supabase.storage.from("cvs").upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upload.error) throw upload.error;
      const { error: insertError } = await supabase.from("applications").insert({ job_id: jobId || null, cv_request_id: requestId || null, ...form, cv_path: path });
      if (insertError) throw insertError;
      setSaving(false); onSubmitted();
    } catch (submitError) {
      setSaving(false); setError(submitError instanceof Error ? submitError.message : "تعذر إرسال الطلب.");
    }
  };
  return <form className="application-form" onSubmit={submit}><div className="form-grid"><label>الاسم الكامل<input required value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="اكتب اسمك الثلاثي" /></label><label>رقم الهاتف<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div><label>البريد الإلكتروني<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@email.com" dir="ltr" /></label><label>رسالة قصيرة <span className="optional">اختياري</span><textarea value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="اكتب أي معلومة تحب توصلها للجهة..." rows={3} /></label><label className="file-drop"><input required type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><FileText size={21} /><span>{file ? file.name : "اضغط لرفع CV بصيغة PDF"}</span><small>الحد الأقصى 5MB</small></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Send size={17} />}{saving ? "جاري الإرسال..." : "إرسال الطلب"}</button></form>;
}

function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (profile: Profile) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    if (!hasSupabaseConfig) { setSaving(false); setError("أضف إعدادات Supabase حتى تسجل الدخول."); return; }
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !data.user) { setSaving(false); setError(authError?.message || "بيانات الدخول غير صحيحة."); return; }
    const { data: profile } = await supabase.from("profiles").select("id, full_name, role, organization").eq("id", data.user.id).single();
    if (!profile) { setSaving(false); setError("الحساب غير مربوط بدور إداري أو HR."); return; }
    setSaving(false); onSuccess(profile as Profile);
  };
  return <ModalShell onClose={onClose} title="دخول الفريق"><div className="login-intro"><span className="brand-mark"><ShieldCheck size={19} /></span><p>دخول خاص بالإدارة وفرق HR لمتابعة الوظائف والسير الذاتية.</p></div><form className="application-form" onSubmit={submit}><label>البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" /></label><label>كلمة المرور<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} dir="ltr" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <LogIn size={17} />}{saving ? "جاري الدخول..." : "دخول"}</button></form></ModalShell>;
}

function ModalShell({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal-panel"><div className="modal-header"><h3>{title}</h3><button className="close-btn" onClick={onClose}><X size={19} /></button></div>{children}</div></div>;
}

function AdminPage({ jobs, requests, applications, onRefresh, onNotify }: { jobs: Job[]; requests: CVRequest[]; applications: Application[]; onRefresh: () => void; onNotify: (message: string) => void }) {
  const [postType, setPostType] = useState<"job" | "request">("job");
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [selectedTab, setSelectedTab] = useState<"posts" | "applications">("posts");
  const filteredJobs = jobs.filter((job) => statusFilter === "all" || job.status === statusFilter);
  const updateStatus = async (table: "jobs" | "cv_requests", id: string, status: PostStatus) => {
    const { error } = await supabase.from(table).update({ status }).eq("id", id);
    if (error) return onNotify(error.message);
    onNotify("تم تحديث حالة المنشور"); onRefresh();
  };
  return <section className="container page-section dashboard-page"><PageIntro eyebrow="لوحة الإدارة" title="خلّي النشر مرتب وواضح" description="أنشئ وظيفة أو طلب CV، راجع الطلبات، وخلي كل شيء محفوظ داخل Supabase." /><div className="dashboard-tabs"><button className={selectedTab === "posts" ? "selected" : ""} onClick={() => setSelectedTab("posts")}><LayoutDashboard size={16} /> المنشورات</button><button className={selectedTab === "applications" ? "selected" : ""} onClick={() => setSelectedTab("applications")}><FileText size={16} /> السير الذاتية <em>{applications.length}</em></button></div>{selectedTab === "posts" ? <><div className="dashboard-toolbar"><div className="filter-pills">{(["all", "published", "draft", "closed"] as const).map((item) => <button key={item} className={statusFilter === item ? "selected" : ""} onClick={() => setStatusFilter(item)}>{item === "all" ? "الكل" : item === "published" ? "منشور" : item === "draft" ? "مسودة" : "مغلق"}</button>)}</div><button className="primary-btn" onClick={() => setShowForm(!showForm)}><Plus size={17} /> منشور جديد</button></div>{showForm && <PostForm type={postType} onTypeChange={setPostType} onSaved={() => { setShowForm(false); onRefresh(); onNotify("تم حفظ المنشور"); }} /> }<div className="admin-list">{filteredJobs.map((job) => <AdminPost key={job.id} title={job.title} subtitle={`${job.company_name} · ${job.city}`} type="وظيفة" status={job.status} onPublish={() => updateStatus("jobs", job.id, job.status === "published" ? "closed" : "published")} />)}{requests.map((request) => <AdminPost key={request.id} title={request.title} subtitle={`${request.organization_name} · ${request.specialization}`} type="طلب CV" status={request.status} onPublish={() => updateStatus("cv_requests", request.id, request.status === "published" ? "closed" : "published")} />)}</div></> : <ApplicationsTable applications={applications} />}</section>;
}

function PostForm({ type, onTypeChange, onSaved }: { type: "job" | "request"; onTypeChange: (type: "job" | "request") => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", company_name: "", category: "تقنية", city: "بغداد", job_type: "دوام كامل" as JobType, description: "", requirements: "", salary_range: "", specialization: "", organization_name: "", details: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true);
    const payload = type === "job" ? { title: form.title, company_name: form.company_name, category: form.category, city: form.city, job_type: form.job_type, description: form.description, requirements: form.requirements.split("\n").filter(Boolean), salary_range: form.salary_range || null, status: "published" } : { title: form.title, specialization: form.specialization, organization_name: form.organization_name, details: form.details, status: "published" };
    const { error } = await supabase.from(type === "job" ? "jobs" : "cv_requests").insert(payload as never);
    setSaving(false); if (error) return alert(error.message); onSaved();
  };
  return <form className="post-form" onSubmit={submit}><div className="post-type"><button type="button" className={type === "job" ? "selected" : ""} onClick={() => onTypeChange("job")}><BriefcaseBusiness size={16} /> وظيفة</button><button type="button" className={type === "request" ? "selected" : ""} onClick={() => onTypeChange("request")}><Users size={16} /> طلب CV من HR</button></div><div className="form-grid"><label>العنوان<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={type === "job" ? "مثال: مطور تطبيقات" : "مثال: مطلوب CV لمطورين"} /></label><label>{type === "job" ? "اسم الشركة" : "اسم جهة HR"}<input required value={type === "job" ? form.company_name : form.organization_name} onChange={(event) => update(type === "job" ? "company_name" : "organization_name", event.target.value)} /></label></div>{type === "job" ? <><div className="form-grid"><label>التصنيف<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>المدينة<input value={form.city} onChange={(event) => update("city", event.target.value)} /></label></div><div className="form-grid"><label>نوع الدوام<select value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>{jobTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} /></label></div><label>الوصف<textarea required rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={3} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} /></label></> : <><label>الاختصاص المطلوب<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} placeholder="مثال: محاسبة، مبيعات، برمجة" /></label><label>تفاصيل الطلب<textarea required rows={5} value={form.details} onChange={(event) => update("details", event.target.value)} /></label></>}<button className="primary-btn" disabled={saving}>{saving ? "جاري الحفظ..." : "نشر الآن"} <Send size={16} /></button></form>;
}

function AdminPost({ title, subtitle, type, status, onPublish }: { title: string; subtitle: string; type: string; status: PostStatus; onPublish: () => void }) {
  return <div className="admin-row"><span className="row-icon"><FileText size={18} /></span><div><b>{title}</b><small>{type} · {subtitle}</small></div><span className={`status ${status}`}>{status === "published" ? "منشور" : status === "draft" ? "مسودة" : "مغلق"}</span><button className="row-action" onClick={onPublish}>{status === "published" ? "إغلاق" : "نشر"}</button></div>;
}

function ApplicationsTable({ applications }: { applications: Application[] }) {
  return <div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.jobs?.title || application.cv_requests?.title || "طلب CV"} · {application.phone}</small></div><span className={`status ${application.status}`}>{application.status === "new" ? "جديد" : application.status}</span><button className="row-action" onClick={async () => { const { data } = await supabase.storage.from("cvs").createSignedUrl(application.cv_path, 300); if (data?.signedUrl) window.open(data.signedUrl, "_blank"); }}>فتح CV</button></div>) : <EmptyState title="ماكو سير ذاتية بعد" text="طلبات المتقدمين راح تظهر هنا فور إرسالها." />}</div>;
}

function HRPage({ applications, onRefresh, onNotify }: { applications: Application[]; onRefresh: () => void; onNotify: (message: string) => void }) {
  const setStatus = async (id: string, status: ApplicationStatus) => { const { error } = await supabase.from("applications").update({ status }).eq("id", id); if (error) return onNotify(error.message); onNotify("تم تحديث حالة المتقدم"); onRefresh(); };
  return <section className="container page-section dashboard-page"><PageIntro eyebrow="مساحة HR" title="تابع السير الذاتية الواردة" description="كل CV وصل من خلال طلباتك محفوظ هنا، وتكدر تفتح الملف وتحدّث حالة المتقدم." /><div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.cv_requests?.title || application.jobs?.title || "طلب CV"} · {formatDate(application.created_at)}</small></div><select value={application.status} onChange={(event) => void setStatus(application.id, event.target.value as ApplicationStatus)}><option value="new">جديد</option><option value="reviewing">قيد المراجعة</option><option value="shortlisted">مرشح</option><option value="rejected">مرفوض</option></select><button className="row-action" onClick={async () => { const { data } = await supabase.storage.from("cvs").createSignedUrl(application.cv_path, 300); if (data?.signedUrl) window.open(data.signedUrl, "_blank"); }}>فتح CV</button></div>) : <EmptyState title="لا توجد طلبات واردة بعد" text="عند إرسال المتقدمين لسيرهم الذاتية راح تظهر هنا." />}</div></section>;
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>;
}
function SectionHeading({ eyebrow, title, action, onAction }: { eyebrow: string; title: string; action: string; onAction: () => void }) {
  return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><button className="outline-btn" onClick={onAction}>{action} <ArrowLeft size={15} /></button></div>;
}
function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) { return <div className="stat"><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>; }
function LoadingCards() { return <div className="job-grid"><div className="skeleton-card" /><div className="skeleton-card" /><div className="skeleton-card" /></div>; }
function EmptyState({ title, text }: { title: string; text: string }) { return <div className="empty-state"><span><Search size={24} /></span><h3>{title}</h3><p>{text}</p></div>; }
function Footer() { return <footer><div className="container footer-inner"><div className="brand"><span className="brand-mark"><BriefcaseBusiness size={17} /></span><span><b>مسار</b><small>وظائف العراق</small></span></div><p>منصة مستقلة تربط الناس بالفرص المناسبة.</p><span>© {new Date().getFullYear()} مسار</span></div></footer>; }

export default App;