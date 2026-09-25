import { useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, LogIn, ShieldCheck, UserPlus, Users } from "lucide-react";
import type { View } from "../../app/types";
import type { Profile } from "../../lib/types";
import { signIn, signUp } from "../../services/authService";

type AuthPageProps = {
  mode: "sign-in" | "sign-up";
  onNavigate: (view: View) => void;
  onSuccess: (profile: Profile) => void;
};

export function AuthPage({ mode, onNavigate, onSuccess }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"candidate" | "hr">("candidate");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const isSignUp = mode === "sign-up";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = isSignUp
      ? await signUp(email, password, fullName, role)
      : await signIn(email, password);
    setSaving(false);
    if (result.error || !result.profile) {
      setError(result.error?.message || "بيانات الدخول غير صحيحة.");
      return;
    }
    onSuccess(result.profile);
  };

  return <main className="auth-page">
    <div className="container auth-page-grid">
      <section className="auth-story">
        <button className="auth-back-link" onClick={() => onNavigate("home")}><ArrowRight size={16} /> العودة للرئيسية</button>
        <span className="auth-story-mark"><ShieldCheck size={23} /></span>
        <span className="auth-story-eyebrow">IRAQ JOBS · منصة مجانية</span>
        <h1>{isSignUp ? "حسابك المجاني، وخطوتك الجاية." : "أهلاً بعودتك."}</h1>
        <p>{isSignUp ? "أنشئ حسابك كباحث عن عمل أو كجهة توظيف، واستفد من المنصة بدون رسوم." : "سجّل دخولك حتى تتابع فرصك، محفوظاتك، أو إدارة الوظائف المنشورة."}</p>
        <ul className="auth-benefits"><li><CheckCircle2 size={17} /> مجاني للباحث عن عمل والجهة الناشرة</li><li><CheckCircle2 size={17} /> لا توجد عمولات على التوظيف أو التقديم</li><li><CheckCircle2 size={17} /> تواصل مباشر مع الجهة المعلنة</li></ul>
      </section>
      <section className="auth-card">
        <div className="auth-card-heading"><div><span>{isSignUp ? "ابدأ الآن" : "تسجيل الدخول"}</span><h2>{isSignUp ? "أنشئ حسابك" : "ادخل إلى حسابك"}</h2></div><span className="auth-card-icon">{isSignUp ? <UserPlus size={20} /> : <LogIn size={20} />}</span></div>
        <p className="auth-card-intro">{isSignUp ? "اختار نوع الحساب المناسب لك. التسجيل مجاني بالكامل." : "استخدم البريد الإلكتروني وكلمة المرور للدخول."}</p>
        <form className="application-form auth-form" onSubmit={submit}>
          {isSignUp && <><label>الاسم الكامل<input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="مثلاً: أحمد محمد" /></label><fieldset className="auth-role-field"><legend>أنتَ؟</legend><div className="auth-role-options"><button type="button" className={role === "candidate" ? "selected" : ""} onClick={() => setRole("candidate")}><Users size={18} /><span><strong>باحث عن عمل</strong><small>أبحث عن فرصة مناسبة</small></span></button><button type="button" className={role === "hr" ? "selected" : ""} onClick={() => setRole("hr")}><ShieldCheck size={18} /><span><strong>جهة توظيف</strong><small>أريد نشر وظيفة</small></span></button></div></fieldset></>}
          <label>البريد الإلكتروني<input required autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" dir="ltr" /></label>
          <label>كلمة المرور<input required autoComplete={isSignUp ? "new-password" : "current-password"} minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="6 أحرف على الأقل" dir="ltr" /></label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary-btn full auth-submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : isSignUp ? <UserPlus size={17} /> : <LogIn size={17} />}{saving ? "جاري المعالجة..." : isSignUp ? "إنشاء الحساب مجاناً" : "تسجيل الدخول"}</button>
        </form>
        <p className="auth-switch-copy">{isSignUp ? "عندك حساب؟" : "ما عندك حساب؟"} <button onClick={() => onNavigate(isSignUp ? "login" : "signup")}>{isSignUp ? "سجّل دخولك" : "أنشئ حساباً مجاناً"}</button></p>
        <small className="auth-free-note"><ShieldCheck size={14} /> التسجيل مجاني للطرفين ولا توجد رسوم مخفية.</small>
      </section>
    </div>
  </main>;
}