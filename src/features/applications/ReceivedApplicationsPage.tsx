import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Inbox, Mail, MapPin, Phone, RefreshCw, UserRound } from "lucide-react";
import type { View, Notify } from "../../app/types";
import type { Application, ApplicationStatus, Profile } from "../../lib/types";
import { formatDate } from "../../lib/format";
import { loadReceivedApplications, updateApplicationStatus } from "../../services/applicationService";

const statusLabels: Record<ApplicationStatus, string> = {
  new: "تم الاستلام",
  reviewing: "قيد المراجعة",
  shortlisted: "ضمن القائمة المختصرة",
  rejected: "غير مناسب حالياً",
  hired: "تم التعيين",
};

const statusOptions: ApplicationStatus[] = ["new", "reviewing", "shortlisted", "rejected", "hired"];

export function ReceivedApplicationsPage({
  profile,
  onNavigate,
  onOpenJob,
  onNotify,
}: {
  profile: Profile;
  onNavigate: (view: View) => void;
  onOpenJob: (jobId: string) => void;
  onNotify: Notify;
}) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    const result = await loadReceivedApplications(profile.id);
    if (result.error) {
      onNotify("تعذر تحميل التقديمات الواردة.");
    } else {
      setApplications(result.applications);
    }
    setLoading(false);
    setRefreshing(false);
  }, [onNotify, profile.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo(() => ({
    total: applications.length,
    new: applications.filter((application) => application.status === "new").length,
    active: applications.filter((application) => ["reviewing", "shortlisted"].includes(application.status)).length,
  }), [applications]);

  const updateStatus = async (application: Application, status: ApplicationStatus) => {
    setUpdatingId(application.id);
    const error = await updateApplicationStatus(application.id, status);
    setUpdatingId("");
    if (error) {
      onNotify("تعذر تحديث حالة التقديم. تحقق من تحديث صلاحيات قاعدة البيانات.");
      return;
    }
    setApplications((current) => current.map((item) => item.id === application.id ? { ...item, status } : item));
    onNotify("تم تحديث حالة التقديم.");
  };

  return <section className="container page-section received-applications-page">
    <button className="back-link" type="button" onClick={() => onNavigate(profile.role === "candidate" ? "candidate" : profile.role === "hr" ? "hr" : "admin")}><ArrowLeft size={16} /> العودة إلى حسابي</button>

    <header className="received-applications-header">
      <div>
        <span className="eyebrow"><Inbox size={14} /> صندوق صاحب الإعلان</span>
        <h1>التقديمات الواردة</h1>
        <p>طلبات الباحثين عن عمل على الوظائف المنشورة من حسابك.</p>
      </div>
      <button type="button" className="outline-btn" onClick={() => void refresh(true)} disabled={refreshing || loading}>
        <RefreshCw size={15} className={refreshing ? "is-spinning" : ""} />
        {refreshing ? "جاري التحديث..." : "تحديث"}
      </button>
    </header>

    <div className="received-applications-summary">
      <div><strong>{summary.total}</strong><small>إجمالي التقديمات</small></div>
      <div><strong>{summary.new}</strong><small>جديدة</small></div>
      <div><strong>{summary.active}</strong><small>قيد المتابعة</small></div>
    </div>

    {loading ? <div className="received-applications-empty"><span className="live-dot" /><p>جاري تحميل التقديمات...</p></div> : applications.length ? <div className="received-applications-list">
      {applications.map((application) => {
        const job = application.jobs;
        return <article className="received-application-card" key={application.id}>
          <div className="received-application-heading">
            <span className="received-applicant-avatar"><UserRound size={19} /></span>
            <div className="received-application-title">
              <h2>{application.full_name || "باحث عن عمل"}</h2>
              <p>{job?.title || "وظيفة منشورة من حسابك"}{job?.company_name && job.company_name !== "جهة غير معلنة" ? ` · ${job.company_name}` : ""}</p>
            </div>
            <label className={`received-application-status status-${application.status}`}>
              <span>حالة الطلب</span>
              <select value={application.status} disabled={updatingId === application.id} onChange={(event) => void updateStatus(application, event.target.value as ApplicationStatus)} aria-label={`حالة تقديم ${application.full_name}`}>
                {statusOptions.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
              </select>
            </label>
          </div>

          <div className="received-application-meta">
            <span><CalendarDays size={14} /> وصل {formatDate(application.created_at)}</span>
            {job?.province && <span><MapPin size={14} />{[job.city, job.province].filter(Boolean).join("، ")}</span>}
            {application.email && <a href={`mailto:${application.email}`}><Mail size={14} />{application.email}</a>}
            {application.phone && <a href={`tel:${application.phone}`}><Phone size={14} />{application.phone}</a>}
          </div>

          {application.note && <p className="received-application-note">{application.note}</p>}
          <div className="received-application-actions">
            {application.job_id && <button type="button" className="text-btn" onClick={() => onOpenJob(application.job_id as string)}>عرض الوظيفة <ArrowLeft size={14} /></button>}
          </div>
        </article>;
      })}
    </div> : <div className="received-applications-empty">
      <span><BriefcaseBusiness size={24} /></span>
      <h2>لا توجد تقديمات واردة حتى الآن</h2>
      <p>عند تفعيل التقديم المباشر على إعلان ونشره، ستظهر طلبات المتقدمين هنا.</p>
      <button type="button" className="primary-btn" onClick={() => onNavigate("job-request")}>نشر وظيفة <ArrowLeft size={16} /></button>
    </div>}
  </section>;
}
