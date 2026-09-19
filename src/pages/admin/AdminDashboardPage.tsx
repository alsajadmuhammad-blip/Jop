import { useEffect, useMemo, useState } from "react";
import { BarChart3, BriefcaseBusiness, Check, CheckCircle2, Clock3, FileText, LayoutDashboard, Link2, Pencil, Plus, RefreshCw, Send, Settings2, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { categories, jobTypes } from "../../lib/constants";
import { formatDate } from "../../lib/format";
import type { Application, ApplicationStatus, CVRequest, EmployerAccount, Job, JobRequest, JobType, PostStatus } from "../../lib/types";
import { createCvRequest, createJob, deleteCvRequest, deleteJob, loadEmployerAccounts, updateCandidateSearchPermission, updateCvRequest, updateJob, updatePostStatus } from "../../services/adminService";
import { openApplicationCv } from "../../services/applicationService";
import type { Notify, View } from "../../app/types";
import { JobRequestReviewList } from "../../features/jobs/JobRequestReviewList";

type AdminSection = "overview" | "jobs" | "job-requests" | "applications" | "employer-access";
export type PostType = "job" | "request";

type AdminDashboardProps = {
  jobs: Job[];
  requests: CVRequest[];
  applications: Application[];
  jobRequests: JobRequest[];
  onNavigate: (view: View) => void;
  onEditJob: (job: Job) => void;
  onEditRequest: (request: CVRequest) => void;
  onRefresh: () => void;
  onNotify: Notify;
};

const sectionItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "نظرة عامة", icon: <LayoutDashboard size={17} /> },
  { id: "jobs", label: "إدارة المنشورات", icon: <BriefcaseBusiness size={17} /> },
  { id: "job-requests", label: "طلبات نشر الوظائف", icon: <ClipboardIcon /> },
  { id: "applications", label: "السير الذاتية", icon: <FileText size={17} /> },
  { id: "employer-access", label: "صلاحيات البحث", icon: <ShieldCheck size={17} /> },
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

