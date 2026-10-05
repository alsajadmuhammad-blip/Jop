import { supabase } from "../lib/supabase";
import { getBaghdadDateAfterDays } from "../lib/date";
import type { EmployerAccount, Job, JobAdType, JobRequest, JobRequestStatus, JobType, PostStatus } from "../lib/types";

export type JobPostInput = {
  title: string;
  company_name: string;
  ad_type: JobAdType;
  category: string;
  province: string;
  city: string;
  job_type: JobType;
  description: string;
  requirements: string[];
  salary_range: string | null;
  contact_email: string | null;
  contact_whatsapp: string | null;
  deadline: string;
  internal_applications: boolean;
};

export async function createJob(input: JobPostInput) {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return userError || new Error("سجّل الدخول قبل نشر الوظيفة.");
  const normalizedInput = input.ad_type === "quick"
    ? { ...input, company_name: input.company_name.trim() || "جهة غير معلنة", deadline: getBaghdadDateAfterDays(15), internal_applications: false }
    : input;
  const { error } = await supabase.from("jobs").insert({ ...normalizedInput, status: "published", created_by: user.id });
  return error;
}

export async function updateJob(id: string, input: JobPostInput) {
  const { error } = await supabase.from("jobs").update(input).eq("id", id);
  return error;
}

export async function deleteJob(id: string) {
  try {
    const { data, error } = await supabase.rpc("admin_delete_job", { p_job_id: id });
    if (error) {
      if (error.code === "PGRST202" || /admin_delete_job|schema cache/i.test(error.message)) {
        return new Error("دالة الحذف غير مفعّلة في قاعدة البيانات. نفّذ supabase/admin-delete-job.sql في SQL Editor، ثم أعد المحاولة.");
      }
      if (/يجب تحديد آخر موعد صالح للتقديم قبل إرسال الطلب أو الموافقة عليه/.test(error.message)) {
        return new Error("قاعدة البيانات تعيد فحص موعد طلب النشر المرتبط أثناء الحذف. نفّذ supabase/job-request-deadline-trigger-fix.sql في SQL Editor، ثم أعد المحاولة.");
      }
      if (/job_requests_deadline_required_check/.test(error.message)) {
        return new Error("قاعدة البيانات تحتاج تحديث قيد موعد طلب النشر قبل حذف الوظيفة. نفّذ supabase/job-request-deadline-trigger-fix.sql في SQL Editor، ثم أعد المحاولة.");
      }
      if (error.code === "42501") {
        return new Error("الحساب الحالي لا يملك صلاحية حذف الوظائف.");
      }
      return new Error(error.message);
    }
    if (data !== true) return new Error("لم يتم العثور على الوظيفة المطلوب حذفها.");
    return null;
  } catch (error) {
    return new Error(error instanceof Error ? error.message : "تعذر الاتصال بقاعدة البيانات.");
  }
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
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return { requests: (data as JobRequest[]) || [], error };
}

export async function updateJobRequestDeadline(id: string, deadline: string) {
  const { error } = await supabase
    .from("job_requests")
    .update({ deadline })
    .eq("id", id)
    .eq("status", "pending");
  return error;
}

export async function submitJobRequest(input: Omit<JobRequest, "id" | "status" | "approved_job_id" | "reviewed_at" | "created_at">) {
  const { data: userResult } = await supabase.auth.getUser();
  const isQuick = input.ad_type === "quick";
  const contactEmail = isQuick ? input.contact_email : input.contact_email || userResult.user?.email || null;
  if (!isQuick && !contactEmail && !input.contact_whatsapp) return new Error("أضف البريد الإلكتروني أو رقم الواتساب لاستقبال التقديمات.");
  const { error } = await supabase.from("job_requests").insert({
    ...input,
    company_name: isQuick ? input.company_name.trim() || "جهة غير معلنة" : input.company_name,
    contact_name: isQuick ? input.contact_name.trim() || "صاحب الإعلان" : input.contact_name,
    contact_email: contactEmail,
    deadline: isQuick ? getBaghdadDateAfterDays(15) : input.deadline,
    internal_applications: isQuick ? false : input.internal_applications,
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

export type AdminAccountStats = {
  hrAccounts: number;
  candidateAccounts: number;
};

export async function loadAdminAccountStats() {
  const [hrResult, candidateResult] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "hr"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidate"),
  ]);
  const error = hrResult.error ?? candidateResult.error;

  return {
    stats: error
      ? null
      : {
          hrAccounts: hrResult.count ?? 0,
          candidateAccounts: candidateResult.count ?? 0,
        },
    error,
  };
}

export async function updateCandidateSearchPermission(userId: string, enabled: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ can_search_candidates: enabled })
    .eq("id", userId)
    .eq("role", "hr");
  return error;
}