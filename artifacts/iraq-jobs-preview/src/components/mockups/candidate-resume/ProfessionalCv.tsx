import type { ReactNode } from "react";

type ExperienceEntry = {
  title: string;
  company: string;
  location: string;
  dates: string;
  description: string;
};

type CandidateProfile = {
  fullName: string;
  headline: string;
  specialization: string;
  yearsOfExperience: string;
  email: string;
  phone: string;
  province: string;
  city: string;
  summary: string;
  skills: string[];
  experiences: ExperienceEntry[];
  education: string[];
  languages: { name: string; level: string }[];
};

const candidate: CandidateProfile = {
  fullName: "Layla Hassan",
  headline: "Senior Operations & Supply Chain Specialist",
  specialization: "Procurement & Logistics",
  yearsOfExperience: "9 years",
  email: "layla.hassan@example.com",
  phone: "+964 770 000 1842",
  province: "Baghdad Governorate",
  city: "Baghdad",
  summary:
    "Operations professional with nine years of experience improving procurement, logistics and supplier performance across Iraq. Known for building reliable processes, coordinating cross-functional teams and keeping critical work moving in complex environments. Combines practical, on-the-ground judgment with clear reporting and a steady focus on cost, service and compliance.",
  skills: [
    "Strategic procurement",
    "Supplier management",
    "Logistics coordination",
    "Contract negotiation",
    "Inventory planning",
    "Team leadership",
    "Budget tracking",
    "Operational reporting",
  ],
  experiences: [
    {
      title: "Operations & Supply Chain Lead",
      company: "Tigris Field Services",
      location: "Baghdad, Iraq",
      dates: "2021 — Present",
      description:
        "Lead purchasing and logistics for multi-site service operations. Introduced supplier scorecards and clearer approval workflows, improving on-time delivery while strengthening visibility on operating costs.",
    },
    {
      title: "Procurement Specialist",
      company: "North Gate Manufacturing",
      location: "Baghdad, Iraq",
      dates: "2017 — 2021",
      description:
        "Managed sourcing, quotations and vendor relationships for local and imported materials. Negotiated framework agreements and partnered with finance and warehouse teams to maintain accurate forecasts.",
    },
    {
      title: "Logistics Coordinator",
      company: "Al-Nahrain Food Trading",
      location: "Basra, Iraq",
      dates: "2014 — 2017",
      description:
        "Coordinated inbound shipments, stock records and delivery schedules across regional depots, resolving routine supplier and transport issues with clear, timely communication.",
    },
  ],
  education: [
    "BSc, Business Administration",
    "University of Baghdad · Baghdad · 2014",
  ],
  languages: [
    { name: "Arabic", level: "Native" },
    { name: "English", level: "Advanced" },
    { name: "Kurdish", level: "Intermediate" },
  ],
};

