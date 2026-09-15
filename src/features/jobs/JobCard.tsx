import { Building2, Clock3, HeartHandshake, MapPin } from "lucide-react";
import { formatDate } from "../../lib/format";
import type { Job } from "../../lib/types";

export function JobCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return <button className="job-card" onClick={onClick}><div className="card-top"><span className="company-logo"><Building2 size={19} /></span><span className="saved-icon"><HeartHandshake size={17} /></span></div><div className="card-body"><span className="category-label">{job.category || "عام"}</span><h3>{job.title}</h3><p className="company-name">{job.company_name}</p><div className="job-meta"><span><MapPin size={14} />{job.city}</span><span><Clock3 size={14} />{job.job_type}</span></div></div><div className="card-footer"><span>{job.salary_range || "الراتب يحدد بالمقابلة"}</span><b>{formatDate(job.created_at)}</b></div></button>;
}