"use client";

import { useState, useEffect } from "react";
import { MessageSquarePlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreRatingDialog } from "@/components/store-rating-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/services/supabase";
import {
  getStoredStoreRating,
  setStoredStoreRating,
} from "@/lib/rating-storage";

interface StoreRatingDialogWrapperProps {
  storeId: string;
  storeName: string;
  ownerId: string | null;
  buttonClassName?: string;
}

export function StoreRatingDialogWrapper({
  storeId,
  storeName,
  ownerId,
  buttonClassName,
}: StoreRatingDialogWrapperProps) {
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [previousRating, setPreviousRating] = useState<number | null>(null);
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isOwner = user?.id === ownerId;
  const isAdmin = userRole === "admin";

  // اقرأ من localStorage بعد mount لتجنب hydration mismatch
  useEffect(() => {
    setPreviousRating(getStoredStoreRating(storeId));
  }, [storeId]);

  if (isOwner) return null;

  const handleOpenDialog = () => {
    if (isAdmin) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا يمكن للمشرفين تقييم المتاجر.",
      });
      return;
    }
    setIsRatingDialogOpen(true);
  };

  const handleRatingSubmit = async (rating: number) => {
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      toast({
        variant: "destructive",
        title: "تقييم غير صحيح",
        description: "يجب أن يكون التقييم بين 1 و 5 نجوم.",
      });
      throw new Error("تقييم غير صحيح");
    }

    const { data: storeData, error: fetchError } = await supabase
      .from("stores")
      .select("rating, reviews")
      .eq("id", storeId)
      .single();

    if (fetchError || !storeData) {
      toast({
        variant: "destructive",
        title: "فشل إرسال التقييم",
        description: "المتجر غير موجود أو حدث خطأ في الاتصال.",
      });
      throw new Error("المتجر غير موجود");
    }

    const currentRating: number = storeData.rating ?? 0;
    const currentReviews: number = storeData.reviews ?? 0;

    let newRating: number;
    let newReviews: number;

    if (previousRating !== null && currentReviews > 0) {
      // وضع التعديل: استبدل القيمة القديمة دون تغيير عدد المراجعات
      newReviews = currentReviews;
      newRating = (currentRating * currentReviews - previousRating + rating) / currentReviews;
    } else {
      // تقييم جديد
      newReviews = currentReviews + 1;
      newRating = (currentRating * currentReviews + rating) / newReviews;
    }

    // Clamp
    newRating = Math.max(1, Math.min(5, newRating));

    const { error: updateError } = await supabase
      .from("stores")
      .update({ rating: newRating, reviews: newReviews })
      .eq("id", storeId);

    if (updateError) {
      toast({
        variant: "destructive",
        title: "فشل إرسال التقييم",
        description: updateError.message || "حدث خطأ ما. حاول مجدداً.",
      });
      throw new Error(updateError.message || "فشل الإرسال");
    }

    // احفظ في localStorage
    setStoredStoreRating(storeId, rating);
    setPreviousRating(rating);

    toast({
      title: previousRating ? "تم تعديل تقييمك ⭐" : "شكراً لتقييمك! ⭐",
      description: `تم ${previousRating ? "تحديث" : "إرسال"} تقييمك لمتجر "${storeName}" بنجاح.`,
    });

    setIsRatingDialogOpen(false);
    router.refresh();
  };

  const hasRated = previousRating !== null;

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        size="lg"
        variant={isAdmin ? "secondary" : "default"}
        className={`font-semibold flex items-center justify-center gap-2 ${
          isAdmin ? "" : "bg-accent text-accent-foreground hover:bg-accent/90"
        } ${buttonClassName ?? ""}`.trim()}
        disabled={isAdmin}
        aria-label={hasRated ? "تعديل تقييم المتجر" : "تقييم المتجر"}
      >
        {hasRated ? (
          <span className="flex items-center gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-4 w-4 ${
                  s <= previousRating
                    ? "fill-current"
                    : "opacity-30"
                }`}
              />
            ))}
          </span>
        ) : (
          <MessageSquarePlus className="h-5 w-5" />
        )}
        <span>{hasRated ? "تعديل التقييم" : "تقييم"}</span>
      </Button>

      <StoreRatingDialog
        isOpen={isRatingDialogOpen}
        onClose={() => setIsRatingDialogOpen(false)}
        onSubmit={handleRatingSubmit}
        storeName={storeName}
      />
    </>
  );
}
