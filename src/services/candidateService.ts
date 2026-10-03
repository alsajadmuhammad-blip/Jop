import { supabase } from "../lib/supabase";
import type { CandidateProfile, CandidateProfileInput, CandidateSearchResult } from "../lib/types";

export type CandidateExperience = {
  id: string;
  title: string;
  company: string;
  location: string;
  startMonth: string;
  endMonth: string;
  isCurrent: boolean;
  legacyPeriod: string;
  description: string;
};

export type CandidateEducation = {
  id: string;
  degree: string;
  specialization: string;
  institution: string;
  graduationYear: string;
};

export const languageLevels = ["اللغة الأم", "متقدم", "جيد جدًا", "متوسط", "مبتدئ"] as const;
export type LanguageLevel = typeof languageLevels[number];
export type CandidateLanguage = {
  name: string;
  level: LanguageLevel | "";
};

const candidateProfileCache = new Map<string, CandidateProfile | null>();
const candidateProfileRequests = new Map<string, Promise<{ profile: CandidateProfile | null; error: unknown | null }>>();
const candidateProfileDraftPrefix = "IRAQ_JOBS_CANDIDATE_PROFILE_DRAFT_V1:";

export type CandidateProfileDraft = {
  payload: CandidateProfileInput;
  savedAt: number;
  signature: string;
};

function isCandidateProfileInput(value: unknown): value is CandidateProfileInput {
  if (!value || typeof value !== "object") return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.full_name === "string" &&
    typeof profile.email === "string" &&
    typeof profile.phone === "string" &&
    typeof profile.headline === "string" &&
    typeof profile.specialization === "string" &&
    typeof profile.province === "string" &&
    typeof profile.city === "string" &&
    typeof profile.experience_years === "number" &&
    Array.isArray(profile.skills) &&
    profile.skills.every((skill) => typeof skill === "string") &&
    typeof profile.experience_details === "string" &&
    typeof profile.education === "string" &&
    Array.isArray(profile.languages) &&
    profile.languages.every((language) => typeof language === "string") &&
    typeof profile.work_type === "string" &&
    typeof profile.remote_available === "boolean" &&
    (profile.expected_salary_min === null || typeof profile.expected_salary_min === "number") &&
    typeof profile.availability === "string" &&
    typeof profile.summary === "string"
  );
}

export function getCandidateProfileDraft(userId: string): CandidateProfileDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(`${candidateProfileDraftPrefix}${userId}`);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<CandidateProfileDraft>;
    if (
      !isCandidateProfileInput(draft.payload) ||
      typeof draft.savedAt !== "number" ||
      typeof draft.signature !== "string"
    ) {
      window.localStorage.removeItem(`${candidateProfileDraftPrefix}${userId}`);
      return null;
    }
    return draft as CandidateProfileDraft;
  } catch {
    return null;
  }
}

export function saveCandidateProfileDraft(userId: string, payload: CandidateProfileInput) {
  if (typeof window === "undefined") return false;
  const signature = JSON.stringify(payload);
  try {
    window.localStorage.setItem(
      `${candidateProfileDraftPrefix}${userId}`,
      JSON.stringify({ payload, savedAt: Date.now(), signature } satisfies CandidateProfileDraft),
    );
    return true;
  } catch {
    return false;
  }
}

export function clearCandidateProfileDraft(userId: string, signature?: string) {
  if (typeof window === "undefined") return;
  try {
    const key = `${candidateProfileDraftPrefix}${userId}`;
    if (!signature || getCandidateProfileDraft(userId)?.signature === signature) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // The cloud profile remains the source of truth if browser storage is unavailable.
  }
}

export function getCachedCandidateProfile(userId: string) {
  return candidateProfileCache.get(userId);
}

export function clearCandidateProfileCache(userId?: string) {
  if (userId) {
    candidateProfileCache.delete(userId);
    candidateProfileRequests.delete(userId);
    return;
  }
  candidateProfileCache.clear();
  candidateProfileRequests.clear();
}

export const experienceStoragePrefix = "IRAQ_JOBS_EXPERIENCES_V1:";
export const educationStoragePrefix = "IRAQ_JOBS_EDUCATION_V1:";

type LegacyExperienceFields = { period?: unknown; startYear?: unknown; endYear?: unknown };

