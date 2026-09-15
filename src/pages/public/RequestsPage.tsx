import { EmptyState, LoadingCards } from "../../components/common/Feedback";
import { PageIntro } from "../../components/common/PageIntro";
import { RequestCard } from "../../features/requests/RequestCard";
import type { CVRequest } from "../../lib/types";

export function RequestsPage({ requests, loading, onOpenRequest }: { requests: CVRequest[]; loading: boolean; onOpenRequest: (request: CVRequest) => void }) {
  return <section className="container page-section"><PageIntro eyebrow="طلبات الـHR" title="اختصاصات مطلوبة حالياً" description="هذه الطلبات تنزل من كروبات وفرق HR. إذا اختصاصك مطابق، أرسل CV مباشرة للجهة." />{loading ? <LoadingCards /> : requests.length ? <div className="request-grid wide">{requests.map((request) => <RequestCard key={request.id} request={request} onClick={() => onOpenRequest(request)} />)}</div> : <EmptyState title="لا توجد طلبات منشورة حالياً" text="تابعنا، أول ما يطلبون اختصاصات جديدة راح تظهر هنا." />}</section>;
}