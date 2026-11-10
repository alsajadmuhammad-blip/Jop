import type { CandidateCvAiResult } from "../../services/cvAiService";
import type { CandidateCvImport } from "./cvImport";

export function applyCandidateCvAiResult(
  current: CandidateCvImport,
  ai: CandidateCvAiResult,
): CandidateCvImport {
  return {
    ...current,
    profile: {
      ...current.profile,
      // Keep locally parsed contact details that the AI response does not contain.
      headline: ai.profile.headline ?? "",
      specialization: ai.profile.specialization ?? "",
      experience_years: ai.profile.experience_years,
      skills: ai.profile.skills ?? [],
      summary: ai.profile.summary ?? "",
    },
    // Successful AI extraction is the sole source for AI-covered fields.
    experiences: ai.experiences,
    education: ai.education,
    languages: ai.languages,
    source: "ai",
    aiText: undefined,
    aiTextTruncated: false,
  };
}
