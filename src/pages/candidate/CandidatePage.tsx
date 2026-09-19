import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, FileText, LogOut, Save, ShieldCheck } from "lucide-react";
import type { View } from "../../app/types";
import type { CandidateProfile, CandidateProfileInput, Profile } from "../../lib/types";
import { hasSupabaseConfig } from "../../lib/supabase";
import { loadCandidateProfile, saveCandidateProfile } from "../../services/candidateService";

type CandidatePageProps = {
  profile: Profile;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  onProfileUpdated?: () => void;
  onNotify?: (message: string) => void;
};

function toInput(profile: CandidateProfile | null, account: Profile): CandidateProfileInput {
  return {
    full_name: profile?.full_name || account.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    headline: profile?.headline || "",
    specialization: profile?.specialization || "",
    city: profile?.city || "",
    experience_years: profile?.experience_years || 0,
    skills: profile?.skills || [],
    experience_details: profile?.experience_details || "",
    education: profile?.education || "",
    languages: profile?.languages || [],
    work_type: profile?.work_type || "",
    remote_available: profile?.remote_available || false,
    expected_salary_min: profile?.expected_salary_min ?? null,
    availability: profile?.availability || "",
    summary: profile?.summary || "",
  };
}

export function CandidatePage({ profile, onNavigate, onLogout, onProfileUpdated, onNotify }: CandidatePageProps) {
  const [form, setForm] = useState<CandidateProfileInput>(() => toInput(null, profile));
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }
    void loadCandidateProfile(profile.id).then((result) => {
      if (result.profile) setForm(toInput(result.profile, profile));
      if (result.error) setError("تعذر تحميل ملفك المهني.");
      setLoading(false);
    });
  }, [profile]);

  const update = <K extends keyof CandidateProfileInput>(key: K, value: CandidateProfileInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateList = (key: "skills" | "languages", value: string) => {
    update(key, value.split(",").map((item) => item.trim()).filter(Boolean));
  };

  const completeness = useMemo(() => {
    const checks = [
      form.full_name,
      form.headline,
      form.specialization,
      form.city,
      form.skills.length,
      form.experience_details,
      form.education,
      form.summary,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.full_name.trim() || !form.headline.trim() || !form.specialization.trim()) {
      setError("أكمل الاسم والمسمى الوظيفي والتخصص أولاً.");
      return;
    }
    setSaving(true);
    setError("");
    if (!hasSupabaseConfig) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      setSaving(false);
      onNotify?.("تم حفظ ملفك في وضع المعاينة.");
      return;
    }
    const result = await saveCandidateProfile(profile.id, form);
    setSaving(false);
    if (result.error) {
      setError(result.error.message || "تعذر حفظ الملف.");
      return;
    }
    onNotify?.("تم حفظ ملفك المهني");
    onProfileUpdated?.();
  };

  if (loading) {
    return <section className="container page-section centered-state"><span className="live-dot" /><p>جاري تحميل ملفك المهني...</p></section>;
  }

  return <section className="container page-section dashboard-page candidate-profile-page">
    <div className="account-hero">
      <div><span className="eyebrow">مساحة الباحث عن عمل</span><h1>السيرة الذاتية الذكية</h1><p>رتّب خبرتك داخل المنصة حتى تكون قابلة للبحث من أصحاب العمل المفعّلين فقط.</p></div>
      <span className="account-avatar">{(form.full_name || "م").slice(0, 1)}</span>
    </div>
    <div className="profile-security-note"><ShieldCheck size={19} /><span><b>ملفك غير عام</b><small>لا يستطيع أي صاحب عمل البحث عنك إلا إذا فعّل المشرف صلاحية البحث لحسابه.</small></span></div>
    <div className="profile-progress"><div><span>اكتمال الملف</span><b>{completeness}%</b></div><span className="profile-progress-track"><i style={{ width: `${completeness}%` }} /></span></div>
    <form className="candidate-profile-form" onSubmit={submit}>
      <div className="profile-form-heading"><div><span className="eyebrow">البيانات الأساسية</span><h2>معلوماتك المهنية</h2></div><FileText size={21} /></div>
      <div className="form-grid"><label>الاسم الكامل<input required value={form.full_name} onChange={(event) => update("full_name", event.target.value)} /></label><label>المسمى الوظيفي<input required value={form.headline} onChange={(event) => update("headline", event.target.value)} placeholder="مثال: مطور واجهات أمامية" /></label></div>
      <div className="form-grid"><label>التخصص<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} placeholder="مثال: برمجيات، محاسبة، تسويق" /></label><label>المدينة<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="بغداد" /></label></div>
      <div className="form-grid"><label>البريد الإلكتروني<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} dir="ltr" /></label><label>رقم الهاتف<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} dir="ltr" /></label></div>
      <label>نبذة مهنية<textarea required rows={4} value={form.summary} onChange={(event) => update("summary", event.target.value)} placeholder="عرّف بخبرتك وما الذي تتميز به..." /></label>
      <div className="profile-form-heading compact"><div><span className="eyebrow">البحث الذكي</span><h2>تفاصيل تساعد على إيجادك</h2></div><CheckCircle2 size={21} /></div>
      <div className="form-grid"><label>المهارات <span className="optional">افصل بينها بفاصلة</span><input required value={form.skills.join(", ")} onChange={(event) => updateList("skills", event.target.value)} placeholder="React, Excel, إدارة مشاريع" /></label><label>سنوات الخبرة<input type="number" min="0" max="60" value={form.experience_years} onChange={(event) => update("experience_years", Number(event.target.value) || 0)} /></label></div>
      <label>تفاصيل الخبرة العملية<textarea required rows={5} value={form.experience_details} onChange={(event) => update("experience_details", event.target.value)} placeholder="المسمى، جهة العمل، المدة، وأبرز الإنجازات..." /></label>
      <div className="form-grid"><label>المؤهل والتعليم<input required value={form.education} onChange={(event) => update("education", event.target.value)} placeholder="بكالوريوس هندسة حاسبات" /></label><label>اللغات <span className="optional">افصل بينها بفاصلة</span><input value={form.languages.join(", ")} onChange={(event) => updateList("languages", event.target.value)} placeholder="العربية، English" /></label></div>
      <div className="form-grid"><label>نوع العمل المطلوب<select value={form.work_type} onChange={(event) => update("work_type", event.target.value)}><option value="">اختر</option><option>دوام كامل</option><option>دوام جزئي</option><option>عن بُعد</option><option>تدريب</option><option>عمل حر</option></select></label><label>التوفر للعمل<select value={form.availability} onChange={(event) => update("availability", event.target.value)}><option value="">اختر</option><option>متاح فورًا</option><option>خلال أسبوعين</option><option>خلال شهر</option><option>غير محدد</option></select></label></div>
      <div className="form-grid"><label>أقل راتب متوقع <span className="optional">اختياري</span><input type="number" min="0" value={form.expected_salary_min ?? ""} onChange={(event) => update("expected_salary_min", event.target.value ? Number(event.target.value) : null)} /></label><label className="checkbox-field"><input type="checkbox" checked={form.remote_available} onChange={(event) => update("remote_available", event.target.checked)} /><span>أقبل العمل عن بُعد</span></label></div>
      {error && <p className="form-error">{error}</p>}
      <div className="profile-form-actions"><button className="primary-btn" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ السيرة الذاتية"} <Save size={17} /></button><button type="button" className="text-btn" onClick={() => onNavigate("jobs")}><ArrowLeft size={16} /> تصفح الوظائف</button></div>
    </form>
    <button className="text-btn account-logout" onClick={onLogout}><LogOut size={17} /> تسجيل الخروج</button>
  </section>;
}