import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, Download, FileText, GraduationCap, Languages, Mail, MapPin, Pencil, Phone, Plus, Printer, RotateCw, Save, ShieldCheck, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { AppSelect } from "../../components/common/AppSelect";
import { MonthYearField } from "../../components/common/MonthYearField";
import type { View } from "../../app/types";
import type { CandidateProfile, CandidateProfileInput, Profile } from "../../lib/types";
import { hasSupabaseConfig } from "../../lib/supabase";
import { clearCandidateProfileDraft, formatCandidateExperiencePeriod, formatCandidateLanguages, getCachedCandidateProfile, getCandidateProfileDraft, languageLevels, loadCandidateProfile, parseCandidateEducation, parseCandidateExperiences, parseCandidateLanguages, saveCandidateProfile, saveCandidateProfileDraft, serializeCandidateEducation, serializeCandidateExperiences, type CandidateEducation, type CandidateExperience, type CandidateLanguage, type LanguageLevel } from "../../services/candidateService";
import { downloadAtsResume, printAtsResume } from "../../features/candidate/atsResume";
import { downloadProfessionalResume, printProfessionalResume } from "../../features/candidate/professionalResume";
import type { CandidateCvImport } from "../../features/candidate/cvImport";
import { CandidateCvImportPage } from "./CandidateCvImportPage";
import "./candidate-profile-page.css";

type CandidatePageProps = {
  profile: Profile;
  onNavigate: (view: View) => void;
  onProfileUpdated?: () => void;
  onNotify?: (message: string) => void;
  showCvImport?: boolean;
};

type ExperienceEntry = CandidateExperience;
type EducationEntry = CandidateEducation;
type CandidateProfileSection = "identity" | "skills" | "experience" | "education" | "preferences";
const candidateProfileSections: CandidateProfileSection[] = ["identity", "skills", "experience", "education", "preferences"];

type AutosaveStatus = "loading" | "idle" | "pending" | "saving" | "saved" | "error" | "unavailable";

