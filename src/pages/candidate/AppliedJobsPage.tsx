import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarDays, CheckCircle2, Clock3, FileText, MapPin, RotateCcw, XCircle } from "lucide-react";
import type { View } from "../../app/types";
import type { Application, Profile } from "../../lib/types";
import { hasSupabaseConfig } from "../../lib/supabase";
import { formatDate } from "../../lib/format";
import { loadCandidateApplications } from "../../services/applicationService";

type AppliedJobsPageProps = {
  profile: Profile;
  onNavigate: (view: View) => void;
  onOpenJob: (jobId: string) => void;
  onNotify: (message: string) => void;
};

const statusDetails: Record<Application["status"], { label: string; icon: typeof Clock3; className: string }> = {
  new: { label: "تم الاستلام", icon: Clock3, className: "new" },
  reviewing: { label: "قيد المراجعة", icon: RotateCcw, className: "reviewing" },
  shortlisted: { label: "ضمن القائمة المختصرة", icon: CheckCircle2, className: "shortlisted" },
  rejected: { label: "غير مناسب حاليًا", icon: XCircle, className: "rejected" },
  hired: { label: "تم القبول", icon: CheckCircle2, className: "hired" },
};

function ApplicationStatus({ status }: { status: Application["status"] }) {
  const details = statusDetails[status] || statusDetails.new;
  const Icon = details.icon;
  return <span className={`candidate-application-status ${details.className}`}><Icon size={14} /> {details.label}</span>;
}

export function AppliedJobsPage({ profile, onNavigate, onOpenJob, onNotify }: AppliedJobsPageProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }
    let active = true;
    void loadCandidateApplications(profile.id).then((result) => {
      if (!active) return;
      setApplications(result.applications);
      setLoading(false);
      if (result.error) onNotify("تعذر تحميل الوظائف المتقدّم لها.");
    });
    return () => {
      active = false;
    };
  }, [onNotify, profile.id]);

  const summary = useMemo(() => ({
    total: applications.length,
    active: applications.filter((application) => ["new", "reviewing", "shortlisted"].includes(application.status)).length,
    accepted: applications.filter((application) => application.status === "hired").length,
  }), [applications]);

  return <section className="container page-section dashboard-page applied-jobs-page">
    <button className="back-link" onClick={() => onNavigate("candidate")}><ArrowRight size={16} /> العودة إلى ملفي المهني</button>

    <header className="applied-jobs-hero">
      <div>
        <span className="eyebrow"><ClipboardMark /> مساحة الباحث عن عمل</span>
        <h1>الوظائف المتقدّم لها</h1>
      </div>
      <button type="button" className="primary-btn" onClick={() => onNavigate("jobs")}><BriefcaseBusiness size={16} /> تصفح وظائف جديدة</button>
    </header>

    <div className="applied-jobs-summary">
      <div><span className="applied-summary-icon blue"><FileText size={17} /></span><strong>{summary.total}</strong><small>إجمالي التقديمات</small></div>
      <div><span className="applied-summary-icon orange"><Clock3 size={17} /></span><strong>{summary.active}</strong><small>طلبات قيد المتابعة</small></div>
      <div><span className="applied-summary-icon green"><CheckCircle2 size={17} /></span><strong>{summary.accepted}</strong><small>طلبات مقبولة</small></div>
    </div>

    {loading ? <div className="applied-jobs-loading"><span className="live-dot" /><p>جاري تحميل تقديماتك...</p></div> : applications.length ? (
      <div className="applied-jobs-list">
        {applications.map((application) => {
          const job = application.jobs;
          const request = application.cv_requests;
          const title = job?.title || request?.title || "طلب تقديم";
          const company = job?.company_name || request?.organization_name || "جهة غير محددة";
          return <article className="applied-job-card" key={application.id}>
            <div className="applied-job-mark"><BriefcaseBusiness size={19} /></div>
            <div className="applied-job-main">
              <div className="applied-job-title-row"><div><h2>{title}</h2><p>{company}</p></div><ApplicationStatus status={application.status} /></div>
              <div className="applied-job-meta">
                <span><CalendarDays size={14} /> قُدّم في {formatDate(application.created_at)}</span>
                {job?.city && <span><MapPin size={14} /> {job.city}</span>}
                {job?.job_type && <span>{job.job_type}</span>}
              </div>
              {application.note && <p className="applied-job-note"><b>ملاحظتك:</b> {application.note}</p>}
            </div>
            {application.job_id && <button type="button" className="outline-btn applied-job-action" onClick={() => onOpenJob(application.job_id as string)}>عرض الوظيفة</button>}
          </article>;
        })}
      </div>
    ) : <div className="applied-jobs-empty">
      <span><BriefcaseBusiness size={25} /></span>
      <h2>ما عندك تقديمات بعد</h2>
      <p>لما تتقدم على وظيفة من ملفك المهني، راح تظهر هنا مع آخر حالة للطلب.</p>
      <button type="button" className="primary-btn" onClick={() => onNavigate("jobs")}><BriefcaseBusiness size={16} /> ابدأ البحث عن وظيفة</button>
    </div>}
  </section>;
}

function ClipboardMark() {
  return <span className="applied-heading-mark"><CheckCircle2 size={14} /></span>;
}