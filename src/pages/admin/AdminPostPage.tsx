import { ArrowRight, BriefcaseBusiness, FilePlus2, ShieldCheck } from "lucide-react";
import { PostForm } from "./AdminDashboardPage";
import type { View } from "../../app/types";
import type { Job } from "../../lib/types";

type AdminPostPageProps = {
  job?: Job | null;
  onNavigate: (view: View) => void;
  onSaved: () => void;
};

export function AdminPostPage({ job, onNavigate, onSaved }: AdminPostPageProps) {
  const editing = Boolean(job);

  return <section className="container page-section admin-post-page">
    <button className="back-link admin-post-back" onClick={() => onNavigate("admin")}><ArrowRight size={16} /> العودة إلى لوحة المشرف</button>
    <div className="admin-post-layout">
      <div className="admin-post-heading">
        <span className="admin-post-icon"><FilePlus2 size={22} /></span>
        <div>
          <span className="eyebrow"><ShieldCheck size={14} /> {editing ? "تعديل منشور" : "مركز النشر"}</span>
          <h1>{editing ? "تعديل بيانات الوظيفة" : "إنشاء وظيفة جديدة"}</h1>
          <p>{editing ? "حدّث بيانات الوظيفة ثم احفظ التغييرات حتى تظهر المعلومات الجديدة للباحثين." : "أدخل تفاصيل الوظيفة وبيانات التواصل ثم انشرها للعامة."}</p>
        </div>
      </div>
       <div className="admin-post-note"><BriefcaseBusiness size={18} /><span><b>{editing ? "مراجعة قبل الحفظ" : "ملاحظة قبل النشر"}</b><small>{editing ? "تأكد من البيانات قبل حفظ التعديلات." : "راجع بيانات التواصل والوصف جيداً؛ المنشور سيظهر للباحثين فور حفظه."}</small></span></div>
      <div className="admin-post-form-card">
          <div className="admin-post-form-header"><div><b>{editing ? "تحديث بيانات الوظيفة" : "بيانات الوظيفة"}</b><span>الحقول المعلّمة مطلوبة</span></div><span className="admin-post-step">01 <small>/ 01</small></span></div>
          <PostForm onSaved={onSaved} initialJob={job} />
      </div>
    </div>
  </section>;
}