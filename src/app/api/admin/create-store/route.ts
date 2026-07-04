import { NextRequest, NextResponse } from "next/server";

const SUPABASE_FUNCTION_URL =
  "https://tjfogjumpyygftwwbmxb.supabase.co/functions/v1/create-store";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Prepare payload for Supabase Edge Function
    const payload = {
      ownerName: body.ownerName,
      storeName: body.storeName,
      storeType: body.storeType,
      marketType: body.marketType,
      phone: body.phone,
      ...(body.storeType === "فعلي" && {
        governorate: body.governorate,
        city: body.city,
      }),
      email: body.email,
      password: body.password,
      ...(body.packageSlug && { packageSlug: body.packageSlug }),
      ...(body.partnerCode && { partnerCode: body.partnerCode }),
      ...(body.registeredByAgentId && { registeredByAgentId: body.registeredByAgentId }),
    };

    // Call Supabase Edge Function
    const response = await fetch(SUPABASE_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: result.message || result.error || "فشل إنشاء المتجر",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(result, { status: response.status });
  } catch (error: any) {
    console.error("Error in create-store API route:", error);
    return NextResponse.json(
      {
        error: error.message || "حدث خطأ في الخادم",
      },
      { status: 500 }
    );
  }
}
