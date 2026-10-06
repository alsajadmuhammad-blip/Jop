import type { ReactNode } from "react";
import {
  Bell,
  Bookmark,
  BriefcaseBusiness,
  House,
  Search,
  Signal,
  UserRound,
  Wifi,
  BatteryFull,
} from "lucide-react";

const tabs = [
  { id: "home", label: "الرئيسية", Icon: House },
  { id: "search", label: "البحث", Icon: Search },
  { id: "saved", label: "المحفوظات", Icon: Bookmark },
  { id: "jobs", label: "الوظائف", Icon: BriefcaseBusiness },
  { id: "account", label: "حسابي", Icon: UserRound },
] as const;

export function BrandShell({
  activeTab,
  children,
}: {
  activeTab: "home" | "jobs";
  children: ReactNode;
}) {
  return (
    <div className="iraq-jobs-mobile">
      <div className="iraq-status-bar" aria-hidden="true">
        <strong>9:41</strong>
        <span className="iraq-status-icons">
          <Signal size={15} />
          <Wifi size={15} />
          <BatteryFull size={17} />
        </span>
      </div>

      <header className="iraq-brand-bar">
        <div className="iraq-brand-actions">
          <button type="button" aria-label="التنبيهات">
            <Bell size={18} />
            <i />
          </button>
          <button type="button" aria-label="الحساب">
            <UserRound size={18} />
          </button>
        </div>
        <div className="iraq-brand-lockup">
          <span className="iraq-brand-copy">
            <b>IRAQ JOBS</b>
            <small>FOR JOB SEEKERS</small>
          </span>
          <img
            src="/__mockup-iraq-jobs/iraq-jobs-logo.jpg"
            alt="IRAQ JOBS"
          />
        </div>
      </header>

      <main className="iraq-page-content">{children}</main>

      <nav className="iraq-bottom-nav" aria-label="التنقل الرئيسي">
        {tabs.map(({ id, label, Icon }) => {
          const active = id === activeTab;
          return (
            <button
              key={id}
              type="button"
              className={active ? "active" : ""}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