function normalizeExperience(item: Partial<CandidateExperience> & LegacyExperienceFields, index: number): CandidateExperience {
  let startMonth = typeof item.startMonth === "string" ? item.startMonth : "";
  let endMonth = typeof item.endMonth === "string" ? item.endMonth : "";
  let isCurrent = item.isCurrent === true;
  let legacyPeriod = typeof item.legacyPeriod === "string"
    ? item.legacyPeriod
    : typeof item.period === "string" ? item.period : "";

  const priorStartYear = typeof item.startYear === "string" ? item.startYear : "";
  const priorEndYear = typeof item.endYear === "string" ? item.endYear : "";
  if (!startMonth && !endMonth && (priorStartYear || priorEndYear) && !legacyPeriod) {
    legacyPeriod = [priorStartYear, isCurrent ? "حتى الآن" : priorEndYear].filter(Boolean).join(" – ");
  }

  return {
    id: typeof item.id === "string" && item.id ? item.id : `experience-${index + 1}`,
    title: typeof item.title === "string" ? item.title : "",
    company: typeof item.company === "string" ? item.company : "",
    location: typeof item.location === "string" ? item.location : "",
    startMonth,
    endMonth,
    isCurrent,
    legacyPeriod,
    description: typeof item.description === "string" ? item.description : "",
  };
}

function formatCandidateMonth(value: string, locale: string) {
  const match = value.match(/^(\d{4})-(0[1-9]|1[0-2])$/);
  if (!match) return value;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatCandidateExperiencePeriod(experience: CandidateExperience) {
  const start = formatCandidateMonth(experience.startMonth, "ar-IQ");
  const end = formatCandidateMonth(experience.endMonth, "ar-IQ");
  if (start && experience.isCurrent) return `${start} – حتى الآن`;
  if (start && end) return `${start} – ${end}`;
  if (experience.isCurrent) return "حتى الآن";
  if (start) return start;
  if (end) return `حتى ${end}`;
  return experience.legacyPeriod;
}

export function formatCandidateExperiencePeriodForAts(experience: CandidateExperience) {
  const start = formatCandidateMonth(experience.startMonth, "en");
  const end = formatCandidateMonth(experience.endMonth, "en");
  if (start && experience.isCurrent) return `${start} – Present`;
  if (start && end) return `${start} – ${end}`;
  if (experience.isCurrent) return "Present";
  if (start) return start;
  if (end) return `Until ${end}`;
  return experience.legacyPeriod;
}

export function parseCandidateLanguages(values: string[]): CandidateLanguage[] {
  return values
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean)
    .map((value) => {
      const separatorIndex = value.lastIndexOf(" — ");
      const possibleLevel = separatorIndex >= 0 ? value.slice(separatorIndex + 3).trim() : "";
      const level = languageLevels.includes(possibleLevel as LanguageLevel) ? possibleLevel as LanguageLevel : "";
      return {
        name: level ? value.slice(0, separatorIndex).trim() : value,
        level,
      };
    });
}

export function formatCandidateLanguages(values: CandidateLanguage[]) {
  return values
    .map((language) => {
      const name = language.name.trim();
      return name ? `${name}${language.level ? ` — ${language.level}` : ""}` : "";
    })
    .filter(Boolean);
}

export function parseCandidateExperiences(value: string): CandidateExperience[] {
  const storedValue = typeof value === "string" ? value : "";
  if (storedValue.startsWith(experienceStoragePrefix)) {
    try {
      const parsed = JSON.parse(storedValue.slice(experienceStoragePrefix.length)) as Array<Partial<CandidateExperience> & LegacyExperienceFields>;
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === "object")
          .map((item, index) => normalizeExperience(item, index));
      }
    } catch {
      // Fall through to the legacy text format.
    }
  }
  if (!storedValue.trim()) return [];
  return [normalizeExperience({
    id: "legacy-experience",
    title: "الخبرة المهنية",
    company: "",
    location: "",
    startMonth: "",
    endMonth: "",
    isCurrent: false,
    legacyPeriod: "",
    description: storedValue,
  }, 0)];
}

