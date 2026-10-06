import { ArrowLeft, Bookmark, BookmarkCheck, Building2, CalendarDays, Clock3, MapPin } from "lucide-react";
import { formatDate, formatJobLocation } from "../../lib/format";
import { getBaghdadToday } from "../../lib/date";
import type { Job } from "../../lib/types";

export function JobCard({ job, onClick, saved, onToggleSaved }: { job: Job; onClick: () => void; saved?: boolean; onToggleSaved?: () => void }) {
  const isQuick = job.ad_type === "quick";
  const location = formatJobLocation(job);
  const daysRemaining = job.deadline
    ? Math.ceil((Date.parse(`${job.deadline}T00:00:00Z`) - Date.parse(`${getBaghdadToday()}T00:00:00Z`)) / 86_400_000)
    : null;
  const deadlineTone = daysRemaining !== null && daysRemaining <= 3 ? "urgent" : "";
  const deadlineSummary = daysRemaining === null
    ? "غير محدد"
    : daysRemaining <= 0
      ? "آخر يوم للتقديم"
      : `باقي ${daysRemaining} ${daysRemaining === 1 ? "يوم" : "أيام"}`;

  return <article className={`job-card ${isQuick ? "quick-job-card" : ""}`} onClick={onClick} role="button" tabIndex={0} aria-label={`عرض تفاصيل وظيفة ${job.title}`} onKeyDown={(event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  }}>
    <div className="job-card-v3-head">
      <span className="company-logo"><Building2 size={19} /></span>
      <div className="job-card-publish-info"><small className="job-card-date"><CalendarDays size={12} /> نُشرت {formatDate(job.created_at)}</small></div>
      {onToggleSaved && <button type="button" className={saved ? "job-save-button saved" : "job-save-button"} onClick={(event) => { event.stopPropagation(); onToggleSaved(); }} onKeyDown={(event) => event.stopPropagation()} aria-pressed={Boolean(saved)} aria-label={saved ? "إزالة من المحفوظات" : "حفظ الوظيفة"}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}<span>{saved ? "محفوظة" : "حفظ"}</span></button>}
    </div>
    <div className="job-card-v3-main">
      {!isQuick && <span className="category-label">{job.category || "عام"}</span>}
      {job.internal_applications && <span className="job-card-internal-apply">تقديم مباشر عبر المنصة</span>}
      <h3>{job.title}</h3>
      {job.company_name !== "جهة غير معلنة" && <p className="company-name">{job.company_name}</p>}
      {isQuick && <p className="quick-job-description">{job.description}</p>}
    </div>
    <div className="job-card-v3-meta"><span><MapPin size={14} />{location}</span>{!isQuick && <span><Clock3 size={14} />{job.job_type}</span>}</div>
    <div className={`job-card-deadline ${deadlineTone}`} aria-label={`آخر موعد للتقديم: ${job.deadline ? formatDate(job.deadline) : "غير محدد"}، ${deadlineSummary}`}>
      <CalendarDays size={15} />
      <span><small>آخر موعد للتقديم</small><strong>{job.deadline ? formatDate(job.deadline) : "غير محدد"}</strong></span>
      <em>{deadlineSummary}</em>
    </div>
    <div className="job-card-v3-footer">
      {!isQuick && <span><small>الراتب</small><strong>{job.salary_range || "يحدد بالمقابلة"}</strong></span>}
      {isQuick && <span className="quick-contact-summary"><small>طريقة التقديم</small><strong>{job.internal_applications ? "مباشر عبر المنصة" : job.contact_whatsapp ? "واتساب" : job.contact_email ? "البريد الإلكتروني" : "ضمن الوصف"}</strong></span>}
      <b>تفاصيل الوظيفة <ArrowLeft size={14} /></b>
    </div>
  </article>;
}