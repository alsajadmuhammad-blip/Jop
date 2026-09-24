import { LogIn, Menu } from "lucide-react";
import type { View } from "../../app/types";
import type { Profile } from "../../lib/types";

type HeaderProps = {
  view: View;
  profile: Profile | null;
  onNavigate: (view: View) => void;
  onLogin: () => void;
  mobileMenu: boolean;
  setMobileMenu: (value: boolean) => void;
};

export function Header({ view, profile, onNavigate, onLogin, mobileMenu, setMobileMenu }: HeaderProps) {
  const links: { label: string; view: View }[] = [
    { label: "الوظائف", view: "jobs" },
  ];
  return <header className="site-header"><div className="nav-wrap">
    <button className="brand" onClick={() => onNavigate("home")} aria-label="iraq jobs - الصفحة الرئيسية"><img className="brand-logo" src="/iraq-jobs-logo.jpg" alt="iraq jobs" /><span><b>iraq jobs</b><small>for job seekers</small></span></button>
    <nav className={mobileMenu ? "main-nav open" : "main-nav"}>
      {links.map((link) => <button key={link.view} className={view === link.view ? "nav-link active" : "nav-link"} onClick={() => onNavigate(link.view)}>{link.label}</button>)}
    </nav>
    <div className="header-actions">
       {profile ? <><button className="profile-chip" onClick={() => profile.role === "candidate" ? onNavigate("candidate") : onNavigate(profile.role === "admin" ? "admin" : "hr")}><span>{(profile.full_name || "مستخدم").slice(0, 1)}</span>{profile.full_name || "حسابي"}</button><button className="menu-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="فتح القائمة الرئيسية" aria-expanded={mobileMenu}><Menu size={21} /></button></> : <button className="login-btn" onClick={onLogin}><LogIn size={16} /> دخول</button>}
    </div>
  </div></header>;
}