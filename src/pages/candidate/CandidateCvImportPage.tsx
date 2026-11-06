import { AlertTriangle, ArrowRight, FileText } from "lucide-react";
import type { CandidateCvImport } from "../../features/candidate/cvImport";
import { CvImportPanel } from "../../features/candidate/CvImportPanel";
import "./candidate-cv-import-page.css";

type CandidateCvImportPageProps = {
  onBack: () => void;
  onImport: (result: CandidateCvImport, replaceExisting: boolean) => void;
};

export function CandidateCvImportPage({ onBack, onImport }: CandidateCvImportPageProps) {
  return (
    <section className="container page-section dashboard-page candidate-profile-page candidate-cv-import-page">
      <button type="button" className="candidate-cv-import-back" onClick={onBack}>
        <ArrowRight size={17} /> العودة إلى ملفي
      </button>

      <header className="candidate-cv-import-title">
        <span className="candidate-cv-import-title-icon"><FileText size={21} /></span>
        <div>
          <span className="eyebrow">مراجعة قبل الاعتماد</span>
          <h1>استيراد بيانات سيرتك الذاتية</h1>
          <p>ارفع سيرتك ليقرأها النظام محليًا، ثم صحّح البيانات وأكّدها قبل إضافتها إلى ملفك.</p>
        </div>
      </header>

      <aside className="candidate-cv-import-alert" role="alert">
        <AlertTriangle size={19} />
        <div>
          <b>تنبيه مهم: الاستخراج آلي وليس مضمونًا بالكامل.</b>
          <p>قد يخطئ في اللغات، سنوات الخبرة، أسماء الشركات أو التواريخ. راجع كل معلومة بنفسك، وعدّل أو احذف أي نتيجة غير صحيحة قبل الاعتماد.</p>
        </div>
      </aside>

      <CvImportPanel onImport={onImport} />
    </section>
  );
}
