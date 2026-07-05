/**
 * POST /api/partner-activation
 *
 * تُستدعى داخلياً عند تفعيل متجر لتحديث أرباح الشريك.
 *
 * الأمان:
 * - يجب أن يحمل الطلب Authorization: Bearer <supabase-jwt>
 * - يتحقق من أن صاحب التوكن لديه role = 'admin' في جدول users
 *
 * الإيدمبوتنسي:
 * - يتحقق من أن activation_date للمتجر ضُبطت خلال آخر 15 دقيقة
 *   (يمنع إعادة الحساب لنفس التفعيل القديم)
 * - يتحقق من أن المتجر نشط فعلاً (is_active = true)
 *
 * منطق الأرباح:
 * - نظام العمولة: نسبة % من سعر الباقة على كل تفعيل
 * - نظام الراتب:
 *     • عند بلوغ الهدف أول مرة → راتب شهري كامل
 *     • كل تفعيل بعد الهدف → عمولة إضافية %
 *     • يجب أن يكون required_stores_count > 0 لنظام الراتب
 *
 * نقاط الباقات:
 *   JSONB في users: { [package_id]: points }
 *   الافتراضي: 1 نقطة
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACTIVATION_WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة

/**
 * ينشئ عميل Supabase بالصلاحيات المناسبة:
 * - إذا كان SERVICE_KEY موجوداً → يُستخدم (يتجاوز RLS)
 * - وإلا → يُستخدم JWT الأدمن (يعتمد على سياسات RLS التي تسمح للأدمن بالتعديل)
 */
