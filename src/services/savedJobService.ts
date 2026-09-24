import { supabase } from "../lib/supabase";
import type { SavedJob } from "../lib/types";

export async function loadSavedJobs() {
  const { data, error } = await supabase
    .from("saved_jobs")
    .select("saved_at, jobs(*)")
    .order("saved_at", { ascending: false });
  const jobs = ((data || []) as unknown as Array<{ saved_at: string; jobs: SavedJob | SavedJob[] | null }>)
    .map((row) => {
      const job = Array.isArray(row.jobs) ? row.jobs[0] : row.jobs;
      return job ? { ...job, saved_at: row.saved_at } : null;
    })
    .filter(Boolean) as SavedJob[];
  return { jobs, error };
}

export async function loadSavedJobIds() {
  const { data, error } = await supabase.from("saved_jobs").select("job_id");
  return { ids: (data || []).map((row) => row.job_id as string), error };
}

export async function toggleSavedJob(jobId: string, saved: boolean) {
  if (saved) {
    const { error } = await supabase.from("saved_jobs").delete().eq("job_id", jobId);
    return error;
  }
  const { error } = await supabase.from("saved_jobs").insert({ job_id: jobId });
  return error;
}