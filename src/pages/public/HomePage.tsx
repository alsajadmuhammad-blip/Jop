import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileText,
  HeartHandshake,
  MapPin,
  Search,
  Users,
  Wallet,
} from "lucide-react";
import { JobsPage } from "./JobsPage";
import type { View } from "../../app/types";
import type { Job, Profile } from "../../lib/types";
import { categories } from "../../lib/constants";
import "./iraq-jobs-redesign.css";

type HomeSearch = {
  keyword: string;
  category: string;
  province: string;
};

type HomePageProps = {
  jobs: Job[];
  hasMoreJobs: boolean;
  loading: boolean;
  profile?: Profile | null;
  initialQuery?: string;
  initialCategory?: string;
  initialProvince?: string;
  onNavigate: (view: View) => void;
  onSearchJobs: (filters: HomeSearch) => void;
  onOpenJob: (job: Job) => void;
  onLogin?: () => void;
  onNotify?: (message: string) => void;
};

const categoryIcons = [
  Search,
  Building2,
  HeartHandshake,
  FileText,
  Wallet,
  BriefcaseBusiness,
  Users,
  CheckCircle2,
];

export function HomePage({
  jobs,
  hasMoreJobs,
  loading,
  profile,
  initialQuery = "",
  initialCategory = "الكل",
  initialProvince = "الكل",
  onNavigate,
  onSearchJobs,
  onOpenJob,
  onLogin,
  onNotify,
}: HomePageProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [province, setProvince] = useState(initialProvince);
  const jobsRef = useRef<HTMLElement>(null);

  const provinces = useMemo(
    () => ["الكل", ...new Set(jobs.map((job) => job.province).filter(Boolean))],
    [jobs],
  );

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchJobs({ keyword: query.trim(), category, province });
  };

  const startCategorySearch = (value: string) => {
    setCategory(value);
    jobsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="iraq-home-redesign" dir="rtl">
      <section className="ij-home-hero" aria-label="ابدأ البحث عن فرصة عمل">
        <img
          src="/images/iraq-heritage-home.webp?v=2"
          alt="معالم تاريخية من بلاد الرافدين"
          fetchPriority="high"
        />
        <div className="ij-home-hero-shade" />
        <div className="ij-home-hero-copy">
          <span className="ij-home-eyebrow">من هنا تبدأ خطوتك القادمة</span>
          <h1>
            فرصتك المهنية
            <br />
            <em>تبدأ من هنا.</em>
          </h1>
          <p>اكتشف الفرص حسب تخصصك ومحافظتك، واختر الطريق الأقرب لطموحك.</p>
        </div>
      </section>

      <form className="ij-home-search" role="search" onSubmit={submitSearch}>
        <label className="ij-home-keyword">
          <Search size={18} aria-hidden="true" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="المسمى الوظيفي أو التخصص"
            aria-label="ابحث عن وظيفة أو تخصص"
          />
        </label>
        <label className="ij-home-province">
          <MapPin size={16} aria-hidden="true" />
          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
            aria-label="اختر المحافظة"
          >
            <option value="الكل">كل المحافظات</option>
            {provinces.filter((item) => item !== "الكل").map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <button className="ij-home-search-button" type="submit">
          ابدأ البحث <ArrowLeft size={15} />
        </button>
      </form>

      <div className="ij-home-trust-row">
        <span><CheckCircle2 size={14} /> التصفح مجاني للباحثين</span>
        <span><CheckCircle2 size={14} /> فرص في محافظات العراق</span>
      </div>

      <section className="ij-home-categories" aria-labelledby="ij-home-categories-title">
        <header className="ij-home-section-heading">
          <div>
            <h2 id="ij-home-categories-title">تصفح حسب التخصص</h2>
            <p>ابدأ من المجال الأقرب لخبرتك</p>
          </div>
          <button type="button" onClick={() => startCategorySearch("الكل")}>
            كل الوظائف <ArrowLeft size={13} />
          </button>
        </header>
        <div className="ij-home-category-grid">
          {categories.map((label, index) => {
            const Icon = categoryIcons[index % categoryIcons.length];
            const selected = category === label;
            return (
              <button
                key={label}
                className={`ij-home-category${selected ? " is-active" : ""}`}
                type="button"
                aria-pressed={selected}
                onClick={() => startCategorySearch(label)}
              >
                <span><Icon size={18} strokeWidth={1.9} /></span>
                {label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="ij-home-listings" ref={jobsRef} aria-label="وظائف متاحة">
        <JobsPage
          jobs={jobs}
          loading={loading}
          initialHasMoreJobs={hasMoreJobs}
          onOpenJob={onOpenJob}
          profile={profile}
          onLogin={onLogin}
          onNotify={onNotify}
          embedded
          initialQuery={query}
          initialCategory={category}
          initialProvince={province}
        />
      </section>

      {(!profile || profile.role === "candidate") && (
        <section className="ij-home-resume">
          <span className="ij-home-resume-icon" aria-hidden="true"><FileText size={20} /></span>
          <div>
            <span>ملف مهني أقوى، فرصة أقرب</span>
            <h2>حوّل ملفك المهني إلى سيرة جاهزة للتقديم</h2>
            <p>أكمل بياناتك وصدّر سيرتك بصيغة Word أو PDF.</p>
          </div>
          <button
            type="button"
            onClick={() => profile?.role === "candidate" ? onNavigate("candidate") : onNavigate("signup")}
          >
            جهّز سيرتك <ArrowLeft size={14} />
          </button>
        </section>
      )}

      <aside className="ij-home-employer">
        <div>
          <strong>تبحث عن كفاءات عراقية؟</strong>
          <span>استكشف خيارات نشر فرص العمل على المنصة.</span>
        </div>
        <button type="button" onClick={() => onNavigate("job-request")}>
          للجهات <ArrowLeft size={14} />
        </button>
      </aside>
    </main>
  );
}
