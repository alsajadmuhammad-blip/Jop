"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { BackButton } from "@/components/layout/back-button";
import CreateStoreForm from "@/app/(pages)/admin/stores/create-store-form";

export default function RepresentativeAddStorePage() {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userRole !== "representative") {
      if (userRole === "admin") {
        router.replace("/admin/stores");
      } else if (userRole === "store") {
        router.replace("/dashboard/store");
      } else {
        router.replace("/login");
      }
    }
  }, [loading, userRole, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center">جاري التحميل...</div>;
  }

  if (!user || userRole !== "representative") {
    return null;
  }

  return (
    <div className="bg-background min-h-full">
      <div className="container mx-auto px-4 py-8 relative">
        <div className="absolute top-4 left-4 z-10">
          <BackButton />
        </div>

        <div className="mx-auto max-w-2xl pt-12">
          <div className="mb-8 text-center">
            <h1 className="mt-2 text-3xl font-bold">إضافة متجر جديد</h1>
            <p className="mt-3 text-muted-foreground">
              استخدم نفس النموذج الذي يتوفر في صفحة المشرف لإنشاء متجر جديد مع حساب المالك بشكل واضح وآمن.
            </p>
          </div>

          <CreateStoreForm />
        </div>
      </div>
    </div>
  );
}
