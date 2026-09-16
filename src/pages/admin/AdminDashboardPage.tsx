import { useMemo, useState } from "react";
import { BarChart3, BriefcaseBusiness, Check, CheckCircle2, Clock3, FileText, LayoutDashboard, Link2, Plus, RefreshCw, Send, Settings2, Users, X } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { categories, jobTypes } from "../../lib/constants";
import { formatDate } from "../../lib/format";
import type { Application, ApplicationStatus, CVRequest, Job, JobRequest, JobType, PostStatus } from "../../lib/types";
import { createCvRequest, createJob, updatePostStatus } from "../../services/adminService";
import { openApplicationCv } from "../../services/applicationService";
import type { Notify, View } from "../../app/types";
import { JobRequestReviewList } from "../../features/jobs/JobRequestReviewList";

type AdminSection = "overview" | "jobs" | "job-requests" | "applications";
type PostType = "job" | "request";

type AdminDashboardProps = {
  jobs: Job[];
  requests: CVRequest[];
  applications: Application[];
  jobRequests: JobRequest[];
  onNavigate: (view: View) => void;
  onRefresh: () => void;
  onNotify: Notify;
};

const sectionItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "نظرة عامة", icon: <LayoutDashboard size={17} /> },
  { id: "jobs", label: "إدارة المنشورات", icon: <BriefcaseBusiness size={17} /> },
  { id: "job-requests", label: "طلبات نشر الوظائف", icon: <ClipboardIcon /> },
  { id: "applications", label: "السير الذاتية", icon: <FileText size={17} /> },
];

function ClipboardIcon() {
  return <span className="nav-custom-icon"><Check size={15} /></span>;
}

function statusLabel(status: PostStatus) {
  return status === "published" ? "منشور" : status === "draft" ? "مسودة" : "مغلق";
}

function StatCard({ icon, value, label, tone, detail }: { icon: React.ReactNode; value: string | number; label: string; tone: string; detail: string }) {
  return <div className={`admin-stat-card ${tone}`}><span className="admin-stat-icon">{icon}</span><div><small>{label}</small><strong>{value}</strong><em>{detail}</em></div></div>;
}

