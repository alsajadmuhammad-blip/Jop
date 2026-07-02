"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreRatingDialog } from "@/components/store-rating-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/services/supabase";

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
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isOwner = user?.id === ownerId;
  const isAdmin = userRole === "admin";

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

    // Fetch current rating and reviews from Supabase directly (static export compatible)
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
    const newReviews = currentReviews + 1;
    const newRating = (currentRating * currentReviews + rating) / newReviews;

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

    toast({
      title: "شكراً لتقييمك! ⭐",
      description: `تم إرسال تقييمك لمتجر "${storeName}" بنجاح.`,
    });

    setIsRatingDialogOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        size="lg"
        variant={isAdmin ? "secondary" : "default"}
        className={`font-semibold flex items-center justify-center gap-2 ${isAdmin ? "" : "bg-accent text-accent-foreground hover:bg-accent/90"} ${buttonClassName ?? ""}`.trim()}
        disabled={isAdmin}
        aria-label="تقييم المتجر"
      >
        <MessageSquarePlus className="h-5 w-5" />
        <span>تقييم</span>
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
