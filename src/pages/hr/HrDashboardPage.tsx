import { useState } from "react";
import { Search, ShieldAlert, SlidersHorizontal, UserRound, X } from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { PageIntro } from "../../components/common/PageIntro";
import { formatDate } from "../../lib/format";
import type { Application, ApplicationStatus, CandidateSearchResult, Profile } from "../../lib/types";
import type { Notify } from "../../app/types";
import { openApplicationCv, updateApplicationStatus } from "../../services/applicationService";
import { emptyCandidateSearchFilters, formatCandidateExperiences, searchCandidateProfiles, type CandidateSearchFilters } from "../../services/candidateService";

export function HrDashboardPage({ profile, applications, onRefresh, onNotify }: { profile: Profile; applications: Application[]; onRefresh: () => void; onNotify: Notify }) {
  const [section, setSection] = useState<"search" | "applications">("search");
  const [filters, setFilters] = useState<CandidateSearchFilters>(emptyCandidateSearchFilters);
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CandidateSearchResult | null>(null);
  const [opening, setOpening] = useState("");

  const updateFilter = <K extends keyof CandidateSearchFilters>(key: K, value: CandidateSearchFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    setSearching(true);
    const result = await searchCandidateProfiles(filters);
    setSearching(false);
    setSearched(true);
    if (result.error) {
      setResults([]);
      onNotify(result.error.message || "تعذر تنفيذ البحث.");
      return;
    }
    setResults(result.profiles);
  };

  const setStatus = async (id: string, status: ApplicationStatus) => {
    const error = await updateApplicationStatus(id, status);
    if (error) return onNotify(error.message);
    onNotify("تم تحديث حالة المتقدم");
    onRefresh();
  };

  const openCv = async (application: Application) => {
    if (!application.cv_path) return onNotify("هذا التقديم مبني على الملف المهني الداخلي.");
    setOpening(application.id);
    try {
      await openApplicationCv(application.cv_path);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "تعذر فتح الملف.");
    } finally {
      setOpening("");
    }
  };

  if (!profile.can_search_candidates && profile.role !== "admin") {
    return <section className="container page-section dashboard-page hr-locked-page"><div className="access-lock-card"><span><ShieldAlert size={28} /></span><h1>البحث غير مفعّل لهذا الحساب</h1><p>لا يمكنك مشاهدة الملفات الشخصية للباحثين إلا بعد أن يفعّل المشرف صلاحية البحث على حسابك.</p><small>عند تفعيل الصلاحية ستظهر لك قاعدة الباحثين هنا مباشرة.</small></div></section>;
  }

  return <section className="container page-section dashboard-page">
    <PageIntro eyebrow="مساحة صاحب العمل / HR" title="ابحث عن المرشح المناسب" description="ابحث في الملفات المهنية المنظمة بدل الاعتماد على ملفات CV خارجية." />
    <div className="hr-section-tabs"><button className={section === "search" ? "active" : ""} onClick={() => setSection("search")}><Search size={16} /> البحث عن الباحثين</button><button className={section === "applications" ? "active" : ""} onClick={() => setSection("applications")}><UserRound size={16} /> الطلبات الواردة <b>{applications.length}</b></button></div>
    {section === "search" && <div className="candidate-search-layout">
      <form className="candidate-search-panel" onSubmit={search}>
        <div className="search-panel-heading"><div><span className="eyebrow">دليل الباحثين</span><h2>فلترة متقدمة</h2></div><SlidersHorizontal size={20} /></div>
        <label>كلمة البحث<input value={filters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="مهارة، مسمى، خبرة أو لغة" /></label>
        <div className="form-grid"><label>التخصص<input value={filters.specialization} onChange={(event) => updateFilter("specialization", event.target.value)} placeholder="مثال: برمجيات" /></label><label>المدينة<input value={filters.city} onChange={(event) => updateFilter("city", event.target.value)} placeholder="بغداد" /></label></div>
        <div className="form-grid"><label>أقل سنوات خبرة<input type="number" min="0" value={filters.minExperience} onChange={(event) => updateFilter("minExperience", event.target.value)} /></label><label>نوع العمل<select value={filters.workType} onChange={(event) => updateFilter("workType", event.target.value)}><option value="">الكل</option><option>دوام كامل</option><option>دوام جزئي</option><option>عن بُعد</option><option>تدريب</option><option>عمل حر</option></select></label></div>
        <label className="checkbox-field"><input type="checkbox" checked={filters.remoteOnly} onChange={(event) => updateFilter("remoteOnly", event.target.checked)} /><span>أظهر من يقبل العمل عن بُعد فقط</span></label>
        <button className="primary-btn full" disabled={searching}>{searching ? "جاري البحث..." : "بحث في الملفات"} <Search size={17} /></button>
      </form>
      <div className="candidate-results"><div className="results-heading"><div><span className="eyebrow">النتائج</span><h2>{searched ? `${results.length} ملف مطابق` : "ابدأ البحث"}</h2></div><small>الملفات الداخلية فقط</small></div>{results.length ? <div className="candidate-result-list">{results.map((candidate) => <button className="candidate-result-card" key={candidate.user_id} onClick={() => setSelected(candidate)}><span className="candidate-result-avatar">{candidate.full_name.slice(0, 1)}</span><span className="candidate-result-copy"><b>{candidate.full_name}</b><strong>{candidate.headline}</strong><small>{candidate.specialization} · {candidate.city} · {candidate.experience_years} سنوات خبرة</small><span>{candidate.skills.slice(0, 4).join(" · ")}</span></span><span className="candidate-result-arrow">عرض</span></button>)}</div> : <EmptyState title={searched ? "لا توجد ملفات مطابقة" : "استخدم الفلاتر للبحث"} text={searched ? "جرّب كلمة أخرى أو وسّع نطاق البحث." : "اكتب التخصص أو المهارة المطلوبة حتى تظهر الملفات المناسبة."} />}</div>
    </div>}
    {section === "applications" && <div className="applications-list">{applications.length ? applications.map((application) => <div className="application-row" key={application.id}><span className="app-avatar">{application.full_name.slice(0, 1)}</span><div><b>{application.full_name}</b><small>{application.cv_requests?.title || application.jobs?.title || "طلب CV"} · {formatDate(application.created_at)}</small></div><select value={application.status} onChange={(event) => void setStatus(application.id, event.target.value as ApplicationStatus)}><option value="new">جديد</option><option value="reviewing">قيد المراجعة</option><option value="shortlisted">مرشح</option><option value="rejected">مرفوض</option></select><button className="row-action" disabled={opening === application.id} onClick={() => void openCv(application)}>{opening === application.id ? "جاري الفتح..." : application.cv_path ? "فتح CV" : "فتح الملف"}</button></div>) : <EmptyState title="لا توجد طلبات واردة بعد" text="عند إرسال الباحثين لطلبات HR راح تظهر هنا." />}</div>}
    {selected && <div className="candidate-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}><article className="candidate-detail-card"><button className="candidate-detail-close" onClick={() => setSelected(null)} aria-label="إغلاق"><X size={19} /></button><div className="candidate-detail-heading"><span className="candidate-result-avatar">{selected.full_name.slice(0, 1)}</span><div><span className="eyebrow">ملف مهني</span><h2>{selected.full_name}</h2><p>{selected.headline} · {selected.specialization}</p></div></div><div className="candidate-detail-facts"><span><small>المدينة</small><b>{selected.city || "غير محدد"}</b></span><span><small>الخبرة</small><b>{selected.experience_years} سنوات</b></span><span><small>التوفر</small><b>{selected.availability || "غير محدد"}</b></span></div><div className="candidate-detail-section"><h3>نبذة مهنية</h3><p>{selected.summary || "لا توجد نبذة مضافة."}</p></div><div className="candidate-detail-section"><h3>المهارات</h3><div className="skill-pills">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div><div className="candidate-detail-section"><h3>الخبرة العملية</h3><p>{formatCandidateExperiences(selected.experience_details) || "لا توجد تفاصيل مضافة."}</p></div><div className="candidate-detail-section"><h3>التعليم واللغات</h3><p>{selected.education || "لا توجد بيانات تعليمية."}</p><p>{selected.languages.join(" · ") || "لا توجد لغات مضافة."}</p></div><div className="candidate-contact-box"><b>بيانات التواصل</b><span>{selected.email}</span><span>{selected.phone}</span></div></article></div>}
  </section>;
}