import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const ACTIVATION_WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const { store_id } = await req.json();
    if (!store_id) {
      return Response.json({ error: "يجب تمرير store_id" }, { status: 400, headers: cors });
    }

    // ── 1. جلب المتجر ─────────────────────────────────────────────
    const { data: store, error: storeErr } = await supabase
      .from("stores")
      .select("registered_by_agent_id, registeredByAgentId, package_id, is_active, activation_date, activationDate")
      .eq("id", store_id)
      .maybeSingle();

    if (storeErr) return Response.json({ error: storeErr.message }, { status: 500, headers: cors });
    if (!store)   return Response.json({ error: "المتجر غير موجود" }, { status: 404, headers: cors });

    const isActive  = store.is_active;
    const agentId   = store.registered_by_agent_id ?? store.registeredByAgentId ?? null;
    const packageId = store.package_id ?? null;
    const actDate   = store.activation_date ?? store.activationDate ?? null;

    if (!isActive)  return Response.json({ skipped: true, reason: "store_not_active" }, { headers: cors });
    if (!agentId)   return Response.json({ skipped: true, reason: "no_partner" }, { headers: cors });

    // ── 2. نافذة 15 دقيقة (idempotency) ──────────────────────────
    if (actDate) {
      const age = Date.now() - new Date(actDate).getTime();
      if (age > ACTIVATION_WINDOW_MS) {
        return Response.json({
          skipped: true,
          reason: `activation_too_old: ${Math.round(age / 60000)} دقيقة`,
        }, { headers: cors });
      }
    }

    // ── 3. جلب بيانات الشريك ──────────────────────────────────────
    const { data: partner, error: partnerErr } = await supabase
      .from("users")
      .select("monthly_activations, total_earnings, commission_percent, payment_system, required_stores_count, monthly_salary, package_points, last_reset_date")
      .eq("id", agentId)
      .maybeSingle();

    if (partnerErr) return Response.json({ error: partnerErr.message }, { status: 500, headers: cors });
    if (!partner)   return Response.json({ error: "الشريك غير موجود" }, { status: 404, headers: cors });

    // ── 4. إعادة الضبط الشهري ─────────────────────────────────────
    const now       = new Date();
    const lastReset = partner.last_reset_date ? new Date(partner.last_reset_date) : null;
    const needsReset = !lastReset
      || lastReset.getFullYear() !== now.getFullYear()
      || lastReset.getMonth()    !== now.getMonth();
    const currentActivations = needsReset ? 0 : (partner.monthly_activations ?? 0);

    // ── 5. سعر الباقة ─────────────────────────────────────────────
    let packagePrice: number | null = null;
    if (packageId) {
      const { data: pkg } = await supabase
        .from("store_packages").select("price").eq("id", packageId).maybeSingle();
      packagePrice = pkg?.price != null ? Number(pkg.price) : null;
    }

    // ── 6. نقاط هذا التفعيل ───────────────────────────────────────
    const pkgPointsMap: Record<string, number> = partner.package_points ?? {};
    const pointsForThisActivation = (packageId && pkgPointsMap[packageId] != null)
      ? Math.max(1, Number(pkgPointsMap[packageId]))
      : 1;

    const oldActivations = currentActivations;
    const newActivations = oldActivations + pointsForThisActivation;

    const required      = partner.required_stores_count ?? 0;
    const commissionPct = partner.commission_percent    ?? 0;
    const monthlySalary = partner.monthly_salary        ?? 0;
    const paymentSystem = partner.payment_system;

    // ── 7. احتساب الأرباح ─────────────────────────────────────────
    let earningsIncrement = 0;
    const breakdown: string[] = [];

    if (paymentSystem === "commission") {
      if (commissionPct > 0 && packagePrice != null && packagePrice > 0) {
        earningsIncrement = Math.round((packagePrice * commissionPct) / 100);
        breakdown.push(`عمولة ${commissionPct}٪ من ${packagePrice} = ${earningsIncrement} د.ع`);
      }
    } else if (paymentSystem === "salary") {
      if (required <= 0) {
        breakdown.push("تحذير: هدف الراتب = 0");
      } else {
        const wasAtGoal = oldActivations >= required;
        const nowAtGoal = newActivations >= required;

        if (!wasAtGoal && nowAtGoal) {
          if (monthlySalary > 0) {
            earningsIncrement += monthlySalary;
            breakdown.push(`راتب شهري (${required} نقطة) = ${monthlySalary} د.ع`);
          }
          if (newActivations > required && commissionPct > 0 && packagePrice) {
            const bonus = Math.round((packagePrice * commissionPct) / 100);
            earningsIncrement += bonus;
            breakdown.push(`عمولة تجاوز = ${bonus} د.ع`);
          }
        } else if (wasAtGoal) {
          if (commissionPct > 0 && packagePrice) {
            earningsIncrement = Math.round((packagePrice * commissionPct) / 100);
            breakdown.push(`عمولة بعد الهدف = ${earningsIncrement} د.ع`);
          }
        } else {
          breakdown.push(`تقدم: ${newActivations}/${required} نقطة`);
        }
      }
    }

    // ── 8. تحديث سجل الشريك ───────────────────────────────────────
    const updatePayload: Record<string, unknown> = {
      monthly_activations: newActivations,
      total_earnings:      (partner.total_earnings ?? 0) + earningsIncrement,
    };
    if (needsReset) updatePayload.last_reset_date = now.toISOString();

    const { error: updateErr } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", agentId);

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 500, headers: cors });

    return Response.json({
      success:               true,
      partnerId:             agentId,
      pointsAdded:           pointsForThisActivation,
      newMonthlyActivations: newActivations,
      earningsIncrement,
      totalEarnings:         (partner.total_earnings ?? 0) + earningsIncrement,
      breakdown,
      wasReset:              needsReset,
    }, { headers: cors });

  } catch (err: unknown) {
    console.error("[partner-activation]", err);
    return Response.json({ error: String(err) }, { status: 500, headers: cors });
  }
});
