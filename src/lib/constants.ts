import type { Job, JobType } from "./types";

export const jobTypes: JobType[] = ["دوام كامل", "دوام جزئي", "عن بُعد", "تدريب", "عمل حر"];
export const categories = ["تقنية", "إدارة", "تسويق", "تصميم", "مالية", "هندسة", "موارد بشرية", "خدمة عملاء"];

export const demoJobs: Job[] = [
  {
    id: "demo-1",
    title: "مطور واجهات أمامية",
    company_name: "شركة حلول رقمية",
    category: "تقنية",
    city: "بغداد",
    job_type: "دوام كامل",
    description: "نبحث عن مطور واجهات أمامية للانضمام إلى فريق منتج يعمل على حلول رقمية تخدم السوق العراقي.",
    requirements: ["خبرة React أو Vue", "فهم جيد لـ HTML و CSS", "القدرة على العمل ضمن فريق"],
    salary_range: "1,500,000 – 2,200,000 د.ع",
    contact_email: "jobs@digital-solutions.iq",
    contact_whatsapp: null,
    status: "published",
    created_at: new Date().toISOString(),
    deadline: null,
    created_by: null,
  },
  {
    id: "demo-2",
    title: "مسؤول موارد بشرية",
    company_name: "مجموعة النخبة",
    category: "موارد بشرية",
    city: "أربيل",
    job_type: "دوام كامل",
    description: "فرصة لمسؤول موارد بشرية لديه شغف ببناء فرق قوية وتحسين تجربة الموظفين.",
    requirements: ["خبرة سنتان على الأقل", "مهارات تواصل ممتازة", "إجادة برامج Office"],
    salary_range: "1,000,000 – 1,500,000 د.ع",
    contact_email: null,
    contact_whatsapp: "9647501234567",
    status: "published",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    deadline: null,
    created_by: null,
  },
];