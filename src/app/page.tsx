
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/services/supabase";
import { HeroCarouselItem, Store as StoreType } from "@/lib/types";
import { mapStoreRow } from '@/services/supabase-db';

import { HeroCarousel } from "@/components/hero-carousel";
import { StoreCard } from "@/components/store-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

function HomePageContent() {
  const [heroItems, setHeroItems] = useState<HeroCarouselItem[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'physical' | 'online'>('all');

  useEffect(() => {
    async function getHomepageData() {
      setLoading(true);
      try {
        const [heroRes, storeRes] = await Promise.allSettled([
          supabase
            .from('hero_carousel_items')
            .select('id, src, hint, text, store_id')
            .order('created_at', { ascending: false })
            .limit(5),
          supabase
            .from('stores')
            .select('*')
            .eq('is_active', true)
            .order('rating', { ascending: false })
            .limit(20),
        ]);

        if (heroRes.status === 'fulfilled') {
          const { data, error } = heroRes.value;
          if (!error && data) {
            setHeroItems(
              (data || []).map((row: any) => ({
                id: String(row.id),
                src: row.src,
                hint: row.hint,
                text: row.text,
                storeId: row.store_id || undefined,
              }))
            );
          }
        }

        if (storeRes.status === 'fulfilled') {
          const { data, error } = storeRes.value;
          if (!error && data) {
            setStores(
              (data || [])
                .map((row: any) => mapStoreRow(row))
                .filter((store: StoreType) => store.isActive)
            );
          }
        }
      } catch (error) {
        console.error('Homepage data fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    getHomepageData();
  }, []);

  // Filter stores based on selected type
  const filteredStores = stores.filter((store) => {
    if (filterType === 'all') return true;
    if (filterType === 'physical') return store.type === 'فعلي';
    if (filterType === 'online') return store.type === 'إلكتروني';
    return true;
  });

  return (
    <div className="flex flex-col bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-6 md:py-12">
        <div className="container mx-auto px-4">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-primary/10 bg-primary/5 p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-primary">ابدأ رحلتك الآن</p>
              <h2 className="text-xl font-bold text-slate-900">أنشئ متجرك من صفحة واحدة، اختر الباقة، ثم ابدأ بالاشتراك.</h2>
            </div>
            <Link href="/create-store">
              <Button size="lg">إنشاء متجر</Button>
            </Link>
          </div>
          {loading ? (
            <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
          ) : (
            <HeroCarousel heroCarouselItems={heroItems} />
          )}
        </div>
      </section>

      {/* Featured Stores Section */}
      {!loading && stores.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-2">المتاجر المتاحة</h2>
              <p className="text-muted-foreground text-lg">تصفح المتاجر المتوفرة</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-3 mb-8 overflow-x-auto pb-2 -mx-4 px-4">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className="rounded-full"
              >
                الكل ({stores.length})
              </Button>
              <Button
                variant={filterType === 'physical' ? 'default' : 'outline'}
                onClick={() => setFilterType('physical')}
                className="rounded-full"
              >
                متاجر فعلية ({stores.filter(s => s.type === 'فعلي').length})
              </Button>
              <Button
                variant={filterType === 'online' ? 'default' : 'outline'}
                onClick={() => setFilterType('online')}
                className="rounded-full"
              >
                متاجر إلكترونية ({stores.filter(s => s.type === 'إلكتروني').length})
              </Button>
            </div>

            {/* Stores Grid */}
            {filteredStores.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStores.map((store) => (
                  <StoreCard key={store.id} store={store} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 rounded-lg bg-muted/20 border border-muted">
                <p className="text-muted-foreground text-lg font-medium">لا توجد متاجر في هذه الفئة</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

export default function Home() {
  return <HomePageContent />;
}
