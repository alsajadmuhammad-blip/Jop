import { BriefcaseBusiness, Bookmark, House, Search, UserRound } from "lucide-react";
import type { View } from "../../app/types";

const items: { label: string; view: View | "account"; Icon: typeof House }[] = [
  { label: "الرئيسية", view: "home", Icon: House },
  { label: "البحث", view: "jobs", Icon: Search },
  { label: "المحفوظات", view: "saved", Icon: Bookmark },
  { label: "الوظائف", view: "jobs", Icon: BriefcaseBusiness },
  { label: "حسابي", view: "account", Icon: UserRound },
];

export function PublicMobileNav({
  activeView,
  onNavigate,
  onLogin,
}: {
  activeView: "home" | "jobs";
  onNavigate: (view: View) => void;
  onLogin: () => void;
}) {
  const activate = (view: View | "account") => {
    if (view === "account") {
      onLogin();
      return;
    }
    if (view === "saved") {
      onLogin();
      return;
    }
    onNavigate(view);
  };

  return (
    <nav className="public-mobile-nav" aria-label="التنقل الرئيسي">
      {items.map(({ label, view, Icon }, index) => {
        const active = view === activeView && (index === 0 || index === 3);
        return (
          <button
            key={`${view}-${label}`}
            className={active ? "active" : ""}
            type="button"
            aria-current={active ? "page" : undefined}
            onClick={() => activate(view)}
          >
            <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
