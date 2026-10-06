import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { CandidateProfile } from "../../lib/types";
import {
  formatCandidateExperiencePeriodForAts,
  parseCandidateEducation,
  parseCandidateExperiences,
  parseCandidateLanguages,
} from "../../services/candidateService";

type CandidateProfilePageProps = {
  candidate: CandidateProfile;
  source: "search" | "applications";
  onBack: () => void;
};

const englishLanguageLevels: Record<string, string> = {
  "اللغة الأم": "Native",
  "متقدم": "Advanced",
  "جيد جدًا": "Very Good",
  "متوسط": "Intermediate",
  "مبتدئ": "Beginner",
};

function ResumeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="candidate-ats-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function CandidateProfilePage({ candidate, source, onBack }: CandidateProfilePageProps) {
  const experiences = parseCandidateExperiences(candidate.experience_details).filter((experience) =>
    [experience.title, experience.company, experience.location, experience.description, experience.legacyPeriod, experience.startMonth, experience.endMonth]
      .some((value) => value.trim()) || experience.isCurrent,
  );
  const education = parseCandidateEducation(candidate.education).filter((entry) =>
    [entry.degree, entry.specialization, entry.institution, entry.graduationYear].some((value) => value.trim()),
  );
  const languages = parseCandidateLanguages(candidate.languages).filter((language) => language.name.trim());
  const skills = candidate.skills.filter((skill) => skill.trim());
  const location = [candidate.city, candidate.province].filter(Boolean).join(", ");
  const contact = [candidate.email, candidate.phone, location].filter(Boolean);
  const meta = [
    candidate.specialization,
    candidate.experience_years > 0 ? `${candidate.experience_years} years of experience` : "",
  ].filter(Boolean);

  return (
    <section className="container page-section hr-candidate-profile-page candidate-ats-profile-page">
      <button type="button" className="back-link candidate-profile-back" onClick={onBack}>
        <ArrowRight size={16} />
        العودة إلى {source === "applications" ? "الطلبات الواردة" : "نتائج البحث"}
      </button>

      <div className="candidate-ats-viewbar" dir="rtl">
        <div>
          <span>معاينة الملف المهني</span>
          <strong>مرتب للقراءة بأنظمة ATS</strong>
        </div>
        <span className="candidate-ats-source">{source === "applications" ? "متقدم على وظيفة" : "مرشح مطابق"}</span>
      </div>

      <article className="candidate-ats-document" lang="en" dir="ltr">
        <header className="candidate-ats-header">
          <h1>{candidate.full_name || "Full Name"}</h1>
          <p className="candidate-ats-headline">{candidate.headline || "Professional Title"}</p>
          {contact.length > 0 && <p className="candidate-ats-contact">{contact.join(" | ")}</p>}
          {meta.length > 0 && <p className="candidate-ats-meta">{meta.join(" | ")}</p>}
        </header>

        {candidate.summary.trim() && (
          <ResumeSection title="Professional Summary">
            <p>{candidate.summary}</p>
          </ResumeSection>
        )}

        {skills.length > 0 && (
          <ResumeSection title="Core Skills">
            <ul className="candidate-ats-list candidate-ats-skills">
              {skills.map((skill, index) => <li key={`${skill}-${index}`}>{skill}</li>)}
            </ul>
          </ResumeSection>
        )}

        {experiences.length > 0 && (
          <ResumeSection title="Professional Experience">
            {experiences.map((experience) => {
              const period = formatCandidateExperiencePeriodForAts(experience);
              const experienceMeta = [experience.company, experience.location, period].filter(Boolean);
              return (
                <article className="candidate-ats-entry" key={experience.id}>
                  <h3>{experience.title || "Professional Experience"}</h3>
                  {experienceMeta.length > 0 && <p className="candidate-ats-entry-meta">{experienceMeta.join(" | ")}</p>}
                  {experience.description.trim() && <p>{experience.description}</p>}
                </article>
              );
            })}
          </ResumeSection>
        )}

        {education.length > 0 && (
          <ResumeSection title="Education">
            {education.map((entry) => {
              const details = [entry.specialization, entry.institution, entry.graduationYear].filter(Boolean);
              return (
                <article className="candidate-ats-entry" key={entry.id}>
                  <h3>{entry.degree || "Education"}</h3>
                  {details.length > 0 && <p className="candidate-ats-entry-meta">{details.join(" | ")}</p>}
                </article>
              );
            })}
          </ResumeSection>
        )}

        {languages.length > 0 && (
          <ResumeSection title="Languages">
            <ul className="candidate-ats-list">
              {languages.map((language, index) => {
                const level = language.level ? englishLanguageLevels[language.level] || language.level : "";
                return <li key={`${language.name}-${index}`}>{[language.name, level].filter(Boolean).join(" — ")}</li>;
              })}
            </ul>
          </ResumeSection>
        )}
      </article>
    </section>
  );
}