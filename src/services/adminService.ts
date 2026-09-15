import { supabase } from "../lib/supabase";
import type { JobRequest, JobRequestStatus, JobType, PostStatus } from "../lib/types";

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
};

export type RequestPostInput = {
  title: string;
  specialization: string;
  organization_name: string;
  details: string;
};

export async function createJob(input: JobPostInput) {
  const { error } = await supabase.from("jobs").insert({ ...input, status: "published" });
  return error;
}

export async function loadJobRequests() {
  const { data, error } = await supabase
    .from("job_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return { requests: (data as JobRequest[]) || [], error };
}

export async function submitJobRequest(input: Omit<JobRequest, "id" | "status" | "approved_job_id" | "reviewed_at" | "created_at">) {
  const { error } = await supabase.from("job_requests").insert({ ...input, status: "pending" });
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

export async function createCvRequest(input: RequestPostInput) {
  const { error } = await supabase.from("cv_requests").insert({ ...input, status: "published" });
  return error;
}

export async function updatePostStatus(table: "jobs" | "cv_requests", id: string, status: PostStatus) {
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  return error;
}