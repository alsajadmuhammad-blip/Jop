import { supabase } from "../lib/supabase";
import type { Application, ApplicationStatus } from "../lib/types";

export type ApplicationFormData = {
  full_name: string;
  email: string;
  phone: string;
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
  target: { requestId: string },
  form: ApplicationFormData,
  file: File,
) {
  const path = `${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const upload = await supabase.storage.from("cvs").upload(path, file, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (upload.error) return upload.error;

  const { error } = await supabase.from("applications").insert({
    job_id: null,
    cv_request_id: target.requestId,
    ...form,
    cv_path: path,
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