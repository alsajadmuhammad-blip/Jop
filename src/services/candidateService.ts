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
  city: string;
  minExperience: string;
  workType: string;
  remoteOnly: boolean;
};

export const emptyCandidateSearchFilters: CandidateSearchFilters = {
  keyword: "",
  specialization: "",
  city: "",
  minExperience: "",
  workType: "",
  remoteOnly: false,
};

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
  const { data, error } = await supabase.rpc("search_candidate_profiles", {
    p_keyword: filters.keyword.trim() || null,
    p_specialization: filters.specialization.trim() || null,
    p_city: filters.city.trim() || null,
    p_min_experience: filters.minExperience ? Number(filters.minExperience) : null,
    p_work_type: filters.workType.trim() || null,
    p_remote_available: filters.remoteOnly || null,
    p_limit: 50,
    p_offset: 0,
  });
  return { profiles: (data as CandidateSearchResult[]) || [], error };
}