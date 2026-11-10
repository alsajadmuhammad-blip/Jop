import type { CandidateCvAiResult } from "../../services/cvAiService";
import type { CandidateCvImport } from "./cvImport";

type Experience = CandidateCvImport["experiences"][number];
type Education = CandidateCvImport["education"][number];
type Language = CandidateCvImport["languages"][number];

function normalizeIdentity(value: string | undefined) {
  return (value || "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function periodBounds(entry: Experience) {
  const periodText = [entry.startMonth, entry.endMonth, entry.legacyPeriod]
    .filter(Boolean)
    .join(" ");
  const years = [...periodText.matchAll(/\b(?:19|20|21)\d{2}\b/g)]
    .map((match) => Number(match[0]));
  if (!years.length) return null;

  const isCurrent = entry.isCurrent || /\b(present|current)\b|حتى الآن|حاليًا|مستمر/i.test(periodText);
  return {
    start: years[0],
    end: isCurrent ? Number.POSITIVE_INFINITY : years[years.length - 1],
  };
}

function periodsOverlap(left: Experience, right: Experience) {
  const leftRange = periodBounds(left);
  const rightRange = periodBounds(right);
  if (!leftRange || !rightRange) return true;
  return Math.max(leftRange.start, rightRange.start) <= Math.min(leftRange.end, rightRange.end);
}

function sameExperience(left: Experience, right: Experience) {
  const leftTitle = normalizeIdentity(left.title);
  const rightTitle = normalizeIdentity(right.title);
  const leftCompany = normalizeIdentity(left.company);
  const rightCompany = normalizeIdentity(right.company);

  if (leftTitle && rightTitle && leftTitle !== rightTitle) return false;
  if (leftCompany && rightCompany && leftCompany !== rightCompany) return false;

  const hasSharedIdentity = Boolean(
    (leftTitle && rightTitle) || (leftCompany && rightCompany),
  );
  return hasSharedIdentity && periodsOverlap(left, right);
}

function mergeExperience(existing: Experience, incoming: Experience): Experience {
  const isCurrent = existing.isCurrent || incoming.isCurrent;
  return {
    ...incoming,
    ...existing,
    id: existing.id || incoming.id,
    title: existing.title.trim() || incoming.title,
    company: existing.company.trim() || incoming.company,
    location: existing.location.trim() || incoming.location,
    startMonth: existing.startMonth || incoming.startMonth,
    endMonth: isCurrent ? "" : existing.endMonth || incoming.endMonth,
    isCurrent,
    legacyPeriod: isCurrent ? "" : existing.legacyPeriod || incoming.legacyPeriod,
    description: existing.description.trim() || incoming.description,
  };
}

function sameEducation(left: Education, right: Education) {
  const leftDegree = normalizeIdentity(left.degree);
  const rightDegree = normalizeIdentity(right.degree);
  const leftSpecialization = normalizeIdentity(left.specialization);
  const rightSpecialization = normalizeIdentity(right.specialization);
  const leftInstitution = normalizeIdentity(left.institution);
  const rightInstitution = normalizeIdentity(right.institution);
  const leftYear = normalizeIdentity(left.graduationYear);
  const rightYear = normalizeIdentity(right.graduationYear);

  if (leftDegree && rightDegree && leftDegree !== rightDegree) return false;
  if (leftSpecialization && rightSpecialization && leftSpecialization !== rightSpecialization) return false;
  if (leftInstitution && rightInstitution && leftInstitution !== rightInstitution) return false;
  if (leftYear && rightYear && leftYear !== rightYear) return false;

  const sameInstitution = leftInstitution && rightInstitution;
  const sameDegree = leftDegree && rightDegree;
  const sameSpecialization = leftSpecialization && rightSpecialization;
  return Boolean(
    (sameInstitution && (sameDegree || !leftDegree || !rightDegree)) ||
    (sameDegree && (sameInstitution || sameSpecialization)),
  );
}

function mergeEducation(existing: Education, incoming: Education): Education {
  return {
    ...incoming,
    ...existing,
    id: existing.id || incoming.id,
    degree: existing.degree.trim() || incoming.degree,
    specialization: existing.specialization.trim() || incoming.specialization,
    institution: existing.institution.trim() || incoming.institution,
    graduationYear: existing.graduationYear.trim() || incoming.graduationYear,
  };
}

function canonicalLanguage(value: string) {
  const key = normalizeIdentity(value);
  const aliases: Record<string, string[]> = {
    arabic: ["arabic", "العربية", "عربي", "عربية"],
    english: ["english", "الانجليزية", "الانكليزية", "انجليزي", "انكليزي"],
    kurdish: ["kurdish", "الكردية", "كردي", "كردية"],
    french: ["french", "الفرنسية", "فرنسي", "فرنسية"],
    turkish: ["turkish", "التركية", "تركي", "تركية"],
  };

  for (const [canonical, names] of Object.entries(aliases)) {
    if (names.some((name) => normalizeIdentity(name) === key)) return canonical;
  }
  return key;
}

function mergeLanguage(existing: Language, incoming: Language): Language {
  return {
    ...incoming,
    ...existing,
    name: existing.name.trim() || incoming.name,
    level: existing.level || incoming.level,
  };
}

function mergeUniqueRecords<T>(
  existing: T[],
  incoming: T[],
  same: (left: T, right: T) => boolean,
  merge: (left: T, right: T) => T,
) {
  const result: T[] = [];
  for (const entry of [...existing, ...incoming]) {
    const duplicateIndex = result.findIndex((current) => same(current, entry));
    if (duplicateIndex === -1) {
      result.push(entry);
    } else {
      result[duplicateIndex] = merge(result[duplicateIndex], entry);
    }
  }
  return result;
}

function mergeSkills(existing: string[] = [], incoming: string[] = []) {
  const result: string[] = [];
  const keys = new Set<string>();
  for (const skill of [...existing, ...incoming]) {
    const value = skill.trim();
    const key = normalizeIdentity(value);
    if (!key || keys.has(key)) continue;
    keys.add(key);
    result.push(value);
  }
  return result.slice(0, 35);
}

export function mergeCandidateCvAiResult(
  current: CandidateCvImport,
  ai: CandidateCvAiResult,
): CandidateCvImport {
  const localProfile = current.profile;
  return {
    ...current,
    profile: {
      ...ai.profile,
      ...localProfile,
      headline: localProfile.headline || ai.profile.headline || "",
      specialization: localProfile.specialization || ai.profile.specialization || "",
      experience_years: localProfile.experience_years || ai.profile.experience_years || 0,
      skills: mergeSkills(localProfile.skills, ai.profile.skills),
      summary: localProfile.summary || ai.profile.summary || "",
    },
    experiences: mergeUniqueRecords(
      current.experiences,
      ai.experiences,
      sameExperience,
      mergeExperience,
    ),
    education: mergeUniqueRecords(
      current.education,
      ai.education,
      sameEducation,
      mergeEducation,
    ),
    languages: mergeUniqueRecords(
      current.languages,
      ai.languages,
      (left, right) => canonicalLanguage(left.name) === canonicalLanguage(right.name),
      mergeLanguage,
    ),
    aiText: undefined,
    aiTextTruncated: false,
  };
}
