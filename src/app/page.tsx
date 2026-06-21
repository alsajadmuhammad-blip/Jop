"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/services/supabase";
import { HeroCarouselItem, Store as StoreType } from "@/lib/types";
import { mapStoreRow } from "@/services/supabase-db";

import { HeroCarousel } from "@/components/hero-carousel";
import { StoreCard } from "@/components/store-card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Building2,
  Globe,
  Smartphone,
  ShoppingBag,
  Utensils,
  Shirt,
  Cpu,
  Dumbbell,
  BookOpen,
  Wrench,
  Sparkles,
  Star,
  Store,
} from "lucide-react";

/* ─── خريطة أيقونات الفئات ─── */
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  "هواتف ذكية": Smartphone,
  "ملابس": Shirt,
  "أجهزة كهربائية": Cpu,
  "أدوات رياضية": Dumbbell,
  "كتب": BookOpen,
  "قطع غيار": Wrench,
  "مستحضرات عناية": Sparkles,
  "طعام": Utensils,
  "ملحقات": ShoppingBag,
};

const CATEGORY_COLORS: Record<string, string> = {
  "هواتف ذكية": "bg-blue-50 text-blue-600 border-blue-100",
  "ملابس": "bg-pink-50 text-pink-600 border-pink-100",
  "أجهزة كهربائية": "bg-purple-50 text-purple-600 border-purple-100",
  "أدوات رياضية": "bg-green-50 text-green-600 border-green-100",
  "كتب": "bg-amber-50 text-amber-600 border-amber-100",
  "قطع غيار": "bg-slate-100 text-slate-600 border-slate-200",
  "مستحضرات عناية": "bg-rose-50 text-rose-600 border-rose-100",
  "طعام": "bg-orange-50 text-orange-600 border-orange-100",
  "ملحقات": "bg-indigo-50 text-indigo-600 border-indigo-100",
};

/* ─── شريط بحث ─── */
function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 pointer-events-none" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ابحث عن متجر أو منتج..."
        className="w-full h-12 pr-11 pl-4 rounded-2xl bg-slate-100 border border-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
      />
    </form>
  );
}

/* ─── فلتر النوع ─── */
type FilterType = "all" | "physical" | "online";

const FILTERS: { key: FilterType; label: string; icon: React.ElementType }[] = [
  { key: "all", label: "الكل", icon: Store },
  { key: "physical", label: "متاجر فعلية", icon: Building2 },
  { key: "online", label: "إلكترونية", icon: Globe },
];

/* ══════════════════════════════════════
   الصفحة الرئيسية
══════════════════════════════════════ */
export default function Home() {
  const [heroItems, setHeroItems] = useState<HeroCarouselItem[]>([]);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [marketTypes, setMarketTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [heroRes, storeRes] = await Promise.allSettled([
          supabase
            .from("hero_carousel_items")
            .select("id, src, hint, text, store_id")
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("stores")
            .select("*")
            .eq("is_active", true)
            .order("rating", { ascending: false })
            .limit(40),
        ]);

        if (heroRes.status === "fulfilled") {
          const { data, error } = heroRes.value;
          if (!error && data)
            setHeroItems(
              data.map((row: any) => ({
                id: String(row.id),
                src: row.src,
                hint: row.hint,
                text: row.text,
                storeId: row.store_id || undefined,
              }))
            );
        }

        if (storeRes.status === "fulfilled") {
          const { data, error } = storeRes.value;
          if (!error && data) {
            const active = data
              .map((row: any) => mapStoreRow(row))
              .filter((s: StoreType) => s.isActive);
            setStores(active);
            const types = [...new Set(active.map((s: StoreType) => s.marketType).filter(Boolean))] as string[];
            setMarketTypes(types);
          }
        }
      } catch (e) {
        console.error("Homepage fetch error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredStores = stores.filter((s) => {
    const typeMatch =
      filterType === "all" ||
      (filterType === "physical" && s.type === "فعلي") ||
      (filterType === "online" && s.type === "إلكتروني");
    const catMatch = activeCategory === "all" || s.marketType === activeCategory;
    return typeMatch && catMatch;
  });

  return (
    <div className="min-h-screen bg-slate-50/40">

      {/* ──────────────────────────────
          شريط البحث العلوي
      ────────────────────────────── */}
      <div className="sticky top-[56px] z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 py-3">
        <SearchBar />
      </div>

      <div className="container mx-auto px-4 max-w-5xl">

        {/* ──────────────────────────────
            البانر الإعلاني
        ────────────────────────────── */}
        <section className="pt-5 pb-4">
          {loading ? (
            <Skeleton className="w-full aspect-[16/6] rounded-2xl" />
          ) : (
            <div className="rounded-2xl overflow-hidden shadow-sm">
              <HeroCarousel heroCarouselItems={heroItems} />
            </div>
          )}
        </section>

        {/* ──────────────────────────────
            فئات الأسواق
        ────────────────────────────── */}
        {marketTypes.length > 0 && (
          <section className="pb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
              {/* الكل */}
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 ${
                  activeCategory === "all"
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary/40"
                }`}
              >
                <Store className="w-4 h-4" />
                الكل
              </button>

              {marketTypes.map((type) => {
                const Icon = CATEGORY_ICONS[type] ?? ShoppingBag;
                const color = CATEGORY_COLORS[type] ?? "bg-slate-50 text-slate-600 border-slate-200";
                const isActive = activeCategory === type;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveCategory(type)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white border-primary shadow-sm"
                        : `${color} hover:border-primary/30`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ──────────────────────────────
            بنر إنشاء متجر
        ────────────────────────────── */}
        <section className="pb-6">
          <Link href="/create-store">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-primary to-primary/80 p-5 flex items-center justify-between gap-4 shadow-md shadow-primary/20 cursor-pointer"
            >
              <div className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />
              <div className="relative z-10">
                <p className="text-white/80 text-xs font-medium mb-0.5">ابدأ رحلتك الرقمية</p>
                <p className="text-white text-base font-black leading-tight">أنشئ متجرك الآن</p>
              </div>
              <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
            </motion.div>
          </Link>
        </section>

        {/* ──────────────────────────────
            كل المتاجر
        ────────────────────────────── */}
        <section className="pb-10">
          {/* رأس القسم + فلاتر النوع */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">جميع المتاجر</h2>
            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    filterType === f.key
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* الشبكة */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-60 rounded-2xl" />
              ))}
            </div>
          ) : filteredStores.length > 0 ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${filterType}-${activeCategory}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              >
                {filteredStores.map((store, i) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.03 }}
                  >
                    <StoreCard store={store} />
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-16 rounded-2xl bg-white border border-dashed border-slate-200">
              <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-400 text-sm font-medium">لا توجد متاجر في هذه الفئة</p>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
