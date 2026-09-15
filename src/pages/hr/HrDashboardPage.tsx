import { useState } from "react";
import { openApplicationCv, updateApplicationStatus } from "../../services/applicationService";
import { EmptyState } from "../../components/common/Feedback";
import { PageIntro } from "../../components/common/PageIntro";
import { formatDate } from "../../lib/format";
import type { Application, ApplicationStatus, Profile } from "../../lib/types";
import type { Notify } from "../../app/types";

export function HrDashboardPage({ profile, applications, onRefresh, onNotify }: { profile: Profile; applications: Application[]; onRefresh: () => void; onNotify: Notify }) {
  const [opening, setOpening] = useState("");
  const setStatus = async (id: string, status: ApplicationStatus) => {
    const error = await updateApplicationStatus(id, status);
    if (error) return onNotify(error.message);
    onNotify("تم تحديث حالة المتقدم");
    onRefresh();
  };
  const openCv = async (application: Application) => {
    setOpening(application.id);
    try {
      await openApplicationCv(application.cv_path);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "تعذر فتح الملف.");
    } finally {
      setOpening("");
    }
  };
  return <section className="container page-section dashboard-page"><PageIntro eyebrow="مساحة HR" title="تابع السير الذاتية الواردة" description={`الطلبات التابعة إلى ${profile.organization || "جهتك"} تظهر هنا فقط، مع إمكانية تحديث حالة كل متقدم.`} /><div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.cv_requests?.title || application.jobs?.title || "طلب CV"} · {formatDate(application.created_at)}</small></div><select value={application.status} onChange={(event) => void setStatus(application.id, event.target.value as ApplicationStatus)}><option value="new">جديد</option><option value="reviewing">قيد المراجعة</option><option value="shortlisted">مرشح</option><option value="rejected">مرفوض</option></select><button className="row-action" disabled={opening === application.id} onClick={() => void openCv(application)}>{opening === application.id ? "جاري الفتح..." : "فتح CV"}</button></div>) : <EmptyState title="لا توجد طلبات واردة بعد" text="عند إرسال المتقدمين لسيرهم الذاتية راح تظهر هنا." />}</div></section>;
}