import { ArrowRight, BriefcaseBusiness, CalendarDays, GraduationCap, Languages, Mail, MapPin, Phone, UserRound } from "lucide-react";
import type { CandidateProfile } from "../../lib/types";
import { parseCandidateExperiences, parseCandidateLanguages } from "../../services/candidateService";

type CandidateProfilePageProps = {
  candidate: CandidateProfile;
  source: "search" | "applications";
  onBack: () => void;
};

export function CandidateProfilePage({ candidate, source, onBack }: CandidateProfilePageProps) {
  const experiences = parseCandidateExperiences(candidate.experience_details);
  const languages = parseCandidateLanguages(candidate.languages);

  return (
    <section className="container page-section hr-candidate-profile-page">
      <button type="button" className="back-link candidate-profile-back" onClick={onBack}>
        <ArrowRight size={16} />
        العودة إلى {source === "applications" ? "الطلبات الواردة" : "نتائج البحث"}
      </button>

      <article className="candidate-detail-card candidate-profile-card">
        <header className="candidate-profile-header">
          <div className="candidate-detail-heading">
            <span className="candidate-result-avatar"><UserRound size={21} /></span>
            <div>
              <span className="eyebrow">ملف مهني للمرشح</span>
              <h1>{candidate.full_name}</h1>
              <p>{candidate.headline} · {candidate.specialization}</p>
            </div>
          </div>
          <span className="candidate-profile-badge"><BriefcaseBusiness size={14} /> {source === "applications" ? "متقدم على وظيفة" : "مرشح مطابق"}</span>
        </header>

        <div className="candidate-profile-layout">
          <div className="candidate-profile-main">
            <section className="candidate-detail-section candidate-summary-section">
              <div className="candidate-section-title"><span className="candidate-section-icon"><UserRound size={16} /></span><div><h3>نبذة مهنية</h3><small>لمحة سريعة عن خبرة المرشح وقيمته</small></div></div>
              <p>{candidate.summary || "لا توجد نبذة مضافة."}</p>
            </section>

            <section className="candidate-detail-section">
              <div className="candidate-section-title"><span className="candidate-section-icon blue"><BriefcaseBusiness size={16} /></span><div><h3>الخبرة العملية</h3><small>المسار المهني والإنجازات الأساسية</small></div></div>
              {experiences.length ? <div className="candidate-experience-list">{experiences.map((experience) => <article className="candidate-experience-item" key={experience.id}><div className="candidate-experience-heading"><b>{experience.title || "خبرة مهنية"}</b><span>{experience.company || "جهة العمل غير محددة"}</span></div>{(experience.period || experience.location) && <small className="candidate-experience-meta"><CalendarDays size={13} /> {[experience.period, experience.location].filter(Boolean).join(" · ")}</small>}<p>{experience.description || "لا توجد تفاصيل مضافة."}</p></article>)}</div> : <p>لا توجد تفاصيل مضافة.</p>}
            </section>

            <section className="candidate-detail-section candidate-education-section">
              <div className="candidate-section-title"><span className="candidate-section-icon violet"><GraduationCap size={16} /></span><div><h3>التعليم واللغات</h3><small>المؤهل واللغات المستخدمة في العمل</small></div></div>
              <div className="candidate-education-block"><b>المؤهل العلمي</b><p>{candidate.education || "لا توجد بيانات تعليمية."}</p></div>
              <div className="candidate-language-block"><b><Languages size={14} /> اللغات</b><div className="candidate-language-list">{languages.length ? languages.map((language, index) => <span key={`${language.name}-${index}`}><strong>{language.name}</strong>{language.level && <small>{language.level}</small>}</span>) : <p>لا توجد لغات مضافة.</p>}</div></div>
            </section>
          </div>

          <aside className="candidate-profile-side">
            <div className="candidate-detail-facts">
              <span><small><MapPin size={12} /> الموقع</small><b>{[candidate.province, candidate.city].filter(Boolean).join(" / ") || "غير محدد"}</b></span>
              <span><small>الخبرة</small><b>{candidate.experience_years} سنوات</b></span>
              <span><small>التوفر</small><b>{candidate.availability || "غير محدد"}</b></span>
              <span><small>نوع العمل</small><b>{candidate.work_type || "غير محدد"}</b></span>
            </div>
            <section className="candidate-detail-section candidate-skills-section"><div className="candidate-section-title"><span className="candidate-section-icon orange"><BriefcaseBusiness size={16} /></span><div><h3>المهارات</h3><small>أبرز نقاط القوة</small></div></div><div className="skill-pills">{candidate.skills.length ? candidate.skills.map((skill) => <span key={skill}>{skill}</span>) : <p>لا توجد مهارات مضافة.</p>}</div></section>
            <div className="candidate-contact-box"><b>بيانات التواصل</b><span><Mail size={14} /> {candidate.email || "لا يوجد بريد مضاف"}</span><span><Phone size={14} /> {candidate.phone || "لا يوجد رقم مضاف"}</span></div>
          </aside>
        </div>
      </article>
    </section>
  );
}