export function AdminDashboardPage({ jobs, requests, applications, jobRequests, onNavigate, onRefresh, onNotify }: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>("overview");
  const [postType, setPostType] = useState<PostType>("job");
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [refreshing, setRefreshing] = useState(false);

  const publishedJobs = jobs.filter((job) => job.status === "published");
  const draftJobs = jobs.filter((job) => job.status === "draft");
  const closedJobs = jobs.filter((job) => job.status === "closed");
  const pendingJobRequests = jobRequests.filter((request) => request.status === "pending");
  const newApplications = applications.filter((application) => application.status === "new");
  const filteredJobs = useMemo(() => jobs.filter((job) => statusFilter === "all" || job.status === statusFilter), [jobs, statusFilter]);

  const refresh = async () => {
    setRefreshing(true);
    onRefresh();
    window.setTimeout(() => setRefreshing(false), 650);
  };

  const copyJobRequestLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}#job-request`;
    try {
      await navigator.clipboard.writeText(link);
      onNotify("تم نسخ رابط طلب نشر الوظيفة");
    } catch {
      onNotify("تعذر نسخ الرابط، انسخه من شريط العنوان");
    }
  };

  const changeStatus = async (table: "jobs" | "cv_requests", id: string, status: PostStatus) => {
    const error = await updatePostStatus(table, id, status);
    if (error) return onNotify(error.message);
    onNotify("تم تحديث حالة المنشور");
    onRefresh();
  };

  const selectSection = (next: AdminSection) => {
    setSection(next);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <section className="container page-section dashboard-page">
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand"><img src="/iraq-jobs-logo.jpg" alt="iraq jobs" /><div><b>iraq jobs</b><small>مركز الإدارة</small></div></div>
        <div className="admin-sidebar-label">مساحة العمل</div>
        <nav className="admin-side-nav">{sectionItems.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => selectSection(item.id)}>{item.icon}<span>{item.label}</span>{item.id === "job-requests" && pendingJobRequests.length > 0 && <em>{pendingJobRequests.length}</em>}{item.id === "applications" && newApplications.length > 0 && <em>{newApplications.length}</em>}</button>)}</nav>
        <div className="admin-sidebar-footer"><Settings2 size={16} /><span>البيانات متصلة بـ Supabase</span><i /></div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar"><div><span className="eyebrow"><BarChart3 size={14} /> iraq jobs / الإدارة</span><h1>{section === "overview" ? "صباح الخير، خلّينا نرتّب الفرص" : sectionItems.find((item) => item.id === section)?.label}</h1><p>{section === "overview" ? "تابع حركة المنصة واتخذ الإجراء المناسب من مكان واحد." : "إدارة واضحة للمنشورات وطلبات الشركات وملفات المتقدمين."}</p></div><button className="admin-refresh-btn" onClick={() => void refresh()}><RefreshCw className={refreshing ? "spin" : ""} size={16} /> تحديث البيانات</button></div>
        {section === "overview" && <AdminOverview jobs={jobs} requests={requests} applications={applications} jobRequests={jobRequests} pendingJobRequests={pendingJobRequests} publishedJobs={publishedJobs} draftJobs={draftJobs} closedJobs={closedJobs} newApplications={newApplications} onSection={selectSection} onNavigate={onNavigate} onCopyLink={() => void copyJobRequestLink()} />}
        {section === "jobs" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>المنشورات</h2><p>أنشئ الوظائف وتابع حالة كل منشور.</p></div><div className="admin-toolbar-actions"><button className="outline-btn" onClick={() => onNavigate("job-request")}><Link2 size={15} /> النموذج العام</button><button className="primary-btn" onClick={() => setShowForm((value) => !value)}><Plus size={16} /> منشور جديد</button></div></div><div className="admin-filter-row">{(["all", "published", "draft", "closed"] as const).map((item) => <button key={item} className={statusFilter === item ? "selected" : ""} onClick={() => setStatusFilter(item)}>{item === "all" ? "الكل" : statusLabel(item)}</button>)}</div>{showForm && <PostForm type={postType} onTypeChange={setPostType} onSaved={() => { setShowForm(false); onRefresh(); onNotify("تم حفظ المنشور"); }} />}<div className="admin-list">{filteredJobs.map((job) => <AdminPost key={job.id} title={job.title} subtitle={`${job.company_name} · ${job.city}`} type="وظيفة" status={job.status} onPublish={() => void changeStatus("jobs", job.id, job.status === "published" ? "closed" : "published")} />)}{requests.length > 0 && <div className="admin-subsection-heading"><span>طلبات CV الداخلية</span><small>{requests.length} طلب</small></div>}{requests.map((request) => <AdminPost key={request.id} title={request.title} subtitle={`${request.organization_name} · ${request.specialization}`} type="طلب CV" status={request.status} onPublish={() => void changeStatus("cv_requests", request.id, request.status === "published" ? "closed" : "published")} />)}{filteredJobs.length === 0 && requests.length === 0 && <EmptyState title="لا توجد منشورات" text="ابدأ بإضافة أول وظيفة من زر منشور جديد." />}</div></section>}
        {section === "job-requests" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>طلبات نشر الوظائف</h2><p>راجع طلبات الشركات قبل نشرها للعامة.</p></div><button className="outline-btn" onClick={() => void copyJobRequestLink()}><Link2 size={15} /> نسخ رابط الطلب العام</button></div><JobRequestReviewList requests={jobRequests} onRefresh={onRefresh} onNotify={onNotify} /></section>}
        {section === "applications" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>السير الذاتية</h2><p>راجع الملفات المرسلة إلى طلبات HR الداخلية.</p></div><span className="section-count"><FileText size={15} /> {applications.length} ملف</span></div><ApplicationsTable applications={applications} onNotify={onNotify} /></section>}
      </div>
    </div>
  </section>;
}

