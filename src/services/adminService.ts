import { supabase } from "../lib/supabase";
import type { EmployerAccount, Job, JobRequest, JobRequestStatus, JobType, PostStatus } from "../lib/types";

export type JobPostInput = {
  title: string;
  company_name: string;
  category: string;
  city: string;
  job_type: JobType;
  description: string;
  requirements: string[];
  salary_range: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  internal_applications: boolean;
};

export async function createJob(input: JobPostInput) {
  const { error } = await supabase.from("jobs").insert({ ...input, status: "published" });
  return error;
}

export async function updateJob(id: string, input: JobPostInput) {
  const { error } = await supabase.from("jobs").update(input).eq("id", id);
  return error;
}

export async function deleteJob(id: string) {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  return error;
}

export async function loadAdminPosts() {
  const jobsResult = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
  return {
    jobs: (jobsResult.data as Job[]) || [],
    error: jobsResult.error,
  };
}

export async function loadJobRequests() {
  const { data, error } = await supabase
    .from("job_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return { requests: (data as JobRequest[]) || [], error };
}

export async function submitJobRequest(input: Omit<JobRequest, "id" | "status" | "approved_job_id" | "reviewed_at" | "created_at">) {
  const { data: userResult } = await supabase.auth.getUser();
  const contactEmail = input.contact_email || userResult.user?.email || null;
  if (!contactEmail && !input.contact_whatsapp) return new Error("أضف البريد الإلكتروني أو رقم الواتساب لاستقبال التقديمات.");
  const { error } = await supabase.from("job_requests").insert({
    ...input,
    contact_email: contactEmail,
    created_by: input.created_by || userResult.user?.id || null,
    status: "pending",
  });
  return error;
}

export async function approveJobRequest(id: string) {
  const { error } = await supabase.rpc("approve_job_request", { p_request_id: id });
  return error;
}

export async function updateJobRequestStatus(id: string, status: JobRequestStatus) {
  const { error } = await supabase
    .from("job_requests")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", id);
  return error;
}

export async function updatePostStatus(table: "jobs", id: string, status: PostStatus) {
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  return error;
}

export async function loadEmployerAccounts() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, organization, can_search_candidates")
    .eq("role", "hr")
    .order("created_at", { ascending: false });
  return { accounts: (data as EmployerAccount[]) || [], error };
}

export async function updateCandidateSearchPermission(userId: string, enabled: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ can_search_candidates: enabled })
    .eq("id", userId)
    .eq("role", "hr");
  return error;
}