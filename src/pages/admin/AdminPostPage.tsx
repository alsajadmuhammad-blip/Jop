import { ArrowRight, BriefcaseBusiness, FilePlus2, ShieldCheck } from "lucide-react";
import { PostForm, type PostType } from "./AdminDashboardPage";
import type { View } from "../../app/types";
import type { Job } from "../../lib/types";
import { useState } from "react";

type AdminPostPageProps = {
  job?: Job | null;
  onNavigate: (view: View) => void;
  onSaved: () => void;
};

export function AdminPostPage({ job, onNavigate, onSaved }: AdminPostPageProps) {
  const [type, setType] = useState<PostType>("job");

  return <section className="container page-section admin-post-page">
    <button className="back-link admin-post-back" onClick={() => onNavigate("admin")}><ArrowRight size={16} /> العودة إلى لوحة المشرف</button>
    <div className="admin-post-layout">
      <div className="admin-post-heading">
        <span className="admin-post-icon"><FilePlus2 size={22} /></span>
        <div>
          <span className="eyebrow"><ShieldCheck size={14} /> {job ? "تعديل منشور" : "مركز النشر"}</span>
          <h1>{job ? "تعديل بيانات الوظيفة" : "إنشاء منشور جديد"}</h1>
          <p>{job ? "حدّث معلومات الوظيفة ثم احفظ التغييرات حتى تظهر البيانات الجديدة للباحثين." : "أدخل تفاصيل الوظيفة أو طلب السيرة الذاتية في نموذج مستقل، ثم انشره مباشرة للعامة."}</p>
        </div>
      </div>
      <div className="admin-post-note"><BriefcaseBusiness size={18} /><span><b>{job ? "مراجعة قبل الحفظ" : "ملاحظة قبل النشر"}</b><small>{job ? "تأكد من بيانات التواصل والوصف قبل حفظ التعديلات." : "راجع بيانات التواصل والوصف جيداً؛ المنشور سيظهر للباحثين فور حفظه."}</small></span></div>
      <div className="admin-post-form-card">
        <div className="admin-post-form-header"><div><b>{job ? "تحديث بيانات الوظيفة" : "بيانات المنشور"}</b><span>الحقول المعلّمة مطلوبة</span></div><span className="admin-post-step">01 <small>/ 01</small></span></div>
        <PostForm type={type} onTypeChange={setType} onSaved={onSaved} initialJob={job} />
      </div>
    </div>
  </section>;
}