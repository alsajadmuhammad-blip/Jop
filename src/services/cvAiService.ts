import { supabase } from "../lib/supabase";
import type { CandidateProfileInput } from "../lib/types";
import {
  languageLevels,
  type CandidateEducation,
  type CandidateExperience,
  type CandidateLanguage,
} from "./candidateService";

const workerUrl = import.meta.env.VITE_CV_AI_WORKER_URL?.trim() || "";

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
  return Boolean(workerUrl);
}

export async function analyzeCandidateCv(text: string): Promise<CandidateCvAiResult> {
  if (!workerUrl) throw new Error("تحليل AI غير مفعّل بعد. استخدم الاستخراج المحلي أو اربط Worker أولًا.");
  if (!text.trim() || text.length > 12_000) {
    throw new Error("نص السيرة غير صالح للتحليل.");
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    throw new Error("انتهت جلسة الدخول. سجّل الدخول ثم أعد المحاولة.");
  }

  let response: Response;
  try {
    response = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ text }),
    });
  } catch {
    throw new Error("تعذر الاتصال بخدمة التحليل السحابي. بقيت بياناتك على الجهاز.");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("وصل رد غير صالح من خدمة التحليل. لم تُضف أي بيانات.");
  }

  const code = isRecord(payload) ? payload.code : undefined;
  if (!response.ok) {
    if (code === "AI_DAILY_QUOTA_EXHAUSTED" || response.status === 429) {
      throw new Error("انتهت حصة Cloudflare AI المجانية لليوم. أوقفنا التحليل السحابي حتى التجديد، ويمكنك متابعة الاستخراج المحلي.");
    }
    if (response.status === 401 || code === "CANDIDATE_ACCESS_REQUIRED") {
      throw new Error("يلزم تسجيل الدخول بحساب باحث عن عمل لاستخدام التحليل.");
    }
    throw new Error("تعذر التحليل السحابي حاليًا. لم تُضف أي بيانات إلى ملفك.");
  }

  const data = isRecord(payload) ? payload.data : undefined;
  return normalizeResponse(data);
}
