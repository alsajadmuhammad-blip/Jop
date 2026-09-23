import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AccountRole = "candidate" | "hr";

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "طريقة الطلب غير مسموحة." }, 405);
  }

  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const role = body.role as AccountRole;

    if (!email || !email.includes("@")) {
      return json({ error: "أدخل بريدًا إلكترونيًا صحيحًا." }, 400);
    }

    if (password.length < 6) {
      return json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." }, 400);
    }

    if (!fullName) {
      return json({ error: "أدخل الاسم الكامل." }, 400);
    }

    if (role !== "candidate" && role !== "hr") {
      return json({ error: "نوع الحساب غير صحيح." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase function secrets.");
      return json({ error: "إعدادات إنشاء الحساب غير مكتملة." }, 500);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role,
      },
    });

    if (createError || !data.user) {
      const message = createError?.message?.toLowerCase() || "";
      if (message.includes("already") || message.includes("registered")) {
        return json({ error: "هذا البريد مسجل مسبقًا. استخدم تسجيل الدخول أو بريدًا آخر." }, 409);
      }
      console.error("Could not create auth user:", createError);
      return json({ error: "تعذر إنشاء الحساب." }, 400);
    }

    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        {
          id: data.user.id,
          full_name: fullName,
          role,
        },
        { onConflict: "id" },
      );

    if (profileError) {
      await admin.auth.admin.deleteUser(data.user.id);
      console.error("Could not create user profile:", profileError);
      return json({ error: "تعذر تجهيز ملف الحساب." }, 500);
    }

    return json({
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    });
  } catch (error) {
    console.error("Unexpected create-account error:", error);
    return json({ error: "تعذر إنشاء الحساب." }, 500);
  }
});