export function AdminDashboardPage({ jobs, requests, applications, jobRequests, onNavigate, onEditJob, onEditRequest, onRefresh, onNotify }: AdminDashboardProps) {
  const [section, setSection] = useState<AdminSection>("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [employerAccounts, setEmployerAccounts] = useState<EmployerAccount[]>([]);
  const [employerAccountsLoading, setEmployerAccountsLoading] = useState(true);

  useEffect(() => {
    void loadEmployerAccounts().then((result) => {
      setEmployerAccounts(result.accounts);
      setEmployerAccountsLoading(false);
      if (result.error) onNotify("تعذر تحميل حسابات أصحاب العمل.");
    });
  }, []);

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

  const removeJob = async (job: Job) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف وظيفة «${job.title}»؟\nسيتم حذفها نهائياً ولا يمكن التراجع عن العملية.`);
    if (!confirmed) return;
    const error = await deleteJob(job.id);
    if (error) return onNotify(error.message);
    onNotify("تم حذف الوظيفة");
    onRefresh();
  };

  const removeRequest = async (request: CVRequest) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف طلب «${request.title}»؟\nسيتم حذف الطلب نهائياً ولا يمكن التراجع عن العملية.`);
    if (!confirmed) return;
    const error = await deleteCvRequest(request.id);
    if (error) return onNotify(error.message);
    onNotify("تم حذف طلب CV");
    onRefresh();
  };

  const selectSection = (next: AdminSection) => {
    setSection(next);
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
        <div className="admin-mobile-topbar">
          <div className="admin-mobile-brand"><img src="/iraq-jobs-logo.jpg" alt="iraq jobs" /><div><b>لوحة المشرف</b><small>iraq jobs</small></div></div>
          <button className="admin-mobile-refresh" onClick={() => void refresh()} aria-label="تحديث البيانات"><RefreshCw className={refreshing ? "spin" : ""} size={18} /></button>
        </div>
        <nav className="admin-mobile-nav" aria-label="أقسام لوحة المشرف">
          {sectionItems.map((item) => <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => selectSection(item.id)}>{item.icon}<span>{item.label}</span>{item.id === "job-requests" && pendingJobRequests.length > 0 && <em>{pendingJobRequests.length}</em>}{item.id === "applications" && newApplications.length > 0 && <em>{newApplications.length}</em>}</button>)}
        </nav>
        <div className="admin-topbar"><div><span className="eyebrow"><BarChart3 size={14} /> iraq jobs / الإدارة</span><h1>{section === "overview" ? "صباح الخير، خلّينا نرتّب الفرص" : sectionItems.find((item) => item.id === section)?.label}</h1><p>{section === "overview" ? "تابع حركة المنصة واتخذ الإجراء المناسب من مكان واحد." : "إدارة واضحة للمنشورات وطلبات الشركات وملفات المتقدمين."}</p></div><button className="admin-refresh-btn" onClick={() => void refresh()}><RefreshCw className={refreshing ? "spin" : ""} size={16} /> تحديث البيانات</button></div>
        {section === "overview" && <AdminOverview jobs={jobs} requests={requests} applications={applications} jobRequests={jobRequests} pendingJobRequests={pendingJobRequests} publishedJobs={publishedJobs} draftJobs={draftJobs} closedJobs={closedJobs} newApplications={newApplications} onSection={selectSection} onNavigate={onNavigate} onCopyLink={() => void copyJobRequestLink()} />}
         {section === "jobs" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>المنشورات</h2><p>أنشئ الوظائف وتابع حالة كل منشور.</p></div><div className="admin-toolbar-actions"><button className="outline-btn" onClick={() => onNavigate("job-request")}><Link2 size={15} /> النموذج العام</button><button className="primary-btn" onClick={() => onNavigate("admin-post")}><Plus size={16} /> منشور جديد</button></div></div><div className="admin-filter-row">{(["all", "published", "draft", "closed"] as const).map((item) => <button key={item} className={statusFilter === item ? "selected" : ""} onClick={() => setStatusFilter(item)}>{item === "all" ? "الكل" : statusLabel(item)}</button>)}</div><div className="admin-list">{filteredJobs.map((job) => <AdminPost key={job.id} title={job.title} subtitle={`${job.company_name} · ${job.city}`} type="وظيفة" status={job.status} onEdit={() => onEditJob(job)} onDelete={() => void removeJob(job)} onPublish={() => void changeStatus("jobs", job.id, job.status === "published" ? "closed" : "published")} />)}{requests.length > 0 && <div className="admin-subsection-heading"><span>طلبات CV الداخلية</span><small>{requests.length} طلب</small></div>}{requests.map((request) => <AdminPost key={request.id} title={request.title} subtitle={`${request.organization_name} · ${request.specialization}`} type="طلب CV" status={request.status} onEdit={() => onEditRequest(request)} onDelete={() => void removeRequest(request)} onPublish={() => void changeStatus("cv_requests", request.id, request.status === "published" ? "closed" : "published")} />)}{filteredJobs.length === 0 && requests.length === 0 && <EmptyState title="لا توجد منشورات" text="ابدأ بإضافة أول وظيفة من زر منشور جديد." />}</div></section>}
        {section === "job-requests" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>طلبات نشر الوظائف</h2><p>راجع طلبات الشركات قبل نشرها للعامة.</p></div><button className="outline-btn" onClick={() => void copyJobRequestLink()}><Link2 size={15} /> نسخ رابط الطلب العام</button></div><JobRequestReviewList requests={jobRequests} onRefresh={onRefresh} onNotify={onNotify} /></section>}
        {section === "applications" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>السير الذاتية</h2><p>راجع الملفات المرسلة إلى طلبات HR الداخلية.</p></div><span className="section-count"><FileText size={15} /> {applications.length} ملف</span></div><ApplicationsTable applications={applications} onNotify={onNotify} /></section>}
         {section === "employer-access" && <EmployerAccessSection accounts={employerAccounts} loading={employerAccountsLoading} onNotify={onNotify} onChanged={(next) => setEmployerAccounts((current) => current.map((account) => account.id === next.id ? next : account))} />}
      </div>
    </div>
  </section>;
}

