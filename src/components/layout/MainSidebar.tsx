import { useMemo } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Search,
  Settings2,
  UserRound,
} from "lucide-react";
import type { View } from "../../app/types";
import type { Profile } from "../../lib/types";
import type { AdminSection } from "../../pages/admin/AdminDashboardPage";
import type { HrSection } from "../../pages/hr/HrDashboardPage";

type MainSidebarProps = {
  profile: Profile;
  view: View;
  adminSection: AdminSection;
  hrSection: HrSection;
  open: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onAdminSection: (section: AdminSection) => void;
  onHrSection: (section: HrSection) => void;
  onLogout: () => void;
};

type MainItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

type MainGroup = {
  label: string;
  items: MainItem[];
};

export function MainSidebar({
  profile,
  view,
  adminSection,
  hrSection,
  open,
  onClose,
  onNavigate,
  onAdminSection,
  onHrSection,
  onLogout,
}: MainSidebarProps) {
  const groups = useMemo<MainGroup[]>(() => {
    const common: MainItem[] = [
      { id: "home", label: "الرئيسية", icon: <Home size={17} /> },
      { id: "jobs", label: "الوظائف", icon: <BriefcaseBusiness size={17} /> },
    ];
    if (profile.role === "candidate") {
      return [
        { label: "استكشاف", items: common },
        { label: "مساحتي", items: [
          { id: "candidate", label: "ملفي المهني", icon: <UserRound size={17} /> },
          { id: "saved", label: "الوظائف المحفوظة", icon: <FileText size={17} /> },
        ] },
      ];
    }
    if (profile.role === "hr") {
      return [
        { label: "استكشاف", items: common },
        { label: "مساحة صاحب العمل", items: [
          { id: "hr-search", label: "البحث عن الكفاءات", icon: <Search size={17} /> },
          { id: "hr-applications", label: "الطلبات الواردة", icon: <FileText size={17} /> },
          { id: "hr-publish", label: "نشر وظيفة", icon: <PlusCircle size={17} /> },
        ] },
      ];
    }
    return [
      { label: "استكشاف", items: common },
      { label: "إدارة المنصة", items: [
        { id: "admin-overview", label: "نظرة عامة", icon: <LayoutDashboard size={17} /> },
        { id: "admin-jobs", label: "إدارة الوظائف", icon: <BriefcaseBusiness size={17} /> },
        { id: "admin-requests", label: "طلبات النشر", icon: <CheckCircle2 size={17} /> },
        { id: "admin-applications", label: "التقديمات", icon: <FileText size={17} /> },
        { id: "admin-access", label: "صلاحيات البحث", icon: <Settings2 size={17} /> },
      ] },
    ];
  }, [profile.role]);

  const active = profile.role === "candidate"
    ? view === "saved" ? "saved" : view === "candidate" ? "candidate" : view
    : profile.role === "hr"
      ? view === "job-request" ? "hr-publish" : view === "hr" ? `hr-${hrSection}` : view
      : view === "admin"
        ? `admin-${adminSection === "job-requests" ? "requests" : adminSection === "employer-access" ? "access" : adminSection}`
        : view;

  const select = (id: string) => {
    onClose();
    if (id === "home" || id === "jobs" || id === "candidate" || id === "saved" || id === "hr-publish") {
      onNavigate(id === "hr-publish" ? "job-request" : id as View);
      return;
    }
    if (id === "hr-search" || id === "hr-applications") {
      onNavigate("hr");
      onHrSection(id === "hr-search" ? "search" : "applications");
      return;
    }
    if (id.startsWith("admin-")) {
      onNavigate("admin");
      const section = id.replace("admin-", "");
      onAdminSection(section === "requests" ? "job-requests" : section === "access" ? "employer-access" : section as AdminSection);
    }
  };

  return (
    <>
      {open && <button type="button" className="main-sidebar-backdrop" onClick={onClose} aria-label="إغلاق القائمة الرئيسية" />}
      <aside className={`main-sidebar ${open ? "open" : ""}`}>
        <div className="main-sidebar-brand">
          <span className="main-sidebar-logo">م</span>
          <div>
            <b>IRAQ JOBS</b>
            <small>{profile.role === "candidate" ? "الباحث عن عمل" : profile.role === "hr" ? "صاحب العمل / HR" : "لوحة المشرف"}</small>
          </div>
        </div>
        <div className="main-sidebar-account">
          <span>{(profile.full_name || "م").slice(0, 1)}</span>
          <div><b>{profile.full_name || "مستخدم"}</b><small>{profile.organization || "حساب IRAQ JOBS"}</small></div>
        </div>
        <nav className="main-sidebar-nav" aria-label="التنقل الرئيسي">
          {groups.map((group) => <div className="main-sidebar-group" key={group.label}>
            <div className="main-sidebar-label">{group.label}</div>
            {group.items.map((item) => (
              <button type="button" key={item.id} className={active === item.id ? "active" : ""} onClick={() => select(item.id)}>
                <span>{item.icon}</span>
                <b>{item.label}</b>
              </button>
            ))}
          </div>)}
        </nav>
        <div className="main-sidebar-heritage" aria-hidden="true">
          <span className="main-sidebar-heritage-sun">✦</span>
          <div className="main-sidebar-heritage-steps"><i /><i /><i /></div>
          <small>من أرض الرافدين</small>
        </div>
        <button type="button" className="main-sidebar-logout" onClick={onLogout}>
          <LogOut size={17} />
          تسجيل الخروج
        </button>
      </aside>
    </>
  );
}