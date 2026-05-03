"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/services/supabase";
import { mapStoreRow } from "@/services/supabase-db";
import { StoreCard } from "@/components/store-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Store } from "@/lib/types";
import { Search } from "lucide-react";

export default function StoresList() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMarketType, setSelectedMarketType] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStores = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        const message = error?.message || "حدثت مشكلة أثناء جلب بيانات المتاجر.";
        console.error("خطأ في جلب المتاجر:", message);
        toast({
          title: "فشل تحميل المتاجر",
          description: message,
          variant: "destructive",
        });
        setErrorMessage(message);
        setStores([]);
        return;
      }

      const mappedStores = (data || [])
        .map((row: any) => mapStoreRow(row))
        .filter((store: Store) => store.isActive);

      setStores(mappedStores);
    } catch (err: any) {
      const message = err?.message || "حدث خطأ غير متوقع أثناء تحميل المتاجر.";
      console.error("خطأ:", message);
      toast({
        title: "فشل تحميل المتاجر",
        description: message,
        variant: "destructive",
      });
      setErrorMessage(message);
      setStores([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (store.description && store.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMarketType =
      !selectedMarketType || store.marketType === selectedMarketType;

    return matchesSearch && matchesMarketType;
  });

  const marketTypes = Array.from(
    new Set(stores.map((s) => s.marketType).filter(Boolean))
  );

  return (
    <div className="space-y-6 pt-16">
      <div>
        <h1 className="text-3xl font-bold mb-2">جميع المتاجر</h1>
        <p className="text-muted-foreground">
          اكتشف أفضل المتاجر والعروض المتاحة الآن
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="ابحث عن متجر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {marketTypes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={!selectedMarketType ? "default" : "outline"}
              onClick={() => setSelectedMarketType("")}
              size="sm"
            >
              الكل
            </Button>
            {marketTypes.map((type) => (
              <Button
                key={type}
                variant={selectedMarketType === type ? "default" : "outline"}
                onClick={() => setSelectedMarketType(type)}
                size="sm"
              >
                {type}
              </Button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[180px] w-full rounded-xl" />
              <div className="space-y-2 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : errorMessage ? (
        <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-8 text-center text-destructive">
          <p className="text-xl font-semibold">تعذر تحميل المتاجر</p>
          <p className="mt-2 text-sm text-destructive-foreground">{errorMessage}</p>
          <Button onClick={fetchStores} className="mt-6">إعادة المحاولة</Button>
        </div>
      ) : filteredStores.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 rounded-lg bg-background border-2 border-dashed">
          <h2 className="mt-4 text-xl font-semibold">لا توجد متاجر متاحة</h2>
          <p className="mt-2 text-muted-foreground">
            لا توجد متاجر تطابق معايير البحث الخاصة بك.
          </p>
        </div>
      )}
    </div>
  );
}
