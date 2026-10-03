import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Header } from "./components/layout/Header";
import { MainSidebar } from "./components/layout/MainSidebar";
import { Footer } from "./components/layout/Footer";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { demoJobs } from "./lib/constants";
import type { Application, CVRequest, Job, Profile } from "./lib/types";
import type { View } from "./app/types";
import { getCurrentProfile, getProfile, signOut } from "./services/authService";
import { getPublicContent } from "./services/publicService";
import { clearCandidateApplicationsCache, loadApplications, loadCandidateApplications } from "./services/applicationService";
import { clearCandidateProfileCache } from "./services/candidateService";
import { clearSavedJobsCache } from "./services/savedJobService";
import { loadAdminPosts, loadJobRequests } from "./services/adminService";
import { HomePage } from "./pages/public/HomePage";
import { JobsPage } from "./pages/public/JobsPage";
import { RequestsPage } from "./pages/public/RequestsPage";
import { JobDetailsPage } from "./pages/public/JobDetailsPage";
import { JobRequestPage } from "./pages/public/JobRequestPage";
import { CandidatePage } from "./pages/candidate/CandidatePage";
import { SavedJobsPage } from "./pages/candidate/SavedJobsPage";
import { AppliedJobsPage } from "./pages/candidate/AppliedJobsPage";
import { CandidateDashboardShell } from "./pages/candidate/CandidateDashboardShell";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminPostPage } from "./pages/admin/AdminPostPage";
import { HrDashboardPage } from "./pages/hr/HrDashboardPage";
import { RequestModal } from "./features/requests/RequestModal";
import { AuthPage } from "./pages/auth/AuthPage";
import "./styles/role-navigation.css";
import type { AdminSection } from "./pages/admin/AdminDashboardPage";
import type { HrSection } from "./pages/hr/HrDashboardPage";
import type { AppNotification, NotificationDestination } from "./components/layout/NotificationBell";

const views: View[] = ["home", "jobs", "login", "signup", "candidate", "saved", "applied", "admin", "admin-post", "hr", "job", "job-request"];

