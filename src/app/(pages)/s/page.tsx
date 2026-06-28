"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { fetchStoreBySlug } from "@/services/supabase-db";
import { Suspense } from "react";

function StoreSlugInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = searchParams.get("store") ?? "";
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) { setNotFound(true); return; }

    fetchStoreBySlug(slug).then((store) => {
      if (store) {
        router.replace(`/store?id=${store.id}`);
      } else {
        setNotFound(true);
      }
    });
  }, [slug, router]);

  if (notFound) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center"
        dir="rtl"
      >
        <div className="text-6xl">🏪</div>
        <h1 className="text-2xl font-bold text-slate-800">المتجر غير موجود</h1>
        <p className="text-slate-500 max-w-xs">
          الرابط{" "}
          <span className="font-mono text-primary">?store={slug}</span>{" "}
          غير مرتبط بأي متجر نشط.
        </p>
        <a
          href="/"
          className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          العودة للرئيسية
        </a>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50"
      dir="rtl"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-slate-500">جاري تحميل المتجر…</p>
    </div>
  );
}

export default function StoreSlugPage() {
  return (
    <Suspense>
      <StoreSlugInner />
    </Suspense>
  );
}
