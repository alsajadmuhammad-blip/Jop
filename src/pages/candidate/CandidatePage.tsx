import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarDays, Check, CheckCircle2, ChevronDown, FileText, GraduationCap, Languages, Mail, MapPin, Pencil, Phone, Plus, RotateCw, Save, ShieldCheck, Sparkles, Trash2, UserRound, X } from "lucide-react";
import { AppSelect } from "../../components/common/AppSelect";
import { MonthYearField } from "../../components/common/MonthYearField";
import type { View } from "../../app/types";
import type { CandidateProfile, CandidateProfileInput, Profile } from "../../lib/types";
import { hasSupabaseConfig } from "../../lib/supabase";
import { clearCandidateProfileDraft, formatCandidateExperiencePeriod, formatCandidateLanguages, getCachedCandidateProfile, getCandidateProfileDraft, languageLevels, loadCandidateProfile, parseCandidateEducation, parseCandidateExperiences, parseCandidateLanguages, saveCandidateProfile, saveCandidateProfileDraft, serializeCandidateEducation, serializeCandidateExperiences, type CandidateEducation, type CandidateExperience, type CandidateLanguage, type LanguageLevel } from "../../services/candidateService";
import type { CandidateCvImport } from "../../features/candidate/cvImport";
import { CandidateCvImportPage } from "./CandidateCvImportPage";
import { CandidateProfileSetupWizard } from "./CandidateProfileSetupWizard";
import { CandidateResumeExportPage } from "./CandidateResumeExportPage";
import { ExperienceFormModal } from "./ExperienceFormModal";

type CandidatePageProps = {
  profile: Profile;
  onNavigate: (view: View) => void;
  onProfileUpdated?: () => void;
  onNotify?: (message: string) => void;
  showCvImport?: boolean;
  showProfessionalEdit?: boolean;
  showResumeExport?: boolean;
};

type ExperienceEntry = CandidateExperience;
type EducationEntry = CandidateEducation;

type AutosaveStatus = "loading" | "idle" | "pending" | "saving" | "saved" | "error" | "unavailable";
type CandidateProfileTab = "skills" | "experience" | "education" | "preferences";
type CandidateSetupStep = 0 | 1 | 2 | 3;
type CandidateSetupProgress = {
  step: CandidateSetupStep;
  status: "in-progress" | "deferred" | "done";
};

const candidateSetupStoragePrefix = "IRAQ_JOBS_CANDIDATE_SETUP_V1:";

const candidateProfileTabs: { id: CandidateProfileTab; label: string; icon: typeof UserRound }[] = [
  { id: "skills", label: "المهارات", icon: Sparkles },
  { id: "experience", label: "الخبرات", icon: BriefcaseBusiness },
  { id: "education", label: "التعليم واللغات", icon: GraduationCap },
  { id: "preferences", label: "تفضيلات العمل", icon: MapPin },
];

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

function readCandidateSetupProgress(userId: string): CandidateSetupProgress | null {
  try {
    const saved = window.localStorage.getItem(`${candidateSetupStoragePrefix}${userId}`);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<CandidateSetupProgress>;
    if (
      typeof parsed.step !== "number" ||
      !Number.isInteger(parsed.step) ||
      parsed.step < 0 ||
      parsed.step > 3 ||
      !["in-progress", "deferred", "done"].includes(parsed.status || "")
    ) {
      window.localStorage.removeItem(`${candidateSetupStoragePrefix}${userId}`);
      return null;
    }
    return parsed as CandidateSetupProgress;
  } catch {
    return null;
  }
}

function writeCandidateSetupProgress(userId: string, progress: CandidateSetupProgress) {
  try {
    window.localStorage.setItem(`${candidateSetupStoragePrefix}${userId}`, JSON.stringify(progress));
  } catch {
    // Profile autosave remains available even if setup progress cannot be stored.
  }
}

