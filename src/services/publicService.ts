import { supabase } from "../lib/supabase";
import type { CVRequest, Job } from "../lib/types";
import type { PublicContent } from "../app/types";

export async function getPublicContent(): Promise<{ content: PublicContent; error: Error | null }> {
  const [jobsResult, requestsResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("status", "published").order("created_at", { ascending: false }),
    supabase.from("cv_requests").select("*").eq("status", "published").order("created_at", { ascending: false }),
  ]);

  const error = jobsResult.error || requestsResult.error;
  return {
    content: {
      jobs: (jobsResult.data as Job[]) || [],
      requests: (requestsResult.data as CVRequest[]) || [],
    },
    error: error ? new Error(error.message) : null,
  };
}