function EmployerAccessSection({ accounts, loading, onNotify, onChanged }: { accounts: EmployerAccount[]; loading: boolean; onNotify: Notify; onChanged: (account: EmployerAccount) => void }) {
  const [updating, setUpdating] = useState("");
  const changePermission = async (account: EmployerAccount) => {
    setUpdating(account.id);
    const enabled = !account.can_search_candidates;
    const error = await updateCandidateSearchPermission(account.id, enabled);
    setUpdating("");
    if (error) return onNotify(error.message || "تعذر تحديث الصلاحية.");
    onChanged({ ...account, can_search_candidates: enabled });
    onNotify(enabled ? "تم تفعيل البحث لهذا الحساب" : "تم إيقاف البحث لهذا الحساب");
  };
  return <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>صلاحيات البحث</h2><p>فعّل البحث عن الملفات الشخصية لكل صاحب عمل بشكل مستقل.</p></div><span className="section-count"><ShieldCheck size={15} /> {accounts.filter((account) => account.can_search_candidates).length} مفعّلة</span></div><div className="access-explanation"><ShieldCheck size={20} /><span><b>التحكم بيد المشرف</b><small>صاحب العمل لا يستطيع رؤية أو البحث عن أي ملف إلا بعد تفعيل هذه الصلاحية لحسابه.</small></span></div>{loading ? <div className="centered-state"><span className="live-dot" /><p>جاري تحميل الحسابات...</p></div> : <div className="employer-access-list">{accounts.length ? accounts.map((account) => <div className="employer-access-row" key={account.id}><span className="app-avatar">{(account.full_name || "ص").slice(0, 1)}</span><div><b>{account.full_name || "حساب بدون اسم"}</b><small>{account.organization || "صاحب عمل / HR"}</small></div><span className={`permission-status ${account.can_search_candidates ? "enabled" : "disabled"}`}>{account.can_search_candidates ? "البحث مفعّل" : "البحث غير مفعّل"}</span><button className={account.can_search_candidates ? "outline-btn danger-outline" : "primary-btn"} disabled={updating === account.id} onClick={() => void changePermission(account)}>{updating === account.id ? "جاري التحديث..." : account.can_search_candidates ? "إيقاف الصلاحية" : "تفعيل البحث"}</button></div>) : <EmptyState title="لا توجد حسابات أصحاب عمل" text="ستظهر حسابات HR هنا بعد التسجيل." />}</div>}</section>;
}

