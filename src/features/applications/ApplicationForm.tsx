import { useState } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { hasSupabaseConfig } from "../../lib/supabase";
import { submitApplication, type ApplicationFormData } from "../../services/applicationService";

type ApplicationFormProps = {
  requestId?: string;
  onSubmitted: () => void;
};

export function ApplicationForm({ requestId, onSubmitted }: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationFormData>({ note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const update = (key: keyof ApplicationFormData, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    if (!hasSupabaseConfig || !requestId) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaving(false);
      onSubmitted();
      return;
    }

    const submitError = await submitApplication({ requestId }, form);
    setSaving(false);
    if (submitError) return setError(submitError.message || "تعذر إرسال الطلب.");
    onSubmitted();
  };

  return <form className="application-form" onSubmit={submit}>
    <div className="profile-submit-note"><b>التقديم يتم من ملفك المهني</b><span>لا نحتاج رفع CV خارجي. تأكد من إكمال بياناتك داخل حساب الباحث عن عمل قبل الإرسال.</span></div>
    <label>رسالة قصيرة <span className="optional">اختياري</span><textarea value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="اكتب أي معلومة تحب توصلها للجهة..." rows={3} /></label>
    {error && <p className="form-error">{error}</p>}
    <button className="primary-btn full" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <Send size={17} />}{saving ? "جاري الإرسال..." : "إرسال الطلب"}</button>
  </form>;
}