import type { Application, CVRequest, Job, Profile } from "../lib/types";

export type View = "home" | "jobs" | "login" | "signup" | "candidate" | "saved" | "applied" | "received" | "admin" | "admin-post" | "hr" | "job" | "job-request";
export type Modal = "request" | "login" | null;
export type Notify = (message: string) => void;
export type PublicContent = {
  jobs: Job[];
  requests: CVRequest[];
  hasMoreJobs: boolean;
  hasMoreRequests: boolean;
};
export type DashboardProps = {
  profile: Profile;
  applications: Application[];
  onRefresh: () => void;
  onNotify: Notify;
};