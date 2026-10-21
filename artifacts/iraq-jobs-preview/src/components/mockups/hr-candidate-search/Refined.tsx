import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import "./_group.css";

type Candidate = {
  name: string;
  headline: string;
  specialization: string;
  province: string;
  city: string;
  years: number;
  skills: string[];
  workTypes: string[];
  availability: string;
  education: string;
  languages: string[];
  summary: string;
};

type Filters = {
  keyword: string;
  specialization: string;
  province: string;
  city: string;
  skill: string;
  workType: string;
  availability: string;
  experience: string;
  remoteOnly: boolean;
};

const profiles: Candidate[] = [
  {
    name: "سارة أحمد",
    headline: "مهندسة برمجيات · تطوير تطبيقات الويب",
    specialization: "مهندس برمجيات",
    province: "بغداد",
    city: "الكرخ",
    years: 5,
    skills: ["React", "TypeScript", "واجهات المستخدم", "إدارة المشاريع"],
    workTypes: ["دوام كامل", "عن بُعد"],
    availability: "خلال شهر",
    education: "بكالوريوس هندسة البرمجيات — جامعة بغداد",
    languages: ["العربية", "الإنجليزية"],
    summary: "طورت منصات خدمية وتجارية مع فرق متعددة التخصصات، وتركّز على بناء واجهات عربية سريعة وسهلة الاستخدام.",
  },
  {
    name: "علي محمود",
    headline: "مهندس برمجيات · أنظمة وخدمات سحابية",
    specialization: "مهندس برمجيات",
    province: "البصرة",
    city: "العشار",
    years: 3,
    skills: ["Node.js", "PostgreSQL", "تحليل البيانات"],
    workTypes: ["دوام كامل", "عن بُعد"],
    availability: "متاح فوراً",
    education: "بكالوريوس علوم الحاسوب — جامعة البصرة",
    languages: ["العربية", "الإنجليزية"],
    summary: "خبرة في بناء واجهات API وربط الأنظمة الداخلية، مع اهتمام خاص باستقرار الخدمات وتحسين قواعد البيانات.",
  },
  {
    name: "نور حسين",
    headline: "مهندسة برمجيات · تطبيقات الهاتف",
    specialization: "مهندس برمجيات",
    province: "أربيل",
    city: "أربيل",
    years: 2,
    skills: ["React", "واجهات المستخدم", "تحليل البيانات"],
    workTypes: ["دوام جزئي", "عن بُعد"],
    availability: "متاح فوراً",
    education: "بكالوريوس تقنية المعلومات — جامعة صلاح الدين",
    languages: ["العربية", "الكردية", "الإنجليزية"],
    summary: "تعمل على تطبيقات موجهة للمستخدمين، وتجمع بين التصميم العملي وتطوير الواجهات متعددة اللغات.",
  },
  {
    name: "حيدر جاسم",
    headline: "مهندس مدني · إدارة مواقع ومشاريع",
    specialization: "مهندس مدني",
    province: "بغداد",
    city: "الرصافة",
    years: 8,
    skills: ["إدارة المشاريع", "AutoCAD", "الإشراف الموقعي"],
    workTypes: ["دوام كامل"],
    availability: "على رأس العمل",
    education: "بكالوريوس هندسة مدنية — الجامعة التكنولوجية",
    languages: ["العربية", "الإنجليزية"],
    summary: "أشرف على مشاريع بنية تحتية ومبانٍ سكنية، من متابعة الجداول إلى تنسيق فرق التنفيذ والموردين.",
  },
  {
    name: "مريم عبد الله",
    headline: "مهندسة مدنية · تصميم إنشائي",
    specialization: "مهندس مدني",
    province: "نينوى",
    city: "الموصل",
    years: 3,
    skills: ["AutoCAD", "إدارة المشاريع", "تحليل البيانات"],
    workTypes: ["دوام كامل", "دوام جزئي"],
    availability: "خلال شهر",
    education: "بكالوريوس هندسة مدنية — جامعة الموصل",
    languages: ["العربية", "الإنجليزية"],
    summary: "خبرة في إعداد المخططات ومراجعة الكميات والتنسيق بين المكاتب الاستشارية وفرق التنفيذ.",
  },
  {
    name: "مصطفى كريم",
    headline: "مهندس مدني · تنفيذ وإشراف",
    specialization: "مهندس مدني",
    province: "البصرة",
    city: "الزبير",
    years: 5,
    skills: ["إدارة المشاريع", "الإشراف الموقعي"],
    workTypes: ["دوام كامل"],
    availability: "متاح فوراً",
    education: "بكالوريوس هندسة مدنية — جامعة البصرة",
    languages: ["العربية"],
    summary: "قاد فرقاً ميدانية في مشاريع طرق ومرافق، مع متابعة دقيقة لمتطلبات السلامة والجودة.",
  },
  {
    name: "زينب فاضل",
    headline: "محاسبة · تقارير مالية وتدقيق",
    specialization: "محاسب",
    province: "بغداد",
    city: "الكرخ",
    years: 5,
    skills: ["المحاسبة", "Excel", "تحليل البيانات"],
    workTypes: ["دوام كامل", "عن بُعد"],
    availability: "خلال شهر",
    education: "بكالوريوس محاسبة — الجامعة المستنصرية",
    languages: ["العربية", "الإنجليزية"],
    summary: "تعد التقارير الدورية وتتابع التسويات والمصروفات، ولديها خبرة في تنظيم إجراءات الإقفال المالي.",
  },
  {
    name: "عمر ناظم",
    headline: "محاسب · حسابات وتكاليف",
    specialization: "محاسب",
    province: "نينوى",
    city: "الموصل",
    years: 1,
    skills: ["المحاسبة", "Excel"],
    workTypes: ["دوام كامل", "دوام جزئي"],
    availability: "متاح فوراً",
    education: "بكالوريوس علوم مالية ومصرفية — جامعة الموصل",
    languages: ["العربية", "الإنجليزية"],
    summary: "يمتلك خبرة عملية في تسجيل القيود ومطابقة الحسابات، ويبحث عن فرصة للتطور في فريق مالي.",
  },
  {
    name: "رنا فؤاد",
    headline: "مسؤولة موارد بشرية · استقطاب وتطوير",
    specialization: "موارد بشرية",
    province: "أربيل",
    city: "أربيل",
    years: 3,
    skills: ["إدارة المشاريع", "التوظيف", "تحليل البيانات"],
    workTypes: ["دوام كامل", "دوام جزئي"],
    availability: "خلال شهر",
    education: "بكالوريوس إدارة أعمال — جامعة صلاح الدين",
    languages: ["العربية", "الكردية", "الإنجليزية"],
    summary: "تنظم عمليات الاستقطاب والتهيئة، وتعمل على تحسين تجربة الموظف ومؤشرات الأداء للفِرق.",
  },
  {
    name: "دانا سامي",
    headline: "أخصائية موارد بشرية · عمليات الموظفين",
    specialization: "موارد بشرية",
    province: "بغداد",
    city: "الرصافة",
    years: 8,
    skills: ["إدارة المشاريع", "التوظيف"],
    workTypes: ["دوام كامل", "عن بُعد"],
    availability: "على رأس العمل",
    education: "ماجستير إدارة الموارد البشرية — الجامعة العراقية",
    languages: ["العربية", "الإنجليزية"],
    summary: "خبرة في سياسات الموارد البشرية وإدارة الأداء، مع قيادة مبادرات تطوير للموظفين.",
  },
];