export function serializeCandidateExperiences(experiences: CandidateExperience[]) {
  const completed = experiences.filter((experience) =>
    [experience.title, experience.company, experience.location, experience.startMonth, experience.endMonth, experience.legacyPeriod, experience.description]
      .some((value) => value.trim()) || experience.isCurrent,
  );
  return completed.length ? `${experienceStoragePrefix}${JSON.stringify(completed)}` : "";
}

export function formatCandidateExperiences(value: string) {
  const experiences = parseCandidateExperiences(value);
  if (!experiences.length) return "";
  return experiences.map((experience) => {
    const heading = [experience.title, experience.company].filter(Boolean).join(" — ");
    const meta = [formatCandidateExperiencePeriod(experience), experience.location].filter(Boolean).join(" · ");
    return [heading, meta, experience.description].filter(Boolean).join("\n");
  }).join("\n\n");
}

export function parseCandidateEducation(value: string): CandidateEducation[] {
  const storedValue = typeof value === "string" ? value : "";
  if (storedValue.startsWith(educationStoragePrefix)) {
    try {
      const parsed = JSON.parse(storedValue.slice(educationStoragePrefix.length)) as Partial<CandidateEducation>[];
      if (Array.isArray(parsed)) {
        return parsed
          .filter((item) => item && typeof item === "object")
          .map((item, index) => ({
            id: typeof item.id === "string" && item.id ? item.id : `education-${index + 1}`,
            degree: typeof item.degree === "string" ? item.degree : "",
            specialization: typeof item.specialization === "string" ? item.specialization : "",
            institution: typeof item.institution === "string" ? item.institution : "",
            graduationYear: typeof item.graduationYear === "string" ? item.graduationYear : "",
          }));
      }
    } catch {
      // Keep the legacy plain-text education value readable.
    }
  }
  return storedValue.trim()
    ? [{ id: "legacy-education", degree: storedValue, specialization: "", institution: "", graduationYear: "" }]
    : [];
}

export function serializeCandidateEducation(education: CandidateEducation[]) {
  const completed = education.filter((entry) =>
    [entry.degree, entry.specialization, entry.institution, entry.graduationYear].some((value) => value.trim()),
  );
  return completed.length ? `${educationStoragePrefix}${JSON.stringify(completed)}` : "";
}

export function formatCandidateEducation(education: CandidateEducation[]) {
  return education.map((entry) => [
    entry.degree,
    entry.specialization ? `التخصص: ${entry.specialization}` : "",
    entry.institution ? `الجهة التعليمية: ${entry.institution}` : "",
    entry.graduationYear ? `سنة التخرج: ${entry.graduationYear}` : "",
  ].filter(Boolean).join(" · ")).filter(Boolean).join("\n");
}

export type CandidateSearchFilters = {
  keyword: string;
  specialization: string;
  province: string;
  city: string;
  minExperience: string;
  workType: string;
  remoteOnly: boolean;
  skill: string;
  availability: string;
};

export const emptyCandidateSearchFilters: CandidateSearchFilters = {
  keyword: "",
  specialization: "",
  province: "",
  city: "",
  minExperience: "",
  workType: "",
  remoteOnly: false,
  skill: "",
  availability: "",
};

export type CandidateSearchOptions = {
  total: number;
  specializations: string[];
  provinces: string[];
  cities: string[];
  workTypes: string[];
  skills: string[];
  availabilities: string[];
  experienceYears: number[];
};

let candidateSearchOptionsCache: { options: CandidateSearchOptions; expiresAt: number } | null = null;
let candidateSearchOptionsRequest: Promise<{ options: CandidateSearchOptions | null; error: unknown | null }> | null = null;

