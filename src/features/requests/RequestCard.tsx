import { ArrowLeft, Users } from "lucide-react";
import { formatDate } from "../../lib/format";
import type { CVRequest } from "../../lib/types";

export function RequestCard({ request, onClick }: { request: CVRequest; onClick: () => void }) {
  return <button className="request-card" onClick={onClick}><div className="request-icon"><Users size={22} /></div><div className="request-content"><div className="card-top-line"><span className="urgent-label">طلب CV</span><span className="date-label">{formatDate(request.created_at)}</span></div><h3>{request.title}</h3><p>{request.organization_name}</p><div className="specialization"><span>الاختصاص المطلوب</span><b>{request.specialization}</b></div></div><ArrowLeft className="request-arrow" size={18} /></button>;
}