const styles = `
  .professional-cv-preview {
    --cv-ink: #203b40;
    --cv-muted: #607579;
    --cv-teal: #276961;
    --cv-deep: #173f46;
    --cv-line: #d9e4e1;
    --cv-tint: #f1f6f4;
    --cv-warm: #f5f2eb;
    min-height: 100vh;
    padding: 34px 18px;
    color: var(--cv-ink);
    background: #e9efed;
    font-family: Arial, "Trebuchet MS", sans-serif;
    font-size: 12px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  .professional-cv-preview *,
  .professional-cv-preview *::before,
  .professional-cv-preview *::after {
    box-sizing: border-box;
  }

  .professional-cv-preview .cv-paper {
    width: 100%;
    max-width: 794px;
    min-height: 1123px;
    margin: 0 auto;
    padding: 49px 54px 38px;
    background: #fff;
    border: 1px solid #dde5e3;
  }

  .professional-cv-preview .cv-header {
    padding: 0 0 23px;
    border-bottom: 3px solid var(--cv-deep);
  }

  .professional-cv-preview .cv-topline {
    width: 100%;
    margin-bottom: 20px;
    border-collapse: collapse;
  }

  .professional-cv-preview .cv-topline td {
    padding: 0;
    vertical-align: middle;
  }

  .professional-cv-preview .cv-kicker {
    color: var(--cv-teal);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
  }

  .professional-cv-preview .cv-sample-tag {
    padding: 5px 8px;
    border: 1px solid #d9e5e0;
    color: #58736f;
    background: #f4f8f6;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.7px;
    text-align: center;
    text-transform: uppercase;
  }

  .professional-cv-preview .cv-name {
    margin: 0;
    color: var(--cv-deep);
    font-family: Georgia, "Times New Roman", serif;
    font-size: 38px;
    font-weight: 700;
    letter-spacing: -0.8px;
    line-height: 1.08;
  }

  .professional-cv-preview .cv-headline {
    margin: 7px 0 15px;
    color: #426166;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.1px;
  }

  .professional-cv-preview .cv-contact {
    width: 100%;
    border-collapse: collapse;
  }

  .professional-cv-preview .cv-contact td {
    padding: 3px 15px 2px 0;
    color: #4c666a;
    font-size: 10px;
    vertical-align: top;
  }

  .professional-cv-preview .cv-contact-label {
    padding-right: 5px;
    color: #839495;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
  }

  .professional-cv-preview .cv-section {
    margin-top: 16px;
    border: 1px solid var(--cv-line);
  }

  .professional-cv-preview .cv-section-heading {
    margin: 0;
    padding: 8px 11px 7px;
    border-bottom: 1px solid var(--cv-line);
    color: var(--cv-deep);
    background: var(--cv-tint);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
    line-height: 1.25;
    text-transform: uppercase;
  }

  .professional-cv-preview .cv-section-body {
    padding: 11px 12px;
  }

  .professional-cv-preview .cv-summary {
    margin: 0;
    color: #415a5e;
    font-size: 11px;
    line-height: 1.65;
  }

  .professional-cv-preview .cv-columns {
    width: 100%;
    margin-top: 16px;
    border-collapse: separate;
    border-spacing: 0;
    table-layout: fixed;
  }

  .professional-cv-preview .cv-columns > tbody > tr > td {
    padding: 0;
    vertical-align: top;
  }

  .professional-cv-preview .cv-main-column {
    width: 62%;
    padding-right: 6px !important;
  }

  .professional-cv-preview .cv-side-column {
    width: 38%;
    padding-left: 6px !important;
  }

  .professional-cv-preview .cv-columns .cv-section {
    margin-top: 0;
    margin-bottom: 13px;
  }

  .professional-cv-preview .cv-experience-list {
    padding: 0 12px;
  }

  .professional-cv-preview .cv-experience {
    padding: 12px 0 11px;
    border-bottom: 1px solid #e3ebe8;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .professional-cv-preview .cv-experience:last-child {
    border-bottom: 0;
  }

  .professional-cv-preview .cv-experience-heading {
    width: 100%;
    border-collapse: collapse;
  }

  .professional-cv-preview .cv-experience-heading td {
    padding: 0;
    vertical-align: top;
  }

  .professional-cv-preview .cv-experience-title {
    margin: 0;
    color: #24494e;
    font-size: 12px;
    font-weight: 700;
    line-height: 1.35;
  }

  .professional-cv-preview .cv-experience-period {
    width: 95px;
    padding-left: 7px !important;
    color: var(--cv-teal);
    font-size: 9px;
    font-weight: 700;
    text-align: right;
    white-space: nowrap;
  }

  .professional-cv-preview .cv-company {
    margin: 3px 0 6px;
    color: #728586;
    font-size: 9px;
    font-weight: 600;
  }

  .professional-cv-preview .cv-description {
    margin: 0;
    color: #51676a;
    font-size: 10px;
    line-height: 1.55;
  }

  .professional-cv-preview .cv-skills-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 5px;
    margin: -5px;
  }

  .professional-cv-preview .cv-skills-table td {
    width: 50%;
    padding: 6px 7px;
    border: 1px solid #e0e9e6;
    color: #3e6260;
    background: #f6f9f7;
    font-size: 9px;
    line-height: 1.3;
    vertical-align: middle;
  }

  .professional-cv-preview .cv-snapshot-table,
  .professional-cv-preview .cv-language-table {
    width: 100%;
    border-collapse: collapse;
  }

  .professional-cv-preview .cv-snapshot-table td,
  .professional-cv-preview .cv-language-table td {
    padding: 6px 0;
    border-bottom: 1px solid #e7edeb;
    vertical-align: top;
  }

  .professional-cv-preview .cv-snapshot-table tr:last-child td,
  .professional-cv-preview .cv-language-table tr:last-child td {
    border-bottom: 0;
  }

  .professional-cv-preview .cv-data-label {
    display: block;
    margin-bottom: 2px;
    color: #829391;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.7px;
    text-transform: uppercase;
  }

  .professional-cv-preview .cv-data-value {
    color: #37585b;
    font-size: 10px;
    font-weight: 600;
  }

  .professional-cv-preview .cv-language-name {
    color: #37585b;
    font-size: 10px;
    font-weight: 700;
  }

  .professional-cv-preview .cv-language-level {
    color: #758887;
    font-size: 9px;
    text-align: right;
  }

  .professional-cv-preview .cv-education-degree {
    margin: 0;
    color: #37585b;
    font-size: 10px;
    font-weight: 700;
  }

  .professional-cv-preview .cv-education-details {
    margin: 4px 0 0;
    color: #738584;
    font-size: 9px;
    line-height: 1.45;
  }

  .professional-cv-preview .cv-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid #dce6e3;
    color: #8a9997;
    font-size: 8px;
    letter-spacing: 0.2px;
  }

  @media (max-width: 640px) {
    .professional-cv-preview {
      padding: 12px 8px;
      font-size: 11px;
    }

    .professional-cv-preview .cv-paper {
      min-height: 0;
      padding: 27px 21px 25px;
    }

    .professional-cv-preview .cv-name {
      font-size: 32px;
    }

    .professional-cv-preview .cv-headline {
      font-size: 14px;
    }

    .professional-cv-preview .cv-contact td {
      display: block;
      padding: 3px 0;
    }

    .professional-cv-preview .cv-columns,
    .professional-cv-preview .cv-columns > tbody,
    .professional-cv-preview .cv-columns > tbody > tr,
    .professional-cv-preview .cv-columns > tbody > tr > td {
      display: block;
      width: 100%;
    }

    .professional-cv-preview .cv-columns {
      border-spacing: 0;
    }

    .professional-cv-preview .cv-side-column {
      padding-top: 1px !important;
    }
  }

  @media print {
    @page {
      size: A4 portrait;
      margin: 13mm;
    }

    .professional-cv-preview {
      min-height: 0;
      padding: 0;
      background: #fff;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .professional-cv-preview .cv-paper {
      width: auto;
      max-width: none;
      min-height: 0;
      margin: 0;
      padding: 0;
      border: 0;
    }

    .professional-cv-preview .cv-header,
    .professional-cv-preview .cv-section-heading {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .professional-cv-preview .cv-columns {
      border-spacing: 0;
    }
  }
`;

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="cv-section">
      <h2 className="cv-section-heading">{title}</h2>
      <div className="cv-section-body">{children}</div>
    </section>
  );
}