const initialFilters: Filters = {
  keyword: "",
  specialization: "",
  province: "",
  city: "",
  skill: "",
  workType: "",
  availability: "",
  experience: "",
  remoteOnly: false,
};

const selectLabels: Record<Exclude<keyof Filters, "keyword" | "remoteOnly">, string> = {
  specialization: "التخصص",
  province: "المحافظة",
  city: "المدينة",
  skill: "المهارة",
  workType: "نوع العمل",
  availability: "التوفر للعمل",
  experience: "الخبرة",
};

const placeholders: Record<Exclude<keyof Filters, "keyword" | "remoteOnly">, string> = {
  specialization: "كل التخصصات",
  province: "كل المحافظات",
  city: "كل المدن",
  skill: "كل المهارات",
  workType: "كل الأنواع",
  availability: "كل حالات التوفر",
  experience: "أي مستوى خبرة",
};

const filterKeys = Object.keys(selectLabels) as Array<keyof typeof selectLabels>;

function profileMatches(candidate: Candidate, filters: Filters, omit?: keyof Filters) {
  const match = (key: keyof Filters, condition: boolean) => key === omit || condition;
  return (
    match("specialization", !filters.specialization || candidate.specialization === filters.specialization) &&
    match("province", !filters.province || candidate.province === filters.province) &&
    match("city", !filters.city || candidate.city === filters.city) &&
    match("skill", !filters.skill || candidate.skills.includes(filters.skill)) &&
    match("workType", !filters.workType || candidate.workTypes.includes(filters.workType)) &&
    match("availability", !filters.availability || candidate.availability === filters.availability) &&
    match("experience", !filters.experience || candidate.years >= Number(filters.experience)) &&
    match("remoteOnly", !filters.remoteOnly || candidate.workTypes.includes("عن بُعد")) &&
    match(
      "keyword",
      !filters.keyword ||
        `${candidate.name} ${candidate.headline} ${candidate.specialization} ${candidate.province} ${candidate.city} ${candidate.skills.join(" ")} ${candidate.education} ${candidate.languages.join(" ")}`
          .toLocaleLowerCase("ar")
          .includes(filters.keyword.trim().toLocaleLowerCase("ar")),
    )
  );
}