export function CandidatePage({ profile, onNavigate, onProfileUpdated, onNotify, showCvImport = false, showProfessionalEdit = false, showResumeExport = false }: CandidatePageProps) {
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
  const [experienceFormOpen, setExperienceFormOpen] = useState(false);
  const [education, setEducation] = useState<EducationEntry[]>(() => parseCandidateEducation(initialForm.education));
  const [languages, setLanguages] = useState<CandidateLanguage[]>(() => parseCandidateLanguages(initialForm.languages));
  const [candidateProfileExists, setCandidateProfileExists] = useState<boolean | null>(
    () => cachedProfile === undefined ? null : Boolean(cachedProfile),
  );
  const [setupProgress, setSetupProgress] = useState<CandidateSetupProgress | null>(
    () => readCandidateSetupProgress(profile.id),
  );
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [setupWizardReady, setSetupWizardReady] = useState(false);
  const [setupWizardStep, setSetupWizardStep] = useState<CandidateSetupStep>(
    () => readCandidateSetupProgress(profile.id)?.step ?? 0,
  );
  const [activeProfileTab, setActiveProfileTab] = useState<CandidateProfileTab>("skills");
  const profileTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [openSections, setOpenSections] = useState({ identity: false, skills: true, experience: false, education: false, preferences: false });
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
      setCandidateProfileExists(false);
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
        setCandidateProfileExists(null);
        setError("تعذر تحميل ملفك المهني، لم تُحفظ أي تعديلات حتى لا يُستبدل محتوى غير محمّل.");
        setAutosaveStatus("error");
        setLoading(false);
        return;
      }
      setCandidateProfileExists(Boolean(result.profile));
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
    if (setupWizardReady || loading || candidateProfileExists === null) return;
    if (setupProgress) {
      setSetupWizardOpen(setupProgress.status === "in-progress");
      setSetupWizardStep(setupProgress.step);
    } else if (!candidateProfileExists) {
      const initialProgress: CandidateSetupProgress = { step: 0, status: "in-progress" };
      writeCandidateSetupProgress(profile.id, initialProgress);
      setSetupProgress(initialProgress);
      setSetupWizardStep(0);
      setSetupWizardOpen(true);
    }
    setSetupWizardReady(true);
  }, [candidateProfileExists, loading, profile.id, setupProgress, setupWizardReady]);

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

  const updateExperienceYears = (value: string) => {
    const years = value === "" ? 0 : Number(value);
    if (!Number.isFinite(years)) return;
    update("experience_years", Math.min(60, Math.max(0, Math.trunc(years))));
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
    setOpenSections((current) => ({
      ...current,
      identity: true,
      skills: true,
      experience: true,
      education: true,
    }));
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
    setExperienceFormOpen(true);
  };

  const saveNewExperience = (experience: ExperienceEntry) => {
    setExperiences((current) => [...current, experience]);
    setOpenSections((current) => ({ ...current, experience: true }));
    setExperienceFormOpen(false);
    onNotify?.("تمت إضافة الخبرة، وسيُحفظ ملفك تلقائيًا.");
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
  const completedSkills = form.skills.filter((skill) => skill.trim()).length;
  const completedEducation = education.filter((entry) =>
    [entry.degree, entry.specialization, entry.institution, entry.graduationYear].some((value) => value.trim()),
  ).length;
  const completedLanguages = languages.filter((language) => language.name.trim()).length;
  const profileTabCounts: Record<CandidateProfileTab, number | null> = {
    skills: completedSkills,
    experience: completedExperiences.length,
    education: completedEducation + completedLanguages,
    preferences: Number(Boolean(form.work_type.trim())) +
      Number(Boolean(form.availability.trim())),
  };
  const hasFullName = Boolean(form.full_name.trim());
  const hasHeadline = Boolean(form.headline.trim());
  const hasSpecialization = Boolean(form.specialization.trim());
  const hasProvince = Boolean(form.province.trim());
  const hasCity = Boolean(form.city.trim());
  const hasSkills = completedSkills > 0;
  const hasExperience = completedExperiences.length > 0;
  const hasEducation = completedEducation > 0;
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

  const autosaveNotice = <div className={`candidate-autosave-status ${autosaveStatus}`} role="status" aria-live="polite">
    <span className="candidate-autosave-icon">
      {autosaveStatus === "saved" ? <CheckCircle2 size={16} /> : autosaveStatus === "error" ? <X size={16} /> : <Save size={16} />}
    </span>
    <span className="candidate-autosave-copy">
      <b>{autosaveStatus === "error" ? "تعذر الحفظ" : "الحفظ التلقائي"}</b>
      <small>{autosaveMessage}</small>
    </span>
    {autosaveStatus === "error" && <button type="button" onClick={() => loadedRef.current ? setRetryCount((count) => count + 1) : setReloadCount((count) => count + 1)}><RotateCw size={14} /> {loadedRef.current ? "إعادة المحاولة" : "إعادة تحميل الملف"}</button>}
  </div>;
  const handleProfileFormBlur = (event: FocusEvent<HTMLFormElement>) => {
    if (!event.relatedTarget || !event.currentTarget.contains(event.relatedTarget as Node)) {
      flushAutosaveRef.current();
    }
  };
  const selectProfileTab = (tab: CandidateProfileTab) => {
    setActiveProfileTab(tab);
    setOpenSections({
      identity: false,
      skills: tab === "skills",
      experience: tab === "experience",
      education: tab === "education",
      preferences: tab === "preferences",
    });
  };

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

  if (showProfessionalEdit) {
    return <section className="container page-section dashboard-page candidate-profile-edit-page">
      <button type="button" className="candidate-professional-edit-back" onClick={() => { flushAutosaveRef.current(); onNavigate("candidate"); }}>
        <ArrowRight size={16} /> العودة إلى ملفي
      </button>
      <header className="candidate-professional-edit-heading">
        <span className="profile-section-icon blue"><Pencil size={18} /></span>
        <div>
          <span className="eyebrow">بياناتك الأساسية</span>
          <h1>تعديل المعلومات المهنية</h1>
          <p>حدّث معلوماتك التي تظهر في أعلى ملفك للباحثين عن فرص مناسبة.</p>
        </div>
      </header>
      <form className="candidate-profile-form candidate-profile-editor candidate-professional-edit-form" onSubmit={(event) => event.preventDefault()} onBlurCapture={handleProfileFormBlur}>
        {autosaveNotice}
        <section className="profile-editor-section profile-tab-section">
          <div className="profile-section-heading">
            <span className="profile-section-icon"><FileText size={18} /></span>
            <div><span className="eyebrow">الظهور الأول</span><h2>معلوماتك المهنية</h2><p>البيانات التي يراها صاحب العمل أولاً.</p></div>
          </div>
          <div className="profile-section-body">
            <div className="form-grid"><label>الاسم الكامل<input required value={form.full_name} onChange={(event) => update("full_name", event.target.value)} placeholder="مثال: أحمد محمد" /></label><label>المسمى الوظيفي<input required value={form.headline} onChange={(event) => update("headline", event.target.value)} placeholder="مثال: مطور واجهات أمامية" /></label></div>
            <div className="form-grid"><label>التخصص<input required value={form.specialization} onChange={(event) => update("specialization", event.target.value)} placeholder="مثال: برمجيات، محاسبة، تسويق" /></label><label>المحافظة<input required value={form.province} onChange={(event) => update("province", event.target.value)} placeholder="بغداد" /></label></div>
            <div className="form-grid"><label>المدينة<input required value={form.city} onChange={(event) => update("city", event.target.value)} placeholder="بغداد" /></label><label>البريد الإلكتروني<input required type="email" value={form.email} onChange={(event) => update("email", event.target.value)} dir="ltr" /></label></div>
            <div className="form-grid"><label>رقم الهاتف<input required value={form.phone} onChange={(event) => update("phone", event.target.value)} dir="ltr" /></label></div>
            <label>نبذة مهنية<textarea required rows={4} value={form.summary} onChange={(event) => update("summary", event.target.value)} placeholder="اكتب بإيجاز عن خبرتك، أسلوبك، والقيمة التي تقدمها..." /></label>
          </div>
        </section>
        <div className="profile-form-actions">
          <span className="profile-autosave-note">تُحفظ تعديلاتك تلقائيًا أثناء التحرير.</span>
          <button type="button" className="primary-btn" onClick={() => { flushAutosaveRef.current(); onNavigate("candidate"); }}><CheckCircle2 size={16} /> حفظ والعودة إلى الملف</button>
        </div>
      </form>
    </section>;
  }

  if (showResumeExport) {
    return <CandidateResumeExportPage
      data={atsData()}
      onNavigate={onNavigate}
      onNotify={onNotify}
    />;
  }

  return <section className="container page-section dashboard-page candidate-profile-page">
    <section className="candidate-profile-cover-card" aria-labelledby="candidate-profile-name">
      <div className="candidate-profile-cover">
        <span className="candidate-profile-cover-label"><Sparkles size={14} /> مساحة الباحث عن عمل</span>
        <div className="candidate-cover-progress" aria-label={`اكتمال الملف ${completeness}%`}>
          <span>اكتمال ملفك</span><b>{completeness}%</b>
          <i><span style={{ width: `${completeness}%` }} /></i>
        </div>
      </div>
      <div className="candidate-profile-identity-card">
        <div className="candidate-profile-identity-content">
          <div className="candidate-profile-identity-heading">
            <div className="candidate-profile-summary-link">
              <span className="eyebrow">ملفك المهني</span>
              <h1 id="candidate-profile-name">{form.full_name || "أضف اسمك الكامل"}</h1>
              <p className="candidate-profile-headline">{form.headline || "أضف مسماك الوظيفي"}</p>
              <span className="candidate-profile-specialization">{form.specialization || "أضف تخصصك المهني"}</span>
            </div>
          </div>
          <div className="candidate-profile-contact">
            {form.email.trim() ? <a href={`mailto:${form.email}`} dir="ltr"><Mail size={15} /> {form.email}</a> : <span><Mail size={15} /> أضف بريدك الإلكتروني</span>}
            {form.phone.trim() ? <a href={`tel:${form.phone.replace(/[^\d+]/g, "")}`} dir="ltr"><Phone size={15} /> {form.phone}</a> : <span><Phone size={15} /> أضف رقم هاتفك</span>}
            <span><MapPin size={15} /> {form.city || form.province || "أضف موقعك"}</span>
          </div>
          <div className="candidate-profile-summary-inline">
            <span>نبذة مهنية</span>
            <p>{form.summary.trim() || "أضف نبذة مهنية قصيرة حتى يتعرف أصحاب العمل على خبرتك وأهدافك."}</p>
          </div>
        </div>
        <button type="button" className="candidate-profile-edit-button" onClick={() => { flushAutosaveRef.current(); onNavigate("candidate-profile-edit"); }}>
          <Pencil size={16} /><span>تعديل المعلومات</span>
        </button>
      </div>
    </section>
    <div className="candidate-profile-grid">
      <form
        className="candidate-profile-form candidate-profile-editor"
        onSubmit={(event) => event.preventDefault()}
        onBlurCapture={handleProfileFormBlur}
      >
        {autosaveNotice}

        <div className="candidate-profile-tabs" role="tablist" aria-label="أقسام ملفك المهني" dir="rtl">
          {candidateProfileTabs.map((tab, index) => {
            const Icon = tab.icon;
            const selected = activeProfileTab === tab.id;
            const count = profileTabCounts[tab.id];
            return <button
              key={tab.id}
              ref={(element) => { profileTabRefs.current[index] = element; }}
              id={`candidate-profile-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls="candidate-profile-tabpanel"
              tabIndex={selected ? 0 : -1}
              className={selected ? "candidate-profile-tab active" : "candidate-profile-tab"}
              onClick={() => selectProfileTab(tab.id)}
              onKeyDown={(event) => {
                const nextIndex = event.key === "ArrowLeft"
                  ? (index + 1) % candidateProfileTabs.length
                  : event.key === "ArrowRight"
                    ? (index - 1 + candidateProfileTabs.length) % candidateProfileTabs.length
                    : event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? candidateProfileTabs.length - 1
                        : -1;
                if (nextIndex >= 0) {
                  event.preventDefault();
                  const nextTab = candidateProfileTabs[nextIndex];
                  if (nextTab) selectProfileTab(nextTab.id);
                  profileTabRefs.current[nextIndex]?.focus();
                }
              }}
            >
              <Icon size={16} /><span>{tab.label}</span>
              {count !== null && <span className="candidate-profile-tab-count" aria-label={`${count} عناصر`}>{count}</span>}
            </button>;
          })}
        </div>
        <div className="candidate-profile-tab-content" id="candidate-profile-tabpanel" role="tabpanel" aria-labelledby={`candidate-profile-tab-${activeProfileTab}`}>
        {activeProfileTab === "skills" && <details className="profile-editor-section profile-disclosure" open={openSections.skills} onToggle={(event) => { const open = event.currentTarget.open; setOpenSections((current) => ({ ...current, skills: open })); }}>
          <summary className="profile-section-summary">
            <span className="profile-section-icon orange"><Sparkles size={18} /></span>
            <span className="profile-summary-copy"><span className="eyebrow">نقاط قوتك</span><b>المهارات والخبرة</b><small>المهارات التي تظهر في بحث أصحاب العمل</small></span>
            <span className="profile-section-count">{form.skills.length} مهارة</span><ChevronDown className="profile-disclosure-chevron" size={18} />
          </summary>
          {openSections.skills && <div className="profile-section-body">
            <div className="skill-entry-row"><input value={skillDraft} onChange={(event) => setSkillDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(); } }} placeholder="اكتب مهارة مثل React أو إدارة المشاريع" aria-label="مهارة جديدة" /><button type="button" className="add-skill-btn" onClick={addSkill}><Plus size={17} /> إضافة مهارة</button></div>
            <div className="editable-skill-list">{form.skills.map((skill) => <span className="editable-skill" key={skill}>{skill}<button type="button" onClick={() => removeSkill(skill)} aria-label={`حذف ${skill}`}><X size={13} /></button></span>)}{form.skills.length === 0 && <span className="profile-empty-hint">ابدأ بأهم مهاراتك المهنية.</span>}</div>
            <div className="form-grid single-label-row"><label>سنوات الخبرة<input type="number" min={0} max={60} step={1} value={form.experience_years} onChange={(event) => updateExperienceYears(event.target.value)} aria-label="سنوات الخبرة" /></label><label className="checkbox-field"><input type="checkbox" checked={form.remote_available} onChange={(event) => update("remote_available", event.target.checked)} /><span>أقبل العمل عن بُعد</span></label></div>
          </div>}
        </details>}

        {activeProfileTab === "experience" && <details className="profile-editor-section profile-disclosure" open={openSections.experience} onToggle={(event) => { const open = event.currentTarget.open; setOpenSections((current) => ({ ...current, experience: open })); }}>
          <summary className="profile-section-summary">
            <span className="profile-section-icon blue"><BriefcaseBusiness size={18} /></span>
            <span className="profile-summary-copy"><span className="eyebrow">مسارك المهني</span><b>الخبرات العملية</b><small>أضف مسؤولياتك وإنجازاتك لكل دور</small></span>
            <span className="profile-section-count">{completedExperiences.length} خبرة</span><ChevronDown className="profile-disclosure-chevron" size={18} />
          </summary>
          {openSections.experience && <div className="profile-section-body">
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
          </div>}
        </details>}

        {activeProfileTab === "education" && <details className="profile-editor-section profile-disclosure" open={openSections.education} onToggle={(event) => { const open = event.currentTarget.open; setOpenSections((current) => ({ ...current, education: open })); }}>
          <summary className="profile-section-summary">
            <span className="profile-section-icon violet"><GraduationCap size={18} /></span>
            <span className="profile-summary-copy"><span className="eyebrow">المعرفة واللغات</span><b>التعليم واللغات</b><small>المؤهل والجهة التعليمية واللغات</small></span>
            <span className="profile-section-count">{completedEducation} مؤهل · {completedLanguages} لغة</span><ChevronDown className="profile-disclosure-chevron" size={18} />
          </summary>
          {openSections.education && <div className="profile-section-body">
            <div className="profile-section-toolbar"><span>المؤهلات العلمية</span><button type="button" className="outline-btn add-experience-btn" onClick={addEducation}><Plus size={16} /> إضافة شهادة</button></div>
            <div className="education-editor-list">{education.map((entry, index) => <article className="experience-editor-card education-editor-card" key={entry.id}><div className="experience-card-top"><span className="experience-number">{String(index + 1).padStart(2, "0")}</span><div><b>{entry.degree || "مؤهل تعليمي جديد"}</b><small>{entry.institution || entry.specialization || "أضف تفاصيل الشهادة"}</small></div><button type="button" className="remove-experience-btn" onClick={() => removeEducation(entry.id)} aria-label={`حذف المؤهل ${index + 1}`}><Trash2 size={16} /></button></div><div className="form-grid"><label>الشهادة أو المؤهل<input value={entry.degree} onChange={(event) => updateEducation(entry.id, "degree", event.target.value)} placeholder="مثال: بكالوريوس" /></label><label>التخصص<input value={entry.specialization} onChange={(event) => updateEducation(entry.id, "specialization", event.target.value)} placeholder="مثال: هندسة الحاسبات" /></label></div><div className="form-grid"><label>الجامعة أو المعهد<input value={entry.institution} onChange={(event) => updateEducation(entry.id, "institution", event.target.value)} placeholder="اسم الجامعة أو المعهد" /></label><label>سنة التخرج<input type="number" min="1950" max={new Date().getFullYear() + 10} value={entry.graduationYear} onChange={(event) => updateEducation(entry.id, "graduationYear", event.target.value)} placeholder="2024" /></label></div></article>)}{education.length === 0 && <button type="button" className="empty-experience-card" onClick={addEducation}><span><Plus size={21} /></span><b>أضف مؤهلك التعليمي</b><small>سجّل الشهادة والتخصص وسنة التخرج.</small></button>}</div>
            <div className="language-editor-field profile-languages-section"><div className="language-editor-heading"><span><b>اللغات</b><small>أضف كل لغة ومستواها بشكل مستقل.</small></span><button type="button" className="outline-btn language-add-btn" onClick={addLanguage}><Plus size={14} /> إضافة لغة</button></div><div className="language-entry-list">{languages.map((language, index) => <div className="language-entry" key={`language-${index}`}><input value={language.name} onChange={(event) => updateLanguage(index, "name", event.target.value)} placeholder="مثال: العربية أو English" aria-label={`اسم اللغة ${index + 1}`} /><AppSelect value={language.level} onChange={(value) => updateLanguage(index, "level", value as LanguageLevel)} placeholder="اختر المستوى" options={languageLevels.map((level) => ({ value: level, label: level }))} ariaLabel={`مستوى اللغة ${index + 1}`} /><button type="button" className="language-remove-btn" onClick={() => removeLanguage(index)} aria-label={`حذف اللغة ${index + 1}`}><X size={15} /></button></div>)}{languages.length === 0 && <p className="language-empty-hint"><Languages size={14} /> أضف اللغة الأم أو أي لغة تستخدمها في العمل.</p>}</div></div>
          </div>}
        </details>}

        {activeProfileTab === "preferences" && <details className="profile-editor-section profile-disclosure" open={openSections.preferences} onToggle={(event) => { const open = event.currentTarget.open; setOpenSections((current) => ({ ...current, preferences: open })); }}>
          <summary className="profile-section-summary">
            <span className="profile-section-icon orange"><MapPin size={18} /></span>
            <span className="profile-summary-copy"><span className="eyebrow">الخطوة التالية</span><b>تفضيلات العمل</b><small>أخبر أصحاب العمل بموعدك ونوع الفرصة المناسبة</small></span>
            <span className="profile-section-count">{form.availability || "اختياري"}</span><ChevronDown className="profile-disclosure-chevron" size={18} />
          </summary>
          {openSections.preferences && <div className="profile-section-body">
            <div className="form-grid"><label>نوع العمل المطلوب<AppSelect value={form.work_type} onChange={(value) => update("work_type", value)} placeholder="اختر نوع العمل" options={["دوام كامل", "دوام جزئي", "عن بُعد", "تدريب", "عمل حر"].map((value) => ({ value, label: value }))} ariaLabel="نوع العمل المطلوب" /></label><label>التوفر للعمل<AppSelect value={form.availability} onChange={(value) => update("availability", value)} placeholder="اختر حالة التوفر" options={["متاح فورًا", "خلال أسبوعين", "خلال شهر", "غير محدد"].map((value) => ({ value, label: value }))} ariaLabel="التوفر للعمل" /></label></div>
            <div className="profile-language-hint profile-preferences-hint"><Languages size={17} /><span>تفاصيل أوضح تساعد في ظهور ملفك بعمليات بحث أدق.</span></div>
          </div>}
        </details>}

        </div>
        <div className="profile-form-actions"><span className="profile-autosave-note">تُحفظ تعديلاتك تلقائيًا أثناء التحرير.</span></div>
      </form>

      <aside className="candidate-profile-aside" aria-label="إعداد السيرة الذاتية وإرشادات الملف">
        <header className="candidate-resume-panel-heading">
          <div><span className="eyebrow">سيرتك جاهزة للتقديم</span><h2>جهّز نسخة تناسبك</h2></div>
          <p>اختر قالبًا وراجع المعاينة قبل تنزيل Word أو حفظ PDF.</p>
        </header>
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
        <div className="profile-aside-card ats-export-card candidate-resume-entry-card">
          <div className="aside-card-heading"><div><span className="eyebrow">ثلاثة قوالب · Word وPDF</span><h3>معاينة وتصدير السيرة</h3></div><FileText size={20} /></div>
          <p>تصفّح القوالب، شاهد شكل سيرتك الفعلي، ثم نزّل النسخة المناسبة.</p>
          <div className="ats-export-actions">
            <button type="button" className="primary-btn" onClick={() => onNavigate("candidate-resume-export")}><FileText size={16} /> فتح صفحة التصدير</button>
          </div>
        </div>
        <div className="profile-aside-card privacy-card"><div className="aside-card-icon"><ShieldCheck size={19} /></div><div><b>ملفك يظهر لأصحاب العمل المصرّح لهم</b><p>يظهر ملفك فقط لأصحاب العمل الذين لديهم صلاحية الوصول إلى ملفات الباحثين عن العمل، والتي يفعّلها المشرف.</p></div><span className="privacy-status"><Check size={13} /> وصول مقيّد</span></div>
         <div className="profile-aside-card checklist-card"><div className="aside-card-heading"><div><span className="eyebrow">قائمة الإنجاز</span><h3>قرّب ملفك من 100%</h3></div><CheckCircle2 size={20} /></div><ul><li className={hasFullName ? "done" : ""}><span>{hasFullName ? <Check size={13} /> : "1"}</span>الاسم الكامل</li><li className={hasHeadline ? "done" : ""}><span>{hasHeadline ? <Check size={13} /> : "2"}</span>المسمى الوظيفي</li><li className={hasSkills ? "done" : ""}><span>{hasSkills ? <Check size={13} /> : "3"}</span>أضف مهاراتك</li><li className={hasExperience ? "done" : ""}><span>{hasExperience ? <Check size={13} /> : "4"}</span>أضف خبرة واحدة على الأقل</li><li className={hasSummary ? "done" : ""}><span>{hasSummary ? <Check size={13} /> : "5"}</span>نبذة مهنية قصيرة</li></ul></div>
        <div className="profile-aside-card tip-card"><div className="aside-card-heading"><div><span className="eyebrow">نصيحة سريعة</span><h3>اكتب إنجازك بالأرقام</h3></div><Sparkles size={20} /></div><p>بدل «أدرت حسابات التواصل»، جرّب «رفعت التفاعل 35% خلال 6 أشهر». التفاصيل الصغيرة تفرق.</p></div>
        <div className="profile-aside-card mini-contact-card"><div className="mini-contact-icon"><FileText size={17} /></div><div><b>تحتاج تحديث سيرتك؟</b><small>أكمل الملف هنا، وبعدها استخدمه للتقديم على الفرص.</small></div></div>
      </aside>
      {experienceFormOpen && <ExperienceFormModal onClose={() => setExperienceFormOpen(false)} onSave={saveNewExperience} />}
    </div>
  </section>;
}