function AdminOverview({ jobs, requests, applications, jobRequests, pendingJobRequests, publishedJobs, draftJobs, closedJobs, newApplications, onSection, onNavigate, onCopyLink }: { jobs: Job[]; requests: CVRequest[]; applications: Application[]; jobRequests: JobRequest[]; pendingJobRequests: JobRequest[]; publishedJobs: Job[]; draftJobs: Job[]; closedJobs: Job[]; newApplications: Application[]; onSection: (section: AdminSection) => void; onNavigate: (view: View) => void; onCopyLink: () => void }) {
  const totalPosts = jobs.length + requests.length;
  const publishedPosts = publishedJobs.length + requests.filter((request) => request.status === "published").length;
  const publicationPercent = totalPosts ? Math.round((publishedPosts / totalPosts) * 100) : 0;
  return <div className="admin-overview">
    <div className="admin-summary-grid"><StatCard tone="navy" icon={<BriefcaseBusiness size={19} />} value={publishedJobs.length} label="وظائف منشورة" detail={`${draftJobs.length} مسودة تحتاج متابعة`} /><StatCard tone="orange" icon={<Clock3 size={19} />} value={pendingJobRequests.length} label="طلبات قيد المراجعة" detail="بانتظار قرار الإدارة" /><StatCard tone="violet" icon={<FileText size={19} />} value={applications.length} label="إجمالي السير الذاتية" detail={`${newApplications.length} جديدة`} /><StatCard tone="green" icon={<CheckCircle2 size={19} />} value={`${publicationPercent}%`} label="نسبة المنشورات النشطة" detail={`${closedJobs.length} منشور مغلق`} /></div>
     <div className="admin-quick-actions"><div><b>إجراءات سريعة</b><span>أكثر العمليات استخداماً</span></div><button onClick={() => onNavigate("admin-post")}><Plus size={17} /><span><b>إضافة منشور</b><small>وظيفة أو طلب CV</small></span></button><button onClick={() => onSection("job-requests")}><CheckCircle2 size={17} /><span><b>مراجعة الطلبات</b><small>{pendingJobRequests.length ? `${pendingJobRequests.length} بانتظارك` : "لا توجد طلبات جديدة"}</small></span></button><button onClick={onCopyLink}><Link2 size={17} /><span><b>رابط طلب وظيفة</b><small>نسخ الرابط العام</small></span></button></div>
    <div className="admin-overview-grid"><div className="admin-report-card"><div className="report-card-header"><div><span className="eyebrow">تقرير النشر</span><h2>حالة المحتوى</h2></div><BarChart3 size={20} /></div><div className="report-bar-row"><div><span>منشور</span><b>{publishedPosts}</b></div><div className="report-bar"><span className="published-bar" style={{ width: `${totalPosts ? (publishedPosts / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-bar-row"><div><span>مسودات</span><b>{draftJobs.length}</b></div><div className="report-bar"><span className="draft-bar" style={{ width: `${totalPosts ? (draftJobs.length / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-bar-row"><div><span>مغلق</span><b>{closedJobs.length}</b></div><div className="report-bar"><span className="closed-bar" style={{ width: `${totalPosts ? (closedJobs.length / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-total"><span>إجمالي المنشورات</span><strong>{totalPosts}</strong></div></div><div className="admin-report-card"><div className="report-card-header"><div><span className="eyebrow">آخر النشاطات</span><h2>ما يحتاج انتباهك</h2></div><button className="report-link" onClick={() => onSection("job-requests")}>عرض الكل</button></div><div className="activity-list">{pendingJobRequests.slice(0, 3).map((request) => <button className="activity-item" key={request.id} onClick={() => onSection("job-requests")}><span className="activity-icon orange"><Clock3 size={16} /></span><span><b>طلب نشر وظيفة جديد</b><small>{request.title} · {request.company_name}</small></span><small>{formatDate(request.created_at)}</small></button>)}{applications.slice(0, 2).map((application) => <button className="activity-item" key={application.id} onClick={() => onSection("applications")}><span className="activity-icon blue"><FileText size={16} /></span><span><b>سيرة ذاتية جديدة</b><small>{application.full_name}</small></span><small>{formatDate(application.created_at)}</small></button>)}{pendingJobRequests.length === 0 && applications.length === 0 && <div className="activity-empty">لا توجد نشاطات جديدة حالياً</div>}</div></div></div>
    <div className="admin-recent-card"><div className="report-card-header"><div><span className="eyebrow">آخر الوظائف</span><h2>الفرص المنشورة حديثاً</h2></div><button className="report-link" onClick={() => onSection("jobs")}>إدارة المنشورات</button></div><div className="recent-jobs-grid">{jobs.slice(0, 4).map((job) => <button className="recent-job-item" key={job.id} onClick={() => onSection("jobs")}><span className="company-logo"><BriefcaseBusiness size={17} /></span><span><b>{job.title}</b><small>{job.company_name} · {job.city}</small></span><span className={`status ${job.status}`}>{statusLabel(job.status)}</span></button>)}{jobs.length === 0 && <div className="activity-empty">لا توجد وظائف بعد.</div>}</div></div>
    <div className="admin-overview-note"><Users size={19} /><span><b>ملاحظة تشغيلية</b><small>صفحة طلبات HR العامة معلقة حالياً للتطوير، بينما تبقى بياناتها محفوظة ويمكن إدارتها من قسم المنشورات الداخلي.</small></span><button onClick={() => onNavigate("requests")}>عرض الصفحة</button></div>
  </div>;
}

export function PostForm({ type, onTypeChange, onSaved, initialJob, initialRequest }: { type: PostType; onTypeChange: (type: PostType) => void; onSaved: () => void; initialJob?: Job | null; initialRequest?: CVRequest | null }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({ title: initialJob?.title || initialRequest?.title || "", company_name: initialJob?.company_name || "", category: initialJob?.category || "تقنية", city: initialJob?.city || "بغداد", job_type: initialJob?.job_type || "دوام كامل" as JobType, description: initialJob?.description || "", requirements: initialJob?.requirements.join("\n") || "", salary_range: initialJob?.salary_range || "", contact_email: initialJob?.contact_email || "", contact_whatsapp: initialJob?.contact_whatsapp || "", specialization: initialRequest?.specialization || "", organization_name: initialRequest?.organization_name || "", details: initialRequest?.details || "" }));
  const editing = Boolean(initialJob || initialRequest);

  useEffect(() => {
    setForm({ title: initialJob?.title || initialRequest?.title || "", company_name: initialJob?.company_name || "", category: initialJob?.category || "تقنية", city: initialJob?.city || "بغداد", job_type: initialJob?.job_type || "دوام كامل" as JobType, description: initialJob?.description || "", requirements: initialJob?.requirements.join("\n") || "", salary_range: initialJob?.salary_range || "", contact_email: initialJob?.contact_email || "", contact_whatsapp: initialJob?.contact_whatsapp || "", specialization: initialRequest?.specialization || "", organization_name: initialRequest?.organization_name || "", details: initialRequest?.details || "" });
    setError("");
  }, [initialJob?.id, initialRequest?.id]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (type === "job" && !form.contact_email.trim() && !form.contact_whatsapp.trim()) return setError("أضف البريد الإلكتروني أو رقم الواتساب على الأقل.");
    setSaving(true);
    setError("");
    const jobInput = { title: form.title, company_name: form.company_name, category: form.category, city: form.city, job_type: form.job_type, description: form.description, requirements: form.requirements.split("\n").map((item) => item.trim()).filter(Boolean), salary_range: form.salary_range.trim() || null, contact_email: form.contact_email.trim() || null, contact_whatsapp: form.contact_whatsapp.trim() || null };
    const requestInput = { title: form.title, specialization: form.specialization, organization_name: form.organization_name, details: form.details };
    const error = type === "job"
      ? await (initialJob ? updateJob(initialJob.id, jobInput) : createJob(jobInput))
      : await (initialRequest ? updateCvRequest(initialRequest.id, requestInput) : createCvRequest(requestInput));
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
  };

  return <form className="post-form admin-post-form" onSubmit={submit}>{!editing && <div className="post-type"><button type="button" className={type === "job" ? "selected" : ""} onClick={() => onTypeChange("job")}><BriefcaseBusiness size={16} /> وظيفة</button><button type="button" className={type === "request" ? "selected" : ""} onClick={() => onTypeChange("request")}><Users size={16} /> طلب CV داخلي</button></div>}<div className="form-grid"><label>العنوان<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={type === "job" ? "مثال: مطور تطبيقات" : "مثال: مطلوب CV لمطورين"} /></label><label>{type === "job" ? "اسم الشركة" : "اسم جهة HR"}<input required value={type === "job" ? form.company_name : form.organization_name} onChange={(event) => update(type === "job" ? "company_name" : "organization_name", event.target.value)} /></label></div>{type === "job" ? <><div className="form-grid"><label>التصنيف<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>المدينة<input required value={form.city} onChange={(event) => update("city", event.target.value)} /></label></div><div className="form-grid"><label>نوع الدوام<select value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>{jobTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} /></label></div><div className="form-grid"><label>البريد الإلكتروني<input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} dir="ltr" /></label><label>واتساب<input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} dir="ltr" /></label></div><label>الوصف<textarea required rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={3} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} /></label></> : <><label>الاختصاص المطلوب<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} /></label><label>تفاصيل الطلب<textarea required rows={5} value={form.details} onChange={(event) => update("details", event.target.value)} /></label></>}{error && <p className="form-error">{error}</p>}<button className="primary-btn" disabled={saving}>{saving ? "جاري الحفظ..." : editing ? "حفظ التعديلات" : "نشر الآن"} <Send size={16} /></button></form>;
}

