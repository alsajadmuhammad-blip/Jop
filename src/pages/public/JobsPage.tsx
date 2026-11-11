import { useEffect, useMemo, useRef, useState } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { EmptyState, LoadingCards } from "../../components/common/Feedback";
import { categories, jobTypes } from "../../lib/constants";
import { BRAND_NAME } from "../../lib/brand";
import type { Job, JobType, Profile } from "../../lib/types";
import { JobCard } from "../../features/jobs/JobCard";
import { hasSupabaseConfig } from "../../lib/supabase";
import { getBaghdadToday } from "../../lib/date";
import { loadSavedJobIds, toggleSavedJob } from "../../services/savedJobService";
import {
  loadPublicJobFilterOptions,
  loadPublicJobsPage,
  PUBLIC_PAGE_SIZE,
  type PublicJobCursor,
  type PublicJobFilters,
} from "../../services/publicService";
import "./iraq-jobs-redesign.css";

export type PublicJobSearch = {
  keyword: string;
  category: string;
  jobType: "الكل" | JobType;
  province: string;
};

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="jr-filter">
      <span>{label}</span>
      <span className="jr-select-wrap">
        <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option === "الكل"
                ? label === "التصنيف"
                  ? "كل التصنيفات"
                  : label === "نوع الدوام"
                    ? "كل أنواع الدوام"
                    : "كل المحافظات"
                : option}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </span>
    </label>
  );
}

type JobsPageProps = {
  jobs: Job[];
  loading: boolean;
  initialHasMoreJobs: boolean;
  onOpenJob: (job: Job) => void;
  profile?: Profile | null;
  onLogin?: () => void;
  onNotify?: (message: string) => void;
  embedded?: boolean;
  initialQuery?: string;
  initialCategory?: string;
  initialJobType?: "الكل" | JobType;
  initialProvince?: string;
  onFiltersChange?: (filters: PublicJobSearch) => void;
};

