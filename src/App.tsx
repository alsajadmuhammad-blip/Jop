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
import { HomePage } from "./pages/public/HomePage";
import { JobsPage } from "./pages/public/JobsPage";
import { RequestsPage } from "./pages/public/RequestsPage";
import { CandidatePage } from "./pages/candidate/CandidatePage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { HrDashboardPage } from "./pages/hr/HrDashboardPage";
import { JobModal } from "./features/jobs/JobModal";
import { RequestModal } from "./features/requests/RequestModal";
import { LoginModal } from "./features/auth/LoginModal";

const views: View[] = ["home", "jobs", "requests", "candidate", "admin", "hr"];

function readView(): View {
  const value = window.location.hash.replace("#", "") as View;
  return views.includes(value) ? value : "home";
}

function App() {
  const [view, setView] = useState<View>(readView);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [requests, setRequests] = useState<CVRequest[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CVRequest | null>(null);
  const [modal, setModal] = useState<"job" | "request" | "login" | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");

  const navigate = (next: View) => {
    setView(next);
    setMobileMenu(false);
    window.location.hash = next;
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
    })();

    const onHashChange = () => setView(readView());
    window.addEventListener("hashchange", onHashChange);
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!hasSupabaseConfig) return;
      if (session?.user) void getProfile(session.user.id).then(({ profile: nextProfile }) => setProfile(nextProfile));
      else setProfile(null);
    });
    return () => {
      active = false;
      window.removeEventListener("hashchange", onHashChange);
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if ((view === "admin" || view === "hr" || view === "candidate") && !profile) {
      setModal("login");
      return;
    }
    if (view === "admin" && profile?.role !== "admin") {
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
  }, [view, profile]);

  useEffect(() => {
    if (profile?.role === "admin" || profile?.role === "hr") void refreshApplications();
    else setApplications([]);
  }, [profile]);

  const publishedJobs = useMemo(() => jobs.filter((job) => job.status === "published"), [jobs]);
  const closeLogin = () => {
    setModal(null);
    if (view === "admin" || view === "hr" || view === "candidate") navigate("home");
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
      {view === "home" && <HomePage jobs={publishedJobs} requests={requests} loading={loading} onNavigate={navigate} onOpenJob={(job) => { setSelectedJob(job); setModal("job"); }} onOpenRequest={(request) => { setSelectedRequest(request); setModal("request"); }} />}
      {view === "jobs" && <JobsPage jobs={publishedJobs} loading={loading} onOpenJob={(job) => { setSelectedJob(job); setModal("job"); }} />}
      {view === "requests" && <RequestsPage requests={requests} loading={loading} onOpenRequest={(request) => { setSelectedRequest(request); setModal("request"); }} />}
      {view === "candidate" && profile?.role === "candidate" && <CandidatePage profile={profile} onNavigate={navigate} onLogout={() => void logout()} />}
      {view === "admin" && profile?.role === "admin" && <AdminDashboardPage jobs={jobs} requests={requests} applications={applications} onRefresh={() => { void refreshPublicContent(); void refreshApplications(); }} onNotify={notify} />}
      {view === "hr" && profile?.role === "hr" && <HrDashboardPage profile={profile} applications={applications} onRefresh={() => void refreshApplications()} onNotify={notify} />}
    </main>
    <Footer />
    {modal === "job" && selectedJob && <JobModal job={selectedJob} onClose={() => setModal(null)} onBrowseRequests={() => { setModal(null); navigate("requests"); }} />}
    {modal === "request" && selectedRequest && <RequestModal request={selectedRequest} onClose={() => setModal(null)} onSubmitted={() => { setModal(null); notify("تم إرسال سيرتك الذاتية إلى الجهة المختصة."); }} />}
    {modal === "login" && <LoginModal onClose={closeLogin} onSuccess={(nextProfile) => { setProfile(nextProfile); setModal(null); notify("تم تسجيل الدخول"); }} />}
    {toast && <div className="toast"><Check size={17} />{toast}</div>}
  </div>;
}

export default App;