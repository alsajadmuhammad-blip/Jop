import { hasSupabaseConfig, supabase } from "../lib/supabase";
import type { CandidateProfileInput } from "../lib/types";
import {
  languageLevels,
  type CandidateEducation,
  type CandidateExperience,
  type CandidateLanguage,
} from "./candidateService";

export type CandidateCvAiResult = {
  profile: Partial<Pick<
    CandidateProfileInput,
    "headline" | "specialization" | "experience_years" | "skills" | "summary"
  >>;
  experiences: CandidateExperience[];
  education: CandidateEducation[];
  languages: CandidateLanguage[];
};

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function textValue(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function newId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() || Date.now()}`;
}

function normalizeResponse(value: unknown): CandidateCvAiResult {
  if (!isRecord(value) || !isRecord(value.profile) ||
      !Array.isArray(value.experiences) || !Array.isArray(value.education) ||
      !Array.isArray(value.languages)) {
    throw new Error("وصلت نتيجة غير مكتملة. لم تُضف أي بيانات إلى الملف.");
  }

  const profile: CandidateCvAiResult["profile"] = {
    headline: textValue(value.profile.headline, 120),
    specialization: textValue(value.profile.specialization, 100),
    experience_years: Number.isInteger(value.profile.experience_years)
      ? Math.min(60, Math.max(0, Number(value.profile.experience_years)))
      : undefined,
    skills: Array.isArray(value.profile.skills)
      ? [...new Set(value.profile.skills.map((item) => textValue(item, 60)).filter(Boolean))].slice(0, 35)
      : [],
    summary: textValue(value.profile.summary, 1200),
  };

  const experiences: CandidateExperience[] = value.experiences
    .filter(isRecord)
    .slice(0, 15)
    .map((item) => {
      const isCurrent = item.isCurrent === true;
      const startMonth = textValue(item.startMonth, 7);
      const endMonth = isCurrent ? "" : textValue(item.endMonth, 7);
      const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;
      const validStartMonth = monthPattern.test(startMonth) ? startMonth : "";
      const validEndMonth = monthPattern.test(endMonth) ? endMonth : "";
      return {
        id: newId("ai-experience"),
        title: textValue(item.title, 120),
        company: textValue(item.company, 120),
        location: textValue(item.location, 120),
        startMonth: validStartMonth,
        endMonth: validEndMonth,
        isCurrent,
        legacyPeriod: textValue(item.legacyPeriod, 80) ||
          (!validStartMonth && !validEndMonth
            ? textValue([item.startMonth, item.endMonth].filter(Boolean).join(" – "), 80)
            : ""),
        description: textValue(item.description, 1200),
      };
    })
    .filter((item) => item.title || item.company || item.description);

  const education: CandidateEducation[] = value.education
    .filter(isRecord)
    .slice(0, 10)
    .map((item) => ({
      id: newId("ai-education"),
      degree: textValue(item.degree, 120),
      specialization: textValue(item.specialization, 120),
      institution: textValue(item.institution, 160),
      graduationYear: textValue(item.graduationYear, 8),
    }))
    .filter((item) => item.degree || item.specialization || item.institution || item.graduationYear);

  const languages: CandidateLanguage[] = value.languages
    .filter(isRecord)
    .slice(0, 12)
    .map((item) => ({
      name: textValue(item.name, 60),
      level: item.level === "" || languageLevels.some((level) => level === item.level)
        ? item.level as CandidateLanguage["level"]
        : "",
    }))
    .filter((item) => item.name);

  return { profile, experiences, education, languages };
}

export function isCvAiConfigured() {
  return hasSupabaseConfig && import.meta.env.VITE_CV_AI_ENABLED === "true";
}

export async function analyzeCandidateCv(text: string): Promise<CandidateCvAiResult> {
  if (!isCvAiConfigured()) {
    throw new Error("تحليل AI غير مفعّل بعد. استخدم الاستخراج المحلي أو أكمل إعداد الدالة السحابية.");
  }
  if (!text.trim() || text.length > 12_000) {
    throw new Error("نص السيرة غير صالح للتحليل.");
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error("انتهت جلسة الدخول. سجّل الدخول ثم أعد المحاولة.");
  }

  const { data, error } = await supabase.functions.invoke("analyze-cv", {
    body: { text },
  });

  if (error) {
    let status = 0;
    let code: unknown;
    if (error.context instanceof Response) {
      status = error.context.status;
      try {
        const payload: unknown = await error.context.clone().json();
        code = isRecord(payload) ? payload.code : undefined;
      } catch {
        // Use the HTTP status when the function response is not JSON.
      }
    }

    if (code === "AI_DAILY_QUOTA_EXHAUSTED" || status === 429) {
      throw new Error("انتهت حصة Cloudflare AI المجانية لليوم. أوقفنا التحليل السحابي حتى التجديد، ويمكنك متابعة الاستخراج المحلي.");
    }
    if (status === 401) {
      throw new Error("يلزم تسجيل الدخول بحساب باحث عن عمل لاستخدام التحليل.");
    }
    if (status === 403 || code === "CANDIDATE_ACCESS_REQUIRED") {
      throw new Error("هذه الميزة متاحة لحساب الباحث عن عمل فقط.");
    }
    if (status === 404) {
      throw new Error("دالة تحليل السيرة غير منشورة على Supabase بعد.");
    }
    if (code === "SERVICE_NOT_CONFIGURED") {
      throw new Error("أضيفت الدالة، لكن أسرار Cloudflare لم تُضبط في Supabase بعد.");
    }
    if (status === 0) {
      throw new Error("تعذر الاتصال بدالة Supabase. تحقق من نشرها واتصال الإنترنت.");
    }
    throw new Error("تعذر التحليل السحابي حاليًا. لم تُضف أي بيانات إلى ملفك.");
  }

  const result = isRecord(data) ? data.data : undefined;
  return normalizeResponse(result);
}
