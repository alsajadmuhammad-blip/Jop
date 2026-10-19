import { useState } from "react";
import { Building2, CheckCircle2, Clock3, Search, ShieldAlert, SlidersHorizontal, UserRound } from "lucide-react";
import { AppSelect } from "../../../original/components/common/AppSelect";
import "./_group.css";

const options = {
  specializations: ["مهندس برمجيات", "مهندس مدني", "محاسب", "موارد بشرية"],
  provinces: ["بغداد", "البصرة", "أربيل", "نينوى"],
  cities: ["الكرخ", "الرصافة", "الموصل", "أربيل"],
  skills: ["React", "إدارة المشاريع", "المحاسبة", "تحليل البيانات"],
  workTypes: ["دوام كامل", "دوام جزئي", "عن بُعد"],
  availabilities: ["متاح فوراً", "خلال شهر", "على رأس العمل"],
  experienceYears: [0, 1, 2, 3, 5, 8, 10],
};

const candidates = [
  {
    name: "سارة أحمد",
    headline: "مهندسة برمجيات · تطوير تطبيقات الويب",
    specialization: "مهندس برمجيات",
    province: "بغداد",
    city: "الكرخ",
    years: 5,
    skills: ["React", "TypeScript", "واجهات المستخدم"],
  },
  {
    name: "علي محمود",
    headline: "مهندس برمجيات · أنظمة وخدمات سحابية",
    specialization: "مهندس برمجيات",
    province: "البصرة",
    city: "العشار",
    years: 3,
    skills: ["Node.js", "PostgreSQL", "تحليل البيانات"],
  },
];

export function Current() {
  const [specialization, setSpecialization] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [skill, setSkill] = useState("");
  const [workType, setWorkType] = useState("");
  const [availability, setAvailability] = useState("");
  const [experience, setExperience] = useState("");

  return (
    <section dir="rtl" className="container page-section dashboard-page hr-workspace-page">
      <header className="hr-page-header">
        <div className="hr-page-header-copy">
          <span className="eyebrow"><Building2 size={14} /> مساحة صاحب العمل / HR</span>
          <h1>اعثر على الكفاءة المناسبة لفريقك</h1>
          <p>فلترة واضحة تساعدك على الوصول إلى المرشح الأقرب لمتطلبات الوظيفة.</p>
          <div className="hr-header-tags">
            <span><CheckCircle2 size={14} /> بيانات متطابقة مع ملفات الباحثين</span>
            <span><ShieldAlert size={14} /> وصول مقيّد ومصرّح</span>
          </div>
        </div>
        <div className="hr-page-header-mark"><Building2 size={27} /><b>IRAQ JOBS</b><small>دليل الكفاءات</small></div>
      </header>

      <div className="hr-summary-strip">
        <div><span><UserRound size={16} /></span><p><b>128</b><small>ملف باحث متاح</small></p></div>
        <div><span><Search size={16} /></span><p><b>—</b><small>نتيجة مطابقة</small></p></div>
        <div><span><Clock3 size={16} /></span><p><b>14</b><small>طلب وارد</small></p></div>
        <div className="hr-summary-note"><SlidersHorizontal size={16} /><span>كل خيار يظهر فقط إذا كان موجودًا في ملفات الباحثين الحالية.</span></div>
      </div>

      <div className="candidate-search-layout">
        <form className="candidate-search-panel">
          <div className="search-panel-heading">
            <div><span className="eyebrow">فلترة من البيانات الفعلية</span><h2>ابنِ بحثك</h2><p>اختر من القيم الموجودة حاليًا بدل كتابة قيمة قد لا تطابق ملفات الباحثين.</p></div>
            <SlidersHorizontal size={20} />
          </div>
          <label className="hr-keyword-field"><span>كلمة البحث <small>اختياري</small></span><input placeholder="مسمى، إنجاز، تعليم أو لغة" /></label>
          <div className="hr-filter-grid">
            <label><span>التخصص</span><AppSelect value={specialization} onChange={setSpecialization} placeholder="كل التخصصات" options={options.specializations.map((value) => ({ value, label: value }))} ariaLabel="التخصص" /></label>
            <label><span>المحافظة</span><AppSelect value={province} onChange={setProvince} placeholder="كل المحافظات" options={options.provinces.map((value) => ({ value, label: value }))} ariaLabel="المحافظة" /></label>
            <label><span>المدينة</span><AppSelect value={city} onChange={setCity} placeholder="كل المدن" options={options.cities.map((value) => ({ value, label: value }))} ariaLabel="المدينة" /></label>
            <label><span>المهارة</span><AppSelect value={skill} onChange={setSkill} placeholder="كل المهارات" options={options.skills.map((value) => ({ value, label: value }))} ariaLabel="المهارة" /></label>
            <label><span>نوع العمل</span><AppSelect value={workType} onChange={setWorkType} placeholder="كل الأنواع" options={options.workTypes.map((value) => ({ value, label: value }))} ariaLabel="نوع العمل" /></label>
            <label><span>التوفر للعمل</span><AppSelect value={availability} onChange={setAvailability} placeholder="كل حالات التوفر" options={options.availabilities.map((value) => ({ value, label: value }))} ariaLabel="التوفر للعمل" /></label>
            <label><span>الخبرة</span><AppSelect value={experience} onChange={setExperience} placeholder="أي مستوى خبرة" options={options.experienceYears.map((value) => ({ value: String(value), label: `من ${value} سنة فأكثر` }))} ariaLabel="الخبرة" /></label>
          </div>
          <label className="checkbox-field hr-remote-filter"><input type="checkbox" /><span>أظهر من يقبل العمل عن بُعد فقط</span></label>
          <div className="hr-filter-actions"><button type="button" className="primary-btn"><Search size={17} /> عرض الباحثين</button><button type="reset" className="reset-filter-btn">مسح الفلاتر</button></div>
        </form>

        <div className="candidate-results">
          <div className="results-heading"><div><span className="eyebrow">النتائج المطابقة</span><h2>اختر معايير البحث</h2></div><small>الملفات الداخلية المصرّح بها</small></div>
          <div className="candidate-result-list">
            {candidates.map((candidate) => (
              <button type="button" className="candidate-result-card" key={candidate.name}>
                <span className="candidate-result-avatar">{candidate.name.slice(0, 1)}</span>
                <span className="candidate-result-copy">
                  <b>{candidate.name}</b>
                  <strong>{candidate.headline}</strong>
                  <small>{candidate.specialization} · {candidate.province} / {candidate.city} · {candidate.years} سنوات خبرة</small>
                  <span>{candidate.skills.join(" · ")}</span>
                </span>
                <span className="candidate-result-arrow">عرض الملف</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
