import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  GraduationCap,
  HeartPulse,
  MapPin,
  Search,
  Wallet,
  Wrench,
} from "lucide-react";
import { BrandShell } from "./_shared/BrandShell";
import "./_shared/redesign.css";
import "./home-redesign.css";

type JobSample = {
  id: number;
  title: string;
  employer: string;
  category: string;
  governorate: string;
  city: string;
  workType: string;
  salary: string;
  deadline: string;
  description: string;
};

const categories = [
  { label: "الكل", Icon: BriefcaseBusiness },
  { label: "الهندسة", Icon: Wrench },
  { label: "تقنية المعلومات", Icon: Search },
  { label: "الصحة", Icon: HeartPulse },
  { label: "التعليم", Icon: GraduationCap },
];

const sampleJobs: JobSample[] = [
  {
    id: 1,
    title: "مهندس موقع",
    employer: "شركة مقاولات — نموذج",
    category: "الهندسة",
    governorate: "بغداد",
    city: "المنصور",
    workType: "دوام كامل",
    salary: "١٬٢٠٠٬٠٠٠ – ١٬٦٠٠٬٠٠٠ د.ع",
    deadline: "ينتهي ٢٨ حزيران",
    description: "فرصة توضيحية لمهندس مدني بخبرة ميدانية. يشمل الدور متابعة تقدم الأعمال والتنسيق مع فريق الموقع.",
  },
  {
    id: 2,
    title: "مطور واجهات ويب",
    employer: "فريق تقني — نموذج",
    category: "تقنية المعلومات",
    governorate: "أربيل",
    city: "عن بُعد جزئياً",
    workType: "دوام كامل",
    salary: "١٬٥٠٠٬٠٠٠ – ٢٬١٠٠٬٠٠٠ د.ع",
    deadline: "ينتهي ٣٠ حزيران",
    description: "إعلان تجريبي لمطور واجهات يهتم بتجربة الاستخدام ويعمل مع فريق تصميم وتطوير.",
  },
  {
    id: 3,
    title: "ممرض / ممرضة",
    employer: "مركز صحي — نموذج",
    category: "الصحة",
    governorate: "البصرة",
    city: "العشار",
    workType: "دوام كامل",
    salary: "٩٠٠٬٠٠٠ – ١٬٢٠٠٬٠٠٠ د.ع",
    deadline: "ينتهي ٢٥ حزيران",
    description: "نموذج توضيحي لفرصة في الرعاية الصحية، مع دوام ضمن فريق متعدد التخصصات.",
  },
  {
    id: 4,
    title: "معلم لغة إنكليزية",
    employer: "مدرسة أهلية — نموذج",
    category: "التعليم",
    governorate: "النجف",
    city: "حي الجامعة",
    workType: "دوام جزئي",
    salary: "٧٠٠٬٠٠٠ – ١٬٠٠٠٬٠٠٠ د.ع",
    deadline: "ينتهي ٢٢ حزيران",
    description: "مثال لفرصة تعليمية لمعلم أو معلمة لغة إنكليزية للمرحلتين المتوسطة والإعدادية.",
  },
];

const governorates = ["كل المحافظات", "بغداد", "البصرة", "أربيل", "النجف"];

