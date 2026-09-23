import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

function translateAuthError(error: { message?: string } | null, fallback: string) {
  const message = error?.message?.toLowerCase() || "";
  if (message.includes("invalid login credentials")) {
    return new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  }
  return error || new Error(fallback);
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, organization, can_search_candidates")
    .eq("id", userId)
    .single();
  return { profile: (data as Profile) || null, error };
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
  const { profile, error: profileError } = await getProfile(data.user.id);
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
  return supabase.auth.signOut();
}