import { useState } from "react";
import { ChevronDown, Filter, Search } from "lucide-react";
import { EmptyState, LoadingCards } from "../../components/common/Feedback";
import { PageIntro } from "../../components/common/PageIntro";
import { categories } from "../../lib/constants";
import type { Job } from "../../lib/types";
import { JobCard } from "../../features/jobs/JobCard";

export function JobsPage({ jobs, loading, onOpenJob }: { jobs: Job[]; loading: boolean; onOpenJob: (job: Job) => void }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("الكل");
  const filtered = jobs.filter((job) => `${job.title} ${job.company_name} ${job.city}`.toLowerCase().includes(query.toLowerCase()) && (category === "الكل" || job.category === category));
  return <section className="container page-section"><PageIntro eyebrow="فرص العمل" title="وظائف منشورة وواضحة" description="تصفح الفرص المنشورة من الشركات والجهات العراقية، واعرف تفاصيل كل فرصة قبل التواصل." /><div className="filters-bar"><div className="search-field"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن وظيفة، شركة، أو مدينة..." /></div><div className="select-field"><Filter size={16} /><select value={category} onChange={(event) => setCategory(event.target.value)}><option>الكل</option>{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div></div>{loading ? <LoadingCards /> : filtered.length ? <div className="job-grid wide">{filtered.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} />)}</div> : <EmptyState title="ماكو وظائف بهذا البحث" text="جرّب كلمة ثانية أو ارجع لاحقاً، الوظائف الجديدة تنزل باستمرار." />}</section>;
}