"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductRatingDialog } from "@/components/product-rating-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { submitProductRating } from "@/services/product-ratings";
import {
  getStoredProductRating,
  setStoredProductRating,
} from "@/lib/rating-storage";

interface ProductRatingWrapperProps {
  productId: string;
  productName: string;
  storeOwnerId: string | null;
  onRated?: (newRating: number, newReviews: number) => void;
}

export function ProductRatingWrapper({
  productId,
  productName,
  storeOwnerId,
  onRated,
}: ProductRatingWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [previousRating, setPreviousRating] = useState<number | null>(null);
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  const isOwner = !!user?.id && user.id === storeOwnerId;
  const isAdmin = userRole === "admin";

  // اقرأ من localStorage بعد الـ mount لتجنب hydration mismatch
  useEffect(() => {
    setPreviousRating(getStoredProductRating(productId));
  }, [productId]);

  // صاحب المتجر لا يرى الزر أصلاً
  if (isOwner) return null;

  const handleOpen = () => {
    if (isAdmin) {
      toast({
        variant: "destructive",
        title: "غير مسموح",
        description: "لا يمكن للمشرفين تقييم المنتجات.",
      });
      return;
    }
    setIsOpen(true);
  };

  const handleSubmit = async (rating: number) => {
    // إذا كان هناك تقييم سابق نمرره للـ service (وضع التعديل)
    const result = await submitProductRating(
      productId,
      rating,
      previousRating ?? undefined,
    );

    // احفظ التقييم الجديد في localStorage
    setStoredProductRating(productId, rating);
    setPreviousRating(rating);

    toast({
      title: previousRating ? "تم تعديل تقييمك ⭐" : "شكراً لتقييمك! ⭐",
      description: `تم ${previousRating ? "تحديث" : "إرسال"} تقييمك لـ "${productName}" بنجاح.`,
    });

    setIsOpen(false);
    onRated?.(result.newRating, result.newReviews);
  };

  const hasRated = previousRating !== null;

  return (
    <>
      <Button
        onClick={handleOpen}
        size="sm"
        variant={isAdmin ? "secondary" : "outline"}
        className="gap-1.5 rounded-xl font-semibold text-xs h-9 border-amber-200 text-amber-700 hover:bg-amber-50"
        aria-label={hasRated ? "تعديل تقييم المنتج" : "تقييم المنتج"}
      >
        {/* نجوم صغيرة تعكس التقييم السابق إن وُجد */}
        {hasRated ? (
          <span className="flex items-center gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`h-3 w-3 ${
                  s <= previousRating
                    ? "text-amber-400 fill-amber-400"
                    : "text-amber-200 fill-amber-200"
                }`}
              />
            ))}
          </span>
        ) : (
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        )}
        {hasRated ? "تعديل" : "تقييم"}
      </Button>

      <ProductRatingDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSubmit={handleSubmit}
        productName={productName}
        initialRating={previousRating ?? undefined}
      />
    </>
  );
}
