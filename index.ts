// supabase/functions/verify-subscription-payment/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface VerifyPaymentRequest {
  transactionId?: string;
  zaincashTransactionId?: string;
  token?: string; 
  ipAddress?: string;
}

function decodeJwtPayload(token: string): Record<string, any> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return {};
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS_HEADERS });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
        status: 405,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const zainCashClientId = Deno.env.get("ZAIN_CASH_CLIENT_ID");
    const zainCashApiUrl = Deno.env.get("ZAIN_CASH_PRODUCTION_API_LINK") || "https://pg-api.zaincash.iq";

    if (!supabaseUrl || !supabaseKey || !zainCashClientId) {
      throw new Error("Missing configuration variables");
    }

    const body = await req.json() as VerifyPaymentRequest;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let zainCashReqId = body.zaincashTransactionId;

    if (body.token) {
      const decoded = decodeJwtPayload(body.token);
      if (decoded && decoded.id) {
        zainCashReqId = decoded.id;
      }
    }

    let transactionQuery = supabase.from("subscription_transactions").select("*");
    if (body.transactionId) {
      transactionQuery = transactionQuery.eq("id", body.transactionId);
    } else if (zainCashReqId) {
      transactionQuery = transactionQuery.eq("zaincash_request_id", zainCashReqId);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: "Missing identifying parameter (transactionId, zaincashTransactionId, or token)" }),
        { status: 400, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const { data: transaction, error: transactionError } = await transactionQuery.single();

    if (transactionError || !transaction) {
      return new Response(
        JSON.stringify({ success: false, error: "Transaction not registered in system" }),
        { status: 404, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
      );
    }

    const verifyResponse = await fetch(
      `${zainCashApiUrl}/transaction/check?id=${transaction.zaincash_request_id}&client_id=${zainCashClientId}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );

    const verifyData = await verifyResponse.json();

    let newStatus = "failed";
    if (verifyData.status === "success" || verifyData.status === 1 || verifyData.status === true) {
      newStatus = "completed";
    }

    const { error: updateError } = await supabase
      .from("subscription_transactions")
      .update({
        status: newStatus,
        payment_gateway_response: verifyData,
        paymentGatewayResponse: verifyData,
        paid_at: newStatus === "completed" ? new Date().toISOString() : null,
        paidAt: newStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", transaction.id);

    if (updateError) throw new Error(`Failed to update transaction status: ${updateError.message}`);

    if (newStatus === "completed") {
      const { data: packageData, error: packageError } = await supabase
        .from("store_packages")
        .select("*")
        .eq("id", transaction.package_id)
        .single();

      if (packageError || !packageData) throw new Error("Package metadata missing");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + packageData.subscription_duration);

      // 1. تصفير وإطفاء الباقات السابقة للمتجر أولاً لمنع ازدواجية الباقات الفعالة
      await supabase
        .from("store_package_assignments")
        .update({ is_active: false })
        .eq("store_id", transaction.store_id);

      // 2. إدخال السجل الجديد (تعديل جذري: تم حذف حقول camelCase لأنها غير موجودة بالمخطط لهذا الجدول) 🟢
      const { error: assignmentError } = await supabase
        .from("store_package_assignments")
        .insert({
          store_id: transaction.store_id,
          package_id: transaction.package_id,
          assigned_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true
        });

      if (assignmentError) throw new Error(`Package assignment failure: ${assignmentError.message}`);

      // 3. تحديث المتجر وتفعيله (مع حقل package_id الصحيح حسب المخطط) 🟢
      const { error: storeActivationError } = await supabase
        .from("stores")
        .update({
          is_active: true,
          isActive: true,
          activation_date: new Date().toISOString(),
          activationDate: new Date().toISOString(),
          product_limit: packageData.product_limit,
          productLimit: packageData.product_limit,
          subscription_duration: packageData.subscription_duration,
          subscriptionDuration: packageData.subscription_duration,
          package_id: transaction.package_id 
        })
        .eq("id", transaction.store_id);

      if (storeActivationError) throw new Error(`Store status activation failure: ${storeActivationError.message}`);

      // 4. كتابة لوج التدقيق للحركة الناجحة
      await supabase.from("subscription_audit_log").insert({
        store_id: transaction.store_id,
        storeId: transaction.store_id,
        transaction_id: transaction.id,
        transactionId: transaction.id,
        action: "verify_payment",
        status_before: "processing",
        statusBefore: "processing",
        status_after: "completed",
        statusAfter: "completed",
        details: { zain_cash_status: verifyData.status, expires_at: expiresAt.toISOString() },
        actor_type: "system",
        actorType: "system",
        ip_address: body.ipAddress || null,
        ipAddress: body.ipAddress || null,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction.id,
        status: newStatus,
        message: `Payment status processed successfully as: ${newStatus}`,
      }),
      { status: 200, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...CORS_HEADERS, "Content-Type": "application/json" } }
    );
  }
});