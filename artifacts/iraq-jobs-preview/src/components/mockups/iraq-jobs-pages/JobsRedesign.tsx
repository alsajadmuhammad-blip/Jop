import { useMemo, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { BrandShell } from "./_shared/BrandShell";
import "./_shared/redesign.css";
import "./JobsRedesign.css";

type Job = {
  id: number;
  title: string;
  employer: string;
  initials: string;
  city: string;
  governorate: string;
  category: string;
  type: string;
  salary: string;
  deadline: string;
  published: string;
  description: string;
  tone: "blue" | "orange" | "green" | "violet";
};

const jobs: Job[] = [
  {
    id: 1,
    title: "مهندس مدني",
    employer: "شركة دجلة للإعمار",
    initials: "دج",
    city: "المنصور",
    governorate: "بغداد",
    category: "الهندسة",
    type: "دوام كامل",
    salary: "1,000,000 – 1,500,000 د.ع",
    deadline: "٣٠ حزيران ٢٠٢٦",
    published: "قبل ساعتين",
    description:
      "متابعة أعمال الموقع والتنسيق مع فرق التنفيذ. يشترط بكالوريوس هندسة مدنية وخبرة عملية مناسبة.",
    tone: "blue",
  },
  {
    id: 2,
    title: "محاسب عام",
    employer: "مجموعة الرافدين التجارية",
    initials: "رف",
    city: "الكرادة",
    governorate: "بغداد",
    category: "المحاسبة والمالية",
    type: "دوام كامل",
    salary: "800,000 – 1,100,000 د.ع",
    deadline: "٥ تموز ٢٠٢٦",
    published: "قبل ٤ ساعات",
    description:
      "إعداد القيود والتقارير الشهرية ومطابقة الحسابات. إتقان برامج المحاسبة ومعرفة Excel مطلوبة.",
    tone: "orange",
  },
  {
    id: 3,
    title: "مسؤول خدمة عملاء",
    employer: "شركة أثر للاتصالات",
    initials: "أث",
    city: "الجامعة",
    governorate: "البصرة",
    category: "خدمة العملاء",
    type: "دوام جزئي",
    salary: "650,000 – 850,000 د.ع",
    deadline: "١٢ تموز ٢٠٢٦",
    published: "قبل ٦ ساعات",
    description:
      "الرد على استفسارات المشتركين ومتابعة طلباتهم. نبحث عن تواصل واضح وروح تعاون.",
    tone: "green",
  },
  {
    id: 4,
    title: "مصمم جرافيك",
    employer: "استوديو نون الإبداعي",
    initials: "نو",
    city: "عن بُعد",
    governorate: "أربيل",
    category: "التصميم والإبداع",
    type: "عمل عن بُعد",
    salary: "900,000 – 1,200,000 د.ع",
    deadline: "٢٠ تموز ٢٠٢٦",
    published: "قبل ١٠ ساعات",
    description:
      "تصميم مواد رقمية للحملات المحلية. أرفق نماذج من أعمالك وخبرتك في أدوات التصميم.",
    tone: "violet",
  },
];

const categories = [
  "الكل",
  "الهندسة",
  "المحاسبة والمالية",
  "خدمة العملاء",
  "التصميم والإبداع",
];
const workTypes = ["الكل", "دوام كامل", "دوام جزئي", "عمل عن بُعد"];
const governorates = ["الكل", "بغداد", "البصرة", "أربيل"];

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
              {option === "الكل" ? `كل ${label}` : option}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </span>
    </label>
  );
}

function JobListing({
  job,
  saved,
  expanded,
  onSave,
  onExpand,
}: {
  job: Job;
  saved: boolean;
  expanded: boolean;
  onSave: () => void;
  onExpand: () => void;
}) {
  return (
    <article className={`jr-job-card ${expanded ? "is-expanded" : ""}`}>
      <div className="jr-job-topline">
        <div className={`jr-employer-mark tone-${job.tone}`} aria-hidden="true">
          <span>{job.initials}</span>
        </div>
        <div className="jr-company-copy">
          <span className="jr-job-category">{job.category}</span>
          <h3>{job.title}</h3>
          <p>{job.employer}</p>
        </div>
        <button
          className={`jr-save ${saved ? "is-saved" : ""}`}
          type="button"
          onClick={onSave}
          aria-label={saved ? "إزالة الوظيفة من المحفوظات" : "حفظ الوظيفة"}
          aria-pressed={saved}
        >
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>

      <div className="jr-job-meta">
        <span>
          <MapPin size={14} />
          {job.governorate}، {job.city}
        </span>
        <i aria-hidden="true" />
        <span>
          <BriefcaseBusiness size={14} />
          {job.type}
        </span>
      </div>

      <div className="jr-salary-row">
        <span className="jr-salary-label">الراتب الشهري</span>
        <strong>{job.salary}</strong>
      </div>

      <div className="jr-card-bottom">
        <span className="jr-deadline">
          <CalendarDays size={14} />
          آخر موعد: {job.deadline}
        </span>
        <span className="jr-published">
          <Clock3 size={13} />
          {job.published}
        </span>
      </div>

      {expanded && (
        <div className="jr-job-details">
          <p>{job.description}</p>
          <span className="jr-detail-note">
            <ShieldCheck size={14} />
            اقرأ تفاصيل الجهة وتحقق من الإعلان قبل مشاركة بياناتك.
          </span>
        </div>
      )}

      <button
        type="button"
        className="jr-details-button"
        onClick={onExpand}
        aria-expanded={expanded}
      >
        {expanded ? "إخفاء التفاصيل" : "تفاصيل الوظيفة"}
        {expanded ? <ArrowDown className="jr-chevron-up" size={15} /> : <ArrowLeft size={15} />}
      </button>
    </article>
  );
}

