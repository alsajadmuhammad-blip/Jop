import { supabase } from "../lib/supabase";
import type { JobType, PostStatus } from "../lib/types";

export type JobPostInput = {
  title: string;
  company_name: string;
  category: string;
  city: string;
  job_type: JobType;
  description: string;
  requirements: string[];
  salary_range: string | null;
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

export async function createCvRequest(input: RequestPostInput) {
  const { error } = await supabase.from("cv_requests").insert({ ...input, status: "published" });
  return error;
}

export async function updatePostStatus(table: "jobs" | "cv_requests", id: string, status: PostStatus) {
  const { error } = await supabase.from(table).update({ status }).eq("id", id);
  return error;
}