import { ArrowLeft, Building2, CalendarDays, Clock3, MapPin } from "lucide-react";
import { formatDate } from "../../lib/format";
import type { Job } from "../../lib/types";

export function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return <button className="job-card" onClick={onClick}>
    <div className="job-card-v3-head">
      <span className="company-logo"><Building2 size={19} /></span>
      <div><span className="job-card-badge">فرصة عمل</span><small className="job-card-date"><CalendarDays size={12} /> نُشرت {formatDate(job.created_at)}</small></div>
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
  </button>;
}