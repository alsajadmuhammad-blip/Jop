export type JobType = "دوام كامل" | "دوام جزئي" | "عن بُعد" | "تدريب" | "عمل حر";
export type PostStatus = "draft" | "published" | "closed";
export type ApplicationStatus = "new" | "reviewing" | "shortlisted" | "rejected" | "hired";

export interface Profile {
  id: string;
  full_name: string | null;
  role: "candidate" | "admin" | "hr";
  organization: string | null;
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
  status: PostStatus;
  created_at: string;
  deadline: string | null;
  created_by: string | null;
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
  cv_path: string;
  note: string | null;
  status: ApplicationStatus;
  created_at: string;
  jobs?: Pick<Job, "title" | "company_name"> | null;
  cv_requests?: Pick<CVRequest, "title" | "organization_name"> | null;
}