function normalizeImportedKey(value: string) {
  return value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function mergeImportedStrings(current: string[], incoming: string[]) {
  const seen = new Set(current.map(normalizeImportedKey));
  const additions = incoming.filter((value) => {
    const key = normalizeImportedKey(value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...current, ...additions];
}

function mergeImportedEntries<T>(current: T[], incoming: T[], getKey: (entry: T) => string) {
  const seen = new Set(current.map(getKey).filter(Boolean));
  const additions = incoming.filter((entry) => {
    const key = getKey(entry);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...current, ...additions];
}

function keepExistingText(existing: string, imported?: string) {
  return existing.trim() || !imported?.trim() ? existing : imported;
}

function buildProfilePayload(
  form: CandidateProfileInput,
  experiences: ExperienceEntry[],
  education: EducationEntry[],
  languages: CandidateLanguage[],
): CandidateProfileInput {
  return {
    ...form,
    education: serializeCandidateEducation(education),
    languages: formatCandidateLanguages(languages),
    experience_details: serializeCandidateExperiences(experiences),
  };
}

function toInput(profile: CandidateProfile | null, account: Profile): CandidateProfileInput {
  return {
    full_name: profile?.full_name || account.full_name || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    headline: profile?.headline || "",
    specialization: profile?.specialization || "",
    province: profile?.province || "",
    city: profile?.city || "",
    experience_years: profile?.experience_years || 0,
    skills: profile?.skills || [],
    experience_details: profile?.experience_details || "",
    education: profile?.education || "",
    languages: profile?.languages || [],
    work_type: profile?.work_type || "",
    remote_available: profile?.remote_available || false,
    expected_salary_min: profile?.expected_salary_min ?? null,
    availability: profile?.availability || "",
    summary: profile?.summary || "",
  };
}

function localMonthValue() {
  const currentDate = new Date();
  return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`;
}

export function CandidatePage({ profile, onNavigate, onProfileUpdated, onNotify, showCvImport = false }: CandidatePageProps) {
  const cachedProfile = getCachedCandidateProfile(profile.id);
  const initialDraft = getCandidateProfileDraft(profile.id);
  const cachedProfileUpdatedAt = cachedProfile?.updated_at ? Date.parse(cachedProfile.updated_at) : Number.NaN;
  const initialForm = initialDraft && (
    !cachedProfile ||
    !Number.isFinite(cachedProfileUpdatedAt) ||
    initialDraft.savedAt > cachedProfileUpdatedAt
  )
    ? initialDraft.payload
    : toInput(cachedProfile ?? null, profile);
  const [form, setForm] = useState<CandidateProfileInput>(initialForm);
  const [experiences, setExperiences] = useState<ExperienceEntry[]>(() => parseCandidateExperiences(initialForm.experience_details));
  const [education, setEducation] = useState<EducationEntry[]>(() => parseCandidateEducation(initialForm.education));
  const [languages, setLanguages] = useState<CandidateLanguage[]>(() => parseCandidateLanguages(initialForm.languages));
  const [activeSection, setActiveSection] = useState<CandidateProfileSection>("identity");
  const [skillDraft, setSkillDraft] = useState("");
  const [loading, setLoading] = useState(hasSupabaseConfig && cachedProfile === undefined);
  const [error, setError] = useState("");
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>(
    !hasSupabaseConfig ? "unavailable" : cachedProfile === undefined ? "loading" : "idle",
  );
  const [autosaveError, setAutosaveError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [reloadCount, setReloadCount] = useState(0);
  const loadedRef = useRef(false);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestSaveRef = useRef<{ payload: CandidateProfileInput; signature: string } | null>(null);
  const queuedSaveRef = useRef<{ payload: CandidateProfileInput; signature: string } | null>(null);
  const inFlightSignatureRef = useRef("");
  const lastSavedSignatureRef = useRef("");
  const processingSaveRef = useRef(false);
  const flushAutosaveRef = useRef<() => void>(() => undefined);

  const handleProfileTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, currentSection: CandidateProfileSection) => {
    const currentIndex = candidateProfileSections.indexOf(currentSection);
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = candidateProfileSections.length - 1;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex + 1) % candidateProfileSections.length;
    else if (event.key === "ArrowRight") nextIndex = (currentIndex - 1 + candidateProfileSections.length) % candidateProfileSections.length;
    else return;

    event.preventDefault();
    const nextSection = candidateProfileSections[nextIndex];
    setActiveSection(nextSection);
    document.getElementById(`candidate-tab-${nextSection}`)?.focus();
  };

  const processAutosaveQueue = useCallback(async () => {
    if (processingSaveRef.current) return;
    processingSaveRef.current = true;
    try {
      while (queuedSaveRef.current) {
        const queued = queuedSaveRef.current;
        queuedSaveRef.current = null;
        if (queued.signature !== latestSaveRef.current?.signature) continue;
        inFlightSignatureRef.current = queued.signature;
        try {
          const result = await saveCandidateProfile(profile.id, queued.payload);
          if (result.error) {
            if (latestSaveRef.current?.signature === queued.signature && mountedRef.current) {
              setAutosaveError("تعذر حفظ التعديلات. تحقق من الاتصال ثم أعد المحاولة.");
              setAutosaveStatus("error");
            }
            continue;
          }
          clearCandidateProfileDraft(profile.id, queued.signature);
          lastSavedSignatureRef.current = queued.signature;
          if (latestSaveRef.current?.signature === queued.signature && mountedRef.current) {
            setAutosaveError("");
            setAutosaveStatus("saved");
            onProfileUpdated?.();
          }
        } catch {
          if (latestSaveRef.current?.signature === queued.signature && mountedRef.current) {
            setAutosaveError("تعذر حفظ التعديلات. تحقق من الاتصال ثم أعد المحاولة.");
            setAutosaveStatus("error");
          }
        } finally {
          inFlightSignatureRef.current = "";
        }
      }
    } finally {
      processingSaveRef.current = false;
    }
  }, [onProfileUpdated, profile.id]);

  const enqueueAutosave = useCallback((payload: CandidateProfileInput, signature: string) => {
    if (!hasSupabaseConfig || !loadedRef.current || signature === lastSavedSignatureRef.current) return;
    if (signature === inFlightSignatureRef.current || queuedSaveRef.current?.signature === signature) return;
    queuedSaveRef.current = { payload, signature };
    if (mountedRef.current) setAutosaveStatus("saving");
    void processAutosaveQueue();
  }, [processAutosaveQueue]);

  const flushAutosave = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const latest = latestSaveRef.current;
    if (latest && latest.signature !== lastSavedSignatureRef.current) {
      enqueueAutosave(latest.payload, latest.signature);
    }
  }, [enqueueAutosave]);
  flushAutosaveRef.current = flushAutosave;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      flushAutosaveRef.current();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    loadedRef.current = false;
    queuedSaveRef.current = null;
    latestSaveRef.current = null;
    setError("");
    if (!hasSupabaseConfig) {
      setLoading(false);
      setAutosaveStatus("unavailable");
      return;
    }
    if (getCachedCandidateProfile(profile.id) === undefined) {
      setLoading(true);
      setAutosaveStatus("loading");
    }
    void loadCandidateProfile(profile.id).then((result) => {
      if (!active) return;
      if (result.error) {
        setError("تعذر تحميل ملفك المهني، لم تُحفظ أي تعديلات حتى لا يُستبدل محتوى غير محمّل.");
        setAutosaveStatus("error");
        setLoading(false);
        return;
      }
      const cloudForm = toInput(result.profile, profile);
      const cloudLanguages = parseCandidateLanguages(cloudForm.languages);
      const cloudExperiences = parseCandidateExperiences(cloudForm.experience_details);
      const cloudEducation = parseCandidateEducation(cloudForm.education);
      const cloudBaseline = buildProfilePayload(cloudForm, cloudExperiences, cloudEducation, cloudLanguages);
      const cloudSignature = JSON.stringify(cloudBaseline);
      const localDraft = getCandidateProfileDraft(profile.id);
      const cloudUpdatedAt = result.profile?.updated_at ? Date.parse(result.profile.updated_at) : Number.NaN;
      const useLocalDraft = Boolean(localDraft && localDraft.signature !== cloudSignature && (
        !result.profile ||
        !Number.isFinite(cloudUpdatedAt) ||
        localDraft.savedAt > cloudUpdatedAt
      ));
      const nextForm = useLocalDraft && localDraft ? localDraft.payload : cloudForm;
      const nextLanguages = useLocalDraft && localDraft
        ? parseCandidateLanguages(localDraft.payload.languages)
        : cloudLanguages;
      const nextExperiences = useLocalDraft && localDraft
        ? parseCandidateExperiences(localDraft.payload.experience_details)
        : cloudExperiences;
      const nextEducation = useLocalDraft && localDraft
        ? parseCandidateEducation(localDraft.payload.education)
        : cloudEducation;
      const selectedPayload = buildProfilePayload(nextForm, nextExperiences, nextEducation, nextLanguages);
      const selectedSignature = JSON.stringify(selectedPayload);
      setForm(nextForm);
      setLanguages(nextLanguages);
      setExperiences(nextExperiences);
      setEducation(nextEducation);
      lastSavedSignatureRef.current = cloudSignature;
      latestSaveRef.current = { payload: selectedPayload, signature: selectedSignature };
      if (!useLocalDraft && localDraft) clearCandidateProfileDraft(profile.id, localDraft.signature);
      loadedRef.current = true;
      setAutosaveStatus("idle");
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [profile.id, profile.full_name, reloadCount]);

  useEffect(() => {
    if (!hasSupabaseConfig || !loadedRef.current) return;
    const payload = buildProfilePayload(form, experiences, education, languages);
    const signature = JSON.stringify(payload);
    saveCandidateProfileDraft(profile.id, payload);
    latestSaveRef.current = { payload, signature };
    if (queuedSaveRef.current && queuedSaveRef.current.signature !== signature) {
      queuedSaveRef.current = null;
    }
    if (signature === lastSavedSignatureRef.current) {
      setAutosaveStatus("saved");
      setAutosaveError("");
      return;
    }
    setAutosaveStatus("pending");
    setAutosaveError("");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      enqueueAutosave(payload, signature);
    }, 650);
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [education, enqueueAutosave, experiences, form, languages, profile.id, retryCount]);

  const update = <K extends keyof CandidateProfileInput>(key: K, value: CandidateProfileInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const applyCvImport = (imported: CandidateCvImport, replaceExisting = false) => {
    setForm((current) => ({
      ...current,
      full_name: replaceExisting && imported.profile.full_name?.trim() ? imported.profile.full_name : keepExistingText(current.full_name, imported.profile.full_name),
      email: replaceExisting && imported.profile.email?.trim() ? imported.profile.email : keepExistingText(current.email, imported.profile.email),
      phone: replaceExisting && imported.profile.phone?.trim() ? imported.profile.phone : keepExistingText(current.phone, imported.profile.phone),
      headline: replaceExisting && imported.profile.headline?.trim() ? imported.profile.headline : keepExistingText(current.headline, imported.profile.headline),
      specialization: replaceExisting && imported.profile.specialization?.trim() ? imported.profile.specialization : keepExistingText(current.specialization, imported.profile.specialization),
      province: replaceExisting && imported.profile.province?.trim() ? imported.profile.province : keepExistingText(current.province, imported.profile.province),
      city: replaceExisting && imported.profile.city?.trim() ? imported.profile.city : keepExistingText(current.city, imported.profile.city),
      summary: replaceExisting && imported.profile.summary?.trim() ? imported.profile.summary : keepExistingText(current.summary, imported.profile.summary),
      experience_years: replaceExisting && imported.profile.experience_years !== undefined
        ? imported.profile.experience_years
        : current.experience_years > 0
          ? current.experience_years
          : imported.profile.experience_years ?? current.experience_years,
      skills: replaceExisting && imported.profile.skills?.length
        ? imported.profile.skills
        : mergeImportedStrings(current.skills, imported.profile.skills || []),
    }));
    setExperiences((current) => replaceExisting && imported.experiences.length
      ? imported.experiences
      : mergeImportedEntries(
        current,
        imported.experiences,
        (entry) => [
          entry.title,
          entry.company,
          entry.legacyPeriod || `${entry.startMonth}-${entry.endMonth}`,
          entry.location,
          entry.description,
        ].map(normalizeImportedKey).join("|"),
      ));
    setEducation((current) => replaceExisting && imported.education.length
      ? imported.education
      : mergeImportedEntries(
        current,
        imported.education,
        (entry) => [entry.degree, entry.specialization, entry.institution, entry.graduationYear]
          .map(normalizeImportedKey).join("|"),
      ));
    setLanguages((current) => replaceExisting && imported.languages.length
      ? imported.languages
      : mergeImportedEntries(
        current,
        imported.languages,
        (entry) => normalizeImportedKey(entry.name),
      ));
    setActiveSection(
      imported.experiences.length
        ? "experience"
        : imported.education.length || imported.languages.length
          ? "education"
          : imported.profile.skills?.length
            ? "skills"
            : "identity",
    );
    onNotify?.(replaceExisting
      ? "تم استبدال البيانات الموجودة بالنتائج التي راجعتها. سيُحفظ الملف تلقائيًا."
      : "تمت إضافة البيانات إلى الحقول الفارغة. راجع ملفك، وسيُحفظ تلقائيًا.");
  };

  const addSkill = () => {
    const nextSkill = skillDraft.trim();
    if (!nextSkill || form.skills.some((skill) => skill.toLocaleLowerCase() === nextSkill.toLocaleLowerCase())) return;
    update("skills", [...form.skills, nextSkill]);
    setSkillDraft("");
  };

  const removeSkill = (skillToRemove: string) => {
    update("skills", form.skills.filter((skill) => skill !== skillToRemove));
  };

  const addExperience = () => {
    setExperiences((current) => [...current, {
      id: `experience-${Date.now()}`,
      title: "",
      company: "",
      location: "",
      startMonth: "",
      endMonth: "",
      isCurrent: false,
      legacyPeriod: "",
      description: "",
    }]);
  };

  const updateExperience = <K extends keyof ExperienceEntry>(id: string, key: K, value: ExperienceEntry[K]) => {
    setExperiences((current) => current.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [key]: value };
      if (key === "startMonth" || key === "endMonth") next.legacyPeriod = "";
      if (key === "startMonth" && typeof value === "string" && value && next.endMonth && next.endMonth < value) {
        next.endMonth = value;
      }
      if (key === "endMonth" && value) next.isCurrent = false;
      if (key === "isCurrent" && value) next.endMonth = "";
      return next;
    }));
  };

  const removeExperience = (id: string) => {
    setExperiences((current) => current.filter((item) => item.id !== id));
  };

  const addEducation = () => {
    setEducation((current) => [...current, {
      id: `education-${Date.now()}`,
      degree: "",
      specialization: "",
      institution: "",
      graduationYear: "",
    }]);
  };

  const updateEducation = <K extends keyof EducationEntry>(id: string, key: K, value: EducationEntry[K]) => {
    setEducation((current) => current.map((item) => item.id === id ? { ...item, [key]: value } : item));
  };

  const removeEducation = (id: string) => {
    setEducation((current) => current.filter((item) => item.id !== id));
  };

  const addLanguage = () => {
    setLanguages((current) => [...current, { name: "", level: "" }]);
  };

  const updateLanguage = <K extends keyof CandidateLanguage>(index: number, key: K, value: CandidateLanguage[K]) => {
    setLanguages((current) => current.map((language, languageIndex) => languageIndex === index ? { ...language, [key]: value } : language));
  };

  const removeLanguage = (index: number) => {
    setLanguages((current) => current.filter((_, languageIndex) => languageIndex !== index));
  };

  const completedExperiences = experiences.filter((experience) =>
    [experience.title, experience.company, experience.location, experience.startMonth, experience.endMonth, experience.legacyPeriod, experience.description]
      .some((value) => value.trim()) || experience.isCurrent,
  );
  const hasFullName = Boolean(form.full_name.trim());
  const hasHeadline = Boolean(form.headline.trim());
  const hasSpecialization = Boolean(form.specialization.trim());
  const hasProvince = Boolean(form.province.trim());
  const hasCity = Boolean(form.city.trim());
  const hasSkills = form.skills.some((skill) => skill.trim());
  const hasExperience = completedExperiences.length > 0;
  const hasEducation = education.some((entry) => [entry.degree, entry.specialization, entry.institution, entry.graduationYear].some((value) => value.trim()));
  const hasSummary = Boolean(form.summary.trim());
  const completeness = useMemo(() => {
    const checks = [
      hasFullName,
      hasHeadline,
      hasSpecialization,
      hasProvince,
      hasCity,
      hasSkills,
      hasExperience,
      hasEducation,
      hasSummary,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [hasCity, hasEducation, hasExperience, hasFullName, hasHeadline, hasProvince, hasSkills, hasSpecialization, hasSummary]);
  const canExportAts = Boolean(form.full_name.trim() && form.headline.trim() && form.email.trim() && form.phone.trim() && form.summary.trim());
  const currentMonth = localMonthValue();
  const autosaveMessage = !hasSupabaseConfig
    ? "الحفظ التلقائي غير متاح في وضع المعاينة."
    : autosaveStatus === "loading"
      ? "جاري تحميل بيانات الملف..."
      : autosaveStatus === "pending"
        ? "سيتم الحفظ تلقائيًا بعد توقفك عن الكتابة."
        : autosaveStatus === "saving"
          ? "جاري حفظ التعديلات..."
          : autosaveStatus === "saved"
            ? "تم حفظ آخر التعديلات."
            : autosaveStatus === "error"
              ? error || autosaveError || "تعذر حفظ التعديلات."
              : "تُحفظ التعديلات تلقائيًا أثناء التحرير.";

  const atsData = () => ({
    ...form,
    education: education.map((entry) => [
      entry.degree,
      entry.specialization ? `Specialization: ${entry.specialization}` : "",
      entry.institution ? `Institution: ${entry.institution}` : "",
      entry.graduationYear ? `Graduation year: ${entry.graduationYear}` : "",
    ].filter(Boolean).join(" | ")).filter(Boolean).join("\n"),
    languages,
    experiences,
  });

  const exportAts = () => {
    if (!canExportAts) {
      onNotify?.("أكمل الاسم والمسمى والبريد والهاتف والنبذة أولاً حتى نخرج سيرة قوية.");
      return;
    }
    downloadAtsResume(atsData());
    onNotify?.("تم تنزيل ملف Word لـ ATS ويمكنك تعديله.");
  };

  const printAts = () => {
    if (!canExportAts) {
      onNotify?.("أكمل البيانات الأساسية أولاً حتى نجهز نسخة PDF مرتبة.");
      return;
    }
    if (!printAtsResume(atsData())) onNotify?.("اسمح بفتح نافذة جديدة حتى تتمكن من حفظ ATS كـ PDF.");
  };

  const exportProfessionalResume = () => {
    if (!canExportAts) {
      onNotify?.("أكمل الاسم والمسمى والبريد والهاتف والنبذة أولاً حتى نخرج سيرة قوية.");
      return;
    }
    downloadProfessionalResume(atsData());
    onNotify?.("تم تنزيل السيرة الاحترافية بصيغة Word.");
  };

  const printProfessionalResumePdf = () => {
    if (!canExportAts) {
      onNotify?.("أكمل البيانات الأساسية أولاً حتى نجهز نسخة PDF مرتبة.");
      return;
    }
    if (!printProfessionalResume(atsData())) onNotify?.("اسمح بفتح نافذة جديدة حتى تتمكن من حفظ السيرة الاحترافية كـ PDF.");
  };

  if (loading) {
    return <section className="container page-section centered-state"><span className="live-dot" /><p>جاري تحميل ملفك المهني...</p></section>;
  }

  if (showCvImport) {
    return <CandidateCvImportPage
      onBack={() => onNavigate("candidate")}
      onImport={(imported, replaceExisting) => {
        applyCvImport(imported, replaceExisting);
        onNavigate("candidate");
      }}
    />;
  }

  return <section className="container page-section dashboard-page candidate-profile-page">
    <aside className="candidate-english-tip" role="note">
      <span className="candidate-english-tip-icon" aria-hidden="true"><Languages size={18} /></span>
      <span>
        <b>نصيحة لتصدير سيرة احترافية</b>
        <small>املأ حقول ملفك المهني باللغة الإنكليزية لتحصل على سيرة واضحة ومرتبة بصيغة ATS.</small>
      </span>
    </aside>
    <header className="candidate-identity-header" dir="rtl">
      <div className="candidate-avatar-wrap">
        <div className="candidate-avatar-placeholder" role="img" aria-label="صورة شخصية افتراضية">{form.full_name.trim().charAt(0) || "م"}</div>
        <small>رفع الصورة الشخصية قيد التطوير — قريبًا</small>
      </div>
      <div className="candidate-identity-copy">
        <div className="candidate-identity-title">
          <div>
            <span className="eyebrow">ملف الباحث عن عمل</span>
            <h1>{form.full_name || "الاسم الكامل"}</h1>
            <p>{form.specialization || "التخصص"} <span aria-hidden="true">·</span> {form.headline || "المسمى الوظيفي"}</p>
          </div>
          <button type="button" className="candidate-identity-edit" onClick={() => setActiveSection("identity")} aria-label="تعديل المعلومات المهنية" title="تعديل المعلومات المهنية">
            <Pencil size={16} /><span>تعديل</span>
          </button>
        </div>
        <div className="candidate-identity-details">
          <span><MapPin size={15} /> {[form.city, form.province].filter(Boolean).join("، ") || "أضف المدينة والمحافظة"}</span>
          <span><Mail size={15} /> <bdi dir="ltr">{form.email || "البريد الإلكتروني"}</bdi></span>
          <span><Phone size={15} /> <bdi dir="ltr">{form.phone || "رقم الهاتف"}</bdi></span>
        </div>
      </div>
      <div className="candidate-identity-utility">
        <div className="candidate-hero-score" aria-label={`اكتمال الملف ${completeness}%`}>
          <strong>{completeness}%</strong><span>اكتمال الملف</span>
        </div>
        <div className="candidate-hero-actions">
          <button type="button" className="candidate-hero-primary" onClick={() => onNavigate("jobs")}><BriefcaseBusiness size={15} /> استكشف الوظائف</button>
          <button type="button" className="candidate-hero-secondary" onClick={() => onNavigate("applied")}><CheckCircle2 size={15} /> تقديماتي</button>
        </div>
      </div>
    </header>
    <div className="candidate-profile-grid">
      <form
        className="candidate-profile-form candidate-profile-editor"
        onSubmit={(event) => event.preventDefault()}
        onBlurCapture={(event) => {
          if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) {
            flushAutosaveRef.current();
          }
        }}
      >
        <div className={`candidate-autosave-status ${autosaveStatus}`} role="status" aria-live="polite">
          <span className="candidate-autosave-icon">
            {autosaveStatus === "saved" ? <CheckCircle2 size={16} /> : autosaveStatus === "error" ? <X size={16} /> : <Save size={16} />}
          </span>
          <span className="candidate-autosave-copy">
            <b>{autosaveStatus === "error" ? "تعذر الحفظ" : "الحفظ التلقائي"}</b>
            <small>{autosaveMessage}</small>
          </span>
          {autosaveStatus === "error" && <button type="button" onClick={() => loadedRef.current ? setRetryCount((count) => count + 1) : setReloadCount((count) => count + 1)}><RotateCw size={14} /> {loadedRef.current ? "إعادة المحاولة" : "إعادة تحميل الملف"}</button>}
        </div>

        <div className="candidate-cv-import-entry">
          <span className="candidate-cv-import-entry-icon"><FileText size={20} /></span>
          <div className="candidate-cv-import-entry-copy">
            <b>ارفع سيرتك الذاتية واستخرج بياناتك بسهولة</b>
            <small>استخرج معلوماتك وخبراتك آليًا أو بالذكاء الاصطناعي، ثم راجعها قبل إضافتها إلى ملفك.</small>
          </div>
          <button type="button" onClick={() => onNavigate("candidate-cv-import")}>
            <span>ابدأ رفع السيرة</span><ArrowRight size={16} />
          </button>
        </div>

        <div className="candidate-profile-tabs" role="tablist" aria-label="أقسام الملف المهني" dir="rtl">
          <button type="button" role="tab" id="candidate-tab-identity" tabIndex={activeSection === "identity" ? 0 : -1} aria-selected={activeSection === "identity"} aria-controls="candidate-panel-identity" className={activeSection === "identity" ? "active" : ""} onClick={() => setActiveSection("identity")} onKeyDown={(event) => handleProfileTabKeyDown(event, "identity")}><FileText size={16} /><span>المعلومات المهنية</span></button>
          <button type="button" role="tab" id="candidate-tab-skills" tabIndex={activeSection === "skills" ? 0 : -1} aria-selected={activeSection === "skills"} aria-controls="candidate-panel-skills" className={activeSection === "skills" ? "active" : ""} onClick={() => setActiveSection("skills")} onKeyDown={(event) => handleProfileTabKeyDown(event, "skills")}><Sparkles size={16} /><span>المهارات والخبرة</span></button>
          <button type="button" role="tab" id="candidate-tab-experience" tabIndex={activeSection === "experience" ? 0 : -1} aria-selected={activeSection === "experience"} aria-controls="candidate-panel-experience" className={activeSection === "experience" ? "active" : ""} onClick={() => setActiveSection("experience")} onKeyDown={(event) => handleProfileTabKeyDown(event, "experience")}><BriefcaseBusiness size={16} /><span>الخبرات العملية</span></button>
          <button type="button" role="tab" id="candidate-tab-education" tabIndex={activeSection === "education" ? 0 : -1} aria-selected={activeSection === "education"} aria-controls="candidate-panel-education" className={activeSection === "education" ? "active" : ""} onClick={() => setActiveSection("education")} onKeyDown={(event) => handleProfileTabKeyDown(event, "education")}><GraduationCap size={16} /><span>التعليم واللغات</span></button>
          <button type="button" role="tab" id="candidate-tab-preferences" tabIndex={activeSection === "preferences" ? 0 : -1} aria-selected={activeSection === "preferences"} aria-controls="candidate-panel-preferences" className={activeSection === "preferences" ? "active" : ""} onClick={() => setActiveSection("preferences")} onKeyDown={(event) => handleProfileTabKeyDown(event, "preferences")}><MapPin size={16} /><span>تفضيلات العمل</span></button>
        </div>

        <section hidden={activeSection !== "identity"} className="profile-editor-section profile-tab-panel" role="tabpanel" tabIndex={0} id="candidate-panel-identity" aria-labelledby="candidate-tab-identity">
          <div className="profile-section-body">
            <div className="form-grid"><label>الاسم الكامل<input required value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="مثال: أحمد محمد" /></label><label>المسمى الوظيفي<input required value={form.headline} onChange={(event) => update("headline", event.target.value)} placeholder="مثال: مطور واجهات أمامية" /></label></div>
            <div className="form-grid"><label>التخصص<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} placeholder="مثال: برمجيات، محاسبة، تسويق" /></label><label>المحافظة<input required value={form.province} onChange={(event) => update("province", event.target.value)} placeholder="بغداد" /></label></div>
            <div className="form-grid"><label>المدينة<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="بغداد" /></label><label>البريد الإلكتروني<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} dir="ltr" /></label></div>
            <div className="form-grid"><label>رقم الهاتف<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} dir="ltr" /></label></div>
            <label>نبذة مهنية<textarea required rows={3} value={form.summary} onChange={(event) => update("summary", event.target.value)} placeholder="اكتب بإيجاز عن خبرتك، أسلوبك، والقيمة التي تقدمها..." /></label>
          </div>
        </section>

        <section hidden={activeSection !== "skills"} className="profile-editor-section profile-tab-panel" role="tabpanel" tabIndex={0} id="candidate-panel-skills" aria-labelledby="candidate-tab-skills">
          <div className="profile-section-body">
            <div className="skill-entry-row"><input value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} placeholder="اكتب مهارة مثل React أو إدارة المشاريع" aria-label="مهارة جديدة" /><button type="button" className="add-skill-btn" onClick={addSkill}><Plus size={17} /> إضافة مهارة</button></div>
            <div className="editable-skill-list">{form.skills.map((skill) => <span className="editable-skill" key={skill}>{skill}<button type="button" onClick={() => removeSkill(skill)} aria-label={`حذف ${skill}`}><X size={13} /></button></span>)}{form.skills.length === 0 && <span className="profile-empty-hint">ابدأ بأهم مهاراتك المهنية.</span>}</div>
            <div className="form-grid single-label-row"><label>سنوات الخبرة<input type="number" min="0" max="60" value={form.experience_years} onChange={(event) => update("experience_years", Number(event.target.value) || 0)} /></label><label className="checkbox-field"><input type="checkbox" checked={form.remote_available} onChange={(event) => update("remote_available", event.target.checked)} /><span>أقبل العمل عن بُعد</span></label></div>
          </div>
        </section>

        <section hidden={activeSection !== "experience"} className="profile-editor-section profile-tab-panel" role="tabpanel" tabIndex={0} id="candidate-panel-experience" aria-labelledby="candidate-tab-experience">
          <div className="profile-section-body">
            <div className="profile-section-toolbar"><span>ترتيب زمني واضح يساعد أصحاب العمل على المتابعة.</span><button type="button" className="outline-btn add-experience-btn" onClick={addExperience}><Plus size={16} /> إضافة خبرة</button></div>
            <div className="experience-editor-list">{experiences.map((experience, index) => <article className="experience-editor-card" key={experience.id}>
              <div className="experience-card-top"><span className="experience-number">{String(index + 1).padStart(2, "0")}</span><div><b>{experience.title || "خبرة جديدة"}</b><small>{experience.company || "أضف جهة العمل والمدة"}</small></div><button type="button" className="remove-experience-btn" onClick={() => removeExperience(experience.id)} aria-label={`حذف الخبرة ${index + 1}`}><Trash2 size={16} /></button></div>
              <div className="form-grid"><label>المسمى الوظيفي<input value={experience.title} onChange={(event) => updateExperience(experience.id, "title", event.target.value)} placeholder="مثال: مسؤول تسويق" /></label><label>جهة العمل<input value={experience.company} onChange={(event) => updateExperience(experience.id, "company", event.target.value)} placeholder="اسم الشركة أو المشروع" /></label></div>
              {(experience.legacyPeriod || experience.startMonth || experience.endMonth) && <div className="experience-period-readout"><CalendarDays size={14} /><span>{experience.legacyPeriod ? <>المدة المحفوظة كما أُدخلت: <b dir="auto">{experience.legacyPeriod}</b></> : <>{formatCandidateExperiencePeriod(experience)}</>}</span></div>}
              <div className="form-grid experience-date-grid">
                <label>من شهر / سنة<MonthYearField value={experience.startMonth} maxValue={currentMonth} onChange={(value) => updateExperience(experience.id, "startMonth", value)} ariaLabel={`تاريخ بداية ${experience.title || "الخبرة"}`} /></label>
                <label>إلى شهر / سنة<MonthYearField value={experience.endMonth} minValue={experience.startMonth} maxValue={currentMonth} disabled={experience.isCurrent} onChange={(value) => updateExperience(experience.id, "endMonth", value)} ariaLabel={`تاريخ نهاية ${experience.title || "الخبرة"}`} /></label>
                <label className="checkbox-field experience-current-field"><input type="checkbox" checked={experience.isCurrent} onChange={(event) => updateExperience(experience.id, "isCurrent", event.target.checked)} /><span>ما زلت أعمل هنا</span></label>
                <label>الموقع<input value={experience.location} onChange={(event) => updateExperience(experience.id, "location", event.target.value)} placeholder="بغداد / عن بُعد" /></label>
              </div>
              {experience.startMonth && experience.endMonth && experience.endMonth < experience.startMonth && <p className="experience-date-error" role="alert">تاريخ نهاية الخبرة أسبق من تاريخ بدايتها؛ غيّر أحد الشهرين لتصحيح الفترة.</p>}
              <label>أبرز المسؤوليات والإنجازات<textarea rows={2} value={experience.description} onChange={(event) => updateExperience(experience.id, "description", event.target.value)} placeholder="اذكر ما أنجزته، وليس فقط ما كانت مهمتك..." /></label>
            </article>)}{experiences.length === 0 && <button type="button" className="empty-experience-card" onClick={addExperience}><span><Plus size={21} /></span><b>أضف أول خبرة مهنية</b><small>رتّب مسارك الوظيفي حتى يقرأه صاحب العمل بسهولة.</small></button>}</div>
          </div>
        </section>

        <section hidden={activeSection !== "education"} className="profile-editor-section profile-tab-panel" role="tabpanel" tabIndex={0} id="candidate-panel-education" aria-labelledby="candidate-tab-education">
          <div className="profile-section-body">
            <div className="profile-section-toolbar"><span>المؤهلات العلمية</span><button type="button" className="outline-btn add-experience-btn" onClick={addEducation}><Plus size={16} /> إضافة شهادة</button></div>
            <div className="education-editor-list">{education.map((entry, index) => <article className="experience-editor-card education-editor-card" key={entry.id}><div className="experience-card-top"><span className="experience-number">{String(index + 1).padStart(2, "0")}</span><div><b>{entry.degree || "مؤهل تعليمي جديد"}</b><small>{entry.institution || entry.specialization || "أضف تفاصيل الشهادة"}</small></div><button type="button" className="remove-experience-btn" onClick={() => removeEducation(entry.id)} aria-label={`حذف المؤهل ${index + 1}`}><Trash2 size={16} /></button></div><div className="form-grid"><label>الشهادة أو المؤهل<input value={entry.degree} onChange={(event) => updateEducation(entry.id, "degree", event.target.value)} placeholder="مثال: بكالوريوس" /></label><label>التخصص<input value={entry.specialization} onChange={(event) => updateEducation(entry.id, "specialization", event.target.value)} placeholder="مثال: هندسة الحاسبات" /></label></div><div className="form-grid"><label>الجامعة أو المعهد<input value={entry.institution} onChange={(event) => updateEducation(entry.id, "institution", event.target.value)} placeholder="اسم الجامعة أو المعهد" /></label><label>سنة التخرج<input type="number" min="1950" max={new Date().getFullYear() + 10} value={entry.graduationYear} onChange={(event) => updateEducation(entry.id, "graduationYear", event.target.value)} placeholder="2024" /></label></div></article>)}{education.length === 0 && <button type="button" className="empty-experience-card" onClick={addEducation}><span><Plus size={21} /></span><b>أضف مؤهلك التعليمي</b><small>سجّل الشهادة والتخصص وسنة التخرج.</small></button>}</div>
            <div className="language-editor-field profile-languages-section"><div className="language-editor-heading"><span><b>اللغات</b><small>أضف كل لغة ومستواها بشكل مستقل.</small></span><button type="button" className="outline-btn language-add-btn" onClick={addLanguage}><Plus size={14} /> إضافة لغة</button></div><div className="language-entry-list">{languages.map((language, index) => <div className="language-entry" key={`language-${index}`}><input value={language.name} onChange={(event) => updateLanguage(index, "name", event.target.value)} placeholder="مثال: العربية أو English" aria-label={`اسم اللغة ${index + 1}`} /><AppSelect value={language.level} onChange={(value) => updateLanguage(index, "level", value as LanguageLevel)} placeholder="اختر المستوى" options={languageLevels.map((level) => ({ value: level, label: level }))} ariaLabel={`مستوى اللغة ${index + 1}`} /><button type="button" className="language-remove-btn" onClick={() => removeLanguage(index)} aria-label={`حذف اللغة ${index + 1}`}><X size={15} /></button></div>)}{languages.length === 0 && <p className="language-empty-hint"><Languages size={14} /> أضف اللغة الأم أو أي لغة تستخدمها في العمل.</p>}</div></div>
          </div>
        </section>

        <section hidden={activeSection !== "preferences"} className="profile-editor-section profile-tab-panel" role="tabpanel" tabIndex={0} id="candidate-panel-preferences" aria-labelledby="candidate-tab-preferences">
          <div className="profile-section-body">
            <div className="form-grid"><label>نوع العمل المطلوب<AppSelect value={form.work_type} onChange={(value) => update("work_type", value)} placeholder="اختر نوع العمل" options={["دوام كامل", "دوام جزئي", "عن بُعد", "تدريب", "عمل حر"].map((value) => ({ value, label: value }))} ariaLabel="نوع العمل المطلوب" /></label><label>التوفر للعمل<AppSelect value={form.availability} onChange={(value) => update("availability", value)} placeholder="اختر حالة التوفر" options={["متاح فورًا", "خلال أسبوعين", "خلال شهر", "غير محدد"].map((value) => ({ value, label: value }))} ariaLabel="التوفر للعمل" /></label></div>
            <div className="form-grid"><label>أقل راتب متوقع <span className="optional">اختياري</span><input type="number" min="0" value={form.expected_salary_min ?? ""} onChange={(event) => update("expected_salary_min", event.target.value ? Number(event.target.value) : null)} /></label><div className="profile-language-hint"><Languages size={17} /><span>تفاصيل أوضح تساعد في ظهور ملفك بعمليات بحث أدق.</span></div></div>
          </div>
        </section>

        <div className="profile-form-actions"><span className="profile-autosave-note">تُحفظ تعديلاتك تلقائيًا أثناء التحرير.</span><button type="button" className="text-btn" onClick={() => { flushAutosaveRef.current(); onNavigate("jobs"); }}><ArrowLeft size={16} /> تصفح الوظائف</button></div>
      </form>

      <aside className="candidate-profile-aside">
        <div className="profile-aside-card ats-export-card">
          <div className="aside-card-heading"><div><span className="eyebrow">English application version</span><h3>ATS Resume</h3></div><FileText size={20} /></div>
          <p>نسخة إنكليزية رسمية بخط خطي واضح وترتيب مناسب لأنظمة التوظيف الآلية.</p>
          <div className="ats-export-actions">
            <button type="button" className="primary-btn" onClick={exportAts}><Download size={16} /> تنزيل Word ATS</button>
            <button type="button" className="outline-btn" onClick={printAts}><Printer size={15} /> حفظ ATS كـ PDF</button>
          </div>
          {!canExportAts && <small className="ats-export-hint">أكمل بيانات الاتصال والنبذة المهنية لتفعيل التصدير.</small>}
        </div>
        <div className="profile-aside-card ats-export-card professional-resume-export-card">
          <div className="aside-card-heading"><div><span className="eyebrow">Designed application version</span><h3>Professional CV</h3></div><FileText size={20} /></div>
          <p>نسخة إنكليزية بتصميم احترافي وبطاقات واضحة، منفصلة عن نسخة ATS.</p>
          <div className="ats-export-actions">
            <button type="button" className="primary-btn" onClick={exportProfessionalResume}><Download size={16} /> تنزيل Word احترافي</button>
            <button type="button" className="outline-btn" onClick={printProfessionalResumePdf}><Printer size={15} /> حفظ PDF احترافي</button>
          </div>
          {!canExportAts && <small className="ats-export-hint">أكمل الاسم والمسمى وبيانات الاتصال والنبذة المهنية لتفعيل التصدير.</small>}
        </div>
        <div className="profile-aside-card privacy-card"><div className="aside-card-icon"><ShieldCheck size={19} /></div><div><b>ملفك يظهر لأصحاب العمل المصرّح لهم</b><p>يظهر ملفك فقط لأصحاب العمل الذين لديهم صلاحية الوصول إلى ملفات الباحثين عن العمل، والتي يفعّلها المشرف.</p></div><span className="privacy-status"><Check size={13} /> وصول مقيّد</span></div>
         <div className="profile-aside-card checklist-card"><div className="aside-card-heading"><div><span className="eyebrow">قائمة الإنجاز</span><h3>قرّب ملفك من 100%</h3></div><CheckCircle2 size={20} /></div><ul><li className={hasFullName ? "done" : ""}><span>{hasFullName ? <Check size={13} /> : "1"}</span>الاسم الكامل</li><li className={hasHeadline ? "done" : ""}><span>{hasHeadline ? <Check size={13} /> : "2"}</span>المسمى الوظيفي</li><li className={hasSkills ? "done" : ""}><span>{hasSkills ? <Check size={13} /> : "3"}</span>أضف مهاراتك</li><li className={hasExperience ? "done" : ""}><span>{hasExperience ? <Check size={13} /> : "4"}</span>أضف خبرة واحدة على الأقل</li><li className={hasSummary ? "done" : ""}><span>{hasSummary ? <Check size={13} /> : "5"}</span>نبذة مهنية قصيرة</li></ul></div>
        <div className="profile-aside-card tip-card"><div className="aside-card-heading"><div><span className="eyebrow">نصيحة سريعة</span><h3>اكتب إنجازك بالأرقام</h3></div><Sparkles size={20} /></div><p>بدل «أدرت حسابات التواصل»، جرّب «رفعت التفاعل 35% خلال 6 أشهر». التفاصيل الصغيرة تفرق.</p></div>
        <div className="profile-aside-card mini-contact-card"><div className="mini-contact-icon"><FileText size={17} /></div><div><b>تحتاج تحديث سيرتك؟</b><small>أكمل الملف هنا، وبعدها استخدمه للتقديم على الفرص.</small></div></div>
      </aside>
    </div>
  </section>;
}