import { useState } from "react";
import { LogOut, Menu, X } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const select = (id: string) => {
    setOpen(false);
    onSelect(id);
  };

  return (
    <>
      <button
        type="button"
        className="role-sidebar-mobile-trigger"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="فتح قائمة مساحة العمل"
      >
        <Menu size={18} />
        <span>قائمة مساحة العمل</span>
      </button>
      {open && <button type="button" className="role-sidebar-backdrop" onClick={() => setOpen(false)} aria-label="إغلاق القائمة" />}
      <aside className={`role-sidebar ${open ? "open" : ""}`}>
        <div className="role-sidebar-heading">
          <div className="role-sidebar-mark">م</div>
          <div>
            <span>{eyebrow}</span>
            <b>{title}</b>
            <small>{subtitle}</small>
          </div>
          <button type="button" className="role-sidebar-close" onClick={() => setOpen(false)} aria-label="إغلاق القائمة">
            <X size={17} />
          </button>
        </div>
        <div className="role-sidebar-label">مساحة العمل</div>
        <nav className="role-sidebar-nav" aria-label={`قائمة ${title}`}>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={active === item.id ? "active" : ""}
              onClick={() => select(item.id)}
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