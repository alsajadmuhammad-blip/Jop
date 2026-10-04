import { ArrowLeft, BriefcaseBusiness, Building2, CheckCircle2, FileText, HeartHandshake } from "lucide-react";
import { JobsPage } from "./JobsPage";
import type { View } from "../../app/types";
import type { Job, Profile } from "../../lib/types";

type HomePageProps = {
  jobs: Job[];
  hasMoreJobs: boolean;
  loading: boolean;
  profile?: Profile | null;
  onNavigate: (view: View) => void;
  onOpenJob: (job: Job) => void;
  onLogin?: () => void;
  onNotify?: (message: string) => void;
};

export function HomePage({ jobs, hasMoreJobs, loading, profile, onNavigate, onOpenJob, onLogin, onNotify }: HomePageProps) {
  return <main className="home-refresh">
    <section className="home-refresh-hero">
      <div className="container home-refresh-hero-inner">
        <div className="home-refresh-frame">
          <div className="home-refresh-image-wrap">
            <img
              className="home-refresh-hero-image"
              src="/images/iraq-heritage-home.webp?v=2"
              alt="مشهد فني لآثار ومعالم بلاد الرافدين التاريخية"
              fetchPriority="high"
            />
          </div>

          <div className="home-refresh-hero-content">
            <div className="home-refresh-hero-copy">
              <span className="home-refresh-eyebrow"><HeartHandshake size={16} /> فرصة عادلة للجميع</span>
              <h1>نساعدك توصل<br /><em>للفرصة المناسبة.</em></h1>
              <p>منصة عراقية مجانية تجمع الباحثين عن عمل مع الجهات التي تبحث عن كفاءات. تصفح، قدّم، وابدأ خطوتك القادمة بدون رسوم.</p>
              <div className="home-refresh-actions">
                <button className="primary-btn large" onClick={() => onNavigate("jobs")}>تصفح الوظائف <ArrowLeft size={18} /></button>
                <button className="home-refresh-secondary-btn" onClick={() => onNavigate("signup")}>أنشئ حسابك مجاناً <UserPlusIcon /></button>
              </div>
              <div className="home-refresh-proof">
                <span><CheckCircle2 size={15} /> مجاني للباحثين عن عمل</span>
                <span><CheckCircle2 size={15} /> مجاني للجهات الناشرة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {(!profile || profile.role === "candidate") && (
      <section className="resume-promo-section" aria-label="تصدير سيرة ذاتية احترافية">
        <div className="container">
          <div className="resume-promo-banner">
            <span className="resume-promo-icon" aria-hidden="true"><FileText size={21} /></span>
            <div className="resume-promo-copy">
              <span className="resume-promo-kicker">ملف مهني أقوى، فرصة أقرب</span>
              <h2>حوّل ملفك المهني إلى سيرة جاهزة للتقديم</h2>
              <p>أكمل بياناتك باللغة الإنكليزية، ثم صدّر سيرتك بصيغة ATS كملف Word أو PDF.</p>
            </div>
            <button
              type="button"
              className="resume-promo-cta"
              onClick={() => onNavigate(profile?.role === "candidate" ? "candidate" : "signup")}
            >
              {profile?.role === "candidate" ? "أكمل ملفك وصدّر سيرتك" : "أنشئ ملفك المهني"}
              <ArrowLeft size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    )}

    <section className="home-app-workspace" aria-labelledby="home-app-heading">
      <div className="container">
        <header className="home-app-workspace-heading">
          <div>
            <span className="home-app-kicker"><BriefcaseBusiness size={15} /> لوحة الوظائف</span>
            <h2 id="home-app-heading">تصفح الوظائف</h2>
            <p>ابحث بالكلمة، ثم ضيّق النتائج حسب التصنيف ونوع الدوام والمحافظة.</p>
          </div>
          <button type="button" className="home-app-publish-button" onClick={() => onNavigate("job-request")}>
            <Building2 size={16} /> نشر وظيفة
          </button>
        </header>

        <JobsPage
          jobs={jobs}
          loading={loading}
          initialHasMoreJobs={hasMoreJobs}
          onOpenJob={onOpenJob}
          profile={profile}
          onLogin={onLogin}
          onNotify={onNotify}
          embedded
        />
      </div>
    </section>
  </main>;
}

function UserPlusIcon() {
  return <span aria-hidden="true">+</span>;
}