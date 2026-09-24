import { supabase } from "../lib/supabase";
import type { Application, ApplicationStatus } from "../lib/types";

export type ApplicationFormData = {
  note: string;
};

export async function loadApplications() {
  const result = await supabase
    .from("applications")
    .select("*, jobs(title, company_name), cv_requests(title, organization_name)")
    .order("created_at", { ascending: false });
  return { applications: (result.data as Application[]) || [], error: result.error };
}

export async function submitApplication(
  target: { requestId?: string; jobId?: string },
  form: ApplicationFormData,
) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) return userError || new Error("سجّل الدخول بحساب الباحث عن عمل أولاً.");
  const { data: candidate, error: candidateError } = await supabase
    .from("candidate_profiles")
    .select("full_name, email, phone")
    .eq("user_id", userResult.user.id)
    .single();
  if (candidateError || !candidate) return candidateError || new Error("أكمل ملفك المهني قبل إرسال الطلب.");
  if (!target.requestId && !target.jobId) return new Error("حدد الوظيفة أو الطلب قبل الإرسال.");
  const { error } = await supabase.from("applications").insert({
    job_id: target.jobId || null,
    cv_request_id: target.requestId || null,
    candidate_id: userResult.user.id,
    full_name: candidate.full_name,
    email: candidate.email || userResult.user.email || "",
    phone: candidate.phone,
    note: form.note,
    cv_path: null,
  });
  return error;
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const { error } = await supabase.from("applications").update({ status }).eq("id", id);
  return error;
}

export async function openApplicationCv(path: string) {
  const { data, error } = await supabase.storage.from("cvs").createSignedUrl(path, 300);
  if (error) throw error;
  if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}