function AdminPost({ title, subtitle, type, status, onPublish, onEdit, onDelete }: { title: string; subtitle: string; type: string; status: PostStatus; onPublish: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return <div className="admin-row"><span className="row-icon"><BriefcaseBusiness size={18} /></span><div><b>{title}</b><small>{type} · {subtitle}</small></div><span className={`status ${status}`}>{statusLabel(status)}</span>{onEdit && <button className="row-action row-edit-action" onClick={onEdit}><Pencil size={13} /> تعديل</button>}{onDelete && <button className="row-action row-delete-action" onClick={onDelete}><Trash2 size={13} /> حذف</button>}<button className="row-action" onClick={onPublish}>{status === "published" ? "إغلاق" : "نشر"}</button></div>;
}

function ApplicationsTable({ applications, onNotify }: { applications: Application[]; onNotify: Notify }) {
  const openCv = async (path: string) => {
    try {
      await openApplicationCv(path);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "تعذر فتح الملف.");
    }
  };
  return <div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.cv_requests?.title || "طلب CV"} · {application.phone}</small></div><span className={`status ${application.status}`}>{application.status === "new" ? "جديد" : application.status === "reviewing" ? "قيد المراجعة" : application.status}</span><button className="row-action" disabled={!application.cv_path} onClick={() => application.cv_path && void openCv(application.cv_path)}>{application.cv_path ? "فتح CV" : "فتح الملف"}</button></div>) : <EmptyState title="ماكو سير ذاتية بعد" text="طلبات المتقدمين راح تظهر هنا فور إرسالها." />}</div>;
}