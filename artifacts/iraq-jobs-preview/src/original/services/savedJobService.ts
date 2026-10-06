import { supabase } from "../lib/supabase";
import type { SavedJob } from "../lib/types";

const savedJobsCache = new Map<string, SavedJob[]>();
const savedJobsRequests = new Map<string, Promise<{ jobs: SavedJob[]; error: unknown | null }>>();
let savedJobsCacheVersion = 0;

export function getCachedSavedJobs(userId: string) {
  return savedJobsCache.get(userId);
}

export function clearSavedJobsCache(userId?: string) {
  savedJobsCacheVersion += 1;
  if (userId) {
    savedJobsCache.delete(userId);
    savedJobsRequests.delete(userId);
    return;
  }
  savedJobsCache.clear();
  savedJobsRequests.clear();
}

export async function loadSavedJobs(userId: string) {
  const cachedJobs = savedJobsCache.get(userId);
  if (cachedJobs) return { jobs: cachedJobs, error: null };

  const pending = savedJobsRequests.get(userId);
  if (pending) return pending;

  const requestVersion = savedJobsCacheVersion;
  const request = (async () => {
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
    if (!error && requestVersion === savedJobsCacheVersion) savedJobsCache.set(userId, jobs);
    return { jobs, error };
  })();

  savedJobsRequests.set(userId, request);
  try {
    return await request;
  } finally {
    if (savedJobsRequests.get(userId) === request) savedJobsRequests.delete(userId);
  }
}

export async function loadSavedJobIds() {
  const { data, error } = await supabase.from("saved_jobs").select("job_id");
  return { ids: (data || []).map((row) => row.job_id as string), error };
}

export async function toggleSavedJob(jobId: string, saved: boolean) {
  const result = saved
    ? await supabase.from("saved_jobs").delete().eq("job_id", jobId)
    : await supabase.from("saved_jobs").insert({ job_id: jobId });
  if (!result.error) clearSavedJobsCache();
  const { error } = result;
  return error;
}