function AdminOverview({ jobs, requests, applications, jobRequests, pendingJobRequests, publishedJobs, draftJobs, closedJobs, newApplications, onSection, onNavigate, onCopyLink }: { jobs: Job[]; requests: CVRequest[]; applications: Application[]; jobRequests: JobRequest[]; pendingJobRequests: JobRequest[]; publishedJobs: Job[]; draftJobs: Job[]; closedJobs: Job[]; newApplications: Application[]; onSection: (section: AdminSection) => void; onNavigate: (view: View) => void; onCopyLink: () => void }) {
  const totalPosts = jobs.length + requests.length;
  const publishedPosts = publishedJobs.length + requests.filter((request) => request.status === "published").length;
  const publicationPercent = totalPosts ? Math.round((publishedPosts / totalPosts) * 100) : 0;
  return <div className="admin-overview">
    <div className="admin-summary-grid"><StatCard tone="navy" icon={<BriefcaseBusiness size={19} />} value={publishedJobs.length} label="وظائف منشورة" detail={`${draftJobs.length} مسودة تحتاج متابعة`} /><StatCard tone="orange" icon={<Clock3 size={19} />} value={pendingJobRequests.length} label="طلبات قيد المراجعة" detail="بانتظار قرار الإدارة" /><StatCard tone="violet" icon={<FileText size={19} />} value={applications.length} label="إجمالي السير الذاتية" detail={`${newApplications.length} جديدة`} /><StatCard tone="green" icon={<CheckCircle2 size={19} />} value={`${publicationPercent}%`} label="نسبة المنشورات النشطة" detail={`${closedJobs.length} منشور مغلق`} /></div>
    <div className="admin-quick-actions"><div><b>إجراءات سريعة</b><span>أكثر العمليات استخداماً</span></div><button onClick={() => onSection("jobs")}><Plus size={17} /><span><b>إضافة منشور</b><small>وظيفة أو طلب CV</small></span></button><button onClick={() => onSection("job-requests")}><CheckCircle2 size={17} /><span><b>مراجعة الطلبات</b><small>{pendingJobRequests.length ? `${pendingJobRequests.length} بانتظارك` : "لا توجد طلبات جديدة"}</small></span></button><button onClick={onCopyLink}><Link2 size={17} /><span><b>رابط طلب وظيفة</b><small>نسخ الرابط العام</small></span></button></div>
    <div className="admin-overview-grid"><div className="admin-report-card"><div className="report-card-header"><div><span className="eyebrow">تقرير النشر</span><h2>حالة المحتوى</h2></div><BarChart3 size={20} /></div><div className="report-bar-row"><div><span>منشور</span><b>{publishedPosts}</b></div><div className="report-bar"><span className="published-bar" style={{ width: `${totalPosts ? (publishedPosts / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-bar-row"><div><span>مسودات</span><b>{draftJobs.length}</b></div><div className="report-bar"><span className="draft-bar" style={{ width: `${totalPosts ? (draftJobs.length / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-bar-row"><div><span>مغلق</span><b>{closedJobs.length}</b></div><div className="report-bar"><span className="closed-bar" style={{ width: `${totalPosts ? (closedJobs.length / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-total"><span>إجمالي المنشورات</span><strong>{totalPosts}</strong></div></div><div className="admin-report-card"><div className="report-card-header"><div><span className="eyebrow">آخر النشاطات</span><h2>ما يحتاج انتباهك</h2></div><button className="report-link" onClick={() => onSection("job-requests")}>عرض الكل</button></div><div className="activity-list">{pendingJobRequests.slice(0, 3).map((request) => <button className="activity-item" key={request.id} onClick={() => onSection("job-requests")}><span className="activity-icon orange"><Clock3 size={16} /></span><span><b>طلب نشر وظيفة جديد</b><small>{request.title} · {request.company_name}</small></span><small>{formatDate(request.created_at)}</small></button>)}{applications.slice(0, 2).map((application) => <button className="activity-item" key={application.id} onClick={() => onSection("applications")}><span className="activity-icon blue"><FileText size={16} /></span><span><b>سيرة ذاتية جديدة</b><small>{application.full_name}</small></span><small>{formatDate(application.created_at)}</small></button>)}{pendingJobRequests.length === 0 && applications.length === 0 && <div className="activity-empty">لا توجد نشاطات جديدة حالياً</div>}</div></div></div>
    <div className="admin-recent-card"><div className="report-card-header"><div><span className="eyebrow">آخر الوظائف</span><h2>الفرص المنشورة حديثاً</h2></div><button className="report-link" onClick={() => onSection("jobs")}>إدارة المنشورات</button></div><div className="recent-jobs-grid">{jobs.slice(0, 4).map((job) => <button className="recent-job-item" key={job.id} onClick={() => onSection("jobs")}><span className="company-logo"><BriefcaseBusiness size={17} /></span><span><b>{job.title}</b><small>{job.company_name} · {job.city}</small></span><span className={`status ${job.status}`}>{statusLabel(job.status)}</span></button>)}{jobs.length === 0 && <div className="activity-empty">لا توجد وظائف بعد.</div>}</div></div>
    <div className="admin-overview-note"><Users size={19} /><span><b>ملاحظة تشغيلية</b><small>صفحة طلبات HR العامة معلقة حالياً للتطوير، بينما تبقى بياناتها محفوظة ويمكن إدارتها من قسم المنشورات الداخلي.</small></span><button onClick={() => onNavigate("requests")}>عرض الصفحة</button></div>
  </div>;
}

function PostForm({ type, onTypeChange, onSaved }: { type: PostType; onTypeChange: (type: PostType) => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", company_name: "", category: "تقنية", city: "بغداد", job_type: "دوام كامل" as JobType, description: "", requirements: "", salary_range: "", contact_email: "", contact_whatsapp: "", specialization: "", organization_name: "", details: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (type === "job" && !form.contact_email.trim() && !form.contact_whatsapp.trim()) return setError("أضف البريد الإلكتروني أو رقم الواتساب على الأقل.");
    setSaving(true);
    setError("");
    const error = type === "job"
      ? await createJob({ title: form.title, company_name: form.company_name, category: form.category, city: form.city, job_type: form.job_type, description: form.description, requirements: form.requirements.split("\n").map((item) => item.trim()).filter(Boolean), salary_range: form.salary_range.trim() || null, contact_email: form.contact_email.trim() || null, contact_whatsapp: form.contact_whatsapp.trim() || null })
      : await createCvRequest({ title: form.title, specialization: form.specialization, organization_name: form.organization_name, details: form.details });
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
  };

  return <form className="post-form admin-post-form" onSubmit={submit}><div className="post-type"><button type="button" className={type === "job" ? "selected" : ""} onClick={() => onTypeChange("job")}><BriefcaseBusiness size={16} /> وظيفة</button><button type="button" className={type === "request" ? "selected" : ""} onClick={() => onTypeChange("request")}><Users size={16} /> طلب CV داخلي</button></div><div className="form-grid"><label>العنوان<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={type === "job" ? "مثال: مطور تطبيقات" : "مثال: مطلوب CV لمطورين"} /></label><label>{type === "job" ? "اسم الشركة" : "اسم جهة HR"}<input required value={type === "job" ? form.company_name : form.organization_name} onChange={(event) => update(type === "job" ? "company_name" : "organization_name", event.target.value)} /></label></div>{type === "job" ? <><div className="form-grid"><label>التصنيف<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>المدينة<input required value={form.city} onChange={(event) => update("city", event.target.value)} /></label></div><div className="form-grid"><label>نوع الدوام<select value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>{jobTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} /></label></div><div className="form-grid"><label>البريد الإلكتروني<input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} dir="ltr" /></label><label>واتساب<input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} dir="ltr" /></label></div><label>الوصف<textarea required rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={3} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} /></label></> : <><label>الاختصاص المطلوب<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} /></label><label>تفاصيل الطلب<textarea required rows={5} value={form.details} onChange={(event) => update("details", event.target.value)} /></label></>}{error && <p className="form-error">{error}</p>}<button className="primary-btn" disabled={saving}>{saving ? "جاري الحفظ..." : "نشر الآن"} <Send size={16} /></button></form>;
}

function AdminPost({ title, subtitle, type, status, onPublish }: { title: string; subtitle: string; type: string; status: PostStatus; onPublish: () => void }) {
  return <div className="admin-row"><span className="row-icon"><BriefcaseBusiness size={18} /></span><div><b>{title}</b><small>{type} · {subtitle}</small></div><span className={`status ${status}`}>{statusLabel(status)}</span><button className="row-action" onClick={onPublish}>{status === "published" ? "إغلاق" : "نشر"}</button></div>;
}

function ApplicationsTable({ applications, onNotify }: { applications: Application[]; onNotify: Notify }) {
  const openCv = async (path: string) => {
    try {
      await openApplicationCv(path);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "تعذر فتح الملف.");
    }
  };
  return <div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.cv_requests?.title || "طلب CV"} · {application.phone}</small></div><span className={`status ${application.status}`}>{application.status === "new" ? "جديد" : application.status === "reviewing" ? "قيد المراجعة" : application.status}</span><button className="row-action" onClick={() => void openCv(application.cv_path)}>فتح CV</button></div>) : <EmptyState title="ماكو سير ذاتية بعد" text="طلبات المتقدمين راح تظهر هنا فور إرسالها." />}</div>;
}