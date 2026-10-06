import { Users } from "lucide-react";
import { ModalShell } from "../../components/common/ModalShell";
import type { CVRequest } from "../../lib/types";
import { ApplicationForm } from "../applications/ApplicationForm";

export function RequestModal({ request, onClose, onSubmitted }: { request: CVRequest; onClose: () => void; onSubmitted: () => void }) {
  return <ModalShell onClose={onClose} title="إرسال السيرة الذاتية"><div className="modal-job-head"><span className="request-icon large"><Users size={24} /></span><div><h2>{request.title}</h2><p>{request.organization_name}</p></div></div><div className="request-detail"><span>الاختصاص المطلوب</span><b>{request.specialization}</b><p>{request.details}</p></div><ApplicationForm requestId={request.id} onSubmitted={onSubmitted} /></ModalShell>;
}