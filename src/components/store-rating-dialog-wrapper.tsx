
"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreRatingDialog } from "@/components/store-rating-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/services/supabase";
import { errorEmitter } from "@/lib/error-emitter";
import { PermissionError } from "@/lib/errors";

interface StoreRatingDialogWrapperProps {
  storeId: string;
  storeName: string;
  ownerId: string | null;
  buttonClassName?: string;
}

export function StoreRatingDialogWrapper({ storeId, storeName, ownerId, buttonClassName }: StoreRatingDialogWrapperProps) {
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const isOwner = user?.id === ownerId;
  const isAdmin = userRole === 'admin';

  const handleOpenDialog = () => {
    if (!user) {
        toast({
            variant: "destructive",
            title: "يرجى تسجيل الدخول",
            description: "يجب عليك تسجيل الدخول أولاً لتقييم المتجر.",
        });
        router.push('/login');
        return;
    }

    if (isOwner || isAdmin) {
       toast({
        variant: "destructive",
        title: "غير مسموح",
        description: isOwner ? "لا يمكنك تقييم متجرك الخاص." : "لا يمكن للمشرفين تقييم المتاجر.",
      });
      return;
    }
    setIsRatingDialogOpen(true);
  };

  if (isOwner) {
    return null;
  }

  const handleRatingSubmit = async (rating: number) => {
    try {
        // Fetch current rating and reviews
        const { data: storeData, error: fetchError } = await supabase
            .from('stores')
            .select('rating, reviews')
            .eq('id', storeId)
            .single();

        if (fetchError) {
            throw fetchError;
        }

        if (!storeData) {
            throw new Error("المتجر غير موجود.");
        }

        const currentRating = storeData.rating || 0;
        const currentReviews = storeData.reviews || 0;

        const newReviews = currentReviews + 1;
        const newRating = ((currentRating * currentReviews) + rating) / newReviews;

        const { error: updateError } = await supabase
            .from('stores')
            .update({ rating: newRating, reviews: newReviews })
            .eq('id', storeId);

        if (updateError) {
            throw updateError;
        }

        toast({
            title: "شكراً لتقييمك!",
            description: `تم إرسال تقييمك لمتجر "${storeName}".`,
        });
        setIsRatingDialogOpen(false);
        router.refresh();

    } catch (error: any) {
        const permissionError = new PermissionError({
            path: `stores/${storeId}`,
            operation: 'update',
            requestResourceData: { rating: 'INCREMENT', reviews: 'INCREMENT' },
        });
        errorEmitter.emit('permission-error', permissionError);

        let errorMessage = "فشل إرسال التقييم. ليس لديك صلاحية أو حدث خطأ ما.";
        if (error && error.message && !error.message.toLowerCase().includes("permission-denied")) {
             errorMessage = error.message;
        }

        toast({
            variant: "destructive",
            title: "فشل إرسال التقييم",
            description: errorMessage,
        });
    }
  };

  const isDisabled = isAdmin;
  const buttonClasses = `${buttonClassName || ''} ${!isDisabled ? 'bg-accent text-accent-foreground hover:bg-accent/90' : ''}`.trim();

  return (
    <>
      <Button onClick={handleOpenDialog} size="lg" variant={isDisabled ? "secondary" : "default"} className={`${buttonClasses} font-semibold flex items-center justify-center gap-2`} disabled={isDisabled} aria-label="تقييم المتجر">
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
