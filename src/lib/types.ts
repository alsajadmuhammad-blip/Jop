export type JobType = "دوام كامل" | "دوام جزئي" | "عن بُعد" | "تدريب" | "عمل حر";
export type PostStatus = "draft" | "published" | "closed";
export type ApplicationStatus = "new" | "reviewing" | "shortlisted" | "rejected" | "hired";
export type JobRequestStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  role: "candidate" | "admin" | "hr";
  organization: string | null;
  can_search_candidates: boolean;
}

export type EmployerAccount = Pick<Profile, "id" | "full_name" | "organization" | "can_search_candidates">;

export interface CandidateProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  headline: string;
  specialization: string;
  city: string;
  experience_years: number;
  skills: string[];
  experience_details: string;
  education: string;
  languages: string[];
  work_type: string;
  remote_available: boolean;
  expected_salary_min: number | null;
  availability: string;
  summary: string;
  created_at: string;
  updated_at: string;
}

export type CandidateProfileInput = Omit<CandidateProfile, "user_id" | "created_at" | "updated_at">;

export interface CandidateSearchResult extends CandidateProfile {
  relevance: number;
}

export interface Job {
  id: string;
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
  status: PostStatus;
  created_at: string;
  deadline: string | null;
  created_by: string | null;
}

export interface JobRequest {
  id: string;
  title: string;
  company_name: string;
  contact_name: string;
  contact_email: string | null;
  contact_whatsapp: string | null;
  category: string;
  city: string;
  job_type: JobType;
  description: string;
  requirements: string[];
  salary_range: string | null;
  deadline: string | null;
  status: JobRequestStatus;
  approved_job_id: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface CVRequest {
  id: string;
  title: string;
  specialization: string;
  organization_name: string;
  details: string;
  status: PostStatus;
  created_at: string;
  deadline: string | null;
  hr_group_id: string | null;
}

export interface Application {
  id: string;
  job_id: string | null;
  cv_request_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  cv_path: string | null;
  candidate_id: string | null;
  note: string | null;
  status: ApplicationStatus;
  created_at: string;
  jobs?: Pick<Job, "title" | "company_name"> | null;
  cv_requests?: Pick<CVRequest, "title" | "organization_name"> | null;
}