import { useEffect, useMemo, useState } from "react";
import { Check, ShieldCheck } from "lucide-react";
import { Header } from "./components/layout/Header";
import { Footer } from "./components/layout/Footer";
import { hasSupabaseConfig, supabase } from "./lib/supabase";
import { demoJobs } from "./lib/constants";
import type { Application, CVRequest, Job, Profile } from "./lib/types";
import type { View } from "./app/types";
import { getCurrentProfile, getProfile, signOut } from "./services/authService";
import { getPublicContent } from "./services/publicService";
import { loadApplications } from "./services/applicationService";
import { loadAdminPosts, loadJobRequests } from "./services/adminService";
import { HomePage } from "./pages/public/HomePage";
import { JobsPage } from "./pages/public/JobsPage";
import { RequestsPage } from "./pages/public/RequestsPage";
import { JobDetailsPage } from "./pages/public/JobDetailsPage";
import { JobRequestPage } from "./pages/public/JobRequestPage";
import { CandidatePage } from "./pages/candidate/CandidatePage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminPostPage } from "./pages/admin/AdminPostPage";
import { HrDashboardPage } from "./pages/hr/HrDashboardPage";
import { RequestModal } from "./features/requests/RequestModal";
import { LoginModal } from "./features/auth/LoginModal";

const views: View[] = ["home", "jobs", "requests", "candidate", "admin", "admin-post", "hr", "job", "job-request"];

