import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, BriefcaseBusiness } from "lucide-react";
import type { View } from "../../app/types";
import type { Profile, SavedJob } from "../../lib/types";
import { EmptyState, LoadingCards } from "../../components/common/Feedback";
import { JobCard } from "../../features/jobs/JobCard";
import { getCachedSavedJobs, loadSavedJobs, toggleSavedJob } from "../../services/savedJobService";
import { getBaghdadToday } from "../../lib/date";

export function SavedJobsPage({ profile, active, onNavigate, onOpenJob, onNotify }: { profile: Profile; active: boolean; onNavigate: (view: View) => void; onOpenJob: (job: SavedJob) => void; onNotify: (message: string) => void }) {
  const cachedJobs = getCachedSavedJobs(profile.id);
  const [jobs, setJobs] = useState<SavedJob[]>(() => cachedJobs ?? []);
  const [loading, setLoading] = useState(cachedJobs === undefined);
  const today = getBaghdadToday();
  const availableJobs = jobs.filter((job) => Boolean(job.deadline) && job.deadline! >= today);

  useEffect(() => {
    if (!active) return;
    void loadSavedJobs(profile.id).then((result) => {
      setJobs(result.jobs);
      setLoading(false);
      if (result.error) onNotify("تعذر تحميل الوظائف المحفوظة.");
    });
  }, [active, onNotify, profile.id]);

  const remove = async (job: SavedJob) => {
    const error = await toggleSavedJob(job.id, true);
    if (error) return onNotify("تعذر تحديث المحفوظات.");
    setJobs((current) => current.filter((item) => item.id !== job.id));
    onNotify("أزيلت الوظيفة من المحفوظات");
  };

  return <section className="container page-section dashboard-page saved-jobs-page">
    <button className="back-link" onClick={() => onNavigate("candidate")}><ArrowRight size={16} /> العودة إلى حسابي</button>
     <div className="saved-jobs-heading"><div><span className="eyebrow"><Bookmark size={14} /> مساحة الباحث عن عمل</span><h1>الوظائف المحفوظة</h1><p>احتفظ بالفرص التي تريد الرجوع إليها والتقديم عليها لاحقًا.</p></div><span className="jobs-total"><BriefcaseBusiness size={16} /> {availableJobs.length} وظيفة</span></div>
     {loading ? <LoadingCards /> : availableJobs.length ? <div className="job-grid wide">{availableJobs.map((job) => <JobCard key={job.id} job={job} onClick={() => onOpenJob(job)} saved onToggleSaved={() => void remove(job)} />)}</div> : <EmptyState title="لا توجد وظائف محفوظة" text="اضغط على زر حفظ في أي وظيفة حتى تظهر هنا." />}
  </section>;
}