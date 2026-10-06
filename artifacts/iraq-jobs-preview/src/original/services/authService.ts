import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

const PROFILE_CACHE_TTL = 5 * 60 * 1000;
const profileCache = new Map<string, { profile: Profile; cachedAt: number }>();
const profileRequests = new Map<string, Promise<{ profile: Profile | null; error: unknown | null }>>();

function translateAuthError(error: { message?: string } | null, fallback: string) {
  const message = error?.message?.toLowerCase() || "";
  if (message.includes("invalid login credentials")) {
    return new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  }
  return error || new Error(fallback);
}

export async function getProfile(userId: string, options: { forceRefresh?: boolean } = {}) {
  const cached = profileCache.get(userId);
  if (!options.forceRefresh && cached && Date.now() - cached.cachedAt < PROFILE_CACHE_TTL) {
    return { profile: cached.profile, error: null };
  }

  const pending = profileRequests.get(userId);
  if (pending) return pending;

  const request = (async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, organization, can_search_candidates")
      .eq("id", userId)
      .single();
    const profile = (data as Profile) || null;
    if (profile && !error) profileCache.set(userId, { profile, cachedAt: Date.now() });
    return { profile, error };
  })();

  profileRequests.set(userId, request);
  try {
    return await request;
  } finally {
    profileRequests.delete(userId);
  }
}

export async function getCurrentProfile() {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user) return null;
  const { profile } = await getProfile(data.session.user.id);
  return profile;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { profile: null, error: translateAuthError(error, "تعذر تسجيل الدخول.") };
  const { profile, error: profileError } = await getProfile(data.user.id, { forceRefresh: true });
  if (profileError || !profile) return { profile: null, error: new Error("الحساب غير مربوط بدور داخل المنصة.") };
  return { profile, error: null };
}

export async function signUp(email: string, password: string, fullName: string, role: "candidate" | "hr") {
  const { data, error } = await supabase.functions.invoke("create-account", {
    body: {
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role,
    },
  });
  if (error || !data?.user) {
    return {
      profile: null,
      session: null,
      error: new Error(data?.error || error?.message || "تعذر إنشاء الحساب."),
    };
  }

  return signIn(email.trim(), password);
}

export function signOut() {
  profileCache.clear();
  return supabase.auth.signOut();
}