function readRoute(): { view: View; jobId: string | null; requestId: string | null } {
  const value = window.location.hash.replace(/^#/, "");
  if (value.startsWith("admin-post/request/")) return { view: "admin-post", jobId: null, requestId: decodeURIComponent(value.slice("admin-post/request/".length)) };
  if (value.startsWith("admin-post/job/")) return { view: "admin-post", jobId: decodeURIComponent(value.slice("admin-post/job/".length)), requestId: null };
  if (value.startsWith("admin-post/")) return { view: "admin-post", jobId: decodeURIComponent(value.slice("admin-post/".length)), requestId: null };
  if (value.startsWith("job/")) return { view: "job", jobId: decodeURIComponent(value.slice(4)), requestId: null };
  return { view: views.includes(value as View) ? value as View : "home", jobId: null, requestId: null };
}

function App() {
  const initialRoute = readRoute();
  const [view, setView] = useState<View>(initialRoute.view);
  const [routeJobId, setRouteJobId] = useState<string | null>(initialRoute.jobId);
  const [routeRequestId, setRouteRequestId] = useState<string | null>(initialRoute.requestId);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<CVRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobRequests, setJobRequests] = useState<import("./lib/types").JobRequest[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CVRequest | null>(null);
  const [modal, setModal] = useState<"job" | "request" | "login" | null>(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(!hasSupabaseConfig);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");

  const navigate = (next: View) => {
    setView(next);
    setRouteJobId(null);
    setRouteRequestId(null);
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

  const navigateToAdminPost = (post?: Job | CVRequest) => {
    const isRequest = Boolean(post && "organization_name" in post);
    setView("admin-post");
    setRouteJobId(!isRequest ? post?.id || null : null);
    setRouteRequestId(isRequest ? post?.id || null : null);
    setMobileMenu(false);
    window.location.hash = post
      ? `admin-post/${isRequest ? "request" : "job"}/${encodeURIComponent(post.id)}`
      : "admin-post";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3500);
  };

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
    const result = await loadApplications();
    if (result.error) notify("تعذر تحميل السير الذاتية. تأكد من سياسات Supabase والحساب.");
    setApplications(result.applications);
  };

  const refreshAdminPosts = async () => {
    if (!hasSupabaseConfig || profile?.role !== "admin") return;
    const result = await loadAdminPosts();
    if (result.error) notify("تعذر تحميل بيانات لوحة الإدارة.");
    setJobs(result.jobs);
    setRequests(result.requests);
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
       setRouteRequestId(route.requestId);
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
    if ((view === "admin" || view === "admin-post" || view === "hr" || view === "candidate") && !profile) {
      setModal("login");
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
  }, [view, profile, authReady]);

  useEffect(() => {
    if (profile?.role === "admin" || profile?.role === "hr") void refreshApplications();
    else setApplications([]);
    if (profile?.role === "admin") void refreshJobRequests();
    else setJobRequests([]);
    if (profile?.role === "admin") void refreshAdminPosts();
  }, [profile]);

  const publishedJobs = useMemo(() => jobs.filter((job) => job.status === "published"), [jobs]);
  const selectedJob = useMemo(() => jobs.find((job) => job.id === routeJobId) || null, [jobs, routeJobId]);
  const selectedCvRequest = useMemo(() => requests.find((request) => request.id === routeRequestId) || null, [requests, routeRequestId]);
  const requiresAuth = view === "admin" || view === "admin-post" || view === "hr" || view === "candidate";
  const closeLogin = () => {
    setModal(null);
    if (view === "admin" || view === "admin-post" || view === "hr" || view === "candidate") navigate("home");
  };
  const logout = async () => {
    await signOut();
    setProfile(null);
    navigate("home");
    notify("تم تسجيل الخروج");
  };

  return <div className="app-shell">
    <Header view={view} profile={profile} onNavigate={navigate} onLogin={() => setModal("login")} onLogout={() => void logout()} mobileMenu={mobileMenu} setMobileMenu={setMobileMenu} />
    <main>
      {!hasSupabaseConfig && <div className="config-banner"><ShieldCheck size={16} /> وضع المعاينة فعال — أضف إعدادات Supabase لتشغيل البيانات الحقيقية.</div>}
      {!authReady && requiresAuth ? <section className="container page-section centered-state"><span className="live-dot" /><p>جاري استعادة جلستك، لحظات ونكمل من نفس الصفحة.</p></section> : <>
        {view === "home" && <HomePage jobs={publishedJobs} requests={requests} loading={loading} onNavigate={navigate} onOpenJob={navigateToJob} onOpenRequest={(request) => { setSelectedRequest(request); setModal("request"); }} />}
        {view === "jobs" && <JobsPage jobs={publishedJobs} loading={loading} onOpenJob={navigateToJob} />}
        {view === "job" && <JobDetailsPage job={selectedJob} onNavigate={navigate} />}
        {view === "job-request" && <JobRequestPage onNavigate={navigate} onSubmitted={() => notify("تم إرسال طلب نشر الوظيفة للمراجعة")} />}
        {view === "requests" && <RequestsPage />}
        {view === "candidate" && profile?.role === "candidate" && <CandidatePage profile={profile} onNavigate={navigate} onLogout={() => void logout()} />}
        {view === "admin" && profile?.role === "admin" && <AdminDashboardPage jobs={jobs} requests={requests} applications={applications} jobRequests={jobRequests} onNavigate={navigate} onEditJob={navigateToAdminPost} onEditRequest={navigateToAdminPost} onRefresh={() => { void refreshAdminPosts(); void refreshApplications(); void refreshJobRequests(); }} onNotify={notify} />}
        {view === "admin-post" && profile?.role === "admin" && <AdminPostPage job={selectedJob} request={selectedCvRequest} onNavigate={navigate} onSaved={() => { void refreshAdminPosts(); navigate("admin"); notify(routeJobId || routeRequestId ? "تم حفظ التعديلات" : "تم حفظ المنشور ونشره بنجاح"); }} />}
        {view === "hr" && profile?.role === "hr" && <HrDashboardPage profile={profile} applications={applications} onRefresh={() => void refreshApplications()} onNotify={notify} />}
      </>}
    </main>
    <Footer />
    {modal === "request" && selectedRequest && <RequestModal request={selectedRequest} onClose={() => setModal(null)} onSubmitted={() => { setModal(null); notify("تم إرسال سيرتك الذاتية إلى الجهة المختصة."); }} />}
    {modal === "login" && <LoginModal onClose={closeLogin} onSuccess={(nextProfile) => { setProfile(nextProfile); setModal(null); notify("تم تسجيل الدخول"); }} />}
    {toast && <div className="toast"><Check size={17} />{toast}</div>}
  </div>;
}

export default App;