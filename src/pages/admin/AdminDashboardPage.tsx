import { useState } from "react";
import { BriefcaseBusiness, FileText, LayoutDashboard, Plus, Send, Users } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { PageIntro } from "../../components/common/PageIntro";
import { categories, jobTypes } from "../../lib/constants";
import type { Application, ApplicationStatus, CVRequest, Job, JobType, PostStatus } from "../../lib/types";
import { createCvRequest, createJob, updatePostStatus } from "../../services/adminService";
import { openApplicationCv } from "../../services/applicationService";
import type { Notify } from "../../app/types";

type AdminDashboardProps = { jobs: Job[]; requests: CVRequest[]; applications: Application[]; onRefresh: () => void; onNotify: Notify };
type PostType = "job" | "request";

export function AdminDashboardPage({ jobs, requests, applications, onRefresh, onNotify }: AdminDashboardProps) {
  const [postType, setPostType] = useState<PostType>("job");
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | PostStatus>("all");
  const [selectedTab, setSelectedTab] = useState<"posts" | "applications">("posts");
  const filteredJobs = jobs.filter((job) => statusFilter === "all" || job.status === statusFilter);

  const changeStatus = async (table: "jobs" | "cv_requests", id: string, status: PostStatus) => {
    const error = await updatePostStatus(table, id, status);
    if (error) return onNotify(error.message);
    onNotify("تم تحديث حالة المنشور");
    onRefresh();
  };

  return <section className="container page-section dashboard-page"><PageIntro eyebrow="لوحة الإدارة" title="خلّي النشر مرتب وواضح" description="أنشئ وظيفة أو طلب CV، راجع الطلبات، وخلي كل شيء محفوظ داخل Supabase." /><div className="dashboard-tabs"><button className={selectedTab === "posts" ? "selected" : ""} onClick={() => setSelectedTab("posts")}><LayoutDashboard size={16} /> المنشورات</button><button className={selectedTab === "applications" ? "selected" : ""} onClick={() => setSelectedTab("applications")}><FileText size={16} /> السير الذاتية <em>{applications.length}</em></button></div>{selectedTab === "posts" ? <><div className="dashboard-toolbar"><div className="filter-pills">{(["all", "published", "draft", "closed"] as const).map((item) => <button key={item} className={statusFilter === item ? "selected" : ""} onClick={() => setStatusFilter(item)}>{item === "all" ? "الكل" : item === "published" ? "منشور" : item === "draft" ? "مسودة" : "مغلق"}</button>)}</div><button className="primary-btn" onClick={() => setShowForm(!showForm)}><Plus size={17} /> منشور جديد</button></div>{showForm && <PostForm type={postType} onTypeChange={setPostType} onSaved={() => { setShowForm(false); onRefresh(); onNotify("تم حفظ المنشور"); }} /> }<div className="admin-list">{filteredJobs.map((job) => <AdminPost key={job.id} title={job.title} subtitle={`${job.company_name} · ${job.city}`} type="وظيفة" status={job.status} onPublish={() => void changeStatus("jobs", job.id, job.status === "published" ? "closed" : "published")} />)}{requests.map((request) => <AdminPost key={request.id} title={request.title} subtitle={`${request.organization_name} · ${request.specialization}`} type="طلب CV" status={request.status} onPublish={() => void changeStatus("cv_requests", request.id, request.status === "published" ? "closed" : "published")} />)}</div></> : <ApplicationsTable applications={applications} onNotify={onNotify} />}</section>;
}

function PostForm({ type, onTypeChange, onSaved }: { type: PostType; onTypeChange: (type: PostType) => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", company_name: "", category: "تقنية", city: "بغداد", job_type: "دوام كامل" as JobType, description: "", requirements: "", salary_range: "", specialization: "", organization_name: "", details: "" });
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const error = type === "job"
      ? await createJob({ title: form.title, company_name: form.company_name, category: form.category, city: form.city, job_type: form.job_type, description: form.description, requirements: form.requirements.split("\n").filter(Boolean), salary_range: form.salary_range || null })
      : await createCvRequest({ title: form.title, specialization: form.specialization, organization_name: form.organization_name, details: form.details });
    setSaving(false);
    if (error) return setError(error.message);
    onSaved();
  };

  return <form className="post-form" onSubmit={submit}><div className="post-type"><button type="button" className={type === "job" ? "selected" : ""} onClick={() => onTypeChange("job")}><BriefcaseBusiness size={16} /> وظيفة</button><button type="button" className={type === "request" ? "selected" : ""} onClick={() => onTypeChange("request")}><Users size={16} /> طلب CV من HR</button></div><div className="form-grid"><label>العنوان<input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder={type === "job" ? "مثال: مطور تطبيقات" : "مثال: مطلوب CV لمطورين"} /></label><label>{type === "job" ? "اسم الشركة" : "اسم جهة HR"}<input required value={type === "job" ? form.company_name : form.organization_name} onChange={(event) => update(type === "job" ? "company_name" : "organization_name", event.target.value)} /></label></div>{type === "job" ? <><div className="form-grid"><label>التصنيف<select value={form.category} onChange={(event) => update("category", event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label><label>المدينة<input value={form.city} onChange={(event) => update("city", event.target.value)} /></label></div><div className="form-grid"><label>نوع الدوام<select value={form.job_type} onChange={(event) => update("job_type", event.target.value)}>{jobTypes.map((item) => <option key={item}>{item}</option>)}</select></label><label>الراتب <span className="optional">اختياري</span><input value={form.salary_range} onChange={(event) => update("salary_range", event.target.value)} /></label></div><label>الوصف<textarea required rows={4} value={form.description} onChange={(event) => update("description", event.target.value)} /></label><label>المتطلبات <span className="optional">كل متطلب بسطر</span><textarea rows={3} value={form.requirements} onChange={(event) => update("requirements", event.target.value)} /></label></> : <><label>الاختصاص المطلوب<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} placeholder="مثال: محاسبة، مبيعات، برمجة" /></label><label>تفاصيل الطلب<textarea required rows={5} value={form.details} onChange={(event) => update("details", event.target.value)} /></label></>}{error && <p className="form-error">{error}</p>}<button className="primary-btn" disabled={saving}>{saving ? "جاري الحفظ..." : "نشر الآن"} <Send size={16} /></button></form>;
}

function AdminPost({ title, subtitle, type, status, onPublish }: { title: string; subtitle: string; type: string; status: PostStatus; onPublish: () => void }) {
  return <div className="admin-row"><span className="row-icon"><FileText size={18} /></span><div><b>{title}</b><small>{type} · {subtitle}</small></div><span className={`status ${status}`}>{status === "published" ? "منشور" : status === "draft" ? "مسودة" : "مغلق"}</span><button className="row-action" onClick={onPublish}>{status === "published" ? "إغلاق" : "نشر"}</button></div>;
}

function ApplicationsTable({ applications, onNotify }: { applications: Application[]; onNotify: Notify }) {
  const openCv = async (path: string) => {
    try {
      await openApplicationCv(path);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "تعذر فتح الملف.");
    }
  };
  return <div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.jobs?.title || application.cv_requests?.title || "طلب CV"} · {application.phone}</small></div><span className={`status ${application.status}`}>{application.status === "new" ? "جديد" : application.status}</span><button className="row-action" onClick={() => void openCv(application.cv_path)}>فتح CV</button></div>) : <EmptyState title="ماكو سير ذاتية بعد" text="طلبات المتقدمين راح تظهر هنا فور إرسالها." />}</div>;
}