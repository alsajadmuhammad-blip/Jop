import { BriefcaseBusiness, Building2, Check, Clock3, MapPin } from "lucide-react";
import { ModalShell } from "../../components/common/ModalShell";
import type { Job } from "../../lib/types";
import { ApplicationForm } from "../applications/ApplicationForm";

export function JobModal({ job, onClose, onSubmitted }: { job: Job; onClose: () => void; onSubmitted: () => void }) {
  return <ModalShell onClose={onClose} title="التقديم على الوظيفة"><div className="modal-job-head"><span className="company-logo large"><Building2 size={24} /></span><div><h2>{job.title}</h2><p>{job.company_name} · {job.city}</p></div></div><div className="detail-chips"><span><Clock3 size={15} />{job.job_type}</span><span><MapPin size={15} />{job.city}</span><span><BriefcaseBusiness size={15} />{job.category}</span></div><div className="modal-copy"><h4>عن الوظيفة</h4><p>{job.description}</p><h4>المتطلبات</h4><ul>{job.requirements.map((item) => <li key={item}><Check size={15} />{item}</li>)}</ul></div><ApplicationForm jobId={job.id.startsWith("demo") ? null : job.id} onSubmitted={onSubmitted} /></ModalShell>;
}