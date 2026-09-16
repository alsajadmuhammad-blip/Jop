import { useMemo, useState } from "react";
import { ArrowDownAZ, BriefcaseBusiness, Filter, MapPin, Search, X } from "lucide-react";
import { EmptyState, LoadingCards } from "../../components/common/Feedback";
import { PageIntro } from "../../components/common/PageIntro";
import { categories, jobTypes } from "../../lib/constants";
import type { Job, JobType } from "../../lib/types";
import { JobCard } from "../../features/jobs/JobCard";

export function JobsPage({ jobs, loading, onOpenJob }: { jobs: Job[]; loading: boolean; onOpenJob: (job: Job) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [jobType, setJobType] = useState<"الكل" | JobType>("الكل");
  const [city, setCity] = useState("الكل");
  const [sort, setSort] = useState<"newest" | "title">("newest");
  const [showFilters, setShowFilters] = useState(false);

  const cities = useMemo(() => Array.from(new Set(jobs.map((job) => job.city).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar")), [jobs]);
  const activeFilterCount = [category !== "الكل", jobType !== "الكل", city !== "الكل"].filter(Boolean).length;
  const clearFilters = () => {
    setQuery("");
    setCategory("الكل");
    setJobType("الكل");
    setCity("الكل");
    setSort("newest");
  };

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("ar");
    return jobs
      .filter((job) => {
        const searchable = `${job.title} ${job.company_name} ${job.city} ${job.category} ${job.job_type}`.toLocaleLowerCase("ar");
        return (!search || searchable.includes(search))
          && (category === "الكل" || job.category === category)
          && (jobType === "الكل" || job.job_type === jobType)
          && (city === "الكل" || job.city === city);
      })
      .sort((a, b) => sort === "title"
        ? a.title.localeCompare(b.title, "ar")
        : new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [jobs, query, category, jobType, city, sort]);

  return <section className="container page-section jobs-page">
    <div className="jobs-page-heading"><PageIntro eyebrow="فرص العمل" title="اختار فرصتك بسهولة" description="ابحث بالاسم أو الشركة، واستخدم الفلاتر للوصول للوظيفة المناسبة بسرعة." /><span className="jobs-total"><BriefcaseBusiness size={16} /> {loading ? "..." : `${filtered.length} وظيفة`}</span></div>
    <div className="filters-bar">
      <div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن وظيفة، شركة، أو مدينة..." aria-label="البحث عن وظيفة" /></div>
      <button className={showFilters ? "filter-toggle active" : "filter-toggle"} onClick={() => setShowFilters((value) => !value)} aria-expanded={showFilters}><Filter size={17} /> الفلاتر {activeFilterCount > 0 && <b>{activeFilterCount}</b>}</button>
      {(query || activeFilterCount > 0 || sort !== "newest") && <button className="clear-filters" onClick={clearFilters}><X size={15} /> مسح الكل</button>}
      {showFilters && <div className="filter-panel">
        <div className="filter-panel-header"><b>فلترة الوظائف</b><button onClick={() => setShowFilters(false)} aria-label="إغلاق الفلاتر"><X size={17} /></button></div>
        <div className="filter-group"><span>التصنيف</span><div className="filter-options">{["الكل", ...categories].map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
        <div className="filter-group"><span>نوع الدوام</span><div className="filter-options">{(["الكل", ...jobTypes] as const).map((item) => <button key={item} className={jobType === item ? "selected" : ""} onClick={() => setJobType(item)}>{item}</button>)}</div></div>
        {cities.length > 0 && <div className="filter-group"><span>المدينة</span><div className="filter-options">{["الكل", ...cities].map((item) => <button key={item} className={city === item ? "selected" : ""} onClick={() => setCity(item)}><MapPin size={13} /> {item}</button>)}</div></div>}
        <div className="filter-group"><span>ترتيب النتائج</span><div className="filter-options"><button className={sort === "newest" ? "selected" : ""} onClick={() => setSort("newest")}><ArrowDownAZ size={14} /> الأحدث أولاً</button><button className={sort === "title" ? "selected" : ""} onClick={() => setSort("title")}><ArrowDownAZ size={14} /> حسب الاسم</button></div></div>
      </div>}
    </div>
    {(category !== "الكل" || jobType !== "الكل" || city !== "الكل") && <div className="active-filter-list"><span>الفلاتر الحالية:</span>{category !== "الكل" && <button onClick={() => setCategory("الكل")}>{category} <X size={13} /></button>}{jobType !== "الكل" && <button onClick={() => setJobType("الكل")}>{jobType} <X size={13} /></button>}{city !== "الكل" && <button onClick={() => setCity("الكل")}>{city} <X size={13} /></button>}</div>}
    {loading ? <LoadingCards /> : filtered.length ? <div className="job-grid wide">{filtered.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div> : <EmptyState title="ماكو وظائف بهذا البحث" text="جرّب تغيير كلمات البحث أو إزالة أحد الفلاتر." />}
  </section>;
}