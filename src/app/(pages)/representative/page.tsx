"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/loading-spinner";

/**
 * صفحة /representative — تحوّل إلى لوحة التحكم الكاملة للشريك
 */
export default function RepresentativePage() {
  const { user, userRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user || userRole !== "representative") {
      router.replace("/login");
      return;
    }
    router.replace("/dashboard/representative");
  }, [user, userRole, loading, router]);

  return <LoadingSpinner isLoading={true} />;
}
