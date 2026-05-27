"use client";

import { useAuth } from "@/hooks/use-auth";
import { BackButton } from "@/components/layout/back-button";
import CreateStoreForm from "./create-store-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminStoresPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">جاري التحميل...</div>;
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="bg-background min-h-full">
      <div className="container mx-auto px-4 py-8 relative">
        <div className="absolute top-4 left-4 z-10">
          <BackButton />
        </div>

        <div className="max-w-2xl mx-auto pt-12">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">إضافة متجر جديد</h1>
            <p className="text-muted-foreground">
              أنشئ حساب متجر جديد وحساب مالك المتجر
            </p>
          </div>

          <CreateStoreForm />
        </div>
      </div>
    </div>
  );
}
