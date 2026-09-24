import { LogOut } from "lucide-react";

export type RoleSidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
};

type RoleSidebarProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: RoleSidebarItem[];
  active: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  statusText?: string;
};

export function RoleSidebar({
  eyebrow,
  title,
  subtitle,
  items,
  active,
  onSelect,
  onLogout,
  statusText = "الحساب متصل",
}: RoleSidebarProps) {
  return (
    <>
      <div className="role-mobile-nav">
        <div className="role-mobile-nav-title">
          <span>{eyebrow}</span>
          <b>{title}</b>
        </div>
        <select
          value={active}
          onChange={(event) => onSelect(event.target.value)}
          aria-label={`التنقل داخل ${title}`}
        >
          {items.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}
        </select>
        <button type="button" className="role-mobile-logout" onClick={onLogout} aria-label="تسجيل الخروج">
          <LogOut size={16} />
        </button>
      </div>
      <aside className="role-sidebar">
        <div className="role-sidebar-heading">
          <div className="role-sidebar-mark">م</div>
          <div>
            <span>{eyebrow}</span>
            <b>{title}</b>
            <small>{subtitle}</small>
          </div>
        </div>
        <div className="role-sidebar-label">مساحة العمل</div>
        <nav className="role-sidebar-nav" aria-label={`قائمة ${title}`}>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => onSelect(item.id)}
            >
              <span className="role-sidebar-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge ? <em>{item.badge}</em> : null}
            </button>
          ))}
        </nav>
        <div className="role-sidebar-footer">
          <span className="role-sidebar-status-dot" />
          <span>{statusText}</span>
        </div>
        <button type="button" className="role-sidebar-logout" onClick={onLogout}>
          <LogOut size={17} />
          تسجيل الخروج
        </button>
      </aside>
    </>
  );
}