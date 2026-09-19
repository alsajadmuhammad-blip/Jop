import { useState } from "react";
import { LoaderCircle, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import { ModalShell } from "../../components/common/ModalShell";
import type { Profile } from "../../lib/types";
import { signIn, signUp } from "../../services/authService";

export function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (profile: Profile) => void }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"candidate" | "hr">("candidate");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = mode === "sign-in"
      ? await signIn(email, password)
      : await signUp(email, password, fullName, role);
    setSaving(false);
    if (result.error || !result.profile) return setError(result.error?.message || "بيانات الدخول غير صحيحة.");
    onSuccess(result.profile);
  };

  return <ModalShell onClose={onClose} title={mode === "sign-in" ? "تسجيل الدخول" : "إنشاء حساب"}>
    <div className="auth-switcher" role="tablist">
      <button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => { setMode("sign-in"); setError(""); }}>دخول</button>
      <button type="button" className={mode === "sign-up" ? "active" : ""} onClick={() => { setMode("sign-up"); setError(""); }}>حساب جديد</button>
    </div>
    <div className="login-intro"><span className="brand-mark"><ShieldCheck size={19} /></span><p>{mode === "sign-in" ? "ادخل إلى حسابك لمتابعة ملفك وفرصك." : "أنشئ حسابًا كباحث عن عمل أو كصاحب عمل/HR."}</p></div>
    <form className="application-form" onSubmit={submit}>
      {mode === "sign-up" && <><label>الاسم الكامل<input required value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><label>نوع الحساب<select value={role} onChange={(event) => setRole(event.target.value as "candidate" | "hr")}><option value="candidate">باحث عن عمل</option><option value="hr">صاحب عمل / HR</option></select></label></>}
      <label>البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" /></label>
      <label>كلمة المرور<input required minLength={6} type="password" value={password} onChange={(event) => setPassword(event.target.value)} dir="ltr" /></label>
      {error && <p className="form-error">{error}</p>}
      <button className="primary-btn full" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : mode === "sign-in" ? <LogIn size={17} /> : <UserPlus size={17} />}{saving ? "جاري المعالجة..." : mode === "sign-in" ? "دخول" : "إنشاء الحساب"}</button>
    </form>
  </ModalShell>;
}