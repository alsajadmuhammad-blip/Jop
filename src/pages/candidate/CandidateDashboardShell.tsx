import { Bookmark, BriefcaseBusiness, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import type { View } from "../../app/types";
import type { Profile } from "../../lib/types";
import { RoleSidebar } from "../../components/layout/RoleSidebar";

export function CandidateDashboardShell({
  profile,
  active,
  onNavigate,
  onLogout,
  children,
}: {
  profile: Profile;
  active: "profile" | "saved";
  onNavigate: (view: View) => void;
  onLogout: () => void;
  children: ReactNode;
}) {
  return (
    <div className="container page-section role-dashboard-shell candidate-dashboard-shell">
      <RoleSidebar
        eyebrow="مسار"
        title="الباحث عن عمل"
        subtitle={profile.full_name || "ملفي المهني"}
        active={active}
        onSelect={(id) => {
          if (id === "profile") onNavigate("candidate");
          if (id === "saved") onNavigate("saved");
          if (id === "jobs") onNavigate("jobs");
        }}
        onLogout={onLogout}
        items={[
          { id: "profile", label: "ملفي المهني", icon: <UserRound size={17} /> },
          { id: "saved", label: "الوظائف المحفوظة", icon: <Bookmark size={17} /> },
          { id: "jobs", label: "تصفح الوظائف", icon: <BriefcaseBusiness size={17} /> },
        ]}
      />
      <main className="role-dashboard-main">{children}</main>
    </div>
  );
}