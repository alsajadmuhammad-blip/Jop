import { Check, ChevronDown, FileText, X } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { approveJobRequest, updateJobRequestStatus } from "../../services/adminService";
import type { JobRequest } from "../../lib/types";
import type { Notify } from "../../app/types";
import { useState } from "react";

export function JobRequestReviewList({ requests, onRefresh, onNotify }: { requests: JobRequest[]; onRefresh: () => void; onNotify: Notify }) {
  const review = async (request: JobRequest, action: "approve" | "reject") => {
    const error = action === "approve"
      ? await approveJobRequest(request.id)
      : await updateJobRequestStatus(request.id, "rejected");
    if (error) return onNotify(error.message);
    onNotify(action === "approve" ? "تمت الموافقة ونشر الوظيفة" : "تم رفض طلب نشر الوظيفة");
    onRefresh();
  };

  return <div className="job-request-review-list">{requests.length ? requests.map((request) => <JobRequestReviewCard key={request.id} request={request} onReview={review} />) : <EmptyState title="لا توجد طلبات نشر" text="عند إرسال شركة لطلب نشر وظيفة سيظهر هنا للمراجعة." />}</div>;
}

function JobRequestReviewCard({ request, onReview }: { request: JobRequest; onReview: (request: JobRequest, action: "approve" | "reject") => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const statusText = request.status === "pending" ? "قيد المراجعة" : request.status === "approved" ? "تمت الموافقة" : "مرفوض";
  return <div className={`job-request-review-card ${expanded ? "expanded" : ""}`}>
    <span className="row-icon"><FileText size={18} /></span>
    <div className="job-request-review-content">
      <button className="review-card-toggle" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className="card-top-line"><b>{request.title}</b><span className={`status ${request.status}`}>{statusText}</span></span>
        <span className="review-card-summary">{request.company_name} · {request.city} · {request.contact_name}</span>
        <span className="review-card-expand"><span>{expanded ? "إخفاء التفاصيل" : "عرض كامل الطلب"}</span><ChevronDown size={16} /></span>
      </button>
      {expanded && <div className="review-details full-review-details">
        <div className="review-detail-grid">
          <span><small>نوع الإعلان</small><b className={request.ad_type === "quick" ? "quick-review-label" : ""}>{request.ad_type === "quick" ? "إعلان سريع" : "إعلان مفصل"}</b></span>
          <span><small>التصنيف</small><b>{request.category || "عام"}</b></span>
          <span><small>المدينة</small><b>{request.city || "غير محددة"}</b></span>
          <span><small>نوع الدوام</small><b>{request.job_type || "غير محدد"}</b></span>
          <span><small>مسؤول التواصل</small><b>{request.contact_name || request.company_name}</b></span>
          <span><small>وسيلة التواصل</small><b dir="ltr">{request.contact_email || request.contact_whatsapp || "غير مضافة"}</b></span>
          <span><small>الراتب</small><b>{request.salary_range || "غير محدد"}</b></span>
          <span><small>آخر موعد</small><b>{request.deadline || "غير محدد"}</b></span>
        </div>
        <div className="review-detail-block"><small>تفاصيل الوظيفة</small><p>{request.description || "لم تتم إضافة تفاصيل."}</p></div>
        <div className="review-detail-block"><small>المتطلبات</small>{request.requirements.length ? <ul>{request.requirements.map((item) => <li key={item}>{item}</li>)}</ul> : <p>لا توجد متطلبات محددة.</p>}</div>
        <div className="review-detail-block"><small>التقديم المباشر</small><p>{request.internal_applications ? "مفعّل للباحثين المسجلين والمكملين لملفهم." : "غير مفعّل."}</p></div>
      </div>}
    </div>
    {request.status === "pending" && <div className="review-actions"><button className="row-action approve" onClick={() => void onReview(request, "approve")}><Check size={14} /> موافقة ونشر</button><button className="row-action reject" onClick={() => void onReview(request, "reject")}><X size={14} /> رفض</button></div>}
  </div>;
}