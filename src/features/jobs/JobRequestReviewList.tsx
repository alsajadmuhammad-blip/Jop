import { Check, ChevronDown, FileText, X } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { DatePickerField } from "../../components/common/DatePickerField";
import { approveJobRequest, updateJobRequestDeadline, updateJobRequestStatus } from "../../services/adminService";
import { formatJobLocation } from "../../lib/format";
import { getBaghdadToday } from "../../lib/date";
import type { JobRequest } from "../../lib/types";
import type { Notify } from "../../app/types";
import { useState } from "react";

export function JobRequestReviewList({ requests, onRefresh, onNotify }: { requests: JobRequest[]; onRefresh: () => void; onNotify: Notify }) {
  const pendingRequests = requests.filter((request) => request.status === "pending");
  const review = async (request: JobRequest, action: "approve" | "reject") => {
    const error = action === "approve"
      ? await approveJobRequest(request.id)
      : await updateJobRequestStatus(request.id, "rejected");
    if (error) return onNotify(error.message);
    onNotify(action === "approve" ? "تمت الموافقة ونشر الوظيفة" : "تم رفض طلب نشر الوظيفة");
    onRefresh();
  };

  const saveDeadline = async (request: JobRequest, deadline: string) => {
    const error = await updateJobRequestDeadline(request.id, deadline);
    if (error) return onNotify(error.message);
    onNotify("تم حفظ آخر موعد للتقديم");
    onRefresh();
  };

  return <div className="job-request-review-list">{pendingRequests.length ? pendingRequests.map((request) => <JobRequestReviewCard key={request.id} request={request} onReview={review} onSaveDeadline={saveDeadline} />) : <EmptyState title="لا توجد طلبات بانتظار المراجعة" text="طلبات النشر المعتمدة أو المرفوضة لا تظهر هنا." />}</div>;
}

function JobRequestReviewCard({ request, onReview, onSaveDeadline }: { request: JobRequest; onReview: (request: JobRequest, action: "approve" | "reject") => Promise<void>; onSaveDeadline: (request: JobRequest, deadline: string) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [deadlineDraft, setDeadlineDraft] = useState(request.deadline || "");
  const [savingDeadline, setSavingDeadline] = useState(false);
  const today = getBaghdadToday();
  const needsDeadline = request.ad_type !== "quick" && (!request.deadline || request.deadline < today);
  const statusText = request.status === "pending" ? "قيد المراجعة" : request.status === "approved" ? "تمت الموافقة" : "مرفوض";
  const saveDeadline = async () => {
    if (!deadlineDraft || deadlineDraft < today) return;
    setSavingDeadline(true);
    await onSaveDeadline(request, deadlineDraft);
    setSavingDeadline(false);
  };
  return <div className={`job-request-review-card ${expanded ? "expanded" : ""}`}>
    <span className="row-icon"><FileText size={18} /></span>
    <div className="job-request-review-content">
      <button className="review-card-toggle" type="button" onClick={() => setExpanded((current) => !current)} aria-expanded={expanded}>
        <span className="card-top-line"><b>{request.title}</b><span className={`status ${request.status}`}>{statusText}</span></span>
         <span className="review-card-summary">{[request.company_name, formatJobLocation(request), request.contact_name].filter(Boolean).join(" · ")}</span>
        <span className="review-card-expand"><span>{expanded ? "إخفاء التفاصيل" : "عرض كامل الطلب"}</span><ChevronDown size={16} /></span>
      </button>
      {expanded && <div className="review-details full-review-details">
        <div className="review-detail-grid">
          <span><small>نوع الإعلان</small><b className={request.ad_type === "quick" ? "quick-review-label" : ""}>{request.ad_type === "quick" ? "إعلان سريع" : "إعلان مفصل"}</b></span>
          {request.ad_type !== "quick" && <span><small>التصنيف</small><b>{request.category || "عام"}</b></span>}
          <span><small>المحافظة</small><b>{request.province || "غير محددة"}</b></span>
          {request.ad_type !== "quick" && <><span><small>المدينة</small><b>{request.city || "غير محددة"}</b></span><span><small>نوع الدوام</small><b>{request.job_type || "غير محدد"}</b></span></>}
          <span><small>مسؤول التواصل</small><b>{request.contact_name || request.company_name}</b></span>
          <span><small>وسيلة التواصل</small><b dir="ltr">{request.contact_email || request.contact_whatsapp || "غير مضافة"}</b></span>
          {request.ad_type !== "quick" && <span><small>الراتب</small><b>{request.salary_range || "غير محدد"}</b></span>}
          <span><small>{request.ad_type === "quick" ? "مدة النشر" : "آخر موعد"}</small><b>{request.ad_type === "quick" ? "15 يوماً من تاريخ الموافقة" : request.deadline || "غير محدد"}</b></span>
        </div>
        <div className="review-detail-block"><small>تفاصيل الوظيفة</small><p>{request.description || "لم تتم إضافة تفاصيل."}</p></div>
        <div className="review-detail-block"><small>المتطلبات</small>{request.requirements.length ? <ul>{request.requirements.map((item) => <li key={item}>{item}</li>)}</ul> : <p>لا توجد متطلبات محددة.</p>}</div>
        <div className="review-detail-block"><small>التقديم المباشر</small><p>{request.internal_applications ? "مفعّل للباحثين المسجلين والمكملين لملفهم." : "غير مفعّل."}</p></div>
      </div>}
      {request.status === "pending" && needsDeadline && <div className="request-deadline-editor">
        <DatePickerField id={`request-deadline-${request.id}`} label="حدد موعداً صالحاً قبل الموافقة" min={today} value={deadlineDraft} onChange={setDeadlineDraft} />
        <button type="button" className="row-action approve" disabled={savingDeadline || !deadlineDraft || deadlineDraft < today} onClick={() => void saveDeadline()}>{savingDeadline ? "جاري الحفظ..." : "حفظ الموعد"}</button>
      </div>}
    </div>
    {request.status === "pending" && <div className="review-actions">{!needsDeadline && <button className="row-action approve" onClick={() => void onReview(request, "approve")}><Check size={14} /> موافقة ونشر</button>}<button className="row-action reject" onClick={() => void onReview(request, "reject")}><X size={14} /> رفض</button></div>}
  </div>;
}