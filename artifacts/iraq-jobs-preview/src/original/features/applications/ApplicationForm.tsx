import { useEffect, useState } from "react";
import { Check, LoaderCircle, Send } from "lucide-react";
import { hasSupabaseConfig } from "../../lib/supabase";
import { hasCandidateAppliedToJob, submitApplication, type ApplicationFormData } from "../../services/applicationService";

type ApplicationFormProps = {
  requestId?: string;
  jobId?: string;
  onSubmitted: () => void;
};

export function ApplicationForm({ requestId, jobId, onSubmitted }: ApplicationFormProps) {
  const [form, setForm] = useState<ApplicationFormData>({ note: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(Boolean(jobId && hasSupabaseConfig));

  useEffect(() => {
    setAlreadyApplied(false);
    setError("");
    setCheckingExisting(Boolean(jobId && hasSupabaseConfig));

    if (!jobId || !hasSupabaseConfig) {
      setCheckingExisting(false);
      return;
    }

    let active = true;
    void hasCandidateAppliedToJob(jobId).then((result) => {
      if (!active) return;
      if (result.error) {
        setError("تعذر التحقق من حالة التقديم. حاول تحديث الصفحة.");
      } else {
        setAlreadyApplied(result.applied);
      }
      setCheckingExisting(false);
    });

    return () => {
      active = false;
    };
  }, [jobId]);

  const update = (key: keyof ApplicationFormData, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (alreadyApplied || checkingExisting) return;
    setSaving(true);
    setError("");
    if (!hasSupabaseConfig || (!requestId && !jobId)) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaving(false);
      onSubmitted();
      return;
    }

    const submitError = await submitApplication({ requestId, jobId }, form);
    setSaving(false);
    if (submitError) {
      if (submitError.message.includes("مسبقًا")) {
        setAlreadyApplied(true);
        setError("");
      } else {
        setError(submitError.message || "تعذر إرسال الطلب.");
      }
      return;
    }
    onSubmitted();
  };

  return <form className="application-form" onSubmit={submit}>
    <div className="profile-submit-note"><b>التقديم يتم من ملفك المهني</b><span>لا نحتاج رفع CV خارجي. تأكد من إكمال بياناتك داخل حساب الباحث عن عمل قبل الإرسال.</span></div>
    {alreadyApplied && <div className="application-already-applied"><Check size={18} /><span><b>تم التقديم مسبقًا</b><small>لقد أرسلت طلبك على هذه الوظيفة، ولا يمكنك إرسال طلب آخر لنفس الوظيفة.</small></span></div>}
    <label>رسالة قصيرة <span className="optional">اختياري</span><textarea value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="اكتب أي معلومة تحب توصلها للجهة..." rows={3} /></label>
    {error && <p className="form-error">{error}</p>}
    <button className="primary-btn full" disabled={saving || checkingExisting || alreadyApplied || Boolean(error && jobId)}>{checkingExisting ? <LoaderCircle className="spin" size={18} /> : alreadyApplied ? <Check size={17} /> : <Send size={17} />}{checkingExisting ? "جاري التحقق..." : alreadyApplied ? "تم التقديم مسبقًا" : saving ? "جاري الإرسال..." : "إرسال الطلب"}</button>
  </form>;
}