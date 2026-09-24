import { useEffect, useMemo, useState } from "react";
import { BarChart3, BriefcaseBusiness, Check, CheckCircle2, Clock3, FileText, LayoutDashboard, Link2, Pencil, Plus, RefreshCw, Send, Settings2, ShieldCheck, Trash2, X } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { categories, jobTypes } from "../../lib/constants";
import { formatDate } from "../../lib/format";
import type { Application, EmployerAccount, Job, JobRequest, JobType, PostStatus } from "../../lib/types";
import { createJob, deleteJob, loadEmployerAccounts, updateCandidateSearchPermission, updateJob, updatePostStatus } from "../../services/adminService";
import type { Notify, View } from "../../app/types";
import { JobRequestReviewList } from "../../features/jobs/JobRequestReviewList";

export type AdminSection = "overview" | "jobs" | "job-requests" | "applications" | "employer-access";

type AdminDashboardProps = {
  jobs: Job[];
  applications: Application[];
  jobRequests: JobRequest[];
  onNavigate: (view: View) => void;
  onEditJob: (job: Job) => void;
  onRefresh: () => void;
  onNotify: Notify;
  adminSection: AdminSection;
  onAdminSection: (section: AdminSection) => void;
};

const sectionItems: { id: AdminSection; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "نظرة عامة", icon: <LayoutDashboard size={17} /> },
  { id: "jobs", label: "إدارة المنشورات", icon: <BriefcaseBusiness size={17} /> },
  { id: "job-requests", label: "طلبات نشر الوظائف", icon: <ClipboardIcon /> },
  { id: "applications", label: "تقديمات الوظائف", icon: <FileText size={17} /> },
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

