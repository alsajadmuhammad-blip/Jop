import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  MapPinned,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  UserRound,
  X,
  Plus,
} from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { formatDate } from "../../lib/format";
import type { Application, ApplicationStatus, CandidateSearchResult, Profile } from "../../lib/types";
import type { Notify } from "../../app/types";
import type { View } from "../../app/types";
import { openApplicationCv, updateApplicationStatus } from "../../services/applicationService";
import {
  emptyCandidateSearchFilters,
  formatCandidateExperiences,
  loadCandidateSearchOptions,
  searchCandidateProfiles,
  type CandidateSearchFilters,
  type CandidateSearchOptions,
} from "../../services/candidateService";

export type HrSection = "search" | "applications";

export function HrDashboardPage({
  profile,
  applications,
  onRefresh,
  onNotify,
  onNavigate,
  section,
  onSection,
}: {
  profile: Profile;
  applications: Application[];
  onRefresh: () => void;
  onNotify: Notify;
  onNavigate: (view: View) => void;
  section: HrSection;
  onSection: (section: HrSection) => void;
}) {
  const [filters, setFilters] = useState<CandidateSearchFilters>(emptyCandidateSearchFilters);
  const [options, setOptions] = useState<CandidateSearchOptions | null>(null);
  const [results, setResults] = useState<CandidateSearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [selected, setSelected] = useState<CandidateSearchResult | null>(null);
  const [opening, setOpening] = useState("");

  const canSearch = profile.can_search_candidates || profile.role === "admin";

  useEffect(() => {
    if (!canSearch) {
      setOptionsLoading(false);
      return;
    }

    let active = true;
    setOptionsLoading(true);
    void loadCandidateSearchOptions().then((result) => {
      if (!active) return;
      if (result.error) {
        onNotify("تعذر تجهيز خيارات الفلترة من ملفات الباحثين.");
      } else {
        setOptions(result.options);
      }
      setOptionsLoading(false);
    });

    return () => {
      active = false;
    };
  }, [canSearch]);

  const updateFilter = <K extends keyof CandidateSearchFilters>(
    key: K,
    value: CandidateSearchFilters[K],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const activeFilterCount = useMemo(
    () => [
      filters.keyword,
      filters.specialization,
      filters.province,
      filters.city,
      filters.minExperience,
      filters.workType,
      filters.skill,
      filters.availability,
      filters.remoteOnly,
    ].filter(Boolean).length,
    [filters],
  );

  const resetFilters = () => {
    setFilters(emptyCandidateSearchFilters);
    setResults([]);
    setSearched(false);
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

  if (!canSearch) {
    return (
      <section className="container page-section dashboard-page hr-locked-page">
        <div className="access-lock-card">
          <span><ShieldAlert size={28} /></span>
          <h1>البحث غير مفعّل لهذا الحساب</h1>
          <p>لا يمكنك مشاهدة الملفات الشخصية للباحثين إلا بعد أن يفعّل المشرف صلاحية الوصول لحسابك.</p>
          <small>عند التفعيل ستظهر لك خيارات الفلترة وملفات الباحثين هنا مباشرة.</small>
          <button type="button" className="primary-btn" onClick={() => onNavigate("job-request")}><Plus size={16} /> طلب نشر وظيفة</button>
        </div>
      </section>
    );
  }

  return (
    <section className="container page-section dashboard-page hr-workspace-page">
      {section === "search" && <>
        <header className="hr-page-header">
          <div className="hr-page-header-copy">
            <span className="eyebrow"><Building2 size={14} /> مساحة صاحب العمل / HR</span>
            <h1>ابحث عن الباحث المناسب بدقة</h1>
            <p>الفلاتر هنا مبنية مباشرة على البيانات التي يضيفها الباحثون في ملفاتهم المهنية.</p>
            <div className="hr-header-tags">
              <span><CheckCircle2 size={14} /> بيانات متطابقة مع ملفات الباحثين</span>
              <span><ShieldAlert size={14} /> وصول مقيّد ومصرّح</span>
            </div>
          </div>
          <div className="hr-page-header-mark"><Building2 size={27} /><b>IRAQ JOBS</b><small>دليل الباحثين</small></div>
        </header>

        <div className="hr-summary-strip">
          <div><span><UserRound size={16} /></span><p><b>{options?.total ?? "—"}</b><small>ملف باحث متاح</small></p></div>
          <div><span><Search size={16} /></span><p><b>{searched ? results.length : "—"}</b><small>نتيجة مطابقة</small></p></div>
          <div><span><Clock3 size={16} /></span><p><b>{applications.length}</b><small>طلب وارد</small></p></div>
          <div className="hr-summary-note"><SlidersHorizontal size={16} /><span>كل خيار يظهر فقط إذا كان موجودًا في ملفات الباحثين الحالية.</span></div>
        </div>
      </>}

      {section === "search" && (
        <div className="candidate-search-layout">
          <form className="candidate-search-panel" onSubmit={search}>
            <div className="search-panel-heading">
              <div>
                <span className="eyebrow">فلترة من البيانات الفعلية</span>
                <h2>ابنِ بحثك</h2>
                <p>اختر من القيم الموجودة حاليًا بدل كتابة قيمة قد لا تطابق ملفات الباحثين.</p>
              </div>
              <SlidersHorizontal size={20} />
            </div>

            <label className="hr-keyword-field">
              <span>كلمة البحث <small>اختياري</small></span>
              <input value={filters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="مسمى، إنجاز، تعليم أو لغة" />
            </label>

            <div className="hr-filter-grid">
              <label>
                <span>التخصص</span>
                <select value={filters.specialization} onChange={(event) => updateFilter("specialization", event.target.value)} disabled={optionsLoading}>
                  <option value="">كل التخصصات</option>
                  {options?.specializations.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                 <span>المحافظة</span>
                 <select value={filters.province} onChange={(event) => updateFilter("province", event.target.value)} disabled={optionsLoading}>
                   <option value="">كل المحافظات</option>
                   {options?.provinces.map((value) => <option key={value} value={value}>{value}</option>)}
                 </select>
               </label>
               <label>
                <span>المدينة</span>
                <select value={filters.city} onChange={(event) => updateFilter("city", event.target.value)} disabled={optionsLoading}>
                  <option value="">كل المدن</option>
                  {options?.cities.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>المهارة</span>
                <select value={filters.skill} onChange={(event) => updateFilter("skill", event.target.value)} disabled={optionsLoading}>
                  <option value="">كل المهارات</option>
                  {options?.skills.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>نوع العمل</span>
                <select value={filters.workType} onChange={(event) => updateFilter("workType", event.target.value)} disabled={optionsLoading}>
                  <option value="">كل الأنواع</option>
                  {options?.workTypes.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>التوفر للعمل</span>
                <select value={filters.availability} onChange={(event) => updateFilter("availability", event.target.value)} disabled={optionsLoading}>
                  <option value="">كل حالات التوفر</option>
                  {options?.availabilities.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label>
                <span>الخبرة</span>
                <select value={filters.minExperience} onChange={(event) => updateFilter("minExperience", event.target.value)} disabled={optionsLoading}>
                  <option value="">أي مستوى خبرة</option>
                  {options?.experienceYears.map((value) => <option key={value} value={String(value)}>من {value} سنة فأكثر</option>)}
                </select>
              </label>
            </div>

            <label className="checkbox-field hr-remote-filter">
              <input type="checkbox" checked={filters.remoteOnly} onChange={(event) => updateFilter("remoteOnly", event.target.checked)} />
              <span>أظهر من يقبل العمل عن بُعد فقط</span>
            </label>

            {optionsLoading && <p className="filter-options-loading"><span className="live-dot" /> جارٍ تجهيز الخيارات من ملفات الباحثين...</p>}

            <div className="hr-filter-actions">
              <button className="primary-btn" disabled={searching || optionsLoading}>
                {searching ? "جاري البحث..." : "عرض الباحثين"} <Search size={17} />
              </button>
              {activeFilterCount > 0 && <button type="button" className="reset-filter-btn" onClick={resetFilters}><RotateCcw size={14} /> مسح الفلاتر ({activeFilterCount})</button>}
            </div>
          </form>

          <div className="candidate-results">
            <div className="results-heading">
              <div>
                <span className="eyebrow">النتائج المطابقة</span>
                <h2>{searched ? `${results.length} ملف مطابق` : "اختر معايير البحث"}</h2>
              </div>
              <small>{searched ? "تمت المطابقة من بيانات الملف مباشرة" : "الملفات الداخلية المصرّح بها"}</small>
            </div>
            {results.length ? (
              <div className="candidate-result-list">
                {results.map((candidate) => (
                  <button type="button" className="candidate-result-card" key={candidate.user_id} onClick={() => setSelected(candidate)}>
                    <span className="candidate-result-avatar">{candidate.full_name.slice(0, 1)}</span>
                    <span className="candidate-result-copy">
                      <b>{candidate.full_name}</b>
                      <strong>{candidate.headline}</strong>
                       <small>{candidate.specialization} · {candidate.province} / {candidate.city} · {candidate.experience_years} سنوات خبرة</small>
                      <span>{candidate.skills.slice(0, 4).join(" · ")}</span>
                    </span>
                    <span className="candidate-result-arrow">عرض الملف</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title={searched ? "لا توجد ملفات مطابقة" : "ابدأ بتحديد المواصفات"}
                text={searched ? "جرّب إزالة فلتر واحد أو اختيار قيمة أخرى من القوائم." : "القوائم تعرض فقط التخصصات والمدن والمهارات الموجودة في ملفات الباحثين."}
              />
            )}
          </div>
        </div>
      )}

      {section === "applications" && (
        <div className="applications-section">
          <div className="applications-section-heading">
            <div><span className="eyebrow">متابعة التقديمات</span><h2>الطلبات الواردة</h2><p>راجع الطلبات وحدّث حالتها حتى يبقى مسار المتابعة واضحًا.</p></div>
            <span className="applications-total"><FileText size={16} /> {applications.length} طلب</span>
          </div>
          {applications.length ? (
            <div className="applications-list">
              {applications.map((application) => (
                <div className="application-row" key={application.id}>
                  <span className="app-avatar">{application.full_name.slice(0, 1)}</span>
                  <div className="application-row-main">
                    <b>{application.full_name}</b>
                    <small>{application.cv_requests?.title || application.jobs?.title || "طلب CV"} · {formatDate(application.created_at)}</small>
                  </div>
                  <div className="application-row-status">
                    <small>حالة الطلب</small>
                    <select value={application.status} onChange={(event) => void setStatus(application.id, event.target.value as ApplicationStatus)}>
                      <option value="new">جديد</option>
                      <option value="reviewing">قيد المراجعة</option>
                      <option value="shortlisted">مرشح</option>
                      <option value="rejected">مرفوض</option>
                    </select>
                  </div>
                  <button className="row-action" disabled={opening === application.id} onClick={() => void openCv(application)}>
                    {opening === application.id ? "جاري الفتح..." : application.cv_path ? "فتح CV" : "فتح الملف"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="لا توجد طلبات واردة بعد" text="عند إرسال الباحثين لطلبات HR راح تظهر هنا." />
          )}
        </div>
      )}

      {selected && (
        <div className="candidate-detail-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <article className="candidate-detail-card">
            <button className="candidate-detail-close" onClick={() => setSelected(null)} aria-label="إغلاق"><X size={19} /></button>
            <div className="candidate-detail-heading">
              <span className="candidate-result-avatar">{selected.full_name.slice(0, 1)}</span>
              <div><span className="eyebrow">ملف مهني</span><h2>{selected.full_name}</h2><p>{selected.headline} · {selected.specialization}</p></div>
            </div>
            <div className="candidate-detail-facts">
               <span><small>الموقع</small><b>{[selected.province, selected.city].filter(Boolean).join(" / ") || "غير محدد"}</b></span>
              <span><small>الخبرة</small><b>{selected.experience_years} سنوات</b></span>
              <span><small>التوفر</small><b>{selected.availability || "غير محدد"}</b></span>
            </div>
            <div className="candidate-detail-section"><h3>نبذة مهنية</h3><p>{selected.summary || "لا توجد نبذة مضافة."}</p></div>
            <div className="candidate-detail-section"><h3>المهارات</h3><div className="skill-pills">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
            <div className="candidate-detail-section"><h3>الخبرة العملية</h3><p>{formatCandidateExperiences(selected.experience_details) || "لا توجد تفاصيل مضافة."}</p></div>
            <div className="candidate-detail-section"><h3>التعليم واللغات</h3><p>{selected.education || "لا توجد بيانات تعليمية."}</p><p>{selected.languages.join(" · ") || "لا توجد لغات مضافة."}</p></div>
            <div className="candidate-contact-box"><b>بيانات التواصل</b><span>{selected.email}</span><span>{selected.phone}</span></div>
          </article>
        </div>
      )}
    </section>
  );
}