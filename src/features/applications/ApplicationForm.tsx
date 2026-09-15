import { useState } from "react";
import { FileText, LoaderCircle, Send } from "lucide-react";
import { hasSupabaseConfig } from "../../lib/supabase";
import { submitApplication, type ApplicationFormData } from "../../services/applicationService";

type ApplicationFormProps = {
  jobId?: string | null;
  requestId?: string;
  onSubmitted: () => void;
};

export function ApplicationForm({ jobId, requestId, onSubmitted }: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationFormData>({ full_name: "", email: "", phone: "", note: "" });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof ApplicationFormData, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return setError("أرفق ملف الـCV بصيغة PDF.");
    if (file.type !== "application/pdf") return setError("نقبل ملفات PDF فقط.");
    if (file.size > 5 * 1024 * 1024) return setError("حجم الملف يجب أن يكون أقل من 5MB.");

    setSaving(true);
    setError("");
    if (!hasSupabaseConfig || (!jobId && !requestId)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaving(false);
      onSubmitted();
      return;
    }

    const submitError = await submitApplication({ jobId, requestId }, form, file);
    setSaving(false);
    if (submitError) return setError(submitError.message || "تعذر إرسال الطلب.");
    onSubmitted();
  };

  return <form className="application-form" onSubmit={submit}>
    <div className="form-grid"><label>الاسم الكامل<input required value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="اكتب اسمك الثلاثي" /></label><label>رقم الهاتف<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} placeholder="07xxxxxxxxx" dir="ltr" /></label></div>
    <label>البريد الإلكتروني<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} placeholder="name@email.com" dir="ltr" /></label>
    <label>رسالة قصيرة <span className="optional">اختياري</span><textarea value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="اكتب أي معلومة تحب توصلها للجهة..." rows={3} /></label>
    <label className="file-drop"><input required type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><FileText size={21} /><span>{file ? file.name : "اضغط لرفع CV بصيغة PDF"}</span><small>الحد الأقصى 5MB</small></label>
    {error && <p className="form-error">{error}</p>}
    <button className="primary-btn full" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Send size={17} />}{saving ? "جاري الإرسال..." : "إرسال الطلب"}</button>
  </form>;
}