export function JobsPage({
  jobs,
  loading,
  initialHasMoreJobs,
  onOpenJob,
  profile,
  onLogin,
  onNotify,
  embedded = false,
  initialQuery = "",
  initialCategory = "الكل",
  initialJobType = "الكل",
  initialProvince = "الكل",
  onFiltersChange,
}: JobsPageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [jobType, setJobType] = useState<"الكل" | JobType>(initialJobType);
  const [province, setProvince] = useState(initialProvince);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [pageJobs, setPageJobs] = useState<Job[]>([]);
  const [serverProvinces, setServerProvinces] = useState<string[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(hasSupabaseConfig);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<PublicJobCursor | null>(null);
  const today = getBaghdadToday();
  const requestSequence = useRef(0);
  const notifyRef = useRef(onNotify);
  const filtersChangeRef = useRef(onFiltersChange);

  useEffect(() => {
    notifyRef.current = onNotify;
  }, [onNotify]);

  useEffect(() => {
    filtersChangeRef.current = onFiltersChange;
  }, [onFiltersChange]);

  useEffect(() => {
    setQuery(initialQuery);
    setCategory(initialCategory);
    setJobType(initialJobType);
    setProvince(initialProvince);
  }, [initialQuery, initialCategory, initialJobType, initialProvince]);

  useEffect(() => {
    filtersChangeRef.current?.({ keyword: query, category, jobType, province });
  }, [query, category, jobType, province]);

  const filters = useMemo<PublicJobFilters>(() => ({
    keyword: query,
    category,
    jobType,
    province,
  }), [query, category, jobType, province]);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    let active = true;
    void loadPublicJobFilterOptions().then((result) => {
      if (!active) return;
      if (result.error) {
        notifyRef.current?.("تعذر تحميل قائمة المحافظات.");
        return;
      }
      setServerProvinces(result.options?.provinces || []);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoadingJobs(false);
      return;
    }

    const sequence = ++requestSequence.current;
    setPageJobs([]);
    setHasMore(false);
    setNextCursor(null);
    setLoadingJobs(true);
    if (loading) return;

    const isDefaultSearch = !filters.keyword.trim()
      && filters.category === "الكل"
      && filters.jobType === "الكل"
      && filters.province === "الكل";

    if (isDefaultSearch) {
      const availableJobs = jobs.filter((job) => Boolean(job.deadline) && job.deadline! >= today);
      const firstPage = availableJobs.slice(0, PUBLIC_PAGE_SIZE);
      const lastJob = firstPage[firstPage.length - 1];
      setPageJobs(firstPage);
      setHasMore(initialHasMoreJobs || availableJobs.length > PUBLIC_PAGE_SIZE);
      setNextCursor(lastJob && (initialHasMoreJobs || availableJobs.length > PUBLIC_PAGE_SIZE)
        ? { id: lastJob.id, created_at: lastJob.created_at }
        : null);
      setLoadingJobs(false);
      return;
    }

    const timer = setTimeout(() => {
      void loadPublicJobsPage(filters).then((result) => {
        if (requestSequence.current !== sequence) return;
        setLoadingJobs(false);
        if (result.error) {
          notifyRef.current?.("تعذر تحميل الوظائف. تأكد من تطبيق تحديث قاعدة البيانات.");
          return;
        }
        setPageJobs(result.jobs);
        setHasMore(result.hasMore);
        setNextCursor(result.nextCursor);
      });
    }, filters.keyword.trim() ? 350 : 0);

    return () => {
      clearTimeout(timer);
    };
  }, [filters, initialHasMoreJobs, jobs, loading]);

  useEffect(() => {
    if (profile?.role !== "candidate" || !hasSupabaseConfig) {
      setSavedIds([]);
      return;
    }
    void loadSavedJobIds().then((result) => setSavedIds(result.ids));
  }, [profile]);

  const toggleSaved = async (job: Job) => {
    if (profile?.role !== "candidate") {
      onLogin?.();
      return;
    }
    const saved = savedIds.includes(job.id);
    const error = await toggleSavedJob(job.id, saved);
    if (error) return onNotify?.("تعذر تحديث المحفوظات.");
    setSavedIds((current) => saved ? current.filter((id) => id !== job.id) : [...current, job.id]);
    onNotify?.(saved ? "أزيلت الوظيفة من المحفوظات" : "تم حفظ الوظيفة");
  };

  const localFilteredJobs = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("ar");
    return jobs
      .filter((job) => {
        const searchable = `${job.title} ${job.company_name} ${job.province} ${job.city} ${job.category} ${job.job_type}`.toLocaleLowerCase("ar");
        return Boolean(job.deadline) && job.deadline! >= today
          && (!search || searchable.includes(search))
          && (category === "الكل" || job.category === category)
          && (jobType === "الكل" || job.job_type === jobType)
          && (province === "الكل" || job.province === province);
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [jobs, query, category, jobType, province, today]);
  const visibleJobs = hasSupabaseConfig ? pageJobs : localFilteredJobs;
  const pageLoading = hasSupabaseConfig ? loadingJobs : loading;
  const provinces = hasSupabaseConfig && serverProvinces.length
    ? serverProvinces
    : Array.from(new Set(jobs.filter((job) => job.status === "published" && Boolean(job.deadline) && job.deadline! >= today).map((job) => job.province).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar"));
  const hasActiveFilters = Boolean(query.trim() || category !== "الكل" || jobType !== "الكل" || province !== "الكل");
  const clearFilters = () => {
    setQuery("");
    setCategory("الكل");
    setJobType("الكل");
    setProvince("الكل");
  };

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    const sequence = requestSequence.current;
    setLoadingMore(true);
    const result = await loadPublicJobsPage(filters, nextCursor);
    if (requestSequence.current !== sequence) {
      setLoadingMore(false);
      return;
    }
    setLoadingMore(false);
    if (result.error) {
      onNotify?.("تعذر تحميل بقية الوظائف.");
      return;
    }
    setPageJobs((current) => [...current, ...result.jobs]);
    setHasMore(result.hasMore);
    setNextCursor(result.nextCursor);
  };

  return (
    <section className={`jobs-page-redesign${embedded ? " is-embedded" : ""}`} dir="rtl">
      {!embedded && (
        <header className="jr-heritage-hero">
          <img src="/images/iraq-heritage-home.webp?v=2" alt="" aria-hidden="true" />
          <div className="jr-hero-shade" />
          <div className="jr-hero-content">
            <span className="jr-hero-kicker"><MapPin size={13} /> فرص مهنية في محافظات العراق</span>
            <h1>ابحث عن عمل<br /><em>يناسب خطوتك</em></h1>
            <p>اكتشف الفرص حسب اختصاصك ومكانك، واختر ما يناسب خبرتك.</p>
          </div>
        </header>
      )}

      <div className="jr-content">
        {!embedded && (
          <>
            <div className="jr-intro-row">
              <div>
                <span className="jr-eyebrow">مساحة البحث</span>
                <h2>فرص العمل</h2>
              </div>
              <span className="jr-free-mark"><ShieldCheck size={14} /> اكتشاف مجاني</span>
            </div>

            <div className="jr-search-block" role="search" aria-label="البحث عن الوظائف">
              <Search size={18} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="المسمى الوظيفي، الجهة أو الموقع"
                aria-label="ابحث بالمسمى أو الجهة أو الموقع"
              />
              {query && (
                <button type="button" aria-label="مسح البحث" onClick={() => setQuery("")}>
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="jr-filter-heading">
              <span><SlidersHorizontal size={14} /> ضيّق نطاق البحث</span>
              {hasActiveFilters && <button type="button" onClick={clearFilters}>مسح الفلاتر</button>}
            </div>
            <div className="jr-filters">
              <FilterSelect
                label="التصنيف"
                value={category}
                options={["الكل", ...categories, "عام"]}
                onChange={setCategory}
              />
              <FilterSelect
                label="نوع الدوام"
                value={jobType}
                options={["الكل", ...jobTypes]}
                onChange={(value) => setJobType(value as "الكل" | JobType)}
              />
              <FilterSelect
                label="المحافظة"
                value={province}
                options={["الكل", ...provinces.filter((item) => item !== "الكل")]}
                onChange={setProvince}
              />
            </div>

            {hasActiveFilters && (
              <div className="jr-active-filters" role="group" aria-label="الفلاتر النشطة">
                {query.trim() && (
                  <button type="button" onClick={() => setQuery("")}>
                    بحث: {query.trim()} <X size={12} aria-hidden="true" />
                  </button>
                )}
                {category !== "الكل" && (
                  <button type="button" onClick={() => setCategory("الكل")}>
                    التصنيف: {category} <X size={12} aria-hidden="true" />
                  </button>
                )}
                {jobType !== "الكل" && (
                  <button type="button" onClick={() => setJobType("الكل")}>
                    الدوام: {jobType} <X size={12} aria-hidden="true" />
                  </button>
                )}
                {province !== "الكل" && (
                  <button type="button" onClick={() => setProvince("الكل")}>
                    المحافظة: {province} <X size={12} aria-hidden="true" />
                  </button>
                )}
                <button className="jr-clear-all" type="button" onClick={clearFilters}>مسح الكل</button>
              </div>
            )}
          </>
        )}

        <div className="jr-results-heading">
          <div>
            <span className="jr-eyebrow">{embedded ? "جديد المنصة" : "تصفّح حسب ما يهمك"}</span>
            <h2>{embedded ? "فرص تستحق أن تراها" : "وظائف مختارة"}</h2>
          </div>
          <span className="jr-result-count">
            {pageLoading ? "…" : `${visibleJobs.length}${hasMore ? "+" : ""} وظيفة`}
          </span>
        </div>

        {pageLoading ? (
          <LoadingCards />
        ) : visibleJobs.length ? (
          <div className="job-grid wide">
            {visibleJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => onOpenJob(job)}
                saved={savedIds.includes(job.id)}
                onToggleSaved={() => void toggleSaved(job)}
              />
            ))}
          </div>
        ) : (
          <div className="jr-empty-state">
            <EmptyState title="ماكو وظائف بهذا البحث" text="جرّب تغيير كلمات البحث أو إزالة أحد الفلاتر." />
          </div>
        )}

        {!pageLoading && hasMore && (
          <button
            type="button"
            className="primary-btn jobs-load-more"
            disabled={loadingMore}
            onClick={() => void loadMore()}
          >
            {loadingMore ? "جاري تحميل المزيد..." : `عرض ${PUBLIC_PAGE_SIZE} وظائف إضافية`}
          </button>
        )}

        {!embedded && (
          <aside className="jr-trust-footer">
            <ShieldCheck size={20} aria-hidden="true" />
            <p>
              <strong>ابحث بثقة.</strong> {BRAND_NAME} منصة مجانية لاكتشاف الوظائف. تحقّق من تفاصيل الإعلان والجهة قبل التقديم.
            </p>
          </aside>
        )}
      </div>
    </section>
  );
}