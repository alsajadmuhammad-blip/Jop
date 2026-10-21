import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  Plus,
  X,
} from "lucide-react";
import { EmptyState } from "../../components/common/Feedback";
import { AppSelect } from "../../components/common/AppSelect";
import { formatDate } from "../../lib/format";
import type { Application, ApplicationStatus, CandidateProfile, CandidateSearchResult, Profile } from "../../lib/types";
import type { Notify } from "../../app/types";
import type { View } from "../../app/types";
import { openApplicationCv, updateApplicationStatus } from "../../services/applicationService";
import { CandidateProfilePage } from "./CandidateProfilePage";
import {
  emptyCandidateSearchFilters,
  CANDIDATE_SEARCH_PAGE_SIZE,
  loadCandidateProfile,
  loadCandidateSearchOptions,
  searchCandidateProfiles,
  type CandidateSearchCursor,
  type CandidateSearchFilters,
  type CandidateSearchOptions,
} from "../../services/candidateService";

export type HrSection = "search" | "applications";

function CandidateFacetField({
  label,
  placeholder,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className={`rs-filter-field${value ? " is-selected" : ""}`}>
      <span>{label}<small>{options.length}</small></span>
      <AppSelect
        className="rs-filter-select"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        options={options}
        ariaLabel={label}
      />
    </label>
  );
}

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [nextCursor, setNextCursor] = useState<CandidateSearchCursor | null>(null);
  const [resultsFilterSignature, setResultsFilterSignature] = useState("");
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [facetRetry, setFacetRetry] = useState(0);
  const [selected, setSelected] = useState<CandidateProfile | null>(null);
  const [selectedSource, setSelectedSource] = useState<"search" | "applications">("search");
  const [opening, setOpening] = useState("");
  const searchSequence = useRef(0);
  const facetLoadSequence = useRef(0);
  const recentlyChangedFilter = useRef<keyof CandidateSearchFilters | null>(null);

  const isSupervisor = profile.role === "admin";
  const canSearch = profile.can_search_candidates || isSupervisor;

  useEffect(() => {
    let active = true;
    if (!canSearch || section !== "search") {
      setOptionsLoading(false);
      return () => {
        active = false;
      };
    }

    setOptionsLoading(true);
    const sequence = ++facetLoadSequence.current;
    const requestedFilters = filters;
    const requestedSignature = JSON.stringify(requestedFilters);
    const timeout = window.setTimeout(() => {
      void loadCandidateSearchOptions(requestedFilters)
        .then((result) => {
          if (!active || sequence !== facetLoadSequence.current) return;
          setOptionsLoading(false);
          if (result.error || !result.options) {
            onNotify("تعذر تحديث خيارات الفلترة. تأكد من تطبيق تحديث البحث في Supabase.");
            return;
          }

          setOptions(result.options);
          setFilters((current) => {
            if (JSON.stringify(current) !== requestedSignature) return current;

            const preserve = recentlyChangedFilter.current;
            const next = { ...current };
            if (preserve !== "specialization" && next.specialization && !result.options?.specializations.includes(next.specialization)) next.specialization = "";
            if (preserve !== "province" && next.province && !result.options?.provinces.includes(next.province)) next.province = "";
            if (preserve !== "city" && next.city && !result.options?.cities.includes(next.city)) next.city = "";
            if (preserve !== "workType" && next.workType && !result.options?.workTypes.includes(next.workType)) next.workType = "";
            if (preserve !== "skill" && next.skill && !result.options?.skills.includes(next.skill)) next.skill = "";
            if (preserve !== "availability" && next.availability && !result.options?.availabilities.includes(next.availability)) next.availability = "";
            if (
              preserve !== "minExperience" &&
              next.minExperience &&
              !result.options?.experienceYears.some((years) => years >= Number(next.minExperience))
            ) {
              next.minExperience = "";
            }
            recentlyChangedFilter.current = null;
            return JSON.stringify(current) === JSON.stringify(next) ? current : next;
          });
        })
        .catch(() => {
          if (!active || sequence !== facetLoadSequence.current) return;
          setOptionsLoading(false);
          onNotify("تعذر تحديث خيارات الفلترة. تأكد من تطبيق تحديث البحث في Supabase.");
        });
    }, 220);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [canSearch, facetRetry, filters, onNotify, section]);

  useEffect(() => {
    setSelected(null);
  }, [section]);

  const updateFilter = <K extends keyof CandidateSearchFilters>(
    key: K,
    value: CandidateSearchFilters[K],
  ) => {
    recentlyChangedFilter.current = key;
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilter = (key: keyof CandidateSearchFilters) => {
    if (key === "remoteOnly") {
      updateFilter("remoteOnly", false);
      return;
    }
    updateFilter(key, "");
  };

  const activeFilterCount = useMemo(
    () => [
      filters.keyword.trim(),
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
  const resultsAreCurrent = resultsFilterSignature === JSON.stringify(filters);
  const experienceOptions = useMemo(() => {
    const years = options?.experienceYears || [];
    const selectedThreshold = filters.minExperience ? Number(filters.minExperience) : null;
    if (
      selectedThreshold !== null &&
      years.some((value) => value >= selectedThreshold) &&
      !years.includes(selectedThreshold)
    ) {
      return [...years, selectedThreshold].sort((left, right) => left - right);
    }
    return years;
  }, [filters.minExperience, options?.experienceYears]);
  const filterChips: { key: keyof CandidateSearchFilters; label: string; value: string }[] = [
    { key: "keyword", label: "بحث", value: filters.keyword.trim() },
    { key: "specialization", label: "التخصص", value: filters.specialization },
    { key: "province", label: "المحافظة", value: filters.province },
    { key: "city", label: "المدينة", value: filters.city },
    { key: "skill", label: "المهارة", value: filters.skill },
    { key: "workType", label: "نوع العمل", value: filters.workType },
    { key: "availability", label: "التوفر", value: filters.availability },
    { key: "minExperience", label: "الخبرة", value: filters.minExperience ? `${filters.minExperience}+ سنوات` : "" },
    { key: "remoteOnly", label: "العمل", value: filters.remoteOnly ? "عن بُعد" : "" },
  ];
  const activeFilterChips = filterChips.filter((chip) => Boolean(chip.value));

  const resetFilters = () => {
    recentlyChangedFilter.current = null;
    setFilters(emptyCandidateSearchFilters);
    setResults([]);
    setSearched(false);
    setHasMoreResults(false);
    setNextCursor(null);
    setResultsFilterSignature("");
    setSearching(false);
    setLoadingMore(false);
    searchSequence.current += 1;
  };

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    const sequence = ++searchSequence.current;
    setSearching(true);
    setLoadingMore(false);
    setResults([]);
    setSearched(false);
    setResultsFilterSignature("");
    setHasMoreResults(false);
    setNextCursor(null);
    const result = await searchCandidateProfiles(filters);
    if (sequence !== searchSequence.current) return;
    setSearching(false);
    setSearched(true);
    if (result.error) {
      setResults([]);
      setResultsFilterSignature(JSON.stringify(filters));
      onNotify(String((result.error as { message?: string }).message || "تعذر تنفيذ البحث."));
      return;
    }
    setResults(result.profiles);
    setHasMoreResults(result.hasMore);
    setNextCursor(result.nextCursor);
    setResultsFilterSignature(JSON.stringify(filters));
  };

  const loadMoreCandidates = async () => {
    if (!nextCursor || loadingMore || resultsFilterSignature !== JSON.stringify(filters)) return;
    const sequence = searchSequence.current;
    setLoadingMore(true);
    const result = await searchCandidateProfiles(filters, nextCursor);
    if (sequence !== searchSequence.current) {
      setLoadingMore(false);
      return;
    }
    setLoadingMore(false);
    if (result.error) {
      onNotify(String((result.error as { message?: string }).message || "تعذر تحميل بقية الباحثين."));
      return;
    }
    setResults((current) => [...current, ...result.profiles]);
    setHasMoreResults(result.hasMore);
    setNextCursor(result.nextCursor);
  };

  const setStatus = async (id: string, status: ApplicationStatus) => {
    const error = await updateApplicationStatus(id, status);
    if (error) return onNotify(error.message);
    onNotify("تم تحديث حالة المتقدم");
    onRefresh();
  };

  const openApplication = async (application: Application) => {
    if (!application.candidate_id && !application.cv_path) {
      return onNotify("لا يوجد ملف مرتبط بهذا التقديم.");
    }

    setOpening(application.id);
    setSelected(null);
    setSelectedSource("applications");

    if (application.candidate_id) {
      const result = await loadCandidateProfile(application.candidate_id);
      setOpening("");
      if (result.error) return onNotify("تعذر فتح الملف المهني. تأكد من صلاحيات الوصول.");
      if (!result.profile) return onNotify("لم يتم العثور على الملف المهني لهذا المتقدم.");
      setSelected(result.profile);
      return;
    }

    try {
      await openApplicationCv(application.cv_path as string);
    } catch (error) {
      onNotify(error instanceof Error ? error.message : "تعذر فتح الملف.");
    } finally {
      setOpening("");
    }
  };

  if (!canSearch && section === "search") {
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

  if (selected) {
    return <CandidateProfilePage candidate={selected} source={selectedSource} onBack={() => setSelected(null)} />;
  }

  return (
    <section className={`container page-section dashboard-page hr-workspace-page${section === "search" ? " hr-candidate-search-page" : ""}`}>
      {section === "search" && <>
        <header className="rs-hero">
          <div className="rs-hero-copy">
            <span className="rs-kicker"><i /> {isSupervisor ? "مساحة المشرف" : "مساحة صاحب العمل / HR"}</span>
            <h1>اعثر على الكفاءة المناسبة لفريقك</h1>
            <p>{isSupervisor ? "ابحث في ملفات الباحثين وساعد في مطابقة الكفاءات مع الوظائف المنشورة." : "بحث أوضح في ملفات الباحثين المتاحة، بخيارات تتغير مع كل معيار تختاره."}</p>
            <div className="rs-hero-tags">
              <span><CheckCircle2 size={14} /> ملفات مكتملة ومطابقة</span>
              <span><ShieldAlert size={14} /> وصول مقيّد ومصرّح</span>
            </div>
          </div>
        </header>

        <section className="rs-stats" aria-label="ملخص البحث">
          <div className="rs-stat"><span className="rs-stat-icon"><UserRound size={16} /></span><p><b>{options?.total ?? "—"}</b><small>باحث ضمن المعايير</small></p></div>
          <div className="rs-stat"><span className="rs-stat-icon"><Search size={16} /></span><p><b>{searched && resultsAreCurrent ? results.length : "—"}</b><small>نتيجة بحث محمّلة</small></p></div>
          <div className="rs-stat"><span className="rs-stat-icon"><Clock3 size={16} /></span><p><b>{applications.length}</b><small>{isSupervisor ? "تقديم على وظائفك" : "طلبات واردة"}</small></p></div>
          <div className="rs-stat rs-stat-note"><SlidersHorizontal size={16} /><span>قوائم الفلاتر تتكيّف مع بقية اختياراتك وتعرض القيم المتاحة فقط.</span></div>
        </section>
      </>}

      {section === "search" && (
        <div className="rs-workspace" aria-busy={searching || optionsLoading}>
          <form className="rs-filter-card" onSubmit={search}>
            <div className="rs-panel-head">
              <div>
                <span className="rs-eyebrow">بحث من البيانات الفعلية</span>
                <h2>ابنِ بحثك</h2>
                <p>اختر تخصصاً أو موقعاً، وستتغيّر بقية الخيارات حسب الملفات المطابقة.</p>
              </div>
              <span className="rs-filter-symbol"><SlidersHorizontal size={18} /></span>
            </div>

            <label className="rs-keyword">
              <span>كلمة البحث <small>اختياري</small></span>
              <div className="rs-keyword-wrap">
                <Search size={16} />
                <input value={filters.keyword} onChange={(event) => updateFilter("keyword", event.target.value)} placeholder="مسمى، إنجاز، تعليم أو لغة" aria-label="كلمة البحث" />
              </div>
            </label>

            <div className="rs-filter-grid">
              <CandidateFacetField label="التخصص" placeholder="كل التخصصات" value={filters.specialization} disabled={!options} onChange={(value) => updateFilter("specialization", value)} options={(options?.specializations || []).map((value) => ({ value, label: value }))} />
              <CandidateFacetField label="المحافظة" placeholder="كل المحافظات" value={filters.province} disabled={!options} onChange={(value) => updateFilter("province", value)} options={(options?.provinces || []).map((value) => ({ value, label: value }))} />
              <CandidateFacetField label="المدينة" placeholder="كل المدن" value={filters.city} disabled={!options} onChange={(value) => updateFilter("city", value)} options={(options?.cities || []).map((value) => ({ value, label: value }))} />
              <CandidateFacetField label="المهارة" placeholder="كل المهارات" value={filters.skill} disabled={!options} onChange={(value) => updateFilter("skill", value)} options={(options?.skills || []).map((value) => ({ value, label: value }))} />
              <CandidateFacetField label="نوع العمل" placeholder="كل الأنواع" value={filters.workType} disabled={!options} onChange={(value) => updateFilter("workType", value)} options={(options?.workTypes || []).map((value) => ({ value, label: value }))} />
              <CandidateFacetField label="التوفر للعمل" placeholder="كل حالات التوفر" value={filters.availability} disabled={!options} onChange={(value) => updateFilter("availability", value)} options={(options?.availabilities || []).map((value) => ({ value, label: value }))} />
              <CandidateFacetField label="الخبرة" placeholder="أي مستوى خبرة" value={filters.minExperience} disabled={!options} onChange={(value) => updateFilter("minExperience", value)} options={experienceOptions.map((value) => ({ value: String(value), label: `من ${value} سنة فأكثر` }))} />
            </div>

            <label className="rs-remote">
              <input type="checkbox" checked={filters.remoteOnly} onChange={(event) => updateFilter("remoteOnly", event.target.checked)} />
              <span>أظهر من يقبل العمل عن بُعد فقط</span>
            </label>

            {optionsLoading && <p className="rs-options-status" role="status"><span className="live-dot" /> {options ? "جارٍ تحديث الخيارات حسب معاييرك..." : "جارٍ تجهيز الخيارات من ملفات الباحثين..."}</p>}
            {!options && !optionsLoading && <div className="rs-options-error" role="alert">
              <span>تعذر تحميل خيارات البحث. قد يحتاج تحديث البحث في قاعدة البيانات إلى التطبيق.</span>
              <button type="button" onClick={() => setFacetRetry((current) => current + 1)}>إعادة المحاولة</button>
            </div>}

            <div className="rs-form-actions">
              <button className="rs-submit" disabled={searching || optionsLoading}>
                {searching ? "جاري البحث..." : "عرض الباحثين"} <Search size={16} />
              </button>
              {activeFilterCount > 0 && <button type="button" className="rs-reset" onClick={resetFilters}><RotateCcw size={14} /> مسح الفلاتر ({activeFilterCount})</button>}
            </div>
          </form>

          <section className="rs-results-card" aria-live="polite">
            <div className="rs-results-head">
              <div>
                <span className="rs-eyebrow">النتائج المطابقة</span>
                <h2>{searching ? "جاري البحث..." : searched && resultsAreCurrent ? `${results.length}${hasMoreResults ? "+" : ""} ملف مطابق` : searched ? "أعد البحث بالمعايير الجديدة" : "مساحة النتائج"}</h2>
              </div>
              <span className="rs-match-count"><ShieldCheck size={13} /> {searched ? "الملفات الداخلية المصرّح بها" : "ابحث ضمن الملفات المصرح بها"}</span>
            </div>
            {activeFilterChips.length > 0 && <div className="rs-active-filters" aria-label="الفلاتر الحالية">
              {activeFilterChips.map((chip) => <button type="button" className="rs-active-filter" key={chip.key} onClick={() => clearFilter(chip.key)}>
                <span>{chip.label}: <b>{chip.value}</b></span><X size={13} aria-hidden="true" />
              </button>)}
            </div>}
            {searching ? (
              <div className="rs-loading" role="status"><span className="live-dot" /><p>جاري البحث في الملفات المطابقة...</p></div>
            ) : searched && !resultsAreCurrent ? (
              <div className="rs-empty"><span className="rs-empty-icon"><SlidersHorizontal size={23} /></span><h3>تغيّرت معايير البحث</h3><p>اضغط «عرض الباحثين» حتى نحدّث النتائج حسب خياراتك الجديدة.</p></div>
            ) : results.length ? (
              <div className="rs-result-list">
                {results.map((candidate) => (
                  <article className="rs-candidate" key={candidate.user_id}>
                    <div className="rs-candidate-main">
                      <span className="rs-avatar" aria-hidden="true">{candidate.full_name.slice(0, 1)}</span>
                      <div className="rs-candidate-info">
                        <div className="rs-name-row"><b>{candidate.full_name}</b><span className="rs-verified"><CheckCircle2 size={12} /> ملف مكتمل</span></div>
                        <strong className="rs-headline">{candidate.headline || candidate.specialization}</strong>
                        <div className="rs-meta">
                          <span><MapPin size={12} />{candidate.province} / {candidate.city}</span>
                          <span><BriefcaseBusiness size={12} />{candidate.experience_years} سنوات خبرة</span>
                          <span><Clock3 size={12} />{candidate.availability}</span>
                        </div>
                        <div className="rs-skill-row">{candidate.skills.slice(0, 4).map((skill) => <span className="rs-skill" key={skill}>{skill}</span>)}</div>
                      </div>
                    </div>
                    <button className="rs-open" type="button" onClick={() => { setSelectedSource("search"); setSelected(candidate); }} aria-label={`عرض الملف المهني لـ ${candidate.full_name}`} title="عرض الملف">
                      <ArrowDownLeft size={18} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rs-empty">
                <span className="rs-empty-icon">{searched ? <Search size={23} /> : <SlidersHorizontal size={23} />}</span>
                <h3>{searched ? "لا توجد ملفات مطابقة" : "ابدأ بتحديد المواصفات"}</h3>
                <p>{searched ? "جرّب إزالة فلتر أو اختيار قيمة ثانية من القوائم، ثم أعد البحث." : "حدّد التخصص أو الموقع المناسب. القوائم تتكيّف تلقائياً مع اختياراتك."}</p>
                {searched && <button type="button" onClick={resetFilters}>مسح الفلاتر والبدء من جديد</button>}
              </div>
            )}
            {hasMoreResults && resultsFilterSignature === JSON.stringify(filters) && <button
              type="button"
              className="rs-load-more"
              disabled={loadingMore || searching}
              onClick={() => void loadMoreCandidates()}
            >
              {loadingMore ? "جاري تحميل المزيد..." : `عرض ${CANDIDATE_SEARCH_PAGE_SIZE} باحثين إضافيين`}
            </button>}
          </section>
        </div>
      )}

      {section === "applications" && (
        <div className="applications-section">
          <div className="applications-section-heading">
            <div><span className="eyebrow">متابعة التقديمات</span><h2>{isSupervisor ? "التقديمات على وظائفك" : "الطلبات الواردة"}</h2><p>{isSupervisor ? "تابع المتقدمين على الوظائف التي نشرتها، وافتح ملفاتهم وحدّث حالة كل طلب." : "راجع الطلبات وحدّث حالتها حتى يبقى مسار المتابعة واضحًا."}</p></div>
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
                    {application.note && <p className="application-row-note"><b>ملاحظة الباحث:</b> {application.note}</p>}
                  </div>
                  <div className="application-row-status">
                    <small>حالة الطلب</small>
                    <AppSelect
                      value={application.status}
                      onChange={(value) => void setStatus(application.id, value as ApplicationStatus)}
                      options={[
                        { value: "new", label: "جديد" },
                        { value: "reviewing", label: "قيد المراجعة" },
                        { value: "shortlisted", label: "مرشح" },
                        { value: "rejected", label: "مرفوض" },
                        { value: "hired", label: "مقبول" },
                      ]}
                      ariaLabel="حالة الطلب"
                    />
                   </div>
                   <button className="row-action" disabled={opening === application.id || (!application.candidate_id && !application.cv_path)} onClick={() => void openApplication(application)}>
                     {opening === application.id ? "جاري الفتح..." : application.candidate_id ? "فتح الملف المهني" : application.cv_path ? "فتح CV" : "فتح الملف"}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={isSupervisor ? "لا توجد تقديمات على وظائفك بعد" : "لا توجد طلبات واردة بعد"} text={isSupervisor ? "انشر وظيفة وفعّل استقبال التقديمات المباشر لتصل الطلبات إلى هذه الصفحة." : "عند إرسال الباحثين لطلبات HR راح تظهر هنا."} />
          )}
        </div>
      )}

    </section>
  );
}