export function AdminDashboardPage({ jobs, applications, jobRequests, onNavigate, onEditJob, onRefresh, onNotify, adminSection, onAdminSection }: AdminDashboardProps) {
  const section = adminSection;
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
  const jobApplications = applications.filter((application) => Boolean(application.job_id));
  const newApplications = jobApplications.filter((application) => application.status === "new");
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

  const changeStatus = async (table: "jobs", id: string, status: PostStatus) => {
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

  const selectSection = (next: AdminSection) => {
    onAdminSection(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <section className="container page-section dashboard-page">
    <div className="admin-main">
        <div className="admin-topbar"><div><span className="eyebrow"><BarChart3 size={14} /> IRAQ JOBS / الإدارة</span><h1>{section === "overview" ? "صباح الخير، خلّينا نرتّب الفرص" : sectionItems.find((item) => item.id === section)?.label}</h1><p>{section === "overview" ? "تابع حركة المنصة واتخذ الإجراء المناسب من مكان واحد." : "إدارة واضحة للمنشورات وطلبات الشركات وملفات المتقدمين."}</p></div><button className="admin-refresh-btn" onClick={() => void refresh()}><RefreshCw className={refreshing ? "spin" : ""} size={16} /> تحديث البيانات</button></div>
         {section === "overview" && <AdminOverview jobs={jobs} applications={jobApplications} jobRequests={jobRequests} pendingJobRequests={pendingJobRequests} publishedJobs={publishedJobs} draftJobs={draftJobs} closedJobs={closedJobs} newApplications={newApplications} onSection={selectSection} onNavigate={onNavigate} onCopyLink={() => void copyJobRequestLink()} />}
         {section === "jobs" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>الوظائف</h2><p>أنشئ الوظائف وتابع حالة كل منشور.</p></div><div className="admin-toolbar-actions"><button className="outline-btn" onClick={() => onNavigate("job-request")}><Link2 size={15} /> النموذج العام</button><button className="primary-btn" onClick={() => onNavigate("admin-post")}><Plus size={16} /> وظيفة جديدة</button></div></div><div className="admin-filter-row">{(["all", "published", "draft", "closed"] as const).map((item) => <button key={item} className={statusFilter === item ? "selected" : ""} onClick={() => setStatusFilter(item)}>{item === "all" ? "الكل" : statusLabel(item)}</button>)}</div><div className="admin-list">{filteredJobs.map((job) => <AdminPost key={job.id} title={job.title} subtitle={`${job.company_name} · ${job.city}`} type="وظيفة" status={job.status} onEdit={() => onEditJob(job)} onDelete={() => void removeJob(job)} onPublish={() => void changeStatus("jobs", job.id, job.status === "published" ? "closed" : "published")} />)}{filteredJobs.length === 0 && <EmptyState title="لا توجد وظائف" text="ابدأ بإضافة أول وظيفة من زر وظيفة جديدة." />}</div></section>}
        {section === "job-requests" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>طلبات نشر الوظائف</h2><p>راجع طلبات الشركات قبل نشرها للعامة.</p></div><button className="outline-btn" onClick={() => void copyJobRequestLink()}><Link2 size={15} /> نسخ رابط الطلب العام</button></div><JobRequestReviewList requests={jobRequests} onRefresh={onRefresh} onNotify={onNotify} /></section>}
          {section === "applications" && <section className="admin-content-section"><div className="admin-section-toolbar"><div><h2>تقديمات الوظائف</h2><p>راجع طلبات الباحثين على الوظائف المنشورة.</p></div><span className="section-count"><FileText size={15} /> {jobApplications.length} طلب</span></div><ApplicationsTable applications={jobApplications} /></section>}
         {section === "employer-access" && <EmployerAccessSection accounts={employerAccounts} loading={employerAccountsLoading} onNotify={onNotify} onChanged={(next) => setEmployerAccounts((current) => current.map((account) => account.id === next.id ? next : account))} />}
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

function AdminOverview({ jobs, applications, jobRequests, pendingJobRequests, publishedJobs, draftJobs, closedJobs, newApplications, onSection, onNavigate, onCopyLink }: { jobs: Job[]; applications: Application[]; jobRequests: JobRequest[]; pendingJobRequests: JobRequest[]; publishedJobs: Job[]; draftJobs: Job[]; closedJobs: Job[]; newApplications: Application[]; onSection: (section: AdminSection) => void; onNavigate: (view: View) => void; onCopyLink: () => void }) {
  const totalPosts = jobs.length;
  const publishedPosts = publishedJobs.length;
  const publicationPercent = totalPosts ? Math.round((publishedPosts / totalPosts) * 100) : 0;
  return <div className="admin-overview">
     <div className="admin-summary-grid"><StatCard tone="navy" icon={<BriefcaseBusiness size={19} />} value={publishedJobs.length} label="وظائف منشورة" detail={`${draftJobs.length} مسودة تحتاج متابعة`} /><StatCard tone="orange" icon={<Clock3 size={19} />} value={pendingJobRequests.length} label="طلبات قيد المراجعة" detail="بانتظار قرار الإدارة" /><StatCard tone="violet" icon={<FileText size={19} />} value={applications.length} label="إجمالي تقديمات الوظائف" detail={`${newApplications.length} جديدة`} /><StatCard tone="green" icon={<CheckCircle2 size={19} />} value={`${publicationPercent}%`} label="نسبة المنشورات النشطة" detail={`${closedJobs.length} منشور مغلق`} /></div>
     <div className="admin-quick-actions"><div><b>إجراءات سريعة</b><span>أكثر العمليات استخداماً</span></div><button onClick={() => onNavigate("admin-post")}><Plus size={17} /><span><b>إضافة وظيفة</b><small>إنشاء وظيفة جديدة</small></span></button><button onClick={() => onSection("job-requests")}><CheckCircle2 size={17} /><span><b>مراجعة الطلبات</b><small>{pendingJobRequests.length ? `${pendingJobRequests.length} بانتظارك` : "لا توجد طلبات جديدة"}</small></span></button><button onClick={onCopyLink}><Link2 size={17} /><span><b>رابط طلب وظيفة</b><small>نسخ الرابط العام</small></span></button></div>
     <div className="admin-overview-grid"><div className="admin-report-card"><div className="report-card-header"><div><span className="eyebrow">تقرير النشر</span><h2>حالة المحتوى</h2></div><BarChart3 size={20} /></div><div className="report-bar-row"><div><span>منشور</span><b>{publishedPosts}</b></div><div className="report-bar"><span className="published-bar" style={{ width: `${totalPosts ? (publishedPosts / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-bar-row"><div><span>مسودات</span><b>{draftJobs.length}</b></div><div className="report-bar"><span className="draft-bar" style={{ width: `${totalPosts ? (draftJobs.length / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-bar-row"><div><span>مغلق</span><b>{closedJobs.length}</b></div><div className="report-bar"><span className="closed-bar" style={{ width: `${totalPosts ? (closedJobs.length / totalPosts) * 100 : 0}%` }} /></div></div><div className="report-total"><span>إجمالي المنشورات</span><strong>{totalPosts}</strong></div></div><div className="admin-report-card"><div className="report-card-header"><div><span className="eyebrow">آخر النشاطات</span><h2>ما يحتاج انتباهك</h2></div><button className="report-link" onClick={() => onSection("job-requests")}>عرض الكل</button></div><div className="activity-list">{pendingJobRequests.slice(0, 3).map((request) => <button className="activity-item" key={request.id} onClick={() => onSection("job-requests")}><span className="activity-icon orange"><Clock3 size={16} /></span><span><b>طلب نشر وظيفة جديد</b><small>{request.title} · {request.company_name}</small></span><small>{formatDate(request.created_at)}</small></button>)}{applications.slice(0, 2).map((application) => <button className="activity-item" key={application.id} onClick={() => onSection("applications")}><span className="activity-icon blue"><FileText size={16} /></span><span><b>تقديم وظيفة جديد</b><small>{application.full_name}</small></span><small>{formatDate(application.created_at)}</small></button>)}{pendingJobRequests.length === 0 && applications.length === 0 && <div className="activity-empty">لا توجد نشاطات جديدة حالياً</div>}</div></div></div>
    <div className="admin-recent-card"><div className="report-card-header"><div><span className="eyebrow">آخر الوظائف</span><h2>الفرص المنشورة حديثاً</h2></div><button className="report-link" onClick={() => onSection("jobs")}>إدارة المنشورات</button></div><div className="recent-jobs-grid">{jobs.slice(0, 4).map((job) => <button className="recent-job-item" key={job.id} onClick={() => onSection("jobs")}><span className="company-logo"><BriefcaseBusiness size={17} /></span><span><b>{job.title}</b><small>{job.company_name} · {job.city}</small></span><span className={`status ${job.status}`}>{statusLabel(job.status)}</span></button>)}{jobs.length === 0 && <div className="activity-empty">لا توجد وظائف بعد.</div>}</div></div>
  </div>;
}

export function PostForm({ onSaved, initialJob }: { onSaved: () => void; initialJob?: Job | null }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(() => ({ title: initialJob?.title || "", company_name: initialJob?.company_name || "", category: initialJob?.category || "تقنية", city: initialJob?.city || "بغداد", job_type: initialJob?.job_type || "دوام كامل" as JobType, description: initialJob?.description || "", requirements: initialJob?.requirements.join("\n") || "", salary_range: initialJob?.salary_range || "", contact_email: initialJob?.contact_email || "", contact_whatsapp: initialJob?.contact_whatsapp || "", internal_applications: initialJob?.internal_applications || false }));
  const editing = Boolean(initialJob);

  useEffect(() => {
    setForm({ title: initialJob?.title || "", company_name: initialJob?.company_name || "", category: initialJob?.category || "تقنية", city: initialJob?.city || "بغداد", job_type: initialJob?.job_type || "دوام كامل" as JobType, description: initialJob?.description || "", requirements: initialJob?.requirements.join("\n") || "", salary_range: initialJob?.salary_range || "", contact_email: initialJob?.contact_email || "", contact_whatsapp: initialJob?.contact_whatsapp || "", internal_applications: initialJob?.internal_applications || false });
    setError("");
  }, [initialJob?.id]);

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.contact_email.trim() && !form.contact_whatsapp.trim()) return setError("أضف البريد الإلكتروني أو رقم الواتساب على الأقل.");
    setSaving(true);
    setError("");
    const jobInput = { title: form.title, company_name: form.company_name, category: form.category, city: form.city, job_type: form.job_type, description: form.description, requirements: form.requirements.split("\n").map((item) => item.trim()).filter(Boolean), salary_range: form.salary_range.trim() || null, contact_email: form.contact_email.trim() || null, contact_whatsapp: form.contact_whatsapp.trim() || null, internal_applications: form.internal_applications };
    const error = await (initialJob ? updateJob(initialJob.id, jobInput) : createJob(jobInput));
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
  };

  return <form className="post-form admin-post-form" onSubmit={submit}><div className="form-grid"><label>العنوان<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="مثال: مطور تطبيقات" /></label><label>اسم الشركة<input required value={form.company_name} onChange={(event) => update("company_name", event.target.value)} /></label></div><div className="form-grid"><label>التصنيف<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>المدينة<input required value={form.city} onChange={(event) => update("city", event.target.value)} /></label></div><div className="form-grid"><label>نوع الدوام<select value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>{jobTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} /></label></div><div className="form-grid"><label>البريد الإلكتروني<input type="email" value={form.contact_email} onChange={(event) => update("contact_email", event.target.value)} dir="ltr" /></label><label>واتساب<input value={form.contact_whatsapp} onChange={(event) => update("contact_whatsapp", event.target.value)} dir="ltr" /></label></div><label>الوصف<textarea required rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={3} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} /></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn" disabled={saving}>{saving ? "جاري الحفظ..." : editing ? "حفظ التعديلات" : "نشر الآن"} <Send size={16} /></button></form>;
}

function AdminPost({ title, subtitle, type, status, onPublish, onEdit, onDelete }: { title: string; subtitle: string; type: string; status: PostStatus; onPublish: () => void; onEdit?: () => void; onDelete?: () => void }) {
  return <div className="admin-row"><span className="row-icon"><BriefcaseBusiness size={18} /></span><div><b>{title}</b><small>{type} · {subtitle}</small></div><span className={`status ${status}`}>{statusLabel(status)}</span>{onEdit && <button className="row-action row-edit-action" onClick={onEdit}><Pencil size={13} /> تعديل</button>}{onDelete && <button className="row-action row-delete-action" onClick={onDelete}><Trash2 size={13} /> حذف</button>}<button className="row-action" onClick={onPublish}>{status === "published" ? "إغلاق" : "نشر"}</button></div>;
}

function ApplicationsTable({ applications }: { applications: Application[] }) {
  return <div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.jobs?.title || "وظيفة"} · {application.phone}</small></div><span className={`status ${application.status}`}>{application.status === "new" ? "جديد" : application.status === "reviewing" ? "قيد المراجعة" : application.status}</span><span className="row-action">تقديم وظيفة</span></div>) : <EmptyState title="لا توجد تقديمات وظائف بعد" text="طلبات الباحثين على الوظائف راح تظهر هنا." />}</div>;
}