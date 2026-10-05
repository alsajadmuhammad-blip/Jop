import { useMemo } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardCheck,
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
          { id: "applied", label: "الوظائف المتقدّم لها", icon: <ClipboardCheck size={17} /> },
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
        { id: "admin-applications", label: "تقديمات وظائفك", icon: <FileText size={17} /> },
        { id: "admin-candidate-search", label: "البحث عن الباحثين", icon: <Search size={17} /> },
        { id: "admin-access", label: "صلاحيات البحث", icon: <Settings2 size={17} /> },
      ] },
    ];
  }, [profile.role]);

  const active = profile.role === "candidate"
    ? view === "saved" ? "saved" : view === "applied" ? "applied" : view === "candidate" ? "candidate" : view === "job" ? "jobs" : view
    : profile.role === "hr"
      ? view === "job-request" ? "hr-publish" : view === "hr" ? `hr-${hrSection}` : view
      : view === "admin"
        ? `admin-${adminSection === "job-requests" ? "requests" : adminSection === "employer-access" ? "access" : adminSection}`
        : view;

  const candidateMobileItems: MainItem[] = [
    { id: "home", label: "الرئيسية", icon: <Home size={19} /> },
    { id: "jobs", label: "الوظائف", icon: <BriefcaseBusiness size={19} /> },
    { id: "saved", label: "المحفوظة", icon: <FileText size={19} /> },
    { id: "applied", label: "تقديماتي", icon: <ClipboardCheck size={19} /> },
    { id: "candidate", label: "ملفي", icon: <UserRound size={19} /> },
  ];

  const select = (id: string) => {
    onClose();
    if (id === "home" || id === "jobs" || id === "candidate" || id === "saved" || id === "applied" || id === "hr-publish") {
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
         onAdminSection(section === "requests" ? "job-requests" : section === "access" ? "employer-access" : section === "candidate-search" ? "candidate-search" : section as AdminSection);
    }
  };

  return (
    <>
      {open && profile.role !== "candidate" && <button type="button" className="main-sidebar-backdrop" onClick={onClose} aria-label="إغلاق القائمة الرئيسية" />}
      <aside className={`main-sidebar ${profile.role === "candidate" ? "candidate-sidebar" : ""} ${open ? "open" : ""}`}>
        <div className="main-sidebar-brand">
          <span className="main-sidebar-logo">م</span>
          <div>
            <b>IRAQ JOBS</b>
            <small>{profile.role === "candidate" ? "الباحث عن عمل" : profile.role === "hr" ? "صاحب العمل / HR" : "لوحة المشرف"}</small>
          </div>
        </div>
        <nav className="main-sidebar-nav" aria-label="التنقل الرئيسي">
          {groups.map((group) => <div className="main-sidebar-group" key={group.label}>
            <div className="main-sidebar-label">{group.label}</div>
            {group.items.map((item) => (
              <button type="button" key={item.id} className={active === item.id ? "active" : ""} onClick={() => select(item.id)} aria-current={active === item.id ? "page" : undefined}>
                <span>{item.icon}</span>
                <b>{item.label}</b>
              </button>
            ))}
          </div>)}
        </nav>
        <button type="button" className="main-sidebar-logout" onClick={onLogout}>
          <LogOut size={17} />
          تسجيل الخروج
        </button>
      </aside>
      {profile.role === "candidate" && (
        <nav className="candidate-mobile-nav" aria-label="التنقل الرئيسي للباحث عن عمل" dir="rtl">
          {candidateMobileItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => select(item.id)}
              aria-label={item.id === "saved" ? "الوظائف المحفوظة" : item.id === "applied" ? "الوظائف المتقدّم لها" : item.label}
              aria-current={active === item.id ? "page" : undefined}
            >
              <span className="candidate-mobile-nav-icon" aria-hidden="true">{item.icon}</span>
              <span className="candidate-mobile-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}