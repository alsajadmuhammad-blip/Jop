import type { ReactNode } from "react";
import type { View } from "@/original/app/types";
import { Header } from "@/original/components/layout/Header";

const noop = () => {};

export function PreviewShell({
  view,
  children,
}: {
  view: View;
  children: ReactNode;
}) {
  return (
    <div className="app-shell" dir="rtl" lang="ar">
      <Header
        view={view}
        profile={null}
        onLogout={noop}
        onNavigate={noop}
        onLogin={noop}
        onRegister={noop}
        mobileMenu={false}
        setMobileMenu={noop}
        notifications={[]}
        onOpenNotification={noop}
      />
      {children}
    </div>
  );
}