export function Refined() {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [hasSearched, setHasSearched] = useState(false);
  const [results, setResults] = useState<Candidate[]>([]);
  const [searchedFilters, setSearchedFilters] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const resultsAreCurrent = hasSearched && searchedFilters === JSON.stringify(filters);

  const activeCount = useMemo(
    () => [
      filters.keyword.trim(),
      filters.specialization,
      filters.province,
      filters.city,
      filters.skill,
      filters.workType,
      filters.availability,
      filters.experience,
      filters.remoteOnly,
    ].filter(Boolean).length,
    [filters],
  );

  const updateFilter = (key: keyof Filters, value: string | boolean) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const availableOptions = (key: keyof typeof selectLabels) => {
    const matches = profiles.filter((profile) => profileMatches(profile, filters, key));
    switch (key) {
      case "specialization": return [...new Set(matches.map((profile) => profile.specialization))].sort();
      case "province": return [...new Set(matches.map((profile) => profile.province))].sort();
      case "city": return [...new Set(matches.map((profile) => profile.city))].sort();
      case "skill": return [...new Set(matches.flatMap((profile) => profile.skills))].sort();
      case "workType": return [...new Set(matches.flatMap((profile) => profile.workTypes))].sort();
      case "availability": return [...new Set(matches.map((profile) => profile.availability))].sort();
      case "experience": return [...new Set(matches.map((profile) => profile.years))].sort((a, b) => a - b).map(String);
    }
  };

  const runSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResults(profiles.filter((candidate) => profileMatches(candidate, filters)));
    setSearchedFilters(JSON.stringify(filters));
    setHasSearched(true);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setHasSearched(false);
    setResults([]);
    setSearchedFilters("");
  };

  const shownProfiles = resultsAreCurrent ? results : [];

  useEffect(() => {
    if (!selectedCandidate) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCandidate(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedCandidate]);

  return (
    <main className="refined-search" dir="rtl">
      <style>{`
        .refined-search {
          --rs-ink: var(--ink);
          --rs-muted: var(--muted);
          --rs-line: var(--line);
          --rs-canvas: #f7faf8;
          --rs-paper: var(--white);
          --rs-teal: var(--green);
          --rs-teal-dark: var(--green-2);
          --rs-teal-soft: var(--mint);
          --rs-coral: var(--accent);
          --rs-coral-soft: rgba(244, 123, 32, .08);
          min-height: 100dvh;
          padding: 30px clamp(15px, 4vw, 58px) 64px;
          color: var(--rs-ink);
          background:
            radial-gradient(ellipse at 91% 0%, rgba(233, 237, 255, .78), transparent 35%),
            var(--rs-canvas);
          font-family: "IBM Plex Sans Arabic", sans-serif;
          isolation: isolate;
        }
        .refined-search * { box-sizing: border-box; }
        .refined-search button, .refined-search input, .refined-search select { font: inherit; }
        .rs-shell { width: min(1320px, 100%); margin: 0 auto; }
        .rs-topline { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; color: var(--rs-muted); font-size: 12px; }
        .rs-brand { display: flex; align-items: center; gap: 10px; color: var(--rs-ink); }
        .rs-brand-logo { display: block; width: 38px; height: 38px; border-radius: 10px; object-fit: cover; }
        .rs-brand b { display: block; font-family: "Readex Pro", sans-serif; font-size: 12px; letter-spacing: .08em; }
        .rs-brand small { display: block; margin-top: 2px; color: var(--rs-muted); font-size: 10px; }
        .rs-access { display: inline-flex; align-items: center; gap: 7px; padding: 8px 12px; border: 1px solid var(--rs-line); border-radius: 99px; color: var(--rs-muted); background: rgba(255,255,255,.75); }
        .rs-hero { position: relative; display: flex; justify-content: space-between; align-items: end; gap: 25px; overflow: hidden; min-height: 205px; padding: 28px 34px; border: 1px solid var(--rs-line); border-radius: 24px; background: var(--rs-paper); box-shadow: 0 18px 50px rgba(24,32,79,.055); }
        .rs-hero:after { content: ""; position: absolute; left: 7%; top: -90px; width: 260px; height: 260px; border: 1px solid rgba(44,63,145,.1); border-radius: 50%; box-shadow: 0 0 0 26px rgba(44,63,145,.025), 0 0 0 52px rgba(44,63,145,.02); pointer-events: none; }
        .rs-hero-copy { position: relative; z-index: 1; max-width: 720px; }
        .rs-kicker { display: inline-flex; align-items: center; gap: 8px; color: var(--rs-teal); font-size: 12px; font-weight: 700; }
        .rs-kicker i { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--rs-coral); }
        .rs-hero h1 { margin: 12px 0 8px; color: var(--rs-ink); font-family: "Readex Pro", sans-serif; font-size: clamp(25px, 3.1vw, 38px); font-weight: 600; line-height: 1.5; letter-spacing: -.035em; }
        .rs-hero p { max-width: 590px; margin: 0; color: var(--rs-muted); font-size: 14px; line-height: 1.9; }
        .rs-stats { display: grid; grid-template-columns: 1fr 1fr 1fr minmax(230px, 1.35fr); gap: 10px; margin: 14px 0 22px; }
        .rs-stat { display: flex; align-items: center; gap: 12px; min-height: 75px; padding: 13px 17px; border: 1px solid var(--rs-line); border-radius: 15px; background: rgba(255,255,255,.88); }
        .rs-stat-icon { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 11px; color: var(--rs-teal); background: var(--rs-teal-soft); }
        .rs-stat p { margin: 0; }
        .rs-stat b { display: block; color: var(--rs-ink); font-family: "Readex Pro",sans-serif; font-size: 19px; line-height: 1.15; }
        .rs-stat small { display: block; margin-top: 4px; color: var(--rs-muted); font-size: 10px; }
        .rs-stat-note { gap: 10px; color: var(--rs-muted); font-size: 11px; line-height: 1.8; }
        .rs-stat-note svg { flex: 0 0 auto; color: var(--rs-coral); }
        .rs-workspace { display: grid; grid-template-columns: minmax(0, 1fr) 372px; align-items: start; gap: 18px; }
        .rs-filter-card, .rs-results-card { border: 1px solid var(--rs-line); border-radius: 19px; background: var(--rs-paper); box-shadow: 0 12px 36px rgba(24,32,79,.04); }
        .rs-filter-card { position: sticky; top: 16px; padding: 22px; }
        .rs-panel-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding-bottom: 16px; border-bottom: 1px solid var(--rs-line); }
        .rs-panel-head h2, .rs-results-head h2 { margin: 4px 0 0; color: var(--rs-ink); font-family: "Readex Pro", sans-serif; font-size: 20px; font-weight: 600; }
        .rs-panel-head p { margin: 6px 0 0; color: var(--rs-muted); font-size: 11px; line-height: 1.75; }
        .rs-eyebrow { color: var(--rs-muted); font-size: 10px; font-weight: 700; letter-spacing: .04em; }
        .rs-filter-symbol { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border-radius: 11px; color: var(--rs-teal); background: var(--rs-teal-soft); }
        .rs-keyword { display: flex; flex-direction: column; gap: 8px; margin-top: 17px; color: var(--rs-ink); font-size: 12px; font-weight: 700; }
        .rs-keyword span { display: flex; justify-content: space-between; }
        .rs-keyword small { color: var(--rs-muted); font-size: 10px; font-weight: 500; }
        .rs-keyword-wrap { position: relative; }
        .rs-keyword-wrap svg { position: absolute; top: 50%; right: 13px; color: var(--rs-muted); transform: translateY(-50%); }
        .rs-keyword input, .rs-filter-select { width: 100%; min-height: 45px; padding: 0 38px 0 12px; border: 1px solid var(--rs-line); border-radius: 10px; outline: 0; color: var(--rs-ink); background-color: var(--rs-paper); font-size: 12px; transition: border-color .18s, box-shadow .18s; }
        .rs-keyword input::placeholder { color: var(--rs-muted); }
        .rs-keyword input:focus, .rs-filter-select:focus { border-color: var(--green-2); box-shadow: 0 0 0 3px rgba(44,63,145,.1); }
        .rs-filter-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 10px; margin-top: 17px; }
        .rs-filter-grid label { display: flex; min-width: 0; flex-direction: column; gap: 7px; color: var(--rs-ink); font-size: 11px; font-weight: 700; }
        .rs-filter-select { min-height: 43px; padding: 0 11px; text-overflow: ellipsis; }
        .rs-filter-select:disabled { color: var(--rs-muted); background: var(--soft); }
        .rs-filter-option { color: var(--rs-ink); }
        .rs-filter-count { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 17px; margin-right: 5px; padding: 0 4px; border-radius: 99px; color: var(--rs-teal); background: var(--rs-teal-soft); font-size: 9px; }
        .rs-remote { display: flex; align-items: center; gap: 9px; min-height: 42px; margin-top: 15px; padding: 0 10px; border: 1px solid var(--rs-line); border-radius: 10px; color: var(--rs-muted); background: var(--soft); font-size: 11px; cursor: pointer; }
        .rs-remote input { width: 16px; height: 16px; margin: 0; accent-color: var(--rs-teal); }
        .rs-form-actions { display: flex; align-items: center; gap: 10px; margin-top: 17px; }
        .rs-submit { display: inline-flex; justify-content: center; align-items: center; gap: 9px; min-height: 46px; flex: 1; padding: 0 16px; border: 0; border-radius: 10px; color: var(--white); background: var(--rs-teal); font-size: 12px; font-weight: 700; cursor: pointer; transition: transform .18s, background .18s; }
        .rs-submit:hover { background: var(--rs-teal-dark); transform: translateY(-1px); }
        .rs-reset { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 42px; padding: 0 8px; border: 0; color: var(--rs-muted); background: transparent; font-size: 11px; cursor: pointer; }
        .rs-reset:hover { color: var(--rs-coral); }
        .rs-results-card { min-height: 510px; padding: 22px; }
        .rs-results-head { display: flex; align-items: end; justify-content: space-between; gap: 18px; padding-bottom: 16px; border-bottom: 1px solid var(--rs-line); }
        .rs-results-head h2 { font-size: 19px; }
        .rs-results-head small { color: var(--rs-muted); font-size: 10px; }
        .rs-match-count { display: inline-flex; align-items: center; gap: 6px; padding: 7px 10px; border-radius: 99px; color: var(--rs-teal); background: var(--rs-teal-soft); font-size: 10px; font-weight: 700; white-space: nowrap; }
        .rs-result-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
        .rs-candidate { display: grid; grid-template-columns: minmax(0, 1fr) 46px; gap: 12px; align-items: center; padding: 15px; border: 1px solid var(--rs-line); border-radius: 14px; background: var(--rs-paper); transition: border-color .18s, transform .18s, box-shadow .18s; }
        .rs-candidate:hover { border-color: var(--green-2); box-shadow: 0 9px 22px rgba(24,32,79,.06); transform: translateY(-1px); }
        .rs-candidate-main { display: flex; align-items: flex-start; gap: 13px; min-width: 0; }
        .rs-avatar { display: grid; place-items: center; flex: 0 0 auto; width: 43px; height: 43px; border: 1px solid var(--rs-line); border-radius: 13px; color: var(--rs-teal); background: var(--mint); font-family: "Readex Pro", sans-serif; font-size: 17px; font-weight: 600; }
        .rs-candidate-info { min-width: 0; }
        .rs-name-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 9px; }
        .rs-name-row b { color: var(--rs-ink); font-size: 14px; }
        .rs-verified { display: inline-flex; align-items: center; gap: 4px; color: var(--green-2); font-size: 9px; }
        .rs-headline { display: block; margin-top: 3px; color: var(--rs-muted); font-size: 11px; font-weight: 600; line-height: 1.7; }
        .rs-meta { display: flex; flex-wrap: wrap; gap: 5px 12px; margin-top: 8px; color: var(--rs-muted); font-size: 10px; }
        .rs-meta span { display: inline-flex; align-items: center; gap: 4px; }
        .rs-skill-row { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }
        .rs-skill { padding: 4px 8px; border: 1px solid var(--rs-line); border-radius: 99px; color: var(--rs-muted); background: var(--soft); font-size: 9px; }
        .rs-open { display: grid; place-items: center; width: 40px; height: 40px; border: 1px solid var(--rs-line); border-radius: 12px; color: var(--rs-teal); background: var(--soft); cursor: pointer; transition: background .18s, color .18s; }
        .rs-open:hover { color: var(--white); background: var(--rs-teal); }
        .rs-empty { display: flex; min-height: 350px; flex-direction: column; align-items: center; justify-content: center; padding: 36px 18px; text-align: center; }
        .rs-empty-icon { display: grid; place-items: center; width: 58px; height: 58px; border: 1px solid var(--rs-line); border-radius: 18px; color: var(--rs-teal); background: var(--soft); }
        .rs-empty h3 { margin: 16px 0 5px; color: var(--rs-ink); font-family: "Readex Pro", sans-serif; font-size: 16px; }
        .rs-empty p { max-width: 320px; margin: 0; color: var(--rs-muted); font-size: 11px; line-height: 1.9; }
        .rs-empty button { margin-top: 14px; padding: 8px 12px; border: 1px solid var(--rs-line); border-radius: 9px; color: var(--rs-teal); background: var(--white); font-size: 11px; font-weight: 700; cursor: pointer; }
        .rs-modal-backdrop { position: fixed; z-index: 99; inset: 0; display: grid; place-items: center; padding: 20px; background: rgba(24, 32, 79, .38); backdrop-filter: blur(4px); }
        .rs-modal { width: min(540px, 100%); max-height: min(760px, 90dvh); overflow: auto; padding: 24px; border: 1px solid var(--rs-line); border-radius: 20px; background: var(--rs-paper); box-shadow: 0 28px 80px rgba(24,32,79,.2); animation: rs-rise .2s ease-out both; }
        @keyframes rs-rise { from { opacity: 0; transform: translateY(9px); } to { opacity: 1; transform: translateY(0); } }
        .rs-modal-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; }
        .rs-modal-close { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border: 1px solid var(--rs-line); border-radius: 11px; color: var(--rs-muted); background: var(--white); cursor: pointer; }
        .rs-modal-person { display: flex; align-items: center; gap: 13px; }
        .rs-modal-person .rs-avatar { width: 56px; height: 56px; border-radius: 16px; font-size: 21px; }
        .rs-modal-person h2 { margin: 0; color: var(--rs-ink); font-family: "Readex Pro",sans-serif; font-size: 19px; }
        .rs-modal-person p { margin: 4px 0 0; color: var(--rs-muted); font-size: 11px; }
        .rs-modal-details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 22px; }
        .rs-detail { padding: 12px; border: 1px solid var(--rs-line); border-radius: 12px; background: var(--soft); }
        .rs-detail small { display: block; color: var(--rs-muted); font-size: 9px; }
        .rs-detail b { display: block; margin-top: 5px; color: var(--rs-ink); font-size: 11px; line-height: 1.7; }
        .rs-modal-section { margin-top: 17px; }
        .rs-modal-section h3 { margin: 0 0 7px; color: var(--rs-muted); font-size: 11px; }
        .rs-modal-section p { margin: 0; color: var(--rs-muted); font-size: 11px; line-height: 1.9; }
        .rs-modal-footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 22px; padding-top: 15px; border-top: 1px solid var(--rs-line); color: var(--rs-muted); font-size: 10px; }
        .rs-modal-footer span { display: inline-flex; align-items: center; gap: 6px; }
        @media (max-width: 980px) {
          .rs-workspace { grid-template-columns: minmax(0, 1fr) 330px; gap: 12px; }
          .rs-filter-card, .rs-results-card { padding: 18px; }
          .rs-stats { grid-template-columns: repeat(3, minmax(0,1fr)); }
          .rs-stat-note { grid-column: 1 / -1; min-height: 52px; }
        }
        @media (max-width: 760px) {
          .refined-search { padding: 15px 12px 40px; }
          .rs-topline { margin-bottom: 12px; }
          .rs-access { padding: 7px 9px; font-size: 10px; }
          .rs-hero { min-height: unset; padding: 23px 19px; border-radius: 18px; }
          .rs-hero h1 { font-size: 26px; }
          .rs-hero p { max-width: 460px; font-size: 12px; }
          .rs-stats { gap: 7px; margin: 10px 0 13px; }
          .rs-stat { min-height: 66px; gap: 8px; padding: 10px; border-radius: 12px; }
          .rs-stat-icon { width: 30px; height: 30px; }
          .rs-stat b { font-size: 16px; }
          .rs-stat small { font-size: 9px; }
          .rs-stat-note { font-size: 10px; }
          .rs-workspace { display: flex; flex-direction: column; gap: 12px; }
          .rs-filter-card { position: static; width: 100%; padding: 17px; }
          .rs-results-card { width: 100%; min-height: 430px; padding: 17px; }
          .rs-panel-head h2, .rs-results-head h2 { font-size: 18px; }
          .rs-panel-head p { max-width: 330px; }
        }
        @media (max-width: 480px) {
          .rs-topline { align-items: flex-start; }
          .rs-brand-logo { width: 34px; height: 34px; }
          .rs-access { max-width: 142px; line-height: 1.5; }
          .rs-hero { padding: 20px 16px; }
          .rs-hero h1 { margin-top: 9px; font-size: 23px; line-height: 1.55; }
          .rs-hero p { font-size: 11px; }
          .rs-stats { grid-template-columns: repeat(2, minmax(0,1fr)); }
          .rs-stat-note { grid-column: 1 / -1; }
          .rs-filter-grid { grid-template-columns: 1fr; gap: 10px; }
          .rs-filter-select { min-height: 46px; }
          .rs-form-actions { align-items: stretch; flex-direction: column; }
          .rs-reset { min-height: 36px; }
          .rs-results-head { align-items: flex-start; flex-direction: column; gap: 8px; }
          .rs-candidate { grid-template-columns: minmax(0,1fr) 36px; gap: 7px; padding: 12px 10px; }
          .rs-candidate-main { gap: 9px; }
          .rs-avatar { width: 37px; height: 37px; border-radius: 11px; }
          .rs-name-row b { font-size: 12px; }
          .rs-headline { font-size: 10px; }
          .rs-meta { gap: 5px 8px; font-size: 9px; }
          .rs-skill { padding: 4px 7px; font-size: 8px; }
          .rs-open { width: 34px; height: 34px; }
          .rs-modal { padding: 18px; border-radius: 17px; }
          .rs-modal-details { grid-template-columns: 1fr 1fr; gap: 7px; }
          .rs-detail { padding: 9px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .refined-search *, .refined-search *::before, .refined-search *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; }
        }
      `}</style>
      <div className="rs-shell">
        <div className="rs-topline">
          <div className="rs-brand" aria-label="Iraq Jobs">
            <img className="rs-brand-logo" src={`${import.meta.env.BASE_URL}iraq-jobs-logo.jpg`} alt="IRAQ JOBS" />
            <span><b>IRAQ JOBS</b><small>FOR JOB SEEKERS</small></span>
          </div>
          <span className="rs-access"><ShieldCheck size={14} /> الوصول إلى الملفات مصرّح</span>
        </div>

        <header className="rs-hero">
          <div className="rs-hero-copy">
            <span className="rs-kicker"><i /> مساحة صاحب العمل / HR</span>
            <h1>اعثر على الكفاءة المناسبة لفريقك</h1>
            <p>بحث أوضح في ملفات الباحثين المتاحة، بخيارات تتغير مع كل معيار تختاره.</p>
          </div>
        </header>

        <section className="rs-stats" aria-label="ملخص البحث">
          <div className="rs-stat"><span className="rs-stat-icon"><UserRound size={16} /></span><p><b>{profiles.length}</b><small>ملف باحث متاح</small></p></div>
          <div className="rs-stat"><span className="rs-stat-icon"><Search size={16} /></span><p><b>{resultsAreCurrent ? results.length : "—"}</b><small>نتيجة مطابقة</small></p></div>
          <div className="rs-stat"><span className="rs-stat-icon"><Clock3 size={16} /></span><p><b>14</b><small>طلب وارد</small></p></div>
          <div className="rs-stat rs-stat-note"><SlidersHorizontal size={16} /><span>كل قائمة تعرض القيم الموجودة في ملفات تطابق اختياراتك الأخرى.</span></div>
        </section>

        <div className="rs-workspace">
          <section className="rs-results-card" aria-live="polite">
            <div className="rs-results-head">
              <div>
                <span className="rs-eyebrow">النتائج المطابقة</span>
                <h2>{!hasSearched ? "مساحة النتائج" : !resultsAreCurrent ? "أعد البحث بالمعايير الجديدة" : shownProfiles.length ? `${shownProfiles.length} ملف مطابق` : "لا توجد ملفات مطابقة"}</h2>
              </div>
              <span className="rs-match-count"><ShieldCheck size={13} /> الملفات الداخلية المصرّح بها</span>
            </div>
            {shownProfiles.length > 0 ? (
              <div className="rs-result-list">
                {shownProfiles.map((candidate) => (
                  <article className="rs-candidate" key={candidate.name}>
                    <div className="rs-candidate-main">
                      <span className="rs-avatar" aria-hidden="true">{candidate.name.slice(0, 1)}</span>
                      <div className="rs-candidate-info">
                        <div className="rs-name-row"><b>{candidate.name}</b><span className="rs-verified"><CheckCircle2 size={12} /> ملف مكتمل</span></div>
                        <strong className="rs-headline">{candidate.headline}</strong>
                        <div className="rs-meta">
                          <span><MapPin size={12} />{candidate.province} / {candidate.city}</span>
                          <span><BriefcaseBusiness size={12} />{candidate.years} سنوات خبرة</span>
                          <span><Clock3 size={12} />{candidate.availability}</span>
                        </div>
                        <div className="rs-skill-row">{candidate.skills.slice(0, 3).map((skill) => <span className="rs-skill" key={skill}>{skill}</span>)}</div>
                      </div>
                    </div>
                    <button className="rs-open" type="button" onClick={() => setSelectedCandidate(candidate)} aria-label={`عرض الملف المهني لـ ${candidate.name}`} title="عرض الملف">
                      <ArrowDownLeft size={18} />
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rs-empty">
                <span className="rs-empty-icon">{hasSearched ? <Search size={23} /> : <SlidersHorizontal size={23} />}</span>
                <h3>{!hasSearched ? "ابدأ بتحديد المواصفات" : !resultsAreCurrent ? "تغيّرت معايير البحث" : "ما لقينا ملفات بهذه المواصفات"}</h3>
                <p>{!hasSearched ? "حدّد التخصص أو المهارة المناسبة. القوائم تتكيّف تلقائياً مع اختياراتك." : !resultsAreCurrent ? "اضغط «عرض الباحثين» حتى نحدّث النتائج حسب خياراتك الجديدة." : "جرّب إزالة فلتر أو اختيار قيمة ثانية، ثم أعد البحث."}</p>
                {hasSearched && resultsAreCurrent && <button type="button" onClick={clearFilters}>مسح الفلاتر والبدء من جديد</button>}
              </div>
            )}
          </section>

          <form className="rs-filter-card" onSubmit={runSearch}>
            <div className="rs-panel-head">
              <div>
                <span className="rs-eyebrow">فلترة من البيانات الفعلية</span>
                <h2>ابنِ بحثك</h2>
                <p>كلما حدّدت تخصصاً، تضيق الخيارات إلى ما يناسبه.</p>
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
              {filterKeys.map((key) => {
                const options = availableOptions(key);
                const selected = filters[key];
                const showSelected = selected && !options.includes(selected);
                return (
                  <label key={key}>
                    <span>{selectLabels[key]}{key === "specialization" && <span className="rs-filter-count">{options.length}</span>}</span>
                    <select
                      className="rs-filter-select"
                      value={selected}
                      onChange={(event) => updateFilter(key, event.target.value)}
                      aria-label={selectLabels[key]}
                    >
                      <option value="">{placeholders[key]}</option>
                      {showSelected && <option value={selected}>{selected}</option>}
                      {options.map((option) => (
                        <option className="rs-filter-option" value={option} key={option}>
                          {key === "experience" ? `من ${option} سنة فأكثر` : option}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>

            <label className="rs-remote">
              <input type="checkbox" checked={filters.remoteOnly} onChange={(event) => updateFilter("remoteOnly", event.target.checked)} />
              <span>أظهر من يقبل العمل عن بُعد فقط</span>
            </label>

            <div className="rs-form-actions">
              <button className="rs-submit" type="submit"><Search size={16} /> عرض الباحثين</button>
              <button className="rs-reset" type="button" onClick={clearFilters}><RotateCcw size={14} /> مسح الفلاتر{activeCount > 0 ? ` (${activeCount})` : ""}</button>
            </div>
          </form>
        </div>
      </div>

      {selectedCandidate && (
        <div className="rs-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedCandidate(null);
        }}>
          <section className="rs-modal" role="dialog" aria-modal="true" aria-labelledby="rs-profile-title">
            <div className="rs-modal-top">
              <div className="rs-modal-person">
                <span className="rs-avatar" aria-hidden="true">{selectedCandidate.name.slice(0, 1)}</span>
                <div><h2 id="rs-profile-title">{selectedCandidate.name}</h2><p>{selectedCandidate.headline}</p></div>
              </div>
              <button className="rs-modal-close" type="button" aria-label="إغلاق الملف" onClick={() => setSelectedCandidate(null)}><X size={18} /></button>
            </div>
            <div className="rs-modal-details">
              <div className="rs-detail"><small>التخصص</small><b>{selectedCandidate.specialization}</b></div>
              <div className="rs-detail"><small>الموقع</small><b>{selectedCandidate.province} / {selectedCandidate.city}</b></div>
              <div className="rs-detail"><small>سنوات الخبرة</small><b>{selectedCandidate.years} سنوات</b></div>
              <div className="rs-detail"><small>التوفر</small><b>{selectedCandidate.availability}</b></div>
              <div className="rs-detail"><small>نوع العمل</small><b>{selectedCandidate.workTypes.join("، ")}</b></div>
              <div className="rs-detail"><small>اللغات</small><b>{selectedCandidate.languages.join("، ")}</b></div>
            </div>
            <div className="rs-modal-section"><h3>نبذة مهنية</h3><p>{selectedCandidate.summary}</p></div>
            <div className="rs-modal-section"><h3>المهارات</h3><div className="rs-skill-row">{selectedCandidate.skills.map((skill) => <span className="rs-skill" key={skill}>{skill}</span>)}</div></div>
            <div className="rs-modal-section"><h3>التعليم</h3><p>{selectedCandidate.education}</p></div>
            <div className="rs-modal-footer"><span><ShieldCheck size={14} /> ملف داخلي مصرح بالوصول إليه</span><span><Check size={14} /> بيانات الباحث</span></div>
          </section>
        </div>
      )}
    </main>
  );
}
