import "./_group.css";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, FileText, MapPin, Save, Sparkles, UserRound } from "lucide-react";

export function Current() {
  return (
    <main className="candidate-profile-preview" dir="rtl">
      <aside className="candidate-preview-tip">
        <Sparkles size={17} />
        <span><b>نصيحة لتصدير سيرة احترافية</b><small>املأ حقول ملفك المهني باللغة الإنكليزية لتحصل على سيرة واضحة ومرتبة بصيغة ATS.</small></span>
      </aside>

      <section className="candidate-preview-hero">
        <div>
          <span><Sparkles size={14} /> مساحة الباحث عن عمل</span>
          <h1>خلّي ملفك يحكي عنك</h1>
          <p>ملف مهني واضح يسهّل على أصحاب العمل رؤية خبرتك ومهاراتك بسرعة.</p>
          <div className="candidate-preview-meta"><span><UserRound size={14} /> نور حسن</span><span><MapPin size={14} /> بغداد</span></div>
          <div className="candidate-preview-actions"><button><BriefcaseBusiness size={15} /> استكشف الوظائف</button><button><CheckCircle2 size={15} /> تقديماتي</button></div>
        </div>
        <div className="candidate-preview-score"><b>68%</b><span>اكتمال الملف</span></div>
      </section>

      <div className="candidate-preview-grid">
        <form className="candidate-preview-editor">
          <div className="candidate-preview-save"><Save size={15} /> الحفظ التلقائي · تم حفظ التغييرات</div>
          <div className="candidate-preview-import">
            <span><b>ارفع سيرتك الذاتية واستخرج بياناتك بسهولة</b><small>استخرج معلوماتك وخبراتك آليًا أو بالذكاء الاصطناعي، ثم راجعها قبل إضافتها إلى ملفك.</small></span>
            <button type="button">ابدأ رفع السيرة <ArrowRight size={15} /></button>
          </div>
          <details open className="candidate-preview-section">
            <summary><FileText size={18} /> معلوماتك المهنية <span>الاسم والمسمى</span></summary>
            <p>الاسم الكامل · المسمى الوظيفي · التخصص · المحافظة · المدينة · البريد الإلكتروني · رقم الهاتف · نبذة مهنية</p>
          </details>
          <details className="candidate-preview-section">
            <summary><Sparkles size={18} /> المهارات والخبرة <span>5 مهارات</span></summary>
            <p>المهارات التي تظهر في بحث أصحاب العمل، مع سنوات الخبرة وإمكانية العمل عن بُعد.</p>
          </details>
          <details className="candidate-preview-section">
            <summary><BriefcaseBusiness size={18} /> الخبرات العملية <span>3 خبرات</span></summary>
            <p>أضف مسؤولياتك وإنجازاتك لكل دور بترتيب زمني واضح.</p>
          </details>
          <details className="candidate-preview-section">
            <summary><FileText size={18} /> التعليم واللغات <span>مؤهلان · لغتان</span></summary>
            <p>المؤهل والجهة التعليمية واللغات.</p>
          </details>
          <details className="candidate-preview-section">
            <summary><MapPin size={18} /> تفضيلات العمل <span>اختياري</span></summary>
            <p>موعدك ونوع الفرصة المناسبة.</p>
          </details>
        </form>
        <aside className="candidate-preview-aside">
          <section className="candidate-preview-aside-card"><span>English application version</span><h3>ATS Resume</h3><p>نسخة إنكليزية رسمية بخط واضح وترتيب مناسب لأنظمة التوظيف الآلية.</p></section>
          <section className="candidate-preview-aside-card"><span>Designed application version</span><h3>Professional CV</h3><p>نسخة إنكليزية بتصميم احترافي وبطاقات واضحة، منفصلة عن نسخة ATS.</p></section>
        </aside>
      </div>
    </main>
  );
}
