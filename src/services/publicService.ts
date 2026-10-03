import { supabase } from "../lib/supabase";
import type { CVRequest, Job } from "../lib/types";
import type { PublicContent } from "../app/types";

export const PUBLIC_PAGE_SIZE = 10;
const publicJobColumns = "id,title,company_name,ad_type,category,province,city,job_type,description,requirements,salary_range,contact_email,contact_whatsapp,internal_applications,status,created_at,deadline,created_by";

export type PublicJobFilters = {
  keyword: string;
  category: string;
  jobType: string;
  province: string;
};

export type PublicJobCursor = {
  id: string;
  created_at: string;
};

export type PublicJobPage = {
  jobs: Job[];
  hasMore: boolean;
  nextCursor: PublicJobCursor | null;
  error: Error | null;
};

export type PublicJobFilterOptions = {
  provinces: string[];
};

let publicJobFilterOptionsCache: PublicJobFilterOptions | null = null;
let publicJobFilterOptionsRequest: Promise<{ options: PublicJobFilterOptions | null; error: unknown | null }> | null = null;

export async function getPublicContent(): Promise<{ content: PublicContent; error: Error | null }> {
  const [jobsResult, requestsResult] = await Promise.all([
    supabase.from("jobs").select(publicJobColumns).eq("status", "published").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(PUBLIC_PAGE_SIZE + 1),
    supabase.from("cv_requests").select("*").eq("status", "published").order("created_at", { ascending: false }).order("id", { ascending: false }).limit(PUBLIC_PAGE_SIZE + 1),
  ]);

  const error = jobsResult.error || requestsResult.error;
  const jobs = (jobsResult.data as Job[]) || [];
  const requests = (requestsResult.data as CVRequest[]) || [];
  return {
    content: {
      jobs: jobs.slice(0, PUBLIC_PAGE_SIZE),
      requests: requests.slice(0, PUBLIC_PAGE_SIZE),
      hasMoreJobs: jobs.length > PUBLIC_PAGE_SIZE,
      hasMoreRequests: requests.length > PUBLIC_PAGE_SIZE,
    },
    error: error ? new Error(error.message) : null,
  };
}

export async function loadPublicJobFilterOptions() {
  if (publicJobFilterOptionsCache) return { options: publicJobFilterOptionsCache, error: null };
  if (publicJobFilterOptionsRequest) return publicJobFilterOptionsRequest;

  const request = (async () => {
    const { data, error } = await supabase.rpc("get_public_job_filter_options");
    if (error) return { options: null, error };
    const options = data as PublicJobFilterOptions;
    publicJobFilterOptionsCache = {
      provinces: Array.isArray(options?.provinces) ? options.provinces.filter((province) => typeof province === "string") : [],
    };
    return { options: publicJobFilterOptionsCache, error: null };
  })();

  publicJobFilterOptionsRequest = request;
  try {
    return await request;
  } finally {
    if (publicJobFilterOptionsRequest === request) publicJobFilterOptionsRequest = null;
  }
}

export async function loadPublicJobsPage(
  filters: PublicJobFilters,
  cursor: PublicJobCursor | null = null,
): Promise<PublicJobPage> {
  let query = supabase.from("jobs").select(publicJobColumns).eq("status", "published");
  const keyword = filters.keyword.trim().replace(/[%_\\]/g, " ").replace(/\s+/g, " ");

  if (keyword) query = query.ilike("search_text", `%${keyword}%`);
  if (filters.category !== "الكل") query = query.eq("category", filters.category);
  if (filters.jobType !== "الكل") query = query.eq("job_type", filters.jobType);
  if (filters.province !== "الكل") query = query.eq("province", filters.province);
  if (cursor?.created_at) {
    query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
  }
  const { data, error } = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PUBLIC_PAGE_SIZE + 1);
  return toPublicJobPage(data as Job[] | null, error);
}

function toPublicJobPage(data: Job[] | null, error: { message: string } | null): PublicJobPage {
  if (error) return { jobs: [], hasMore: false, nextCursor: null, error: new Error(error.message) };

  const rows = data || [];
  const hasMore = rows.length > PUBLIC_PAGE_SIZE;
  const jobs = rows.slice(0, PUBLIC_PAGE_SIZE);
  const lastJob = jobs[jobs.length - 1];
  const nextCursor = hasMore && lastJob ? { id: lastJob.id, created_at: lastJob.created_at } : null;

  return { jobs, hasMore, nextCursor, error: null };
}

export async function loadPublicJobById(jobId: string) {
  const { data, error } = await supabase
    .from("jobs")
    .select(publicJobColumns)
    .eq("id", jobId)
    .eq("status", "published")
    .maybeSingle();
  return { job: (data as Job | null) || null, error };
}