function readRoute(): { view: View; jobId: string | null } {
  const value = window.location.hash.replace(/^#/, "");
  if (value.startsWith("admin-post/request/")) return { view: "admin", jobId: null };
  if (value.startsWith("admin-post/job/")) return { view: "admin-post", jobId: decodeURIComponent(value.slice("admin-post/job/".length)) };
  if (value === "admin-post") return { view: "admin-post", jobId: null };
  if (value.startsWith("job/")) return { view: "job", jobId: decodeURIComponent(value.slice(4)) };
  return { view: views.includes(value as View) ? value as View : "home", jobId: null };
}

function applicationStatusLabel(status: Application["status"]) {
  return ({
    new: "تم استلام الطلب",
    reviewing: "قيد المراجعة",
    shortlisted: "ضمن القائمة المختصرة",
    rejected: "غير مناسب حاليًا",
    hired: "تم القبول",
  } as Record<Application["status"], string>)[status];
}

function App() {
  const initialRoute = readRoute();
  const [view, setView] = useState<View>(initialRoute.view);
  const [routeJobId, setRouteJobId] = useState<string | null>(initialRoute.jobId);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<CVRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidateApplications, setCandidateApplications] = useState<Application[]>([]);
  const [jobRequests, setJobRequests] = useState<import("./lib/types").JobRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CVRequest | null>(null);
  const [modal, setModal] = useState<"request" | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [adminSection, setAdminSection] = useState<AdminSection>("overview");
  const [hrSection, setHrSection] = useState<HrSection>("search");
  const [toast, setToast] = useState("");

  const navigate = (next: View) => {
    setView(next);
    setRouteJobId(null);
    setMobileMenu(false);
    window.location.hash = next;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToJob = (job: Job) => {
    setView("job");
    setRouteJobId(job.id);
    setMobileMenu(false);
    window.location.hash = `job/${encodeURIComponent(job.id)}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToJobId = (jobId: string) => {
    setView("job");
    setRouteJobId(jobId);
    setMobileMenu(false);
    window.location.hash = `job/${encodeURIComponent(jobId)}`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navigateToAdminPost = (post?: Job) => {
    setView("admin-post");
    setRouteJobId(post?.id || null);
    setMobileMenu(false);
    window.location.hash = post ? `admin-post/job/${encodeURIComponent(post.id)}` : "admin-post";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openNotification = (destination: NotificationDestination) => {
    if (destination.adminSection) setAdminSection(destination.adminSection);
    if (destination.hrSection) setHrSection(destination.hrSection);
    navigate(destination.view);
  };

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  }, []);

  const refreshPublicContent = async () => {
    if (!hasSupabaseConfig) {
      setJobs(demoJobs);
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getPublicContent();
    if (result.error) notify("تعذر تحميل البيانات. نفّذ ملف Supabase schema.sql أولاً.");
    setJobs(result.content.jobs);
    setRequests(result.content.requests);
    setLoading(false);
  };

  const refreshApplications = async () => {
    if (!hasSupabaseConfig) return;
    const result = await loadApplications(profile?.role === "admin");
    if (result.error) notify("تعذر تحميل السير الذاتية. تأكد من سياسات Supabase والحساب.");
    setApplications(result.applications);
  };

  const refreshAdminPosts = async () => {
    if (!hasSupabaseConfig || profile?.role !== "admin") return;
    const result = await loadAdminPosts();
    if (result.error) notify("تعذر تحميل بيانات لوحة الإدارة.");
    setJobs(result.jobs);
  };

  const refreshJobRequests = async () => {
    if (!hasSupabaseConfig || profile?.role !== "admin") return;
    const result = await loadJobRequests();
    if (result.error) notify("تعذر تحميل طلبات نشر الوظائف. تأكد من تنفيذ تحديث قاعدة البيانات.");
    setJobRequests(result.requests);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const [publicResult, currentProfile] = await Promise.all([
        hasSupabaseConfig ? getPublicContent() : Promise.resolve({ content: { jobs: demoJobs, requests: [] }, error: null }),
        hasSupabaseConfig ? getCurrentProfile() : Promise.resolve(null),
      ]);
      if (!active) return;
      if (publicResult.error) notify("تعذر تحميل البيانات. نفّذ ملف Supabase schema.sql أولاً.");
      setJobs(publicResult.content.jobs);
      setRequests(publicResult.content.requests);
      setProfile(currentProfile);
      setLoading(false);
       setAuthReady(true);
    })();

    const onHashChange = () => {
      const route = readRoute();
      setView(route.view);
      setRouteJobId(route.jobId);
    };
    window.addEventListener("hashchange", onHashChange);
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!hasSupabaseConfig) return;
       if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
       if (session?.user) {
         setAuthReady(false);
         void getProfile(session.user.id)
           .then(({ profile: nextProfile }) => setProfile(nextProfile))
           .finally(() => setAuthReady(true));
       } else {
         setProfile(null);
          clearCandidateProfileCache();
          clearCandidateApplicationsCache();
          clearSavedJobsCache();
         setAuthReady(true);
       }
    });
    return () => {
      active = false;
      window.removeEventListener("hashchange", onHashChange);
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if ((view === "admin" || view === "admin-post" || view === "hr" || view === "candidate" || view === "saved" || view === "applied") && !profile) {
      navigate("login");
      return;
    }
    if ((view === "admin" || view === "admin-post") && profile?.role !== "admin") {
      notify("هذه الصفحة مخصصة للإدارة");
      navigate("home");
      return;
    }
    if (view === "hr" && profile?.role !== "hr") {
      notify("هذه الصفحة مخصصة لجهات HR");
      navigate("home");
      return;
    }
    if (view === "candidate" && profile?.role !== "candidate") {
      notify("هذه الصفحة مخصصة للباحثين عن عمل");
      navigate("home");
    }
    if (view === "saved" && profile?.role !== "candidate") {
      notify("هذه الصفحة مخصصة للباحثين عن عمل");
      navigate("home");
    }
    if (view === "applied" && profile?.role !== "candidate") {
      notify("هذه الصفحة مخصصة للباحثين عن عمل");
      navigate("home");
    }
  }, [view, profile, authReady]);

  useEffect(() => {
    if (profile?.role === "admin" || profile?.role === "hr") void refreshApplications();
    else setApplications([]);
    if (profile?.role === "candidate" && hasSupabaseConfig) {
      void loadCandidateApplications(profile.id).then((result) => setCandidateApplications(result.applications));
    } else {
      setCandidateApplications([]);
    }
    if (profile?.role === "admin") void refreshJobRequests();
    else setJobRequests([]);
    if (profile?.role === "admin") void refreshAdminPosts();
  }, [profile]);

  const publishedJobs = useMemo(() => jobs.filter((job) => job.status === "published"), [jobs]);
  const selectedJob = useMemo(() => jobs.find((job) => job.id === routeJobId) || null, [jobs, routeJobId]);
  const supervisorJobIds = useMemo(
    () => new Set(jobs.filter((job) => profile?.role === "admin" && job.created_by === profile.id).map((job) => job.id)),
    [jobs, profile],
  );
  const supervisorApplications = useMemo(
    () => applications.filter((application) => application.job_id && supervisorJobIds.has(application.job_id)),
    [applications, supervisorJobIds],
  );
  const notifications = useMemo<AppNotification[]>(() => {
    if (!profile) return [];

    if (profile.role === "candidate") {
      return candidateApplications.map((application) => {
        const status = applicationStatusLabel(application.status);
        const title = application.status === "new" ? "تم استلام تقديمك" : `تحديث على تقديمك: ${status}`;
        const jobTitle = application.jobs?.title || application.cv_requests?.title || "طلب تقديم";
        return {
          id: `candidate-application-${application.id}-${application.status}`,
          title,
          body: jobTitle,
          target: { view: "applied" },
          createdAt: application.created_at,
          tone: application.status === "hired" || application.status === "shortlisted" ? "green" : application.status === "reviewing" ? "orange" : "blue",
        };
      });
    }

    if (profile.role === "hr") {
      return applications
        .filter((application) => application.status === "new")
        .map((application) => ({
          id: `hr-application-${application.id}-new`,
          title: "تقديم جديد يحتاج متابعة",
          body: application.jobs?.title || application.cv_requests?.title || "طلب تقديم",
          target: { view: "hr", hrSection: "applications" },
          createdAt: application.created_at,
          tone: "orange" as const,
        }));
    }

    return [
      ...jobRequests
        .filter((request) => request.status === "pending")
        .map((request) => ({
          id: `admin-job-request-${request.id}-pending`,
          title: "طلب نشر وظيفة جديد",
          body: `${request.title} · ${request.company_name}`,
          target: { view: "admin", adminSection: "job-requests" } as const,
          createdAt: request.created_at,
          tone: "orange" as const,
        })),
      ...applications
        .filter((application) => application.job_id && supervisorJobIds.has(application.job_id))
        .filter((application) => application.status === "new")
        .map((application) => ({
          id: `admin-application-${application.id}-new`,
          title: "تقديم وظيفة جديد",
          body: application.jobs?.title || "تقديم جديد",
          target: { view: "admin", adminSection: "applications" } as const,
          createdAt: application.created_at,
          tone: "blue" as const,
        })),
    ];
  }, [applications, candidateApplications, jobRequests, profile, supervisorJobIds]);
  const requiresAuth = view === "admin" || view === "admin-post" || view === "hr" || view === "candidate" || view === "saved" || view === "applied";
  const logout = async () => {
    const { error } = await signOut();
    if (error) {
      notify("تعذر تسجيل الخروج، حاول مرة ثانية.");
      return;
    }
    setProfile(null);
    clearCandidateProfileCache();
    clearCandidateApplicationsCache();
    clearSavedJobsCache();
    navigate("home");
    notify("تم تسجيل الخروج");
  };

  const handleAuthSuccess = (nextProfile: Profile) => {
    setProfile(nextProfile);
    navigate(nextProfile.role === "candidate" ? "candidate" : nextProfile.role === "admin" ? "admin" : "hr");
    notify("تم تسجيل الدخول بنجاح");
  };

  return <div className={`app-shell ${profile ? "has-main-sidebar" : ""}`}>
    <Header view={view} profile={profile} notifications={notifications} onNavigate={navigate} onOpenNotification={openNotification} onLogin={() => navigate("login")} onRegister={() => navigate("signup")} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
    {profile && <MainSidebar profile={profile} view={view} adminSection={adminSection} hrSection={hrSection} open={mobileMenu} onClose={() => setMobileMenu(false)} onNavigate={navigate} onAdminSection={setAdminSection} onHrSection={setHrSection} onLogout={() => void logout()} />}
    <main>
      {!hasSupabaseConfig && <div className="config-banner"><ShieldCheck size={16} /> وضع المعاينة فعال — أضف إعدادات Supabase لتشغيل البيانات الحقيقية.</div>}
      {!authReady && requiresAuth ? <section className="container page-section centered-state"><span className="live-dot" /><p>جاري استعادة جلستك، لحظات ونكمل من نفس الصفحة.</p></section> : <>
        {view === "home" && <HomePage jobs={publishedJobs} requests={requests} loading={loading} onNavigate={navigate} onOpenJob={navigateToJob} onOpenRequest={(request) => { setSelectedRequest(request); setModal("request"); }} />}
          {view === "jobs" && <JobsPage jobs={publishedJobs} loading={loading} onOpenJob={navigateToJob} profile={profile} onLogin={() => navigate("login")} onNotify={notify} />}
          {view === "job" && <JobDetailsPage job={selectedJob} profile={profile} onNavigate={navigate} onLogin={() => navigate("login")} onNotify={notify} />}
          {view === "login" && <AuthPage mode="sign-in" onNavigate={navigate} onSuccess={handleAuthSuccess} />}
          {view === "signup" && <AuthPage mode="sign-up" onNavigate={navigate} onSuccess={handleAuthSuccess} />}
         {view === "job-request" && <JobRequestPage profile={profile} onNavigate={navigate} onSubmitted={() => notify("تم إرسال طلب نشر الوظيفة للمراجعة")} />}
         {view === "candidate" && profile?.role === "candidate" && <CandidateDashboardShell><CandidatePage profile={profile} onNavigate={navigate} onNotify={notify} /></CandidateDashboardShell>}
           {view === "saved" && profile?.role === "candidate" && <CandidateDashboardShell><SavedJobsPage profile={profile} onNavigate={navigate} onOpenJob={navigateToJob} onNotify={notify} /></CandidateDashboardShell>}
           {view === "applied" && profile?.role === "candidate" && <CandidateDashboardShell><AppliedJobsPage profile={profile} onNavigate={navigate} onOpenJob={navigateToJobId} onNotify={notify} /></CandidateDashboardShell>}
           {view === "admin" && profile?.role === "admin" && adminSection === "candidate-search" && <HrDashboardPage profile={profile} applications={supervisorApplications} section="search" onSection={() => setAdminSection("candidate-search")} onRefresh={() => void refreshApplications()} onNotify={notify} onNavigate={navigate} />}
           {view === "admin" && profile?.role === "admin" && adminSection === "applications" && <HrDashboardPage profile={profile} applications={supervisorApplications} section="applications" onSection={() => setAdminSection("applications")} onRefresh={() => void refreshApplications()} onNotify={notify} onNavigate={navigate} />}
           {view === "admin" && profile?.role === "admin" && adminSection !== "candidate-search" && adminSection !== "applications" && <AdminDashboardPage jobs={jobs} applications={supervisorApplications} jobRequests={jobRequests} adminSection={adminSection} onAdminSection={setAdminSection} onNavigate={navigate} onEditJob={navigateToAdminPost} onRefresh={() => { void refreshAdminPosts(); void refreshApplications(); void refreshJobRequests(); }} onNotify={notify} />}
        {view === "admin-post" && profile?.role === "admin" && <AdminPostPage job={selectedJob} onNavigate={navigate} onSaved={() => { void refreshAdminPosts(); navigate("admin"); notify(routeJobId ? "تم حفظ التعديلات" : "تم نشر الوظيفة بنجاح"); }} />}
         {view === "hr" && profile?.role === "hr" && <HrDashboardPage profile={profile} applications={applications} section={hrSection} onSection={setHrSection} onRefresh={() => void refreshApplications()} onNotify={notify} onNavigate={(next) => navigate(next)} />}
      </>}
    </main>
    <Footer />
    {modal === "request" && selectedRequest && <RequestModal request={selectedRequest} onClose={() => setModal(null)} onSubmitted={() => { setModal(null); notify("تم إرسال سيرتك الذاتية إلى الجهة المختصة."); }} />}
    {toast && <div className="toast"><Check size={17} />{toast}</div>}
  </div>;
}

export default App;