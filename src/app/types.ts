import type { Application, CVRequest, Job, Profile } from "../lib/types";

export type View = "home" | "jobs" | "requests" | "candidate" | "admin" | "hr";
export type Modal = "job" | "request" | "login" | null;
export type Notify = (message: string) => void;
export type PublicContent = { jobs: Job[]; requests: CVRequest[] };
export type DashboardProps = {
  profile: Profile;
  applications: Application[];
  onRefresh: () => void;
  onNotify: Notify;
};