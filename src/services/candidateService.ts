import { supabase } from "../lib/supabase";
import type { CandidateProfile, CandidateProfileInput, CandidateSearchResult } from "../lib/types";

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