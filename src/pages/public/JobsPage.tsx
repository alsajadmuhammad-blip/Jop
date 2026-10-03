import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, MapPin, Search, ShieldCheck, X } from "lucide-react";
import { EmptyState, LoadingCards } from "../../components/common/Feedback";
import { categories, jobTypes } from "../../lib/constants";
import type { Job, JobType, Profile } from "../../lib/types";
import { JobCard } from "../../features/jobs/JobCard";
import { hasSupabaseConfig } from "../../lib/supabase";
import { loadSavedJobIds, toggleSavedJob } from "../../services/savedJobService";
import {
  loadPublicJobFilterOptions,
  loadPublicJobsPage,
  PUBLIC_PAGE_SIZE,
  type PublicJobCursor,
  type PublicJobFilters,
} from "../../services/publicService";

export function JobsPage({ jobs, loading, initialHasMoreJobs, onOpenJob, profile, onLogin, onNotify }: { jobs: Job[]; loading: boolean; initialHasMoreJobs: boolean; onOpenJob: (job: Job) => void; profile?: Profile | null; onLogin?: () => void; onNotify?: (message: string) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [jobType, setJobType] = useState<"الكل" | JobType>("الكل");
  const [province, setProvince] = useState("الكل");
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [pageJobs, setPageJobs] = useState<Job[]>([]);
  const [serverProvinces, setServerProvinces] = useState<string[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(hasSupabaseConfig);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<PublicJobCursor | null>(null);
  const requestSequence = useRef(0);
  const notifyRef = useRef(onNotify);

  useEffect(() => {
    notifyRef.current = onNotify;
  }, [onNotify]);

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
      const firstPage = jobs.slice(0, PUBLIC_PAGE_SIZE);
      const lastJob = firstPage[firstPage.length - 1];
      setPageJobs(firstPage);
      setHasMore(initialHasMoreJobs || jobs.length > PUBLIC_PAGE_SIZE);
      setNextCursor(lastJob && (initialHasMoreJobs || jobs.length > PUBLIC_PAGE_SIZE)
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
        return (!search || searchable.includes(search))
          && (category === "الكل" || job.category === category)
          && (jobType === "الكل" || job.job_type === jobType)
          && (province === "الكل" || job.province === province);
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [jobs, query, category, jobType, province]);
  const visibleJobs = hasSupabaseConfig ? pageJobs : localFilteredJobs;
  const pageLoading = hasSupabaseConfig ? loadingJobs : loading;
  const provinces = hasSupabaseConfig && serverProvinces.length
    ? serverProvinces
    : Array.from(new Set(jobs.filter((job) => job.status === "published").map((job) => job.province).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar"));
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

  return <section className="container page-section jobs-page">
    <header className="jobs-hero-banner">
      <div className="jobs-hero-copy">
        <span className="jobs-hero-eyebrow"><BriefcaseBusiness size={15} /> IRAQ JOBS <i /> فرص العمل</span>
        <h1>خطوتك القادمة تبدأ من هنا</h1>
        <p>اكتشف الوظائف المنشورة في محافظات العراق، واختر الفرصة الأقرب إلى خبرتك.</p>
      </div>
      <div className="jobs-hero-mark" aria-hidden="true"><MapPin size={30} /></div>
      <div className="jobs-hero-count"><strong>{pageLoading ? "…" : `${visibleJobs.length}${hasMore ? "+" : ""}`}</strong><span>فرصة في النتائج</span></div>
    </header>

    <aside className="home-refresh-notice jobs-page-notice">
      <div className="home-refresh-notice-icon"><ShieldCheck size={24} /></div>
      <div>
        <strong>مهم تعرف</strong>
        <p>IRAQ JOBS منصة مجانية وخيرية لنشر الوظائف فقط. لا نأخذ أجوراً مقابل نشر الوظائف أو التوظيف أو التقديم، ولا نتحمل مسؤولية صحة الإعلانات أو نتائج التواصل بين الأطراف.</p>
      </div>
    </aside>

    <div className="jobs-browse-tools">
      <div className="jobs-classic-filters">
        <label className="jobs-search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالمسمى أو اسم الشركة" aria-label="البحث عن وظيفة" /></label>
        <label className="jobs-select-field"><span>التصنيف</span><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="تصفية حسب التصنيف"><option value="الكل">كل التصنيفات</option>{[...categories, "عام"].map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label className="jobs-select-field"><span>نوع الدوام</span><select value={jobType} onChange={(event) => setJobType(event.target.value as "الكل" | JobType)} aria-label="تصفية حسب نوع الدوام"><option value="الكل">كل أنواع الدوام</option>{jobTypes.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      {hasActiveFilters && <button className="clear-filters" type="button" onClick={clearFilters}><X size={15} /> مسح الفلاتر</button>}
    </div>

    <section className="jobs-province-section" aria-labelledby="jobs-province-heading">
      <div className="jobs-province-heading"><div><span className="jobs-section-eyebrow">اعثر على فرصتك قريباً منك</span><h2 id="jobs-province-heading">تصفية حسب المحافظة</h2></div><span>المعروض فقط المحافظات التي فيها وظائف منشورة</span></div>
      <div className="jobs-province-scroll" role="group" aria-label="تصفية حسب المحافظة">
        <button type="button" className={province === "الكل" ? "selected" : ""} aria-pressed={province === "الكل"} onClick={() => setProvince("الكل")}>كل المحافظات</button>
        {provinces.map((item) => <button type="button" key={item} className={province === item ? "selected" : ""} aria-pressed={province === item} onClick={() => setProvince(item)}>{item}</button>)}
      </div>
      {!provinces.length && !pageLoading && <p className="jobs-no-provinces">ستظهر المحافظات هنا عند نشر وظائف فيها.</p>}
    </section>

      <div className="jobs-results-bar"><div><span className="eyebrow">نتائج البحث</span><strong>{pageLoading ? "جاري التحميل..." : `${visibleJobs.length}${hasMore ? "+" : ""} وظيفة متاحة`}</strong></div><span>مرتبة حسب الأحدث</span></div>
      {pageLoading ? <LoadingCards /> : visibleJobs.length ? <div className="job-grid wide">{visibleJobs.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} saved={savedIds.includes(job.id)} onToggleSaved={() => void toggleSaved(job)} />)}</div> : <EmptyState title="ماكو وظائف بهذا البحث" text="جرّب تغيير كلمات البحث أو إزالة أحد الفلاتر." />}
      {!pageLoading && hasMore && <button type="button" className="primary-btn jobs-load-more" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "جاري تحميل المزيد..." : `عرض ${PUBLIC_PAGE_SIZE} وظائف إضافية`}</button>}
  </section>;
}