import { LogIn, Menu, UserPlus } from "lucide-react";
import type { View } from "../../app/types";
import type { Profile } from "../../lib/types";
import { NotificationBell, type AppNotification, type NotificationDestination } from "./NotificationBell";

type HeaderProps = {
  view: View;
  profile: Profile | null;
  onNavigate: (view: View) => void;
  onLogin: () => void;
  onRegister: () => void;
  mobileMenu: boolean;
  setMobileMenu: (value: boolean) => void;
  notifications: AppNotification[];
  onOpenNotification: (destination: NotificationDestination) => void;
};

function roleLabel(profile: Profile) {
  return profile.role === "candidate" ? "باحث عن عمل" : profile.role === "hr" ? "حساب HR" : "مدير المنصة";
}

export function Header({ view, profile, onNavigate, onLogin, onRegister, mobileMenu, setMobileMenu, notifications, onOpenNotification }: HeaderProps) {
  const links: { label: string; view: View }[] = [
    { label: "الرئيسية", view: "home" },
    { label: "الوظائف", view: "jobs" },
  ];
  return <header className={`site-header${profile ? " role-site-header" : ""}${profile?.role === "candidate" ? " candidate-site-header" : ""}`}><div className="nav-wrap">
    <button className="brand" onClick={() => onNavigate("home")} aria-label="IRAQ JOBS - الصفحة الرئيسية"><img className="brand-logo" src="/iraq-jobs-logo.jpg" alt="IRAQ JOBS" /><span><b>IRAQ JOBS</b><small>FOR JOB SEEKERS</small></span></button>
    <nav className={mobileMenu ? "main-nav open" : "main-nav"}>
      {links.map((link) => <button key={link.view} className={view === link.view ? "nav-link active" : "nav-link"} onClick={() => onNavigate(link.view)}>{link.label}</button>)}
    </nav>
    <div className="header-actions">
       {profile ? <><NotificationBell profile={profile} notifications={notifications} onNavigate={onOpenNotification} /><button className="profile-chip" onClick={() => profile.role === "candidate" ? onNavigate("candidate") : onNavigate(profile.role === "admin" ? "admin" : "hr")} aria-label={`فتح ${roleLabel(profile)}`}>
         <span className="profile-copy"><b>{profile.full_name || "حسابي"}</b><small>{roleLabel(profile)}</small></span>
        </button><button className={`menu-btn ${profile.role === "candidate" ? "candidate-menu-btn" : ""}`} onClick={() => setMobileMenu(!mobileMenu)} aria-label="فتح القائمة الرئيسية" aria-expanded={mobileMenu}><Menu size={21} /></button></> : <div className="auth-header-actions"><button className="login-btn" onClick={onLogin}><LogIn size={16} /> دخول</button><button className="register-btn" onClick={onRegister}><UserPlus size={16} /> حساب مجاني</button></div>}
    </div>
  </div></header>;
}