export async function loadCandidateSearchOptions() {
  if (candidateSearchOptionsCache && candidateSearchOptionsCache.expiresAt > Date.now()) {
    return { options: candidateSearchOptionsCache.options, error: null };
  }
  if (candidateSearchOptionsRequest) return candidateSearchOptionsRequest;

  const request = (async () => {
    const { data, error } = await supabase.rpc("get_candidate_search_options");
    if (error) return { options: null, error };

    const rawOptions = data as CandidateSearchOptions;
    const options: CandidateSearchOptions = {
      total: Number(rawOptions?.total) || 0,
      specializations: Array.isArray(rawOptions?.specializations) ? rawOptions.specializations : [],
      provinces: Array.isArray(rawOptions?.provinces) ? rawOptions.provinces : [],
      cities: Array.isArray(rawOptions?.cities) ? rawOptions.cities : [],
      workTypes: Array.isArray(rawOptions?.workTypes) ? rawOptions.workTypes : [],
      skills: Array.isArray(rawOptions?.skills) ? rawOptions.skills : [],
      availabilities: Array.isArray(rawOptions?.availabilities) ? rawOptions.availabilities : [],
      experienceYears: Array.isArray(rawOptions?.experienceYears) ? rawOptions.experienceYears.map(Number).filter(Number.isFinite) : [],
    };
    candidateSearchOptionsCache = { options, expiresAt: Date.now() + 60_000 };
    return { options, error: null };
  })();

  candidateSearchOptionsRequest = request;
  try {
    return await request;
  } finally {
    if (candidateSearchOptionsRequest === request) candidateSearchOptionsRequest = null;
  }
}

export async function loadCandidateProfile(userId: string, options: { forceRefresh?: boolean } = {}) {
  if (!options.forceRefresh && candidateProfileCache.has(userId)) {
    return { profile: candidateProfileCache.get(userId) ?? null, error: null };
  }

  if (!options.forceRefresh) {
    const pending = candidateProfileRequests.get(userId);
    if (pending) return pending;
  }

  const request = (async () => {
    const { data, error } = await supabase
      .from("candidate_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    const profile = (data as CandidateProfile | null) || null;
    if (!error) candidateProfileCache.set(userId, profile);
    return { profile, error };
  })();

  if (!options.forceRefresh) candidateProfileRequests.set(userId, request);
  try {
    return await request;
  } finally {
    if (!options.forceRefresh && candidateProfileRequests.get(userId) === request) {
      candidateProfileRequests.delete(userId);
    }
  }
}

export async function saveCandidateProfile(userId: string, input: CandidateProfileInput) {
  const { error } = await supabase
    .from("candidate_profiles")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id" });
  if (!error) {
    const previous = candidateProfileCache.get(userId);
    const now = new Date().toISOString();
    candidateProfileCache.set(userId, {
      user_id: userId,
      ...input,
      created_at: previous?.created_at || now,
      updated_at: now,
    });
  }
  return { profile: error ? null : candidateProfileCache.get(userId) || null, error };
}

export type CandidateSearchCursor = Pick<CandidateSearchResult, "user_id" | "updated_at" | "relevance">;
export type CandidateSearchPage = {
  profiles: CandidateSearchResult[];
  hasMore: boolean;
  nextCursor: CandidateSearchCursor | null;
  error: unknown | null;
};

export const CANDIDATE_SEARCH_PAGE_SIZE = 10;

export async function searchCandidateProfiles(
  filters: CandidateSearchFilters,
  cursor: CandidateSearchCursor | null = null,
): Promise<CandidateSearchPage> {
  const { data, error } = await supabase.rpc("search_candidate_profiles_page", {
    p_keyword: filters.keyword.trim() || null,
    p_specialization: filters.specialization || null,
    p_province: filters.province || null,
    p_city: filters.city || null,
    p_min_experience: filters.minExperience ? Number(filters.minExperience) : null,
    p_work_type: filters.workType || null,
    p_skill: filters.skill || null,
    p_availability: filters.availability || null,
    p_remote_available: filters.remoteOnly ? true : null,
    p_after_relevance: cursor?.relevance ?? null,
    p_after_updated_at: cursor?.updated_at ?? null,
    p_after_user_id: cursor?.user_id ?? null,
    p_limit: CANDIDATE_SEARCH_PAGE_SIZE + 1,
  });

  if (error) return { profiles: [], hasMore: false, nextCursor: null, error };

  const rows = (data as CandidateSearchResult[]) || [];
  const hasMore = rows.length > CANDIDATE_SEARCH_PAGE_SIZE;
  const profiles = rows.slice(0, CANDIDATE_SEARCH_PAGE_SIZE);
  const lastProfile = profiles[profiles.length - 1];

  return {
    profiles,
    hasMore,
    nextCursor: hasMore && lastProfile
      ? {
          user_id: lastProfile.user_id,
          updated_at: lastProfile.updated_at,
          relevance: lastProfile.relevance,
        }
      : null,
    error: null,
  };
}