export function HomeRedesign() {
  const [query, setQuery] = useState("");
  const [governorate, setGovernorate] = useState("كل المحافظات");
  const [category, setCategory] = useState("الكل");
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [openJobId, setOpenJobId] = useState<number | null>(null);
  const [toast, setToast] = useState("");
  const jobsRef = useRef<HTMLElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const visibleJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ar");
    return sampleJobs.filter((job) => {
      const searchable = `${job.title} ${job.employer} ${job.category} ${job.governorate} ${job.city}`.toLocaleLowerCase("ar");
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (governorate === "كل المحافظات" || job.governorate === governorate)
        && (category === "الكل" || job.category === category);
    });
  }, [category, governorate, query]);

  const announce = (message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2600);
  };

  const startSearch = () => {
    jobsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleSaved = (job: JobSample) => {
    const isSaved = savedIds.includes(job.id);
    setSavedIds((current) => isSaved ? current.filter((id) => id !== job.id) : [...current, job.id]);
    announce(isSaved ? "أزيلت الوظيفة من المحفوظات" : "حُفظت الوظيفة على هذا الجهاز");
  };

  return (
    <BrandShell activeTab="home">
      <div className="ij-home">
        <section className="ij-hero" aria-label="ابدأ البحث عن فرصة عمل">
          <img
            src="/__mockup-iraq-jobs/images/iraq-heritage-home.webp"
            alt="معالم تاريخية من بلاد الرافدين"
          />
          <div className="ij-hero-copy">
            <span className="ij-eyebrow">من هنا تبدأ خطوتك القادمة</span>
            <h1>فرصتك المهنية<br /><em>تبدأ من العراق.</em></h1>
            <p>اكتشف فرصاً حسب تخصصك ومحافظتك، واختر الطريق الأقرب لطموحك.</p>
          </div>
        </section>

        <section className="ij-search-panel" role="search" aria-label="البحث عن وظيفة">
          <label className="ij-search-input">
            <Search size={17} aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") startSearch();
              }}
              placeholder="المسمى الوظيفي أو التخصص"
              aria-label="ابحث عن وظيفة أو تخصص"
            />
          </label>
          <div className="ij-search-bottom">
            <label className="ij-province-select">
              <MapPin size={16} aria-hidden="true" />
              <select
                value={governorate}
                onChange={(event) => setGovernorate(event.target.value)}
                aria-label="اختر المحافظة"
              >
                {governorates.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <button className="ij-search-button" type="button" onClick={startSearch}>
              ابدأ البحث <ArrowLeft size={15} />
            </button>
          </div>
        </section>

        <div className="ij-trust-row">
          <span className="ij-trust-item"><CheckCircle2 size={14} /> التصفح مجاني للباحثين</span>
          <span className="ij-trust-item"><CheckCircle2 size={14} /> فرص حسب محافظتك</span>
        </div>

        <section className="ij-categories" aria-labelledby="ij-categories-title">
          <header className="ij-section-heading">
            <div>
              <h2 id="ij-categories-title">تصفح حسب التخصص</h2>
              <p>ابدأ من المجال الأقرب لخبرتك</p>
            </div>
            <button
              className="ij-text-link"
              type="button"
              onClick={() => {
                setCategory("الكل");
                startSearch();
              }}
            >
              كل الوظائف <ArrowLeft size={13} />
            </button>
          </header>
          <div className="ij-category-strip">
            {categories.map(({ label, Icon }) => (
              <button
                className={`ij-category${category === label ? " is-active" : ""}`}
                key={label}
                type="button"
                aria-pressed={category === label}
                onClick={() => {
                  setCategory(label);
                  startSearch();
                }}
              >
                <span className="ij-category-icon"><Icon size={17} strokeWidth={1.9} /></span>
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="ij-listings" ref={jobsRef} aria-labelledby="ij-jobs-title">
          <header className="ij-section-heading ij-listings-heading">
            <div>
              <h2 id="ij-jobs-title">فرص تستحق أن تراها</h2>
              <p>نماذج توضيحية للتصفح والبحث</p>
            </div>
            <span className="ij-demo-tag">{visibleJobs.length} فرص</span>
          </header>

          <div className="ij-job-list">
            {visibleJobs.map((job, index) => {
              const saved = savedIds.includes(job.id);
              const expanded = openJobId === job.id;
              return (
                <article className="ij-job-card" key={job.id} style={{ animationDelay: `${index * 55}ms` }}>
                  <div className="ij-job-top">
                    <div className="ij-job-title-wrap">
                      <span className="ij-job-category">{job.category}</span>
                      <button
                        className="ij-job-title"
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpenJobId(expanded ? null : job.id)}
                      >
                        {job.title}
                      </button>
                      <div className="ij-employer">{job.employer}</div>
                    </div>
                    <button
                      className={`ij-save${saved ? " is-saved" : ""}`}
                      type="button"
                      aria-label={saved ? `إزالة ${job.title} من المحفوظات` : `حفظ ${job.title}`}
                      aria-pressed={saved}
                      onClick={() => toggleSaved(job)}
                    >
                      <Bookmark size={16} fill={saved ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="ij-job-meta">
                    <span><MapPin size={13} /> {job.governorate} · {job.city}</span>
                    <span><BriefcaseBusiness size={13} /> {job.workType}</span>
                  </div>
                  <div className="ij-job-footer">
                    <span className="ij-salary"><Wallet size={13} /> {job.salary}</span>
                    <span className="ij-deadline"><Clock3 size={12} /> {job.deadline}</span>
                  </div>
                  {expanded && (
                    <div className="ij-job-detail">
                      {job.description}
                      <button type="button" onClick={() => announce("هذه معاينة توضيحية؛ لا يتم إرسال طلب تقديم.")}>
                        تفاصيل وطريقة التقديم <ArrowLeft size={12} />
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
            {visibleJobs.length === 0 && (
              <div className="ij-empty" role="status">
                <strong>ما لقينا فرصاً بهذا البحث</strong>
                <p>غيّر كلمة البحث أو اختر محافظة وتخصصاً آخر.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="ij-employer-promo">
          <div className="ij-employer-copy">
            <strong>تبحث عن كفاءات عراقية؟</strong>
            <span>تعرّف على خيارات نشر فرص العمل</span>
          </div>
          <button className="ij-account-button" type="button" onClick={() => announce("ميزة نشر الوظائف تظهر هنا في المنصة.")}>
            للجهات <ArrowLeft size={13} />
          </button>
        </aside>
      </div>
      {toast && <div className="ij-toast" role="status">{toast}</div>}
    </BrandShell>
  );
}