function makeOpsClient(adminToken: string) {
  if (SERVICE_KEY) {
    return createClient(SUPABASE_URL, SERVICE_KEY);
  }
  // fallback: نستخدم JWT الأدمن لكي تنطبق سياسات RLS الخاصة بالأدمن
  return createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${adminToken}` } },
  });
}

// ── التحقق من الـ JWT وأن المستخدم أدمن ─────────────────────────────────────
// يُعيد token النظيف أو null إذا فشل التحقق
async function verifyAdmin(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  try {
    // نتحقق من التوكن عبر Supabase (لا يحتاج service key)
    const supabaseCheck = createClient(SUPABASE_URL, ANON_KEY);
    const { data: { user }, error } = await supabaseCheck.auth.getUser(token);
    if (error || !user) return null;

    // نتحقق من role في جدول users باستخدام عميل الأدمن
    const opsClient = makeOpsClient(token);
    const { data: row } = await opsClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    return row?.role === 'admin' ? token : null;
  } catch {
    return null;
  }
}

// ── نوع الاستجابة ────────────────────────────────────────────────────────────
export type PartnerActivationResult =
  | { success: true; partnerId: string; pointsAdded: number; newMonthlyActivations: number; earningsIncrement: number; totalEarnings: number; breakdown: string[]; wasReset: boolean }
  | { skipped: true; reason: string }
  | { error: string };

// ── المنطق الرئيسي ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse<PartnerActivationResult>> {
  // ── 0. التحقق من الصلاحية ─────────────────────────────────────────────────
  const adminToken = await verifyAdmin(req.headers.get('authorization'));
  if (!adminToken) {
    return NextResponse.json({ error: 'غير مصرح: يجب أن تكون مشرفاً' }, { status: 401 });
  }

  // عميل العمليات: service-role إن وُجد، وإلا JWT الأدمن
  const db = makeOpsClient(adminToken);

  try {
    const body = await req.json() as { store_id?: string };
    const { store_id } = body;

    if (!store_id) {
      return NextResponse.json({ error: 'يجب تمرير store_id' }, { status: 400 });
    }

    // ── 1. جلب بيانات المتجر مع التحقق من صحة التفعيل ────────────────────
    const { data: store, error: storeErr } = await db
      .from('stores')
      .select('registered_by_agent_id, package_id, is_active, activation_date')
      .eq('id', store_id)
      .maybeSingle();

    if (storeErr) {
      return NextResponse.json({ error: `خطأ في جلب المتجر: ${storeErr.message}` }, { status: 500 });
    }

    if (!store) {
      return NextResponse.json({ error: 'المتجر غير موجود' }, { status: 404 });
    }

    // التحقق من أن المتجر نشط
    if (!store.is_active) {
      return NextResponse.json({ skipped: true, reason: 'store_not_active' });
    }

    if (!store.registered_by_agent_id) {
      return NextResponse.json({ skipped: true, reason: 'no_partner' });
    }

    // ── 2. التحقق من نافذة التفعيل (idempotency) ─────────────────────────
    // نقبل فقط إذا كان activation_date ضُبط خلال آخر 15 دقيقة
    if (store.activation_date) {
      const activatedAt = new Date(store.activation_date).getTime();
      const age = Date.now() - activatedAt;
      if (age > ACTIVATION_WINDOW_MS) {
        return NextResponse.json({
          skipped: true,
          reason: `activation_too_old: ${Math.round(age / 60000)} دقيقة مضت — يجب الاستدعاء فور التفعيل`,
        });
      }
    }

    const agentId  = store.registered_by_agent_id;
    const packageId = store.package_id ?? null;

    // ── 3. جلب بيانات الشريك ──────────────────────────────────────────────
    const { data: partner, error: partnerErr } = await db
      .from('users')
      .select('monthly_activations, total_earnings, commission_percent, payment_system, required_stores_count, monthly_salary, package_points, last_reset_date')
      .eq('id', agentId)
      .maybeSingle();

    if (partnerErr) {
      return NextResponse.json({ error: `خطأ في جلب الشريك: ${partnerErr.message}` }, { status: 500 });
    }
    if (!partner) {
      return NextResponse.json({ error: 'الشريك غير موجود' }, { status: 404 });
    }

    // ── 4. التحقق من إعادة الضبط الشهري ──────────────────────────────────
    const now = new Date();
    const lastReset = partner.last_reset_date ? new Date(partner.last_reset_date) : null;
    const needsReset = !lastReset
      || lastReset.getFullYear() !== now.getFullYear()
      || lastReset.getMonth()    !== now.getMonth();

    const currentActivations = needsReset ? 0 : (partner.monthly_activations ?? 0);

    // ── 5. جلب سعر الباقة ─────────────────────────────────────────────────
    let packagePrice: number | null = null;
    if (packageId) {
      const { data: pkg } = await db
        .from('store_packages')
        .select('price')
        .eq('id', packageId)
        .maybeSingle();
      packagePrice = pkg?.price != null ? Number(pkg.price) : null;
    }

    // ── 6. احتساب النقاط ──────────────────────────────────────────────────
    // package_points: { [package_id]: number } — خاص بهذا الشريك
    const pkgPointsMap: Record<string, number> = partner.package_points ?? {};
    const pointsForThisActivation = packageId && pkgPointsMap[packageId] != null
      ? Math.max(1, Number(pkgPointsMap[packageId]))
      : 1;

    const oldActivations = currentActivations;
    const newActivations = oldActivations + pointsForThisActivation;

    const required      = partner.required_stores_count ?? 0;
    const commissionPct = partner.commission_percent    ?? 0;
    const monthlySalary = partner.monthly_salary        ?? 0;
    const paymentSystem = partner.payment_system;

    // ── 7. احتساب الأرباح ─────────────────────────────────────────────────
    let earningsIncrement = 0;
    const breakdown: string[] = [];

    if (paymentSystem === 'commission') {
      // نظام عمولة: نسبة من كل تفعيل
      if (commissionPct > 0 && packagePrice != null && packagePrice > 0) {
        earningsIncrement = Math.round((packagePrice * commissionPct) / 100);
        breakdown.push(`عمولة ${commissionPct}٪ من ${packagePrice.toLocaleString('ar-IQ')} = ${earningsIncrement.toLocaleString('ar-IQ')} د.ع`);
      }

    } else if (paymentSystem === 'salary') {
      // نظام الراتب — يجب أن يكون required > 0، وإلا نُسقط بدون حساب
      if (required <= 0) {
        breakdown.push('تحذير: نظام الراتب بدون هدف محدد — لا أرباح تُحتسب (اضبط required_stores_count > 0)');
      } else {
        const wasAtGoal = oldActivations >= required;
        const nowAtGoal = newActivations >= required;

        if (!wasAtGoal && nowAtGoal) {
          // 🎯 تحقق الهدف هذا التفعيل → راتب شهري
          if (monthlySalary > 0) {
            earningsIncrement += monthlySalary;
            breakdown.push(`راتب شهري (تحقيق ${required} نقطة) = ${monthlySalary.toLocaleString('ar-IQ')} د.ع`);
          }
          // إذا تجاوز الهدف بنفس التفعيل → عمولة للزيادة
          if (newActivations > required && commissionPct > 0 && packagePrice != null && packagePrice > 0) {
            const bonus = Math.round((packagePrice * commissionPct) / 100);
            earningsIncrement += bonus;
            breakdown.push(`عمولة تجاوز الهدف ${commissionPct}٪ = ${bonus.toLocaleString('ar-IQ')} د.ع`);
          }
        } else if (wasAtGoal) {
          // ✅ الهدف محقق مسبقاً → عمولة إضافية
          if (commissionPct > 0 && packagePrice != null && packagePrice > 0) {
            earningsIncrement = Math.round((packagePrice * commissionPct) / 100);
            breakdown.push(`عمولة بعد الهدف ${commissionPct}٪ = ${earningsIncrement.toLocaleString('ar-IQ')} د.ع`);
          }
        } else {
          breakdown.push(`تقدم نحو الهدف: ${newActivations}/${required} نقطة — لا أرباح بعد`);
        }
      }
    } else {
      breakdown.push(`نظام الدفع غير معروف: ${paymentSystem}`);
    }

    // ── 8. تحديث سجل الشريك ──────────────────────────────────────────────
    const newTotalEarnings = (partner.total_earnings ?? 0) + earningsIncrement;
    const updatePayload: Record<string, any> = {
      monthly_activations: newActivations,
      total_earnings:      newTotalEarnings,
    };
    if (needsReset) {
      updatePayload.last_reset_date = now.toISOString();
    }

    const { error: updateErr } = await db
      .from('users')
      .update(updatePayload)
      .eq('id', agentId);

    if (updateErr) {
      return NextResponse.json({ error: `فشل تحديث الشريك: ${updateErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success:               true,
      partnerId:             agentId,
      pointsAdded:           pointsForThisActivation,
      newMonthlyActivations: newActivations,
      earningsIncrement,
      totalEarnings:         newTotalEarnings,
      breakdown,
      wasReset:              needsReset,
    });

  } catch (err: any) {
    console.error('[partner-activation] unexpected error:', err);
    return NextResponse.json({ error: err?.message ?? 'خطأ غير متوقع' }, { status: 500 });
  }
}
