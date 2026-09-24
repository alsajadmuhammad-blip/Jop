import { ArrowRight, BriefcaseBusiness, MapPin, UserRound } from "lucide-react";
import type { CandidateProfile } from "../../lib/types";
import { formatCandidateExperiences } from "../../services/candidateService";

type CandidateProfilePageProps = {
  candidate: CandidateProfile;
  source: "search" | "applications";
  onBack: () => void;
};

export function CandidateProfilePage({ candidate, source, onBack }: CandidateProfilePageProps) {
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
              <span className="eyebrow">ملف مهني</span>
              <h1>{candidate.full_name}</h1>
              <p>{candidate.headline} · {candidate.specialization}</p>
            </div>
          </div>
          <span className="candidate-profile-badge"><BriefcaseBusiness size={14} /> ملف متقدم</span>
        </header>

        <div className="candidate-detail-facts">
          <span><small><MapPin size={12} /> الموقع</small><b>{[candidate.province, candidate.city].filter(Boolean).join(" / ") || "غير محدد"}</b></span>
          <span><small>الخبرة</small><b>{candidate.experience_years} سنوات</b></span>
          <span><small>التوفر</small><b>{candidate.availability || "غير محدد"}</b></span>
        </div>

        <div className="candidate-detail-section"><h3>نبذة مهنية</h3><p>{candidate.summary || "لا توجد نبذة مضافة."}</p></div>
        <div className="candidate-detail-section"><h3>المهارات</h3><div className="skill-pills">{candidate.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div>
        <div className="candidate-detail-section"><h3>الخبرة العملية</h3><p>{formatCandidateExperiences(candidate.experience_details) || "لا توجد تفاصيل مضافة."}</p></div>
        <div className="candidate-detail-section"><h3>التعليم واللغات</h3><p>{candidate.education || "لا توجد بيانات تعليمية."}</p><p>{candidate.languages.join(" · ") || "لا توجد لغات مضافة."}</p></div>
        <div className="candidate-contact-box"><b>بيانات التواصل</b><span>{candidate.email}</span><span>{candidate.phone}</span></div>
      </article>
    </section>
  );
}