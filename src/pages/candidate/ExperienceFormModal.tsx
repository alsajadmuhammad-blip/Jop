import { useState, type FormEvent } from "react";
import { BriefcaseBusiness, MapPin, Save } from "lucide-react";
import { ModalShell } from "../../components/common/ModalShell";
import type { CandidateExperience } from "../../services/candidateService";

type ExperienceFormModalProps = {
  onClose: () => void;
  onSave: (experience: CandidateExperience) => void;
};

function emptyExperience(): CandidateExperience {
  return {
    id: `experience-${Date.now()}`,
    title: "",
    company: "",
    location: "",
    startMonth: "",
    endMonth: "",
    isCurrent: false,
    legacyPeriod: "",
    description: "",
  };
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function ExperienceFormModal({ onClose, onSave }: ExperienceFormModalProps) {
  const [experience, setExperience] = useState<CandidateExperience>(emptyExperience);
  const currentMonth = currentMonthValue();

  const update = <K extends keyof CandidateExperience>(
    key: K,
    value: CandidateExperience[K],
  ) => {
    setExperience((current) => {
      const next = { ...current, [key]: value } as CandidateExperience;
      if (key === "startMonth" || key === "endMonth") next.legacyPeriod = "";
      if (key === "startMonth" && typeof value === "string" && value && next.endMonth && next.endMonth < value) {
        next.endMonth = value;
      }
      if (key === "endMonth" && value) next.isCurrent = false;
      if (key === "isCurrent" && value) next.endMonth = "";
      return next;
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave({
      ...experience,
      title: experience.title.trim(),
      company: experience.company.trim(),
      location: experience.location.trim(),
      description: experience.description.trim(),
    });
  };

  return (
    <ModalShell onClose={onClose} title="إضافة خبرة مهنية" panelClassName="experience-form-modal-panel">
      <form className="application-form experience-modal-form" onSubmit={submit}>
        <div className="experience-modal-intro">
          <span><BriefcaseBusiness size={18} /></span>
          <p>أدخل معلومات العمل، ثم احفظها لتظهر في ملفك المهني.</p>
        </div>
        <div className="form-grid">
          <label>المسمى الوظيفي<input required autoFocus value={experience.title} onChange={(event) => update("title", event.target.value)} placeholder="مثال: مهندس مدني" /></label>
          <label>جهة العمل <span className="optional">اختياري</span><input value={experience.company} onChange={(event) => update("company", event.target.value)} placeholder="اسم الشركة أو المشروع" /></label>
        </div>
        <div className="form-grid experience-date-grid">
          <label>تاريخ البداية<input className="experience-month-input" type="month" lang="ar-IQ" max={currentMonth} value={experience.startMonth} onChange={(event) => update("startMonth", event.target.value)} aria-label="تاريخ بداية الخبرة" /></label>
          <label>تاريخ النهاية<input className="experience-month-input" type="month" lang="ar-IQ" min={experience.startMonth || undefined} max={currentMonth} disabled={experience.isCurrent} value={experience.endMonth} onChange={(event) => update("endMonth", event.target.value)} aria-label="تاريخ نهاية الخبرة" /></label>
          <label className="checkbox-field experience-current-field"><input type="checkbox" checked={experience.isCurrent} onChange={(event) => update("isCurrent", event.target.checked)} /><span>ما زلت أعمل هنا</span></label>
          <label>الموقع<div className="experience-modal-location"><MapPin size={15} /><input value={experience.location} onChange={(event) => update("location", event.target.value)} placeholder="بغداد / عن بُعد" /></div></label>
        </div>
        <label>أبرز المسؤوليات والإنجازات<textarea rows={4} value={experience.description} onChange={(event) => update("description", event.target.value)} placeholder="اذكر ما أنجزته، وليس فقط ما كانت مهمتك..." /></label>
        <div className="experience-modal-actions">
          <button type="submit" className="primary-btn"><Save size={16} /> حفظ الخبرة</button>
          <button type="button" className="outline-btn" onClick={onClose}>إلغاء</button>
        </div>
      </form>
    </ModalShell>
  );
}
