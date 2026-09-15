import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, organization")
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
  if (error || !data.user) return { profile: null, error: error || new Error("تعذر تسجيل الدخول.") };
  const { profile, error: profileError } = await getProfile(data.user.id);
  if (profileError || !profile) return { profile: null, error: new Error("الحساب غير مربوط بدور داخل المنصة.") };
  return { profile, error: null };
}

export function signOut() {
  return supabase.auth.signOut();
}