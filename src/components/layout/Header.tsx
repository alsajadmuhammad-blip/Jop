import { BriefcaseBusiness, LayoutDashboard, LogIn, LogOut, Menu, Users } from "lucide-react";
import type { View } from "../../app/types";
import type { Profile } from "../../lib/types";

type HeaderProps = {
  view: View;
  profile: Profile | null;
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onLogout: () => void;
  mobileMenu: boolean;
  setMobileMenu: (value: boolean) => void;
};

export function Header({ view, profile, onNavigate, onLogin, onLogout, mobileMenu, setMobileMenu }: HeaderProps) {
  const links: { label: string; view: View }[] = [
    { label: "الوظائف", view: "jobs" },
    { label: "طلبات HR", view: "requests" },
  ];
  return <header className="site-header"><div className="nav-wrap">
    <button className="brand" onClick={() => onNavigate("home")} aria-label="الصفحة الرئيسية"><span className="brand-mark"><BriefcaseBusiness size={19} /></span><span><b>مسار</b><small>وظائف العراق</small></span></button>
    <nav className={mobileMenu ? "main-nav open" : "main-nav"}>
      {links.map((link) => <button key={link.view} className={view === link.view ? "nav-link active" : "nav-link"} onClick={() => onNavigate(link.view)}>{link.label}</button>)}
      {profile?.role === "candidate" && <button className={view === "candidate" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("candidate")}>حسابي</button>}
      {profile?.role === "admin" && <button className={view === "admin" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("admin")}><LayoutDashboard size={16} /> الإدارة</button>}
      {profile?.role === "hr" && <button className={view === "hr" ? "nav-link active" : "nav-link"} onClick={() => onNavigate("hr")}><Users size={16} /> مساحة HR</button>}
    </nav>
    <div className="header-actions">
      {profile ? <button className="profile-chip" onClick={() => profile.role === "candidate" ? onNavigate("candidate") : onLogout}><span>{(profile.full_name || "مستخدم").slice(0, 1)}</span>{profile.full_name || "حسابي"}{profile.role !== "candidate" && <LogOut size={15} />}</button> : <button className="login-btn" onClick={onLogin}><LogIn size={16} /> دخول</button>}
      <button className="menu-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="القائمة"><Menu size={21} /></button>
    </div>
  </div></header>;
}