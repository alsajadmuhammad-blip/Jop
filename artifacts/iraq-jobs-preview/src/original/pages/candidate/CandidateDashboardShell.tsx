import type { ReactNode } from "react";

export function CandidateDashboardShell({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="candidate-dashboard-shell">{children}</div>;
}