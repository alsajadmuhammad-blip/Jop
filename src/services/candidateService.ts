import { supabase } from "../lib/supabase";
import type { CandidateProfile, CandidateProfileInput, CandidateSearchResult } from "../lib/types";

export type CandidateExperience = {
  id: string;
  title: string;
  company: string;
  location: string;
  period: string;
  description: string;
};

export const experienceStoragePrefix = "IRAQ_JOBS_EXPERIENCES_V1:";

export function parseCandidateExperiences(value: string): CandidateExperience[] {
  if (value.startsWith(experienceStoragePrefix)) {
    try {
      const parsed = JSON.parse(value.slice(experienceStoragePrefix.length)) as CandidateExperience[];
      if (Array.isArray(parsed)) return parsed.filter((item) => item && typeof item === "object");
    } catch {
      // Fall through to the legacy text format.
    }
  }
  if (!value.trim()) return [];
  return [{
    id: "legacy-experience",
    title: "الخبرة المهنية",
    company: "",
    location: "",
    period: "",
    description: value,
  }];
}

export function formatCandidateExperiences(value: string) {
  const experiences = parseCandidateExperiences(value);
  if (!experiences.length) return "";
  return experiences.map((experience) => {
    const heading = [experience.title, experience.company].filter(Boolean).join(" — ");
    const meta = [experience.period, experience.location].filter(Boolean).join(" · ");
    return [heading, meta, experience.description].filter(Boolean).join("\n");
  }).join("\n\n");
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
    candidate.experience_details,
    candidate.education,
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