export function ProfessionalCv() {
  const skillRows: string[][] = [];
  for (let index = 0; index < candidate.skills.length; index += 2) {
    skillRows.push(candidate.skills.slice(index, index + 2));
  }

  return (
    <div className="professional-cv-preview" dir="ltr">
      <style>{styles}</style>
      <main className="cv-paper" aria-label="Professional CV preview">
        <header className="cv-header">
          <table className="cv-topline" role="presentation">
            <tbody>
              <tr>
                <td className="cv-kicker">Curriculum vitae · Iraq</td>
                <td align="right">
                  <span className="cv-sample-tag">Fictional sample profile</span>
                </td>
              </tr>
            </tbody>
          </table>
          <h1 className="cv-name">{candidate.fullName}</h1>
          <p className="cv-headline">{candidate.headline}</p>
          <table className="cv-contact" role="presentation">
            <tbody>
              <tr>
                <td>
                  <span className="cv-contact-label">Email</span>
                  {candidate.email}
                </td>
                <td>
                  <span className="cv-contact-label">Phone</span>
                  {candidate.phone}
                </td>
              </tr>
              <tr>
                <td colSpan={2}>
                  <span className="cv-contact-label">Location</span>
                  {candidate.city}, {candidate.province}
                </td>
              </tr>
            </tbody>
          </table>
        </header>

        <Section title="Professional summary">
          <p className="cv-summary">{candidate.summary}</p>
        </Section>

        <table className="cv-columns" role="presentation">
          <tbody>
            <tr>
              <td className="cv-main-column">
                <Section title="Professional experience">
                  <div className="cv-experience-list">
                    {candidate.experiences.map((experience) => (
                      <article className="cv-experience" key={experience.title}>
                        <table className="cv-experience-heading" role="presentation">
                          <tbody>
                            <tr>
                              <td>
                                <h3 className="cv-experience-title">{experience.title}</h3>
                              </td>
                              <td className="cv-experience-period">{experience.dates}</td>
                            </tr>
                          </tbody>
                        </table>
                        <p className="cv-company">
                          {experience.company} · {experience.location}
                        </p>
                        <p className="cv-description">{experience.description}</p>
                      </article>
                    ))}
                  </div>
                </Section>
              </td>
              <td className="cv-side-column">
                <Section title="Career snapshot">
                  <table className="cv-snapshot-table">
                    <tbody>
                      <tr>
                        <td>
                          <span className="cv-data-label">Specialization</span>
                          <span className="cv-data-value">{candidate.specialization}</span>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <span className="cv-data-label">Experience</span>
                          <span className="cv-data-value">{candidate.yearsOfExperience}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Section>

                <Section title="Core skills">
                  <table className="cv-skills-table" role="presentation">
                    <tbody>
                      {skillRows.map((row, rowIndex) => (
                        <tr key={`skills-${rowIndex}`}>
                          {row.map((skill) => (
                            <td key={skill}>{skill}</td>
                          ))}
                          {row.length === 1 && <td aria-hidden="true" />}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>

                <Section title="Education">
                  <p className="cv-education-degree">{candidate.education[0]}</p>
                  <p className="cv-education-details">{candidate.education[1]}</p>
                </Section>

                <Section title="Languages">
                  <table className="cv-language-table">
                    <tbody>
                      {candidate.languages.map((language) => (
                        <tr key={language.name}>
                          <td className="cv-language-name">{language.name}</td>
                          <td className="cv-language-level">{language.level}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Section>
              </td>
            </tr>
          </tbody>
        </table>

        <footer className="cv-footer">Prepared with Iraq Jobs · Candidate profile document</footer>
      </main>
    </div>
  );
}

export default ProfessionalCv;
