import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { storeId, rating } = await request.json();

    if (!storeId || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "بيانات غير صحيحة" }, { status: 400 });
    }

    // Use service role key if available to bypass RLS, otherwise anon key
    const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const supabase = createClient(SUPABASE_URL, key, {
      auth: { persistSession: false },
    });

    const { data: storeData, error: fetchError } = await supabase
      .from("stores")
      .select("rating, reviews")
      .eq("id", storeId)
      .single();

    if (fetchError || !storeData) {
      return NextResponse.json({ error: "المتجر غير موجود" }, { status: 404 });
    }

    const currentRating: number = storeData.rating ?? 0;
    const currentReviews: number = storeData.reviews ?? 0;
    const newReviews = currentReviews + 1;
    const newRating = (currentRating * currentReviews + rating) / newReviews;

    const { error: updateError } = await supabase
      .from("stores")
      .update({ rating: newRating, reviews: newReviews })
      .eq("id", storeId);

    if (updateError) {
      console.error("Rating update error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, newRating, newReviews });
  } catch (err: any) {
    console.error("Rate API error:", err);
    return NextResponse.json({ error: err.message || "خطأ في الخادم" }, { status: 500 });
  }
}
