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

type CandidateSearchOptionRow = Pick<
  CandidateProfile,
  "specialization" | "province" | "city" | "work_type" | "skills" | "availability" | "experience_years"
>;

const normalizeSearchValue = (value: string) => value.trim().toLocaleLowerCase();

const uniqueSorted = (values: string[]) => Array.from(
  new Set(values.map((value) => value.trim()).filter(Boolean)),
).sort((a, b) => a.localeCompare(b, "ar"));

export async function loadCandidateSearchOptions() {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("specialization, province, city, work_type, skills, availability, experience_years")
    .limit(1000);

  if (error) return { options: null, error };

  const rows = (data as CandidateSearchOptionRow[]) || [];
  const options: CandidateSearchOptions = {
    total: rows.length,
    specializations: uniqueSorted(rows.map((row) => row.specialization)),
    provinces: uniqueSorted(rows.map((row) => row.province)),
    cities: uniqueSorted(rows.map((row) => row.city)),
    workTypes: uniqueSorted(rows.map((row) => row.work_type)),
    skills: uniqueSorted(rows.flatMap((row) => row.skills || [])),
    availabilities: uniqueSorted(rows.map((row) => row.availability)),
    experienceYears: Array.from(new Set(rows.map((row) => Number(row.experience_years)).filter((value) => Number.isFinite(value))))
      .sort((a, b) => a - b),
  };

  return { options, error: null };
}

export async function loadCandidateProfile(userId: string) {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return { profile: (data as CandidateProfile | null) || null, error };
}

export async function saveCandidateProfile(userId: string, input: CandidateProfileInput) {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .upsert({ user_id: userId, ...input }, { onConflict: "user_id" })
    .select("*")
    .single();
  return { profile: (data as CandidateProfile | null) || null, error };
}

export async function searchCandidateProfiles(filters: CandidateSearchFilters) {
  const { data, error } = await supabase
    .from("candidate_profiles")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1000);

  if (error) return { profiles: [], error };

  const keyword = normalizeSearchValue(filters.keyword);
  const specialization = normalizeSearchValue(filters.specialization);
  const province = normalizeSearchValue(filters.province);
  const city = normalizeSearchValue(filters.city);
  const workType = normalizeSearchValue(filters.workType);
  const skill = normalizeSearchValue(filters.skill);
  const availability = normalizeSearchValue(filters.availability);
  const minExperience = filters.minExperience ? Number(filters.minExperience) : null;
  const searchableText = (candidate: CandidateProfile) => normalizeSearchValue([
    candidate.full_name,
    candidate.headline,
    candidate.specialization,
    candidate.province,
    candidate.city,
    formatCandidateExperiences(candidate.experience_details),
    formatCandidateEducation(parseCandidateEducation(candidate.education)),
    candidate.summary,
    ...candidate.skills,
    ...candidate.languages,
  ].join(" "));

  const profiles = ((data as CandidateProfile[]) || [])
    .filter((candidate) => {
      const candidateSkills = (candidate.skills || []).map(normalizeSearchValue);
      return (
        (!keyword || searchableText(candidate).includes(keyword)) &&
        (!specialization || normalizeSearchValue(candidate.specialization) === specialization) &&
        (!province || normalizeSearchValue(candidate.province) === province) &&
        (!city || normalizeSearchValue(candidate.city) === city) &&
        (!workType || normalizeSearchValue(candidate.work_type) === workType) &&
        (!skill || candidateSkills.includes(skill)) &&
        (!availability || normalizeSearchValue(candidate.availability) === availability) &&
        (minExperience === null || Number(candidate.experience_years) >= minExperience) &&
        (!filters.remoteOnly || candidate.remote_available)
      );
    })
    .map((candidate) => ({
      ...candidate,
      relevance: keyword && searchableText(candidate).includes(keyword) ? 10 : 0,
    } satisfies CandidateSearchResult))
    .sort((a, b) => b.relevance - a.relevance || Date.parse(b.updated_at) - Date.parse(a.updated_at))
    .slice(0, 50);

  return { profiles, error: null };
}