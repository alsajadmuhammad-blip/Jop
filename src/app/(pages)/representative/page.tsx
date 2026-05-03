"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { fetchStoresByRepresentative } from "@/services/supabase-db";

export default function RepresentativeDashboard() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || userRole !== "representative") {
      router.replace("/login");
      return;
    }
    // جلب المتاجر التي أضافها هذا المندوب
    async function fetchStores() {
      setLoading(true);
      try {
        const rows = user ? await fetchStoresByRepresentative(user.id) : [];
        setStores(rows);
      } catch (err) {
        console.error('Error fetching rep stores', err);
        setStores([]);
      } finally {
        setLoading(false);
      }
    }
    fetchStores();
  }, [user, userRole, router]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 border-b pb-6">
        <h1 className="text-3xl font-bold mb-2">لوحة تحكم المندوب</h1>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-muted-foreground text-sm mb-2">يمكنك إضافة متاجر جديدة وستظهر هنا جميع المتاجر التي أضفتها.</p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href="/representative/add-store">
              <PlusCircle className="w-5 h-5" /> إضافة متجر جديد
            </Link>
          </Button>
        </div>
      </div>
      <div className="border-b pb-6">
        <h2 className="text-2xl font-bold mb-6">المتاجر التي أضفتها</h2>
          {loading ? (
            <div>جاري التحميل...</div>
          ) : stores.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">لم تقم بإضافة أي متجر بعد.</div>
          ) : (
            <ul className="space-y-4">
              {stores.map((store) => (
                <li key={store.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-bold text-lg">{store.name}</div>
                    <div className="text-xs text-muted-foreground">نوع السوق: {store.marketType}</div>
                    <div className="text-xs text-muted-foreground">الباقة: {store.packageName}</div>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <Link href={`/stores/${store.id}`} className="text-primary hover:underline text-sm">عرض المتجر</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}
