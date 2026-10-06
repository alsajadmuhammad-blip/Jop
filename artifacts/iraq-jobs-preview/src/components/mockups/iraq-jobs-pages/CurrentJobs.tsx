import "./_group.css";
import { demoJobs } from "@/original/lib/constants";
import { JobsPage } from "@/original/pages/public/JobsPage";
import { PreviewShell } from "./_shared/PreviewShell";

const noop = () => {};

export function CurrentJobs() {
  return (
    <PreviewShell view="jobs">
      <JobsPage
        jobs={demoJobs}
        loading={false}
        initialHasMoreJobs={false}
        onOpenJob={noop}
        profile={null}
        onLogin={noop}
        onNotify={noop}
      />
    </PreviewShell>
  );
}