export function JobsRedesign() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const [workType, setWorkType] = useState("الكل");
  const [governorate, setGovernorate] = useState("الكل");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const filteredJobs = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ar");
    return jobs.filter((job) => {
      const searchable = `${job.title} ${job.employer} ${job.city} ${job.governorate} ${job.category}`.toLocaleLowerCase("ar");
      return (
        (!needle || searchable.includes(needle)) &&
        (category === "الكل" || job.category === category) &&
        (workType === "الكل" || job.type === workType) &&
        (governorate === "الكل" || job.governorate === governorate)
      );
    });
  }, [query, category, workType, governorate]);

  const activeFilters =
    Boolean(query.trim()) || category !== "الكل" || workType !== "الكل" || governorate !== "الكل";

  const resetFilters = () => {
    setQuery("");
    setCategory("الكل");
    setWorkType("الكل");
    setGovernorate("الكل");
  };

  const toggleSaved = (job: Job) => {
    const isSaved = savedIds.includes(job.id);
    setSavedIds((current) =>
      isSaved ? current.filter((id) => id !== job.id) : [...current, job.id],
    );
    setToast(isSaved ? "أزيلت الوظيفة من المحفوظات" : "حُفظت الوظيفة للمراجعة لاحقاً");
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <BrandShell activeTab="jobs">
      <section className="jobs-redesign" dir="rtl">
        <div className="jr-heritage-hero">
          <img
            src="/__mockup-iraq-jobs/images/iraq-heritage-home.webp"
            alt=""
            aria-hidden="true"
          />
          <div className="jr-hero-shade" />
          <div className="jr-hero-content">
            <span className="jr-hero-kicker">
              <MapPin size={13} />
              فرص مهنية في محافظات العراق
            </span>
            <h1>
              ابحث عن عمل
              <br />
              <em>يناسب خطوتك</em>
            </h1>
            <p>اكتشف الفرص حسب اختصاصك ومكانك، واختَر ما يناسب خبرتك.</p>
          </div>
          <div className="jr-hero-stamp">
            <span>من</span>
            <strong>العراق</strong>
            <i />
          </div>
        </div>

        <div className="jr-content">
          <div className="jr-intro-row">
            <div>
              <span className="jr-eyebrow">مساحة البحث</span>
              <h2>فرص العمل</h2>
            </div>
            <span className="jr-free-mark">
              <ShieldCheck size={14} />
              اكتشاف مجاني
            </span>
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
            <span>
              <SlidersHorizontal size={14} />
              ضيّق نطاق البحث
            </span>
            {activeFilters && (
              <button type="button" onClick={resetFilters}>
                مسح الفلاتر
              </button>
            )}
          </div>
          <div className="jr-filters">
            <FilterSelect
              label="التصنيف"
              value={category}
              options={categories}
              onChange={setCategory}
            />
            <FilterSelect
              label="نوع الدوام"
              value={workType}
              options={workTypes}
              onChange={setWorkType}
            />
            <FilterSelect
              label="المحافظة"
              value={governorate}
              options={governorates}
              onChange={setGovernorate}
            />
          </div>

          <div className="jr-results-heading" id="jr-results">
            <div>
              <span className="jr-eyebrow">تصفّح حسب ما يهمك</span>
              <h2>وظائف مختارة</h2>
            </div>
            <span className="jr-result-count">
              {filteredJobs.length.toLocaleString("ar")} نماذج
            </span>
          </div>

          <div className="jr-sample-note">
            <span className="jr-sample-dot" />
            <span>نماذج توضيحية للتصميم — ليست إعلانات وظائف مباشرة</span>
          </div>

          <div className="jr-listings">
            {filteredJobs.map((job, index) => (
              <div
                className="jr-listing-wrap"
                key={job.id}
                style={{ "--jr-index": index } as CSSProperties}
              >
                <JobListing
                  job={job}
                  saved={savedIds.includes(job.id)}
                  expanded={expandedId === job.id}
                  onSave={() => toggleSaved(job)}
                  onExpand={() => setExpandedId(expandedId === job.id ? null : job.id)}
                />
              </div>
            ))}
            {filteredJobs.length === 0 && (
              <div className="jr-empty">
                <div className="jr-empty-icon">
                  <Search size={21} />
                </div>
                <strong>ما لقينا نتائج مطابقة</strong>
                <p>جرّب كلمة بحث مختلفة أو وسّع نطاق الفلاتر.</p>
                <button type="button" onClick={resetFilters}>
                  عرض كل النماذج
                </button>
              </div>
            )}
          </div>

          <div className="jr-trust-footer">
            <span className="jr-trust-icon">
              <ShieldCheck size={17} />
            </span>
            <p>
              <strong>ابحث بثقة.</strong> IRAQ JOBS منصة مجانية لاكتشاف الوظائف. تحقّق من تفاصيل كل إعلان
              والجهة قبل التقديم.
            </p>
            <Check className="jr-trust-check" size={15} />
          </div>

          <button
            className="jr-back-top"
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            العودة إلى الأعلى <ArrowDown size={14} />
          </button>
        </div>

        {toast && (
          <div className="jr-toast" role="status">
            <BookmarkCheck size={16} />
            {toast}
          </div>
        )}
      </section>
    </BrandShell>
  );
}

export default JobsRedesign;
