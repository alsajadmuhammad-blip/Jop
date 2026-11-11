import "./_group.css";
import { useState, type FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

type Profile = {
  name: string;
  title: string;
  specialization: string;
  city: string;
  email: string;
  phone: string;
  summary: string;
};

const initialProfile: Profile = {
  name: "نور حسن",
  title: "مصممة تجربة المستخدم",
  specialization: "تصميم المنتجات الرقمية",
  city: "بغداد، العراق",
  email: "noor.hassan@email.com",
  phone: "+964 770 284 6193",
  summary:
    "مصممة تجربة مستخدم أعمل على تحويل احتياجات الناس إلى تجارب رقمية بسيطة وواضحة. لدي خبرة في أبحاث المستخدمين، تصميم الواجهات، وبناء أنظمة تصميم متناسقة بالتعاون مع فرق المنتجات والتطوير.",
};

const tabs = [
  { id: "overview", label: "نبذة مهنية", icon: UserRound },
  { id: "experience", label: "الخبرات", icon: BriefcaseBusiness, count: "٣" },
  { id: "education", label: "التعليم", icon: GraduationCap },
  { id: "skills", label: "المهارات", icon: Sparkles, count: "٥" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function Reimagined() {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState(initialProfile);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  const startEditing = () => {
    setDraft(profile);
    setNotice("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setDraft(profile);
    setEditing(false);
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfile(draft);
    setEditing(false);
    setNotice("تم حفظ معلوماتك المهنية على هذا النموذج.");
  };

  const announce = (message: string) => setNotice(message);

  return (
    <main className="ijr-page" dir="rtl">
      <style>{`
        .ijr-page {
          --ij-ink: #222951;
          --ij-indigo: #30386f;
          --ij-muted: #727994;
          --ij-line: #e6e4df;
          --ij-paper: #fffefa;
          --ij-ground: #f5f3ee;
          --ij-orange: #d98243;
          min-height: 100dvh;
          padding: 30px clamp(16px, 4vw, 58px) 72px;
          background:
            radial-gradient(ellipse at 91% 2%, rgba(221, 203, 173, .2), transparent 27%),
            var(--ij-ground);
          color: var(--ij-ink);
          font-family: "IBM Plex Sans Arabic", sans-serif;
          box-sizing: border-box;
        }
        .ijr-page *, .ijr-page *::before, .ijr-page *::after { box-sizing: border-box; }
        .ijr-page button, .ijr-page input, .ijr-page textarea { font: inherit; }
        .ijr-shell { width: min(1120px, 100%); margin: 0 auto; }
        .ijr-topline { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:17px; }
        .ijr-brand { display:flex; align-items:center; gap:10px; color:var(--ij-ink); font:600 14px "Readex Pro",sans-serif; }
        .ijr-brand-mark { display:grid; place-items:center; width:31px; height:31px; border-radius:10px 10px 10px 3px; color:#fff; background:var(--ij-indigo); }
        .ijr-top-note { display:flex; align-items:center; gap:7px; color:#777c91; font-size:11px; }
        .ijr-tip { display:flex; align-items:flex-start; gap:12px; padding:13px 16px; margin-bottom:17px; border:1px solid #eddfc4; border-right:3px solid #d4a057; border-radius:12px; color:#685941; background:#fffaf1; }
        .ijr-tip-icon { flex:0 0 auto; color:#b27a30; margin-top:2px; }
        .ijr-tip b { display:block; font-size:12px; font-weight:700; }
        .ijr-tip small { display:block; margin-top:3px; color:#83765f; font-size:10px; line-height:1.7; }
        .ijr-profile-card { overflow:hidden; border:1px solid #e3e1dc; border-radius:20px; background:var(--ij-paper); box-shadow:0 12px 34px rgba(37,42,72,.055); }
        .ijr-cover { position:relative; height:176px; overflow:hidden; background:linear-gradient(112deg,#202751 0%,#30386f 54%,#475282 100%); }
        .ijr-cover::before { content:""; position:absolute; inset:0; opacity:.35; background-image:linear-gradient(145deg,transparent 48%,rgba(255,255,255,.14) 48.15%,transparent 48.5%),linear-gradient(35deg,transparent 67%,rgba(255,255,255,.13) 67.15%,transparent 67.5%); background-size:250px 170px,310px 210px; }
        .ijr-cover::after { content:""; position:absolute; width:330px; height:330px; left:8%; top:-220px; border:1px solid rgba(255,255,255,.15); border-radius:50%; box-shadow:0 0 0 28px rgba(255,255,255,.035),0 0 0 60px rgba(255,255,255,.025); }
        .ijr-cover-orb { position:absolute; top:35px; left:20%; width:96px; height:96px; border:1px solid rgba(255,197,139,.36); border-radius:50%; }
        .ijr-cover-orb::after { content:""; position:absolute; inset:17px; border:1px solid rgba(255,255,255,.19); border-radius:50%; }
        .ijr-cover-caption { position:absolute; left:25px; bottom:20px; display:flex; align-items:center; gap:8px; color:rgba(255,255,255,.68); font-size:10px; letter-spacing:.04em; }
        .ijr-cover-caption i { width:6px; height:6px; display:block; border-radius:50%; background:#e6a16b; }
        .ijr-profile-body { position:relative; padding:0 32px 25px; }
        .ijr-identity-row { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-top:-51px; }
        .ijr-avatar-wrap { position:relative; flex:0 0 auto; }
        .ijr-avatar { display:grid; place-items:center; width:110px; height:110px; border:5px solid var(--ij-paper); border-radius:50%; color:#9da4bd; background:linear-gradient(145deg,#f1f0ed,#e5e5e1); box-shadow:0 3px 15px rgba(34,41,81,.1); }
        .ijr-photo-status { position:absolute; right:-12px; bottom:1px; display:flex; align-items:center; gap:4px; padding:5px 8px; border:1px solid #e5d4bb; border-radius:999px; color:#845f36; background:#fffaf1; white-space:nowrap; font-size:9px; font-weight:600; }
        .ijr-edit-button { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:10px 14px; border:1px solid #d9dce8; border-radius:10px; color:var(--ij-indigo); background:#fff; cursor:pointer; font-size:11px; font-weight:600; transition:background .18s ease, transform .18s ease; }
        .ijr-edit-button:hover { background:#f6f6fb; transform:translateY(-1px); }
        .ijr-identity { padding-top:12px; }
        .ijr-name-line { display:flex; align-items:center; flex-wrap:wrap; gap:10px; }
        .ijr-name { margin:0; color:var(--ij-ink); font:600 clamp(21px,3vw,27px)/1.5 "Readex Pro",sans-serif; }
        .ijr-verified { display:inline-flex; align-items:center; gap:4px; color:#477365; font-size:9px; }
        .ijr-title { margin:2px 0 0; color:#555d79; font-size:13px; }
        .ijr-specialty { display:inline-flex; align-items:center; gap:6px; margin-top:8px; padding:5px 9px; border-radius:7px; color:#655a4e; background:#f4f0e9; font-size:10px; }
        .ijr-contact-row { display:flex; flex-wrap:wrap; gap:10px 22px; padding:17px 0 0; margin-top:17px; border-top:1px solid #eeece7; color:#737991; font-size:10px; }
        .ijr-contact-item { display:inline-flex; align-items:center; gap:7px; }
        .ijr-contact-item svg { color:#a3724d; }
        .ijr-notice { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:10px 13px; margin:14px 0 0; border:1px solid #d8e6df; border-radius:10px; color:#426c5d; background:#f2f8f4; font-size:11px; animation:ijr-enter .22s ease both; }
        .ijr-notice button { display:grid; place-items:center; width:26px; height:26px; border:0; border-radius:7px; color:#56786c; background:transparent; cursor:pointer; }
        .ijr-import { display:flex; align-items:center; justify-content:space-between; gap:18px; padding:17px 18px; margin-top:17px; border:1px solid #dfe2f0; border-radius:14px; background:linear-gradient(105deg,#f4f5fb,#fbfaf6); }
        .ijr-import-copy { display:flex; align-items:center; gap:13px; min-width:0; }
        .ijr-import-icon { display:grid; place-items:center; flex:0 0 auto; width:40px; height:40px; border-radius:12px; color:#435089; background:#e8eaf5; }
        .ijr-import b { display:block; color:#343c6f; font-size:12px; }
        .ijr-import small { display:block; margin-top:4px; color:#767c94; font-size:10px; line-height:1.7; }
        .ijr-import button { display:flex; align-items:center; gap:7px; flex:0 0 auto; padding:9px 12px; border:1px solid #d9dbe8; border-radius:9px; color:#4b537e; background:#fff; cursor:pointer; font-size:10px; font-weight:600; }
        .ijr-content-grid { display:grid; grid-template-columns:minmax(0,1fr) 286px; align-items:start; gap:17px; margin-top:18px; }
        .ijr-main-panel, .ijr-resume-card, .ijr-edit-panel { border:1px solid #e5e3de; border-radius:15px; background:var(--ij-paper); box-shadow:0 8px 24px rgba(37,42,72,.035); }
        .ijr-tablist { display:flex; gap:5px; padding:8px; border-bottom:1px solid #eeece7; overflow-x:auto; scrollbar-width:thin; }
        .ijr-tab { display:inline-flex; align-items:center; justify-content:center; gap:8px; flex:1 0 auto; min-height:42px; padding:8px 13px; border:0; border-radius:9px; color:#787d94; background:transparent; cursor:pointer; font-size:11px; transition:color .18s ease,background .18s ease; }
        .ijr-tab:hover { color:var(--ij-indigo); background:#f7f6f2; }
        .ijr-tab[aria-selected="true"] { color:#fff; background:var(--ij-indigo); box-shadow:0 4px 10px rgba(48,56,111,.15); }
        .ijr-tab-count { display:grid; place-items:center; min-width:19px; height:19px; padding:0 4px; border-radius:999px; color:inherit; background:rgba(255,255,255,.17); font-size:9px; }
        .ijr-tab[aria-selected="false"] .ijr-tab-count { background:#eeedf0; }
        .ijr-tab-content { padding:23px 24px 25px; animation:ijr-enter .24s ease both; }
        .ijr-section-head { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:15px; }
        .ijr-kicker { display:block; margin-bottom:4px; color:#b17a4c; font-size:9px; font-weight:700; letter-spacing:.04em; }
        .ijr-section-head h2 { margin:0; color:var(--ij-ink); font:600 17px/1.5 "Readex Pro",sans-serif; }
        .ijr-section-head p { margin:5px 0 0; color:#7b8095; font-size:10px; line-height:1.7; }
        .ijr-summary { color:#626983; font-size:12px; line-height:2.05; }
        .ijr-summary p { margin:0; }
        .ijr-about-foot { display:flex; align-items:center; gap:8px; margin-top:18px; padding-top:14px; border-top:1px solid #efede8; color:#737992; font-size:10px; }
        .ijr-about-foot svg { color:#9c744f; }
        .ijr-timeline { display:grid; gap:0; }
        .ijr-timeline-item { position:relative; display:grid; grid-template-columns:20px minmax(0,1fr); gap:13px; padding-bottom:21px; }
        .ijr-timeline-item:not(:last-child)::before { content:""; position:absolute; right:8px; top:19px; bottom:0; width:1px; background:#e5e4e0; }
        .ijr-timeline-dot { position:relative; z-index:1; width:17px; height:17px; margin-top:3px; border:4px solid #e8eaf3; border-radius:50%; background:#747eae; }
        .ijr-timeline-item h3 { margin:0; color:#333a67; font:600 13px/1.6 "Readex Pro",sans-serif; }
        .ijr-timeline-item p { margin:3px 0 5px; color:#727891; font-size:10px; }
        .ijr-time { display:inline-flex; align-items:center; gap:5px; color:#a17a58; font-size:9px; }
        .ijr-timeline-copy { margin-top:8px; color:#747a90; font-size:10px; line-height:1.8; }
        .ijr-education-card { display:flex; gap:14px; padding:15px; border:1px solid #eeece7; border-radius:12px; background:#fdfcf9; }
        .ijr-education-icon { display:grid; place-items:center; width:39px; height:39px; flex:0 0 auto; border-radius:11px; color:#58618f; background:#eceef6; }
        .ijr-education-card h3 { margin:0; color:#343b68; font:600 13px "Readex Pro",sans-serif; }
        .ijr-education-card p { margin:5px 0; color:#747a91; font-size:10px; }
        .ijr-education-card small { color:#a17a58; font-size:9px; }
        .ijr-skills { display:flex; flex-wrap:wrap; gap:9px; }
        .ijr-skill { display:inline-flex; align-items:center; gap:7px; padding:9px 12px; border:1px solid #e8e6e0; border-radius:9px; color:#4b5278; background:#fbfaf7; font-size:10px; }
        .ijr-skill svg { color:#b27d50; }
        .ijr-empty-note { color:#85899b; font-size:10px; line-height:1.8; }
        .ijr-side { display:grid; gap:12px; }
        .ijr-resume-card { padding:17px; }
        .ijr-resume-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:9px; }
        .ijr-resume-heading span { display:block; color:#9a7a5f; font-size:8px; letter-spacing:.07em; }
        .ijr-resume-heading h3 { margin:3px 0 0; color:#303866; font:600 16px "Readex Pro",sans-serif; }
        .ijr-resume-heading svg { color:#7b83a9; }
        .ijr-resume-card p { margin:11px 0 15px; color:#777d92; font-size:10px; line-height:1.8; }
        .ijr-download { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:10px 12px; border:0; border-radius:9px; color:#fff; background:#353d75; cursor:pointer; font-size:10px; font-weight:600; transition:background .18s ease,transform .18s ease; }
        .ijr-download:hover { background:#282f61; transform:translateY(-1px); }
        .ijr-secondary-download { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; padding:9px 10px; margin-top:7px; border:1px solid #e4e3e0; border-radius:9px; color:#626984; background:transparent; cursor:pointer; font-size:9px; }
        .ijr-secure { display:flex; gap:10px; align-items:flex-start; padding:14px 15px; border:1px solid #dce7df; border-radius:13px; color:#557163; background:#f3f8f3; }
        .ijr-secure b { display:block; color:#486657; font-size:10px; }
        .ijr-secure small { display:block; margin-top:4px; color:#738479; font-size:9px; line-height:1.7; }
        .ijr-edit-panel { padding:23px 25px 25px; animation:ijr-enter .24s ease both; }
        .ijr-edit-top { display:flex; align-items:center; justify-content:space-between; gap:15px; padding-bottom:18px; margin-bottom:18px; border-bottom:1px solid #eeece7; }
        .ijr-back { display:inline-flex; align-items:center; gap:7px; padding:8px 0; border:0; color:#626a86; background:transparent; cursor:pointer; font-size:10px; }
        .ijr-edit-title { margin:0; color:var(--ij-ink); font:600 19px "Readex Pro",sans-serif; }
        .ijr-edit-intro { margin:5px 0 0; color:#7b8094; font-size:10px; }
        .ijr-form { display:grid; gap:14px; }
        .ijr-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:13px; }
        .ijr-form label { display:grid; gap:6px; color:#545b77; font-size:10px; font-weight:600; }
        .ijr-form input, .ijr-form textarea { width:100%; padding:11px 12px; border:1px solid #e1e0dc; border-radius:9px; outline:none; color:#32395f; background:#fff; font-size:11px; font-weight:400; transition:border-color .18s ease,box-shadow .18s ease; }
        .ijr-form input:focus, .ijr-form textarea:focus { border-color:#8990b6; box-shadow:0 0 0 3px rgba(70,79,137,.09); }
        .ijr-form textarea { resize:vertical; min-height:104px; line-height:1.8; }
        .ijr-form-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; padding-top:5px; }
        .ijr-form-hint { color:#85899a; font-size:9px; }
        .ijr-save { display:inline-flex; align-items:center; gap:7px; padding:10px 15px; border:0; border-radius:9px; color:#fff; background:#333b74; cursor:pointer; font-size:10px; font-weight:600; }
        .ijr-save:hover { background:#272e61; }
        @keyframes ijr-enter { from { opacity:0; transform:translateY(5px); } to { opacity:1; transform:translateY(0); } }
        @media (max-width: 820px) {
          .ijr-page { padding:22px 18px 50px; }
          .ijr-content-grid { grid-template-columns:1fr; }
          .ijr-side { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .ijr-secure { grid-column:1/-1; }
        }
        @media (max-width: 560px) {
          .ijr-page { padding:16px 12px 40px; }
          .ijr-top-note { display:none; }
          .ijr-cover { height:142px; }
          .ijr-cover-orb { left:9%; }
          .ijr-profile-body { padding:0 17px 19px; }
          .ijr-identity-row { align-items:flex-start; flex-direction:column; gap:12px; margin-top:-48px; }
          .ijr-avatar { width:94px; height:94px; }
          .ijr-edit-button { align-self:flex-end; margin-top:-14px; }
          .ijr-identity { padding-top:7px; }
          .ijr-contact-row { display:grid; grid-template-columns:1fr; gap:10px; }
          .ijr-import { align-items:flex-start; flex-direction:column; gap:12px; padding:14px; }
          .ijr-import button { align-self:stretch; justify-content:center; }
          .ijr-tab { min-width:106px; padding:8px 9px; font-size:10px; }
          .ijr-tab-content { padding:19px 16px; }
          .ijr-side { grid-template-columns:1fr; }
          .ijr-secure { grid-column:auto; }
          .ijr-form-grid { grid-template-columns:1fr; }
          .ijr-edit-panel { padding:18px 15px; }
          .ijr-form-actions { align-items:flex-start; flex-direction:column; }
        }
      `}</style>

      <div className="ijr-shell">
        <header className="ijr-topline">
          <div className="ijr-brand">
            <span className="ijr-brand-mark"><Layers3 size={16} /></span>
            <span>فرصتك المهنية تبدأ من هنا</span>
          </div>
          <div className="ijr-top-note"><ShieldCheck size={14} /> مساحة آمنة لمعلوماتك المهنية</div>
        </header>

        <aside className="ijr-tip" role="note">
          <Sparkles className="ijr-tip-icon" size={16} />
          <span>
            <b>نصيحة لتصدير سيرة احترافية</b>
            <small>املأ حقول ملفك المهني باللغة الإنكليزية لتحصل على سيرة واضحة ومرتبة بصيغة ATS.</small>
          </span>
        </aside>

        <section className="ijr-profile-card" aria-label="الملف المهني">
          <div className="ijr-cover">
            <span className="ijr-cover-orb" />
            <span className="ijr-cover-caption"><i /> IRAQ JOBS · PROFILE</span>
          </div>
          <div className="ijr-profile-body">
            <div className="ijr-identity-row">
              <div className="ijr-avatar-wrap">
                <div className="ijr-avatar" aria-label="مساحة الصورة الشخصية قيد التطوير"><UserRound size={39} strokeWidth={1.3} /></div>
                <span className="ijr-photo-status"><Clock3 size={11} /> قيد التطوير</span>
              </div>
              {!editing && (
                <button className="ijr-edit-button" type="button" onClick={startEditing}>
                  <Pencil size={14} /> تعديل المعلومات المهنية
                </button>
              )}
            </div>
            <div className="ijr-identity">
              <div className="ijr-name-line">
                <h1 className="ijr-name">{profile.name}</h1>
                <span className="ijr-verified"><CheckCircle2 size={13} /> باحثة عن عمل</span>
              </div>
              <p className="ijr-title">{profile.title}</p>
              <span className="ijr-specialty"><Award size={13} /> {profile.specialization}</span>
              <div className="ijr-contact-row">
                <span className="ijr-contact-item"><MapPin size={14} /> {profile.city}</span>
                <span className="ijr-contact-item"><Mail size={14} /> <bdi>{profile.email}</bdi></span>
                <span className="ijr-contact-item"><Phone size={14} /> <bdi>{profile.phone}</bdi></span>
              </div>
            </div>
          </div>
        </section>

        {notice && (
          <div className="ijr-notice" role="status">
            <span>{notice}</span>
            <button type="button" onClick={() => setNotice("")} aria-label="إغلاق التنبيه"><Check size={15} /></button>
          </div>
        )}

        <section className="ijr-import">
          <div className="ijr-import-copy">
            <span className="ijr-import-icon"><FileText size={20} /></span>
            <span>
              <b>ارفع سيرتك الذاتية واستخرج بياناتك بسهولة</b>
              <small>استخرج معلوماتك وخبراتك آليًا، ثم راجعها قبل إضافتها إلى ملفك.</small>
            </span>
          </div>
          <button type="button" onClick={() => announce("استيراد السيرة الذاتية قيد التطوير.")}>
            <span>ابدأ رفع السيرة</span><ArrowLeft size={15} />
          </button>
        </section>

        {editing ? (
          <section className="ijr-edit-panel">
            <div className="ijr-edit-top">
              <div>
                <h2 className="ijr-edit-title">معلوماتك المهنية</h2>
                <p className="ijr-edit-intro">عرّف أصحاب العمل بخبرتك وتخصصك ووسائل التواصل المناسبة.</p>
              </div>
              <button type="button" className="ijr-back" onClick={cancelEditing}><ArrowRight size={15} /> العودة إلى الملف</button>
            </div>
            <form className="ijr-form" onSubmit={saveProfile}>
              <div className="ijr-form-grid">
                <label>الاسم الكامل<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
                <label>المسمى الوظيفي<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required /></label>
              </div>
              <div className="ijr-form-grid">
                <label>التخصص<input value={draft.specialization} onChange={(event) => setDraft({ ...draft, specialization: event.target.value })} required /></label>
                <label>المدينة والمحافظة<input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} required /></label>
              </div>
              <div className="ijr-form-grid">
                <label>البريد الإلكتروني<input type="email" dir="ltr" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required /></label>
                <label>رقم الهاتف<input dir="ltr" value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} required /></label>
              </div>
              <label>نبذة مهنية<textarea value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} required /></label>
              <div className="ijr-form-actions">
                <span className="ijr-form-hint">تظهر هذه المعلومات لأصحاب العمل المصرّح لهم.</span>
                <button className="ijr-save" type="submit"><Check size={15} /> حفظ التعديلات</button>
              </div>
            </form>
          </section>
        ) : (
          <div className="ijr-content-grid">
            <section className="ijr-main-panel">
              <div className="ijr-tablist" role="tablist" aria-label="أقسام الملف المهني">
                {tabs.map(({ id, label, icon: Icon, count }) => (
                  <button
                    key={id}
                    type="button"
                    className="ijr-tab"
                    role="tab"
                    aria-selected={activeTab === id}
                    onClick={() => setActiveTab(id)}
                  >
                    <Icon size={15} />
                    {label}
                    {count && <span className="ijr-tab-count">{count}</span>}
                  </button>
                ))}
              </div>
              <div className="ijr-tab-content" role="tabpanel" key={activeTab}>
                {activeTab === "overview" && (
                  <>
                    <div className="ijr-section-head">
                      <div><span className="ijr-kicker">نبذة تعريفية</span><h2>عن نور</h2><p>لمحة قصيرة عن خبرتي وطريقة عملي.</p></div>
                    </div>
                    <div className="ijr-summary"><p>{profile.summary}</p></div>
                    <div className="ijr-about-foot"><CheckCircle2 size={15} /> مهتمة بفرص العمل في تصميم المنتجات وتجربة المستخدم</div>
                  </>
                )}
                {activeTab === "experience" && (
                  <>
                    <div className="ijr-section-head">
                      <div><span className="ijr-kicker">المسار المهني</span><h2>الخبرات العملية</h2><p>خبرة متدرجة في فرق المنتجات الرقمية داخل بغداد.</p></div>
                    </div>
                    <div className="ijr-timeline">
                      <article className="ijr-timeline-item"><span className="ijr-timeline-dot" /><div><h3>مصممة تجربة المستخدم</h3><p>شركة مدار للتقنية · بغداد</p><span className="ijr-time"><Clock3 size={12} /> ٢٠٢٢ — الآن</span><div className="ijr-timeline-copy">أقود البحث مع المستخدمين وأحوّل الملاحظات إلى تدفقات استخدام ونماذج أولية قابلة للاختبار.</div></div></article>
                      <article className="ijr-timeline-item"><span className="ijr-timeline-dot" /><div><h3>مصممة واجهات رقمية</h3><p>استوديو نقطة · بغداد</p><span className="ijr-time"><Clock3 size={12} /> ٢٠٢٠ — ٢٠٢٢</span><div className="ijr-timeline-copy">صممت واجهات تطبيقات ومواقع، وشاركت في بناء مكتبة مكونات لفريق التطوير.</div></div></article>
                      <article className="ijr-timeline-item"><span className="ijr-timeline-dot" /><div><h3>متدربة تصميم</h3><p>مبادرة مساحة · بغداد</p><span className="ijr-time"><Clock3 size={12} /> ٢٠١٩ — ٢٠٢٠</span></div></article>
                    </div>
                  </>
                )}
                {activeTab === "education" && (
                  <>
                    <div className="ijr-section-head">
                      <div><span className="ijr-kicker">التعليم والمعرفة</span><h2>التعليم</h2><p>المؤهلات العلمية والتدريب المهني.</p></div>
                    </div>
                    <article className="ijr-education-card">
                      <span className="ijr-education-icon"><GraduationCap size={20} /></span>
                      <div><h3>بكالوريوس علوم الحاسوب</h3><p>الجامعة المستنصرية · بغداد</p><small>٢٠١٥ — ٢٠١٩</small></div>
                    </article>
                    <article className="ijr-education-card" style={{ marginTop: 10 }}>
                      <span className="ijr-education-icon"><Award size={19} /></span>
                      <div><h3>أساسيات أبحاث تجربة المستخدم</h3><p>منصة إدراك للتعلّم</p><small>شهادة مهنية · ٢٠٢١</small></div>
                    </article>
                  </>
                )}
                {activeTab === "skills" && (
                  <>
                    <div className="ijr-section-head">
                      <div><span className="ijr-kicker">نقاط القوة</span><h2>المهارات المهنية</h2><p>مهارات تساعد أصحاب العمل على اكتشاف خبرتك.</p></div>
                    </div>
                    <div className="ijr-skills">
                      {["تصميم تجربة المستخدم", "Figma", "أبحاث المستخدمين", "تصميم الواجهات", "أنظمة التصميم"].map((skill) => <span className="ijr-skill" key={skill}><Sparkles size={13} />{skill}</span>)}
                    </div>
                    <p className="ijr-empty-note" style={{ marginTop: 17 }}>تتطور المهارات مع كل مشروع جديد؛ أضيفي المهارات الأقرب إلى نوع الفرص التي تبحثين عنها.</p>
                  </>
                )}
              </div>
            </section>

            <aside className="ijr-side" aria-label="تنزيل السيرة الذاتية">
              <article className="ijr-resume-card">
                <div className="ijr-resume-heading"><div><span>ENGLISH APPLICATION VERSION</span><h3>ATS Resume</h3></div><FileText size={19} /></div>
                <p>نسخة إنكليزية رسمية بخط واضح وترتيب مناسب لأنظمة التوظيف الآلية.</p>
                <button type="button" className="ijr-download" onClick={() => announce("تصدير نسخة Word ATS غير متاح في هذا النموذج.")}><ArrowDownToLine size={15} /> تنزيل Word ATS</button>
                <button type="button" className="ijr-secondary-download" onClick={() => announce("حفظ نسخة ATS بصيغة PDF غير متاح في هذا النموذج.")}>حفظ ATS كـ PDF</button>
              </article>
              <article className="ijr-resume-card">
                <div className="ijr-resume-heading"><div><span>DESIGNED APPLICATION VERSION</span><h3>Professional CV</h3></div><FileText size={19} /></div>
                <p>نسخة إنكليزية بتصميم احترافي وتفاصيل واضحة، منفصلة عن نسخة ATS.</p>
                <button type="button" className="ijr-download" onClick={() => announce("تصدير السيرة الاحترافية غير متاح في هذا النموذج.")}><ArrowDownToLine size={15} /> تنزيل Word احترافي</button>
                <button type="button" className="ijr-secondary-download" onClick={() => announce("حفظ السيرة الاحترافية بصيغة PDF غير متاح في هذا النموذج.")}>حفظ PDF احترافي</button>
              </article>
              <div className="ijr-secure"><ShieldCheck size={17} /><span><b>ملفك ضمن مساحة آمنة</b><small>تظهر معلوماتك لأصحاب العمل المصرّح لهم فقط.</small></span></div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
