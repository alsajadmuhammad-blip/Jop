"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoreRatingDialog } from "@/components/store-rating-dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

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
    const response = await fetch("/api/store/rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, rating }),
    });

    const data = await response.json();

    if (!response.ok) {
      toast({
        variant: "destructive",
        title: "فشل إرسال التقييم",
        description: data.error || "حدث خطأ ما. حاول مجدداً.",
      });
      throw new Error(data.error || "فشل الإرسال");
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
