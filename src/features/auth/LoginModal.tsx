import { useState } from "react";
import { LoaderCircle, LogIn, ShieldCheck } from "lucide-react";
import { ModalShell } from "../../components/common/ModalShell";
import type { Profile } from "../../lib/types";
import { signIn } from "../../services/authService";

export function LoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (profile: Profile) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    const result = await signIn(email, password);
    setSaving(false);
    if (result.error || !result.profile) return setError(result.error?.message || "بيانات الدخول غير صحيحة.");
    onSuccess(result.profile);
  };

  return <ModalShell onClose={onClose} title="دخول الفريق"><div className="login-intro"><span className="brand-mark"><ShieldCheck size={19} /></span><p>دخول خاص بالإدارة وفرق HR لمتابعة الوظائف والسير الذاتية.</p></div><form className="application-form" onSubmit={submit}><label>البريد الإلكتروني<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} dir="ltr" /></label><label>كلمة المرور<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} dir="ltr" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-btn full" disabled={saving}>{saving ? <LoaderCircle className="spin" size={18} /> : <LogIn size={17} />}{saving ? "جاري الدخول..." : "دخول"}</button></form></ModalShell>;
}