import { Check, FileText, X } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { approveJobRequest, updateJobRequestStatus } from "../../services/adminService";
import type { JobRequest } from "../../lib/types";
import type { Notify } from "../../app/types";

export function JobRequestReviewList({ requests, onRefresh, onNotify }: { requests: JobRequest[]; onRefresh: () => void; onNotify: Notify }) {
  const review = async (request: JobRequest, action: "approve" | "reject") => {
    const error = action === "approve"
      ? await approveJobRequest(request.id)
      : await updateJobRequestStatus(request.id, "rejected");
    if (error) return onNotify(error.message);
    onNotify(action === "approve" ? "تمت الموافقة ونشر الوظيفة" : "تم رفض طلب نشر الوظيفة");
    onRefresh();
  };

  return <div className="job-request-review-list">{requests.length ? requests.map((request) => <div className="job-request-review-card" key={request.id}><span className="row-icon"><FileText size={18} /></span><div className="job-request-review-content"><div className="card-top-line"><b>{request.title}</b><span className={`status ${request.status}`}>{request.status === "pending" ? "قيد المراجعة" : request.status === "approved" ? "تمت الموافقة" : "مرفوض"}</span></div><p>{request.company_name} · {request.city} · {request.contact_name}</p><small>{request.contact_email || request.contact_whatsapp}</small><div className="review-details"><span>{request.category}</span><span>{request.job_type}</span><span>{request.description}</span></div></div>{request.status === "pending" && <div className="review-actions"><button className="row-action approve" onClick={() => void review(request, "approve")}><Check size={14} /> موافقة ونشر</button><button className="row-action reject" onClick={() => void review(request, "reject")}><X size={14} /> رفض</button></div>}</div>) : <EmptyState title="لا توجد طلبات نشر" text="عند إرسال شركة لطلب نشر وظيفة سيظهر هنا للمراجعة." />}</div>;
}