import "./_group.css";
import { demoJobs } from "@/original/lib/constants";
import { HomePage } from "@/original/pages/public/HomePage";
import { PreviewShell } from "./_shared/PreviewShell";

const noop = () => {};

export function CurrentHome() {
  return (
    <PreviewShell view="home">
      <HomePage
        jobs={demoJobs}
        hasMoreJobs={false}
        loading={false}
        profile={null}
        onNavigate={noop}
        onOpenJob={noop}
        onLogin={noop}
        onNotify={noop}
      />
    </PreviewShell>
  );
}
