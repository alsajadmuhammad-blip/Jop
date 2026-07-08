"use client";

import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductRatingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => Promise<void>;
  productName: string;
  /** التقييم السابق للمستخدم — يُفعِّل وضع التعديل */
  initialRating?: number;
}

export function ProductRatingDialog({
  isOpen,
  onClose,
  onSubmit,
  productName,
  initialRating,
}: ProductRatingDialogProps) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // عند فتح الـ dialog نضبط التقييم على القيمة السابقة (إن وُجدت)
  useEffect(() => {
    if (isOpen) {
      setRating(initialRating ?? 0);
      setHoverRating(0);
    }
  }, [isOpen, initialRating]);

  const isEditMode = (initialRating ?? 0) > 0;

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(rating);
      setRating(0);
      setHoverRating(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setRating(0);
    setHoverRating(0);
    onClose();
  };

  const displayRating = hoverRating > 0 ? hoverRating : rating;

  const ratingLabels: Record<number, string> = {
    1: "سيء",
    2: "مقبول",
    3: "جيد",
    4: "جيد جداً",
    5: "ممتاز",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "تعديل تقييمك" : "تقييم المنتج"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? `تقييمك الحالي ${initialRating} نجوم — اختر تقييماً جديداً لـ "${productName}".`
              : `شاركنا رأيك في "${productName}". اختر تقييمك من 1 إلى 5 نجوم.`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="flex justify-center gap-1" dir="ltr">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  disabled={isSubmitting}
                  className="focus:outline-none disabled:cursor-not-allowed transition-transform hover:scale-110 active:scale-95"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  <Star
                    className={cn(
                      "h-10 w-10 transition-colors duration-100",
                      displayRating >= star
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-200 fill-gray-200"
                    )}
                  />
                </button>
              ))}
            </div>
            <p className={cn(
              "text-sm font-semibold transition-opacity duration-200 h-5",
              displayRating > 0 ? "opacity-100 text-yellow-600" : "opacity-0"
            )}>
              {ratingLabels[displayRating] ?? ""}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting || (isEditMode && rating === initialRating)}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 animate-spin ml-2" />جاري الإرسال...</>
            ) : isEditMode ? (
              "تحديث التقييم"
            ) : (
              "إرسال التقييم"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
