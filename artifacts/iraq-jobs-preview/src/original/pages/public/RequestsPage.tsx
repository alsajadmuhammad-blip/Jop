import { Clock3, Construction } from "lucide-react";

export function RequestsPage() {
  return <section className="container page-section hr-development-page"><div className="development-banner"><span className="development-icon"><Construction size={30} /></span><div><span className="eyebrow">طلبات الـHR</span><h1>هذه الصفحة قيد التطوير</h1><p>نعمل على ترتيب تجربة طلبات الـHR حتى تكون أوضح وأسهل للباحثين عن عمل. ستعود الصفحة قريباً بشكل أفضل.</p><span className="development-status"><Clock3 size={14} /> قيد التطوير</span></div></div><div className="development-note"><b>حالياً</b><span>يمكنك تصفح الوظائف المنشورة والتواصل مع الشركات مباشرة من صفحة كل وظيفة.</span></div></section>;
}