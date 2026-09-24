import { ArrowLeft, Bookmark, BookmarkCheck, Building2, CalendarDays, Clock3, MapPin } from "lucide-react";
import { formatDate } from "../../lib/format";
import type { Job } from "../../lib/types";

export function JobCard({ job, onClick, saved, onToggleSaved }: { job: Job; onClick: () => void; saved?: boolean; onToggleSaved?: () => void }) {
  return <article className="job-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") onClick(); }}>
    <div className="job-card-v3-head">
      <span className="company-logo"><Building2 size={19} /></span>
       <div><span className="job-card-badge">فرصة عمل</span><small className="job-card-date"><CalendarDays size={12} /> نُشرت {formatDate(job.created_at)}</small></div>
       {onToggleSaved && <button type="button" className={saved ? "job-save-button saved" : "job-save-button"} onClick={(event) => { event.stopPropagation(); onToggleSaved(); }} aria-label={saved ? "إزالة من المحفوظات" : "حفظ الوظيفة"}>{saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}<span>{saved ? "محفوظة" : "حفظ"}</span></button>}
    </div>
    <div className="job-card-v3-main">
      <span className="category-label">{job.category || "عام"}</span>
      <h3>{job.title}</h3>
      <p className="company-name">{job.company_name}</p>
    </div>
    <div className="job-card-v3-meta"><span><MapPin size={14} />{job.city}</span><span><Clock3 size={14} />{job.job_type}</span></div>
    <div className="job-card-v3-footer">
      <span><small>الراتب</small><strong>{job.salary_range || "يحدد بالمقابلة"}</strong></span>
      <b>التفاصيل <ArrowLeft size={14} /></